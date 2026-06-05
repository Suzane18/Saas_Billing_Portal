import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/src/lib/prisma'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

if (!STRIPE_SECRET_KEY) {
  throw new Error('Stripe secret key is not configured')
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

const createDate = (timestamp: number | null): Date | null =>
  timestamp ? new Date(timestamp * 1000) : null

const upsertSubscriptionFromStripeSubscription = async (subscription: Stripe.Subscription) => {
  console.log('[WEBHOOK RECEIVED] Processing subscription upsert', { stripeSubscriptionId: subscription.id })

  console.log('[SUBSCRIPTION UPSERT START]', { stripeSubscriptionId: subscription.id })

  // Prefer explicit userId passed via Stripe metadata
  let userId = subscription.metadata?.userId

  // Fallback: find user by Stripe customer id stored on User.stripeCustomerId
  if (!userId) {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
    if (customerId) {
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
      if (user) {
        userId = user.id
        console.log('[USER FOUND] Resolved userId from stripe customer', { userId, customerId })
      } else {
        console.warn('[USER NOT FOUND] No user linked to Stripe customer', { customerId, subscriptionId: subscription.id })
      }
    }
  }

  if (!userId) {
    throw new Error('Stripe subscription metadata missing userId and no matching user by customer id')
  }

  const priceId = (subscription.items?.data?.[0]?.price as Stripe.Price | string)
  const stripePriceId = typeof priceId === 'string' ? priceId : priceId?.id
  if (!stripePriceId) {
    throw new Error('Stripe subscription missing price id')
  }

  const stripeSubscription = subscription as Stripe.Subscription & { current_period_start: number | null; current_period_end: number | null }
  const currentPeriodStart = stripeSubscription.current_period_start ?? null
  const currentPeriodEnd = stripeSubscription.current_period_end ?? null

  console.log('[CURRENT PERIOD START]', { currentPeriodStart })
  console.log('[CURRENT PERIOD END]', { currentPeriodEnd })

  try {
    const result = await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: stripePriceId,
        status: subscription.status,
        currentPeriodStart: createDate(currentPeriodStart),
        currentPeriodEnd: createDate(currentPeriodEnd),
      },
      update: {
        stripePriceId: stripePriceId,
        status: subscription.status,
        currentPeriodStart: createDate(currentPeriodStart),
        currentPeriodEnd: createDate(currentPeriodEnd),
      },
    })

    // If this subscription is now active, mark any other subscriptions for the user as canceled
    if (subscription.status === 'active') {
      try {
        const cleanupResult = await prisma.subscription.updateMany({
          where: {
            userId,
            stripeSubscriptionId: { not: subscription.id },
          },
          data: { status: 'canceled' },
        })
        console.log('[OLD SUBSCRIPTIONS CANCELED]', { stripeSubscriptionId: subscription.id, userId, count: cleanupResult.count })
      } catch (err) {
        console.warn('[SUBSCRIPTION CLEANUP] failed to cancel other subscriptions', err)
      }
    }

    console.log('[SUBSCRIPTION UPSERT SUCCESS]', { stripeSubscriptionId: subscription.id, userId, status: subscription.status })
    return result
  } catch (error) {
    console.error('[SUBSCRIPTION UPSERT FAILED]', { stripeSubscriptionId: subscription.id, error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  if (!subscriptionId) {
    throw new Error('Checkout session did not include a subscription id')
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  if (!customerId) {
    throw new Error('Checkout session did not include a customer id')
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  if (!subscription) {
    throw new Error('Stripe subscription could not be retrieved')
  }

  console.log('[WEBHOOK RECEIVED] checkout.session.completed', { sessionId: session.id, subscriptionId, customerId })

  // If the subscription object from Stripe doesn't contain metadata.userId, the upsert will fall back
  return upsertSubscriptionFromStripeSubscription(subscription)
}

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  // Try to resolve userId from metadata or customer
  const userId = subscription.metadata?.userId ?? (typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as any)?.id)
  console.log('[WEBHOOK RECEIVED] customer.subscription.deleted', { stripeSubscriptionId: subscription.id, userIdFromMetadata: subscription.metadata?.userId })

  try {
    // Prefer updating status to keep history rather than deleting records
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'canceled' },
    })
    console.log('[SUBSCRIPTION MARKED CANCELED]', { stripeSubscriptionId: subscription.id })
    return
  } catch (error) {
    console.error('[DATABASE WRITE FAILED] subscription.updateMany', { stripeSubscriptionId: subscription.id, error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

export async function POST(request: Request) {
  console.log('[WEBHOOK RECEIVED] Incoming POST /api/stripe/webhooks')
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('[Webhook] Missing Stripe signature header')
    return NextResponse.json({ message: 'Missing Stripe signature header' }, { status: 400 })
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[Webhook] Webhook secret not configured')
    return NextResponse.json({ message: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
    console.log('[EVENT TYPE]', { type: event.type, id: event.id })
  } catch (error) {
    console.error('[WEBHOOK] Signature verification failed:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ message: 'Webhook verification failed' }, { status: 401 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        console.log('[HANDLED] checkout.session.completed', { sessionId: session.id })
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object as any
        console.log('[WEBHOOK RECEIVED] invoice.paid', { invoiceId: invoice.id, subscription: invoice.subscription })

        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (!subscriptionId) {
          console.warn('[INVOICE] No subscription id on invoice.paid; skipping')
          break
        }

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await upsertSubscriptionFromStripeSubscription(subscription)
          console.log('[HANDLED] invoice.paid', { invoiceId: invoice.id })
        } catch (err) {
          console.error('[INVOICE HANDLER FAILED]', err)
          throw err
        }
        break
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await upsertSubscriptionFromStripeSubscription(subscription)
        console.log('[HANDLED] customer.subscription.created', { stripeSubscriptionId: subscription.id })
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await upsertSubscriptionFromStripeSubscription(subscription)
        console.log('[HANDLED] customer.subscription.updated', { stripeSubscriptionId: subscription.id })
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        console.log('[HANDLED] customer.subscription.deleted', { stripeSubscriptionId: subscription.id })
        break
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Webhook] Handler error for ${event.type}:`, message)
    return NextResponse.json({ message: 'Webhook handler error', error: message }, { status: 500 })
  }
}
