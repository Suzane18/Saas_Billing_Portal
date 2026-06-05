import { Fragment } from 'react'
import { getAdminSubscriptions } from '@/src/lib/adminQueries'
import Pagination from '@/src/components/admin/Pagination'
import StatusBadge from '@/src/components/admin/StatusBadge'

interface SubscriptionsPageProps {
  searchParams?: { page?: string; search?: string; status?: string; sortBy?: string; sortOrder?: string }
}

const statusOptions = ['active', 'trialing', 'canceled', 'past_due', 'incomplete', 'unpaid']
const sortOptions = [
  { value: 'currentPeriodStart', label: 'Plan Start Date' },
  { value: 'currentPeriodEnd', label: 'Renewal Date' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created Date' },
]

const formatDate = (value: Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(value)
    : 'Not Available'

export default async function AdminSubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const page = Number(searchParams?.page ?? '1') || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const status = typeof searchParams?.status === 'string' && searchParams.status.length > 0 ? searchParams.status : undefined
  const sortBy = typeof searchParams?.sortBy === 'string' ? searchParams.sortBy : 'currentPeriodEnd'
  const sortOrder = searchParams?.sortOrder === 'asc' ? 'asc' : 'desc'

  const { subscriptions, total, summary } = await getAdminSubscriptions({
    page,
    pageSize: 20,
    search,
    status,
    sortBy: sortBy as 'currentPeriodStart' | 'currentPeriodEnd' | 'status' | 'createdAt',
    sortOrder,
  })

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Subscription management</h1>
            <p className="mt-2 text-sm text-slate-600">Review active, canceled, and past-due subscriptions in one place.</p>
          </div>
          <form className="flex flex-wrap items-center gap-2" action="/admin/subscriptions">
            <select
              name="status"
              defaultValue={status ?? ''}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              name="sortBy"
              defaultValue={sortBy}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="sortOrder"
              defaultValue={sortOrder}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <input
              name="search"
              defaultValue={search ?? ''}
              placeholder="Search subscription or email"
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
            <button type="submit" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Filter
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Total subscriptions</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{summary.totalSubscriptions}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Active</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{summary.activeSubscriptions}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Cancelled</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{summary.canceledSubscriptions}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Expired</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{summary.expiredSubscriptions}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Upcoming renewals</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{summary.upcomingRenewals}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-semibold">User Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">User ID</th>
              <th className="px-6 py-4 font-semibold">Subscription ID</th>
              <th className="px-6 py-4 font-semibold">Current Plan</th>
              <th className="px-6 py-4 font-semibold">Price ID</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Plan Start Date</th>
              <th className="px-6 py-4 font-semibold">Renewal Date</th>
              <th className="px-6 py-4 font-semibold">Subscription Created</th>
              <th className="px-6 py-4 font-semibold">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {subscriptions.map((subscription) => {
              const planName = subscription.stripePriceId.includes('starter')
                ? 'Starter'
                : subscription.stripePriceId.includes('pro')
                ? 'Pro'
                : subscription.stripePriceId.includes('business')
                ? 'Business'
                : 'Unknown Plan'
              return (
                <Fragment key={subscription.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4">{subscription.user.name ?? 'Not Available'}</td>
                    <td className="px-6 py-4">{subscription.user.email}</td>
                    <td className="px-6 py-4 break-all">{subscription.user.id}</td>
                    <td className="px-6 py-4 break-all">{subscription.stripeSubscriptionId}</td>
                    <td className="px-6 py-4">{planName}</td>
                    <td className="px-6 py-4 break-all">{subscription.stripePriceId}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={subscription.status} />
                    </td>
                    <td className="px-6 py-4">{formatDate(subscription.currentPeriodStart)}</td>
                    <td className="px-6 py-4">{formatDate(subscription.currentPeriodEnd)}</td>
                    <td className="px-6 py-4">{formatDate(subscription.createdAt)}</td>
                    <td className="px-6 py-4">{formatDate(subscription.updatedAt)}</td>
                  </tr>
                  <tr key={`${subscription.id}-details`} className="bg-slate-50">
                    <td colSpan={11} className="px-6 py-4">
                      <details className="rounded-3xl border border-slate-200 bg-white p-4">
                        <summary className="cursor-pointer font-semibold text-slate-900">View details</summary>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">User Information</p>
                            <p className="mt-2 text-sm text-slate-700">Name: {subscription.user.name ?? 'Not Available'}</p>
                            <p className="text-sm text-slate-700">Email: {subscription.user.email}</p>
                            <p className="text-sm text-slate-700">User ID: {subscription.user.id}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Subscription Information</p>
                            <p className="mt-2 text-sm text-slate-700">Subscription ID: {subscription.stripeSubscriptionId}</p>
                            <p className="text-sm text-slate-700">Price ID: {subscription.stripePriceId}</p>
                            <p className="text-sm text-slate-700">Status: {subscription.status}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Billing Dates</p>
                            <p className="mt-2 text-sm text-slate-700">Plan Start Date: {formatDate(subscription.currentPeriodStart)}</p>
                            <p className="text-sm text-slate-700">Renewal Date: {formatDate(subscription.currentPeriodEnd)}</p>
                            <p className="text-sm text-slate-700">Created Date: {formatDate(subscription.createdAt)}</p>
                            <p className="text-sm text-slate-700">Last Updated: {formatDate(subscription.updatedAt)}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plan Information</p>
                            <p className="mt-2 text-sm text-slate-700">Current Plan: {planName}</p>
                            <p className="text-sm text-slate-700">Stripe Price ID: {subscription.stripePriceId}</p>
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} pageSize={20} totalItems={total} basePath="/admin/subscriptions" />
    </div>
  )
}
