'use client'

import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Button from '@/src/components/ui/Button'

export interface BillingPlan {
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  monthlyCurrency: string
  yearlyCurrency: string
  monthlyInterval: string
  yearlyInterval: string
  monthlyPriceId: string
  yearlyPriceId: string
}

interface ActiveSubscriptionSummary {
  stripePriceId: string | null
  status: string
  planName: string | null
}

interface BillingPlansProps {
  plans: BillingPlan[]
  activeSubscription?: ActiveSubscriptionSummary | null
}

const formatAmount = (amount: number, currency: string) => {
  if (!currency) return `$${amount}`
  return currency.toLowerCase() === 'usd' ? `$${amount}` : `${amount} ${currency.toUpperCase()}`
}

const getIntervalLabel = (interval: string) => {
  if (interval === 'year') return 'per year'
  return 'per month'
}

const getButtonLabel = (hasSubscription: boolean, isCurrentPlan: boolean, planName: string) => {
  if (isCurrentPlan) return 'Current Plan'
  return hasSubscription ? `Switch to ${planName}` : `Subscribe to ${planName}`
}

export default function BillingPlans({ plans, activeSubscription }: BillingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const { status } = useSession()

  const activePriceId = activeSubscription?.stripePriceId ?? null
  const hasSubscription = Boolean(activePriceId)

  const planItems = useMemo(
    () =>
      plans.map((plan) => {
        const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
        const currency = billingCycle === 'yearly' ? plan.yearlyCurrency : plan.monthlyCurrency
        const interval = billingCycle === 'yearly' ? plan.yearlyInterval : plan.monthlyInterval
        const priceId = billingCycle === 'yearly' ? plan.yearlyPriceId : plan.monthlyPriceId
        const priceLabel = `${formatAmount(price, currency)} / ${interval}`
        const isCurrentPlan = activePriceId ? activePriceId === plan.monthlyPriceId || activePriceId === plan.yearlyPriceId : false

        return {
          ...plan,
          price,
          priceLabel,
          priceId,
          isCurrentPlan,
        }
      }),
    [billingCycle, plans, activePriceId],
  )

  const activePlanLabel = useMemo(() => {
    if (!hasSubscription || !activePriceId) return null

    const match = plans
      .flatMap((plan) => [
        { plan, priceId: plan.monthlyPriceId, interval: plan.monthlyInterval, amount: plan.monthlyPrice, currency: plan.monthlyCurrency },
        { plan, priceId: plan.yearlyPriceId, interval: plan.yearlyInterval, amount: plan.yearlyPrice, currency: plan.yearlyCurrency },
      ])
      .find((item) => item.priceId === activePriceId)

    return match ? `${match.plan.name} (${match.interval})` : null
  }, [activePriceId, hasSubscription, plans])

  const handleSubscribe = async (priceId: string, planName: string) => {
    setCheckoutError(null)
    setCheckoutLoading(planName)

    if (status === 'unauthenticated') {
      window.location.assign('/auth/login')
      return
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, billingCycle }),
      })

      if (response.status === 401) {
        window.location.assign('/auth/login')
        return
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || 'Could not create checkout session')
      }

      if (!data?.url) {
        throw new Error('Stripe did not return a checkout URL')
      }

      window.location.assign(data.url)
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Could not create checkout session')
    } finally {
      setCheckoutLoading(null)
    }
  }

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Available plans</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">Choose the billing plan that fits your team.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Pick monthly or yearly pricing and subscribe directly from your dashboard.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full bg-slate-100 p-1 text-sm shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-full px-4 py-2 transition ${billingCycle === 'monthly' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`rounded-full px-4 py-2 transition ${billingCycle === 'yearly' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">{hasSubscription ? 'Current subscription' : 'No active subscription'}</p>
            <p className="mt-2 text-sm text-slate-600">
              {hasSubscription
                ? `Your current plan is ${activePlanLabel ?? 'a subscription plan'}. Choose another tier to upgrade or downgrade.`
                : 'Select a plan to begin your subscription and access billing features.'}
            </p>
          </div>
          <Button as="button" type="button" disabled={!hasSubscription} variant="secondary">
            Manage billing
          </Button>
        </div>
      </div>

      {checkoutError ? (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-red-900">
          <p className="text-sm font-medium">{checkoutError}</p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        {planItems.map((plan) => (
          <div key={plan.name} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">{plan.name}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{plan.priceLabel}</p>
                <p className="mt-2 text-sm text-slate-600">{getIntervalLabel(billingCycle === 'monthly' ? plan.monthlyInterval : plan.yearlyInterval)}</p>
              </div>
              {plan.isCurrentPlan ? (
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                  Current plan
                </span>
              ) : null}
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-600">{plan.description}</p>

            <div className="mt-8 space-y-3">
              <p className="text-sm font-semibold text-slate-900">Billing interval</p>
              <p className="text-sm text-slate-600">{billingCycle === 'monthly' ? plan.monthlyInterval : plan.yearlyInterval}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                as="button"
                type="button"
                disabled={!plan.priceId || plan.isCurrentPlan || checkoutLoading !== null}
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                variant={plan.isCurrentPlan ? 'secondary' : 'primary'}
              >
                {checkoutLoading === plan.name ? 'Redirecting…' : getButtonLabel(hasSubscription, plan.isCurrentPlan, plan.name)}
              </Button>
              {!plan.priceId ? (
                <p className="text-sm text-slate-500">Stripe price ID not configured for this plan.</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
