import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

const PRICE_KEYS = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  business_monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
  business_yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
}

function missingEnv(key: string) {
  return NextResponse.json({ error: `${key} not configured` }, { status: 500 })
}

export async function GET() {
  if (!STRIPE_SECRET_KEY) return missingEnv('STRIPE_SECRET_KEY')

  const missing = Object.entries(PRICE_KEYS).filter(([, v]) => !v)
  if (missing.length > 0) return missingEnv(missing[0][0])

  const stripe = new Stripe(STRIPE_SECRET_KEY)

  try {
    const results: Record<string, any> = {}

    for (const [key, id] of Object.entries(PRICE_KEYS)) {
      const price = await stripe.prices.retrieve(id!)
      results[key] = {
        id: price.id,
        amount: price.unit_amount ? price.unit_amount / 100 : null,
        currency: price.currency,
        interval: (price.recurring as any)?.interval ?? null,
        nickname: price.nickname ?? null,
      }
    }

    return NextResponse.json(results)
  } catch (err: any) {
    console.error('[PRICING] Error fetching prices:', err)
    return NextResponse.json({ error: 'Failed to load pricing' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
