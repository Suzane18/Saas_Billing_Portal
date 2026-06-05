export default function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trialing: 'bg-sky-100 text-sky-700',
    canceled: 'bg-rose-100 text-rose-700',
    past_due: 'bg-amber-100 text-amber-700',
    incomplete: 'bg-slate-100 text-slate-700',
    unpaid: 'bg-rose-100 text-rose-700',
    none: 'bg-slate-100 text-slate-700',
  }
  const classes = statusMap[status] ?? 'bg-slate-100 text-slate-700'

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {status === 'none' ? 'No subscription' : status.replace('_', ' ')}
    </span>
  )
}
