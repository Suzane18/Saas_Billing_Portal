import Footer from '@/src/components/landing/Footer'
import Features from '@/src/components/landing/Features'
import FAQ from '@/src/components/landing/FAQ'
import Hero from '@/src/components/landing/Hero'
import Navbar from '@/src/components/landing/Navbar'
import Pricing from '@/src/components/landing/Pricing'
import Testimonials from '@/src/components/landing/Testimonials'

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-32">
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
