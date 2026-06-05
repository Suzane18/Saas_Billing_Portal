import { requireUser } from '@/src/lib/requireAuth'
import prisma from '@/src/lib/prisma'
import { getAdminOverviewData } from '@/src/lib/adminQueries'
import SignOutButton from './signout-button'
import SubscriptionCard from '@/src/components/dashboard/SubscriptionCard'
import BillingPlans from '@/src/components/dashboard/BillingPlans'

const dashboardPlanDefinitions = [
  {
    name: 'Starter',
    description: 'Perfect for early-stage teams launching billing automation.',
    monthlyKey: 'starter_monthly',
    yearlyKey: 'starter_yearly',
    fallbackMonthly: 29,
    fallbackYearly: 23,
  },
  {
    name: 'Pro',
    description: 'Scale confidently with advanced subscription and revenue tools.',
    monthlyKey: 'pro_monthly',
    yearlyKey: 'pro_yearly',
    fallbackMonthly: 79,
    fallbackYearly: 63,
  },
  {
    name: 'Business',
    description: 'Enterprise-grade billing for high-volume operations.',
    monthlyKey: 'business_monthly',
    yearlyKey: 'business_yearly',
    fallbackMonthly: 199,
    fallbackYearly: 159,
  },
]

export default async function DashboardPage() {
  const session = await requireUser()
  const userId = session?.user?.id
  const role = session?.user?.role ?? 'USER'

  console.log('[Dashboard] Page rendered for user:', { userId, email: session?.user?.email })
  console.log('Session Role:', session.user.role)

  if (role === 'ADMIN') {
    const overview = await getAdminOverviewData()
    return (
      <div className="min-h-screen p-6 bg-sky-50">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-950">Admin billing dashboard</h1>
                <p className="mt-2 text-sm text-slate-600">Signed in as {session?.user?.email}</p>
              </div>
              <SignOutButton />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Total Users</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{overview.totalUsers}</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Total Subscriptions</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{overview.totalSubscriptions}</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Active Subscriptions</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{overview.activeSubscriptions}</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Monthly Revenue</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">${overview.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Lifetime Revenue</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">${overview.lifetimeRevenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Recent users</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {overview.recentUsers.map((user) => (
                  <div key={user.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-medium text-slate-900">{user.email}</p>
                    <p className="text-slate-600">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Recent subscriptions</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {overview.recentSubscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-medium text-slate-900">{subscription.stripePriceId}</p>
                    <p className="text-slate-600">{subscription.status} • {new Date(subscription.currentPeriodEnd ?? subscription.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const activeSubscription = userId
    ? await prisma.subscription.findFirst({
        where: { userId, status: 'active' },
        orderBy: { currentPeriodEnd: 'desc' },
      })
    : null

  console.log('[Dashboard] Active subscription fetched:', { userId, subscriptionId: activeSubscription?.id })

  const pricingUrl = new URL(
    '/api/pricing',
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  )

  const pricingResponse = await fetch(pricingUrl.toString(), { cache: 'no-store' })
  const pricingData = pricingResponse.ok ? await pricingResponse.json() : {}

  console.log('[Dashboard] Pricing data loaded:', { success: pricingResponse.ok })

  const plans = dashboardPlanDefinitions.map((plan) => {
    const monthlyPrice = pricingData[plan.monthlyKey]?.amount ?? plan.fallbackMonthly
    const yearlyPrice = pricingData[plan.yearlyKey]?.amount ?? plan.fallbackYearly
    const monthlyCurrency = pricingData[plan.monthlyKey]?.currency ?? 'usd'
    const yearlyCurrency = pricingData[plan.yearlyKey]?.currency ?? 'usd'
    const monthlyInterval = pricingData[plan.monthlyKey]?.interval ?? 'month'
    const yearlyInterval = pricingData[plan.yearlyKey]?.interval ?? 'year'
    const monthlyPriceId = pricingData[plan.monthlyKey]?.id ?? ''
    const yearlyPriceId = pricingData[plan.yearlyKey]?.id ?? ''

    return {
      name: plan.name,
      description: plan.description,
      monthlyPrice,
      yearlyPrice,
      monthlyCurrency,
      yearlyCurrency,
      monthlyInterval,
      yearlyInterval,
      monthlyPriceId,
      yearlyPriceId,
    }
  })

  const activeSubscriptionSummary = activeSubscription
    ? {
        stripePriceId: activeSubscription.stripePriceId,
        status: activeSubscription.status,
        planName: activeSubscription.stripePriceId
          ? activeSubscription.stripePriceId.includes('starter')
            ? 'Starter'
            : activeSubscription.stripePriceId.includes('pro')
            ? 'Pro'
            : activeSubscription.stripePriceId.includes('business')
            ? 'Business'
            : 'Subscription'
          : null,
      }
    : null

  return (
    <div className="min-h-screen p-6 bg-sky-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">Billing dashboard</h1>
              <p className="mt-2 text-sm text-slate-600">Signed in as {session?.user?.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>

        {!activeSubscription ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-semibold text-slate-950">No active subscription found</p>
            <p className="mt-3 text-slate-600">
              When you subscribe, your active plan, status, renewal date, and billing details will appear here.
            </p>
            <div className="mt-8">
              <button
                type="button"
                disabled
                className="inline-flex items-center rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-500"
              >
                Manage billing
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            <SubscriptionCard subscription={activeSubscription} />
          </div>
        )}

        <BillingPlans plans={plans} activeSubscription={activeSubscriptionSummary} />
      </div>
    </div>
  )
}
