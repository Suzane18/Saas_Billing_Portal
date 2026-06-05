'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Section from '@/src/components/ui/Section'

export default function BillingSuccessPage() {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setRedirecting(true)
      
      try {
        await fetch('/api/revalidate', { method: 'POST' }).catch(() => {
          console.log('Cache revalidation request sent')
        })
      } catch (error) {
        console.error('Revalidation error:', error)
      }

      router.push('/dashboard')
    }, 3000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <Section
      title="Subscription confirmed"
      description="Thank you for subscribing. Your billing is now active and your customer portal is ready."
    >
      <div className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-950">Payment completed successfully.</p>
        <p className="mt-4 text-slate-600">
          {redirecting ? 'Updating your dashboard...' : 'Your subscription is now processing in Stripe. You will be redirected to your dashboard shortly.'}
        </p>
      </div>
    </Section>
  )
}
