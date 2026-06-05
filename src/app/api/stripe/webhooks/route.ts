import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/src/lib/prisma'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

if (!STRIPE_SECRET_KEY) {
  throw new Error('Stripe secret key is not configured')
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

const getLatestStripeSubscription = async (subscriptionOrId: Stripe.Subscription | string) => {
  const subscriptionId = typeof subscriptionOrId === 'string' ? subscriptionOrId : subscriptionOrId.id
  if (!subscriptionId) {
    throw new Error('Stripe subscription ID is required')
  }

  const latestSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  if (!latestSubscription) {
    throw new Error('Stripe subscription could not be retrieved from Stripe API')
  }

  return latestSubscription
}

const upsertSubscriptionFromStripeSubscription = async (subscriptionOrId: Stripe.Subscription | string) => {
  const subscription = await getLatestStripeSubscription(subscriptionOrId)

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

  const price = subscription.items?.data?.[0]?.price as Stripe.Price | string
  const stripePriceId = typeof price === 'string' ? price : price?.id
  if (!stripePriceId) {
    throw new Error('Stripe subscription missing price id')
  }

  const billingInterval = typeof price === 'object' ? price.recurring?.interval : undefined
  const planType = typeof price === 'object' ? price.nickname ?? stripePriceId : stripePriceId

  console.log('[SUBSCRIPTION OBJECT]', JSON.stringify(subscription, null, 2))
  console.log('[PRICE ID]', { stripePriceId })
  console.log('[PLAN TYPE]', { planType })
  console.log('[STATUS]', { status: subscription.status })

  const stripeSubscription = subscription as unknown as Stripe.Subscription & {
    current_period_start?: number | null
    current_period_end?: number | null
  }

  const periodStart = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000)
    : null
  const periodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000)
    : null

  console.log('[STRIPE PERIOD START]', { periodStart: stripeSubscription.current_period_start })
  console.log('[STRIPE PERIOD END]', { periodEnd: stripeSubscription.current_period_end })
  console.log('[DATABASE PERIOD START]', { periodStart })
  console.log('[DATABASE PERIOD END]', { periodEnd })

  if (!stripeSubscription.current_period_start || !stripeSubscription.current_period_end) {
    console.warn('[STRIPE PERIOD MISSING]', {
      stripeSubscriptionId: subscription.id,
      current_period_start: stripeSubscription.current_period_start,
      current_period_end: stripeSubscription.current_period_end,
    })
  }

  if (periodStart && periodEnd) {
    if (periodEnd.getTime() <= periodStart.getTime()) {
      console.error('[PERIOD VALIDATION FAILED]', {
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      })
      throw new Error('Stripe subscription current_period_end must be after current_period_start')
    }

    if (billingInterval) {
      const durationMs = periodEnd.getTime() - periodStart.getTime()
      const oneMonthMs = 30 * 24 * 60 * 60 * 1000
      const oneYearMs = 365 * 24 * 60 * 60 * 1000
      const isMonthly = billingInterval === 'month'
      const isYearly = billingInterval === 'year'
      const approxMatch = isMonthly
        ? Math.abs(durationMs - oneMonthMs) <= 3 * 24 * 60 * 60 * 1000
        : isYearly
        ? Math.abs(durationMs - oneYearMs) <= 7 * 24 * 60 * 60 * 1000
        : true

      console.log('[PERIOD VALIDATION]', {
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        billingInterval,
        durationMs,
        approxMatch,
      })

      if (!approxMatch) {
        console.warn('[PERIOD VALIDATION FAILED]', {
          stripeSubscriptionId: subscription.id,
          billingInterval,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          durationDays: Math.round(durationMs / (1000 * 60 * 60 * 24)),
        })
      }
    }
  }

  try {
    const result = await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId,
        status: subscription.status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      update: {
        stripePriceId,
        status: subscription.status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    })

    console.log('[DATABASE PERIOD START]', { databasePeriodStart: result.currentPeriodStart })
    console.log('[DATABASE PERIOD END]', { databasePeriodEnd: result.currentPeriodEnd })

    if (
      result.currentPeriodStart?.getTime() !== periodStart?.getTime() ||
      result.currentPeriodEnd?.getTime() !== periodEnd?.getTime()
    ) {
      console.warn('[SYNC MISMATCH DETECTED]', {
        stripeSubscriptionId: subscription.id,
        stripePeriodStart: periodStart,
        stripePeriodEnd: periodEnd,
        databasePeriodStart: result.currentPeriodStart,
        databasePeriodEnd: result.currentPeriodEnd,
      })
    }

    if (subscription.status !== 'canceled' && subscription.status !== 'incomplete_expired') {
      console.log('[SUBSCRIPTION CLEANUP START]', { stripeSubscriptionId: subscription.id, userId, status: subscription.status })
      try {
        const cleanupResult = await prisma.subscription.updateMany({
          where: {
            userId,
            stripeSubscriptionId: { not: subscription.id },
          },
          data: { status: 'canceled' },
        })
        console.log('[SUBSCRIPTION CLEANUP SUCCESS]', { stripeSubscriptionId: subscription.id, userId, canceledCount: cleanupResult.count })
        if (cleanupResult.count > 0) {
          console.log('[CANCELED SUBSCRIPTION]', { stripeSubscriptionId: subscription.id, userId, canceledCount: cleanupResult.count })
        }
      } catch (err) {
        console.warn('[SUBSCRIPTION CLEANUP] failed to cancel other subscriptions', err)
      }
    }

    console.log('[ACTIVE SUBSCRIPTION]', { stripeSubscriptionId: subscription.id, userId, status: subscription.status })
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

  console.log('[WEBHOOK RECEIVED] checkout.session.completed', { sessionId: session.id, subscriptionId, customerId })

  return upsertSubscriptionFromStripeSubscription(subscriptionId)
}

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  // Try to resolve userId from metadata or customer
  const customer = subscription.customer
  const customerId = typeof customer === 'string' ? customer : customer?.id
  const userId = subscription.metadata?.userId ?? customerId
  console.log('[WEBHOOK RECEIVED] customer.subscription.deleted', { stripeSubscriptionId: subscription.id, userId, userIdFromMetadata: subscription.metadata?.userId })

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
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
        console.log('[WEBHOOK RECEIVED] invoice.paid', { invoiceId: invoice.id, subscription: invoice.subscription })

        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (!subscriptionId) {
          console.warn('[INVOICE] No subscription id on invoice.paid; skipping')
          break
        }

        try {
          await upsertSubscriptionFromStripeSubscription(subscriptionId)
          console.log('[HANDLED] invoice.paid', { invoiceId: invoice.id })
        } catch (err) {
          console.error('[INVOICE HANDLER FAILED]', err)
          throw err
        }
        break
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await upsertSubscriptionFromStripeSubscription(subscription.id)
        console.log('[HANDLED] customer.subscription.created', { stripeSubscriptionId: subscription.id })
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await upsertSubscriptionFromStripeSubscription(subscription.id)
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
