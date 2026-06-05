import { ReactNode } from 'react'
import { requireAdmin } from '@/src/lib/requireAdmin'
import AdminNav from '@/src/components/admin/AdminNav'

export const metadata = {
  title: 'Admin Dashboard',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:w-80">
            <AdminNav />
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
