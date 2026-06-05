import { NextResponse } from 'next/server'
import { Session } from 'next-auth'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth/next'
import authOptions from '@/src/lib/auth'
import prisma from '@/src/lib/prisma'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY missing')
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null

export async function POST(request: Request) {
  if (!stripe) return NextResponse.json({ message: 'Stripe not configured' }, { status: 500 })

  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id as string

  console.log('[CHECKOUT USER ID]', { userId })

  try {
    const body = await request.json()
    const { priceId } = body
    if (!priceId) return NextResponse.json({ message: 'priceId required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } })

    let customerId = user?.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({ email: session.user.email ?? undefined, metadata: { userId } })
      customerId = customer.id
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
      console.log('[CUSTOMER CREATED]', { customerId, userId })
    }
    console.log('[CUSTOMER ID]', { customerId })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { userId } },
      customer: customerId,
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing/cancel`,
    })

    console.log('[CHECKOUT SESSION CREATED]', { sessionId: checkout.id, url: checkout.url })

    return NextResponse.json({ url: checkout.url })
  } catch (err: any) {
    console.error('[CHECKOUT] Error creating session', err)
    return NextResponse.json({ message: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
