import { requireUser } from '@/lib/requireAuth'
import SignOutButton from './signout-button'

export default async function DashboardPage() {
  const session = await requireUser()

  return (
    <div className="min-h-screen p-6 bg-sky-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold text-sky-700">Dashboard</h1>
        <p className="mt-2 text-sky-600">Signed in as {session?.user?.email}</p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
