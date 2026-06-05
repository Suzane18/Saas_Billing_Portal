import Section from '@/src/components/ui/Section'

export default function BillingCancelPage() {
  return (
    <Section
      title="Checkout canceled"
      description="No worries — your subscription was not completed. You can choose a plan again when you are ready."
    >
      <div className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-950">Checkout was canceled.</p>
        <p className="mt-4 text-slate-600">
          If you want to continue, select a plan again and complete checkout.
        </p>
      </div>
    </Section>
  )
}
