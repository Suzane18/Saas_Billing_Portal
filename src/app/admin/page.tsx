import Link from 'next/link'
import { getAdminOverviewData } from '@/src/lib/adminQueries'
import MetricCard from '@/src/components/admin/MetricCard'

export default async function AdminPage() {
  const overview = await getAdminOverviewData()

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Admin Overview</h1>
            <p className="mt-2 text-sm text-slate-600">High-level operational metrics for your billing system.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/users" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Manage users
            </Link>
            <Link href="/admin/subscriptions" className="rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200">
              Subscription list
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <MetricCard label="Total users" value={overview.totalUsers.toString()} />
        <MetricCard label="Total subscribers" value={overview.totalSubscribers.toString()} />
        <MetricCard label="Active subscriptions" value={overview.activeSubscriptions.toString()} />
        <MetricCard label="Monthly revenue" value={`$${overview.monthlyRevenue.toLocaleString()}`} />
        <MetricCard label="Lifetime revenue" value={`$${overview.lifetimeRevenue.toLocaleString()}`} />
        <MetricCard label="Churn count" value={overview.churnCount.toString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Subscription status distribution</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(overview.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="capitalize text-sm text-slate-700">{status}</span>
                <span className="text-sm font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
