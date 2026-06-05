import Section from '@/src/components/ui/Section'

const features = [
  {
    title: 'Invoice Management',
    description: 'Create, send, and reconcile invoices in one central workflow so you can avoid payment delays.',
  },
  {
    title: 'Subscription Tracking',
    description: 'Monitor recurring revenue and churn with live subscription status and renewal reminders.',
  },
  {
    title: 'Payment Methods',
    description: 'Accept cards and wallets securely with a modern payments API and one-click billing updates.',
  },
  {
    title: 'Customer Portal',
    description: 'Give customers access to billing history, invoices, and self-serve subscription changes.',
  },
  {
    title: 'Webhook Automation',
    description: 'Automate workflows and notifications when invoices, payments or subscriptions change.',
  },
  {
    title: 'Analytics',
    description: 'Track growth with clean revenue reports, cohort insights, and customer lifetime value.',
  },
]

export default function Features() {
  return (
    <Section title="Everything your billing team needs" description="A modern billing platform built for speed, accuracy, and predictable revenue.">
      <div id="features" className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Feature</div>
            <h3 className="mt-4 text-xl font-semibold text-slate-950">{feature.title}</h3>
            <p className="mt-3 text-slate-600 leading-7">{feature.description}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
