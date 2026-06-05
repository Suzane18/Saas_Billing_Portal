import type { Subscription } from '@prisma/client'
import Button from '@/src/components/ui/Button'

interface SubscriptionCardProps {
  subscription: Subscription
}

const planLabelFromPriceId = (priceId: string) => {
  if (priceId.includes('starter')) return 'Starter'
  if (priceId.includes('pro')) return 'Pro'
  if (priceId.includes('business')) return 'Business'
  return 'Subscription Plan'
}

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value)

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  past_due: 'bg-amber-100 text-amber-700',
  canceled: 'bg-rose-100 text-rose-700',
  unpaid: 'bg-rose-100 text-rose-700',
  incomplete: 'bg-slate-100 text-slate-700',
  incomplete_expired: 'bg-slate-100 text-slate-700',
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const planName = planLabelFromPriceId(subscription.stripePriceId ?? '')
  const statusClass = statusStyles[subscription.status] ?? 'bg-slate-100 text-slate-700'

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">Current plan</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{planName}</h2>
          <p className="mt-2 text-sm text-slate-600">Subscribed using Stripe price</p>
          <p className="mt-3 break-all text-sm font-medium text-slate-800">{subscription.stripePriceId}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${statusClass}`}>
            {subscription.status}
          </span>
        </div>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-5">
          <dt className="text-xs uppercase tracking-[0.28em] text-slate-500">Renewal date</dt>
          <dd className="mt-2 text-base font-semibold text-slate-950">
            {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'}
          </dd>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <dt className="text-xs uppercase tracking-[0.28em] text-slate-500">Created date</dt>
          <dd className="mt-2 text-base font-semibold text-slate-950">
            {formatDate(subscription.createdAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-950">Manage Billing</p>
            <p className="mt-1 text-sm text-slate-600">
              Placeholder for Stripe Customer Portal integration.
            </p>
          </div>
          <Button as="button" type="button" disabled variant="secondary">
            Manage billing
          </Button>
        </div>
      </div>
    </div>
  )
}
