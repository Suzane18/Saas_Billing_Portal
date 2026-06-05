import { getAdminUsers } from '@/src/lib/adminQueries'
import Pagination from '@/src/components/admin/Pagination'
import StatusBadge from '@/src/components/admin/StatusBadge'

interface UsersPageProps {
  searchParams?: { page?: string; search?: string }
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const page = Number(searchParams?.page ?? '1') || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const { users, total } = await getAdminUsers({ page, pageSize: 20, search })

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">User management</h1>
            <p className="mt-2 text-sm text-slate-600">Search, inspect, and review user accounts and subscription status.</p>
          </div>
          <form className="flex w-full max-w-md items-center gap-2 sm:w-auto" action="/admin/users">
            <input
              name="search"
              defaultValue={search ?? ''}
              placeholder="Search by name or email"
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
            <button type="submit" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Subscription</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {users.map((user) => {
              const latestSubscription = user.subscriptions?.[0]
              return (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">{user.name ?? '—'}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4">{latestSubscription?.stripePriceId ?? 'None'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={latestSubscription?.status ?? 'none'} />
                  </td>
                  <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} pageSize={20} totalItems={total} basePath="/admin/users" />
    </div>
  )
}
