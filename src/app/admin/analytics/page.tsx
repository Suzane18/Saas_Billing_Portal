import { getAdminAnalyticsData } from '@/src/lib/adminQueries'
import MetricCard from '@/src/components/admin/MetricCard'

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalyticsData()

  const revenueRows = Object.entries(analytics.monthlyRevenueTrend).sort(([a], [b]) => a.localeCompare(b))
  const signupRows = Object.entries(analytics.signupsByMonth).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Analytics</h1>
            <p className="mt-2 text-sm text-slate-600">Subscriber growth, revenue trends, and status distribution.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <MetricCard label="Tracked status buckets" value={Object.keys(analytics.subscriptionsByStatus).length.toString()} />
        <MetricCard label="Revenue months" value={revenueRows.length.toString()} />
        <MetricCard label="Signup months" value={signupRows.length.toString()} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Monthly revenue trend</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {revenueRows.map(([month, amount]) => (
              <div key={month} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>{month}</span>
                <span className="font-semibold">${amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Subscriber growth</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {signupRows.map(([month, count]) => (
              <div key={month} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>{month}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Subscription status distribution</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(analytics.subscriptionsByStatus).map(([status, count]) => (
            <div key={status} className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">{status}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
