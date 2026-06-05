'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Button from '@/src/components/ui/Button'
import Section from '@/src/components/ui/Section'

interface PriceInfo {
  id: string
  amount: number
  currency: string
  interval: 'month' | 'year' | string
}

interface PriceData {
  [key: string]: PriceInfo
}

const plansConfig = [
  {
    name: 'Starter',
    description: 'Perfect for early-stage teams launching billing automation.',
    fallbackPrices: {
      monthly: 29,
      yearly: 23,
    },
    priceKeys: {
      monthly: 'starter_monthly',
      yearly: 'starter_yearly',
    },
    fallbackPriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? '',
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY ?? '',
    },
    features: ['Unlimited invoices', 'Customer portal', 'Basic analytics'],
  },
  {
    name: 'Pro',
    description: 'Scale confidently with advanced subscription and revenue tools.',
    fallbackPrices: {
      monthly: 79,
      yearly: 63,
    },
    priceKeys: {
      monthly: 'pro_monthly',
      yearly: 'pro_yearly',
    },
    fallbackPriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '',
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? '',
    },
    features: ['Advanced reporting', 'Webhook automation', 'Priority support'],
  },
  {
    name: 'Business',
    description: 'Enterprise-grade billing for high-volume operations.',
    fallbackPrices: {
      monthly: 199,
      yearly: 159,
    },
    priceKeys: {
      monthly: 'business_monthly',
      yearly: 'business_yearly',
    },
    fallbackPriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY ?? '',
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEARLY ?? '',
    },
    features: ['Custom workflows', 'Dedicated support', 'Advanced integrations', 'SLA guarantee'],
  },
]

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [stripePrices, setStripePrices] = useState<PriceData>({})
  const [loading, setLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true)

      try {
        const response = await fetch('/api/pricing')
        if (!response.ok) {
          throw new Error(`Pricing endpoint returned ${response.status}`)
        }

        const data = (await response.json()) as PriceData
        const hasValidPrices = data && Object.keys(data).length > 0

        if (hasValidPrices) {
          setStripePrices(data)
          setIsFallback(false)
        } else {
          setStripePrices({})
          setIsFallback(true)
        }
      } catch (error) {
        console.error('Error fetching prices:', error)
        setStripePrices({})
        setIsFallback(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
  }, [])

  const plans = useMemo(
    () =>
      plansConfig.map((plan) => {
        const monthly = stripePrices[plan.priceKeys.monthly]
        const yearly = stripePrices[plan.priceKeys.yearly]

        return {
          ...plan,
          monthlyPrice: monthly?.amount ?? plan.fallbackPrices.monthly,
          monthlyCurrency: monthly?.currency ?? 'usd',
          monthlyInterval: monthly?.interval ?? 'month',
          monthlyPriceId: monthly?.id || plan.fallbackPriceIds.monthly,
          yearlyPrice: yearly?.amount ?? plan.fallbackPrices.yearly,
          yearlyCurrency: yearly?.currency ?? 'usd',
          yearlyInterval: yearly?.interval ?? 'year',
          yearlyPriceId: yearly?.id || plan.fallbackPriceIds.yearly,
        }
      }),
    [stripePrices],
  )

  const { data: session, status } = useSession()
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const activePlan = useMemo(
    () =>
      plans.map((plan) => {
        const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
        const interval = billingCycle === 'monthly' ? plan.monthlyInterval : plan.yearlyInterval
        const currency = billingCycle === 'monthly' ? plan.monthlyCurrency : plan.yearlyCurrency
        const priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId

        return {
          ...plan,
          price: Math.round(price),
          interval,
          currency,
          priceId,
        }
      }),
    [billingCycle, plans],
  )

  const formatCurrency = (amount: number, currency: string) => {
    if (currency.toLowerCase() === 'usd') {
      return `$${amount}`
    }
    return `${amount} ${currency.toUpperCase()}`
  }

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
      console.error('Checkout failed:', error)
      setCheckoutError(
        error instanceof Error ? error.message : 'Checkout session could not be created. Please try again.',
      )
    } finally {
      setCheckoutLoading(null)
    }
  }

  return (
    <Section
      title="Pricing that grows with your business"
      description="Choose the plan that fits your team and keep your billing stack aligned with every customer lifecycle."
    >
      <div id="pricing" className="mt-12 space-y-8">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-slate-900/95 px-5 py-6 text-white sm:flex-row sm:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Billing cadence</p>
            <h3 className="mt-2 text-xl font-semibold">Flexible monthly and yearly billing</h3>
          </div>
          <div className="inline-flex items-center rounded-full bg-slate-800 p-1 text-sm shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-4 py-2 transition ${billingCycle === 'monthly' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-full px-4 py-2 transition ${billingCycle === 'yearly' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              Yearly
            </button>
          </div>
        </div>

        {!loading && isFallback && (
          <div className="rounded-3xl border border-amber-300 bg-amber-50 px-6 py-4 text-amber-900">
            <p className="text-sm font-medium">
              Stripe pricing is temporarily unavailable. Showing default plan prices instead.
            </p>
          </div>
        )}

        {checkoutError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-red-900">
            <p className="text-sm font-medium">{checkoutError}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm animate-pulse">
                <div className="h-8 bg-slate-200 rounded mb-4 w-3/4" />
                <div className="h-4 bg-slate-100 rounded mb-8 w-full" />
                <div className="h-12 bg-slate-200 rounded mb-8 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {activePlan.map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-950">{plan.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                  </div>
                  {billingCycle === 'yearly' ? (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                      Save 20%
                    </span>
                  ) : null}
                </div>
                <div className="mt-8 flex items-end gap-3">
                  <span className="text-5xl font-semibold tracking-tight text-slate-950">
                    {formatCurrency(plan.price, plan.currency)}
                  </span>
                  <span className="pb-1 text-sm text-slate-500">/{plan.interval === 'year' ? 'yr' : 'mo'}</span>
                </div>
                <div className="mt-8 space-y-4">
                  {plan.features.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-600" />
                      <p className="text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                  <Button
                    as="button"
                    type="button"
                    onClick={() => handleSubscribe(plan.priceId, plan.name)}
                    disabled={!plan.priceId || checkoutLoading !== null}
                    variant={plan.name === 'Pro' ? 'primary' : 'secondary'}
                    className="w-full"
                  >
                    {checkoutLoading === plan.name ? 'Redirecting...' : `Choose ${plan.name}`}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="rounded-3xl bg-sky-50 px-6 py-5 text-slate-700">
          <p className="text-sm font-medium">All plans come with unlimited invoices, secure payments, and email support.</p>
        </div>
      </div>
    </Section>
  )
}
