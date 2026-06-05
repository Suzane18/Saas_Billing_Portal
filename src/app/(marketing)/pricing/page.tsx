import Footer from '@/src/components/landing/Footer'
import Navbar from '@/src/components/landing/Navbar'
import Pricing from '@/src/components/landing/Pricing'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-20 px-6 py-16 sm:px-8 lg:px-12">
        <section className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Pricing</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Choose a plan that fits your growth stage
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Everything you need to scale billing for your SaaS customers with confidence and clarity.
          </p>
        </section>
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
