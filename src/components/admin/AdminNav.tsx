import Link from 'next/link'

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
  { href: '/admin/analytics', label: 'Analytics' },
]

export default function AdminNav() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Admin panel</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Billing operations</h2>
      </div>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
