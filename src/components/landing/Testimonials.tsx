'use client'

import { motion } from 'framer-motion'
import Section from '@/src/components/ui/Section'

const testimonials = [
  {
    quote: 'BillingFlow helped our team cut invoice processing time in half and kept revenue predictable.',
    name: 'Maya Patel',
    role: 'Finance Lead, Orbit Labs',
  },
  {
    quote: 'Our subscription renewals feel smooth, and the portal experience is a huge win for customers.',
    name: 'Elijah Kim',
    role: 'CEO, Nova Metrics',
  },
  {
    quote: 'The automated webhook workflows freed our ops team from manual coordination and reduced errors.',
    name: 'Sofia Alvarez',
    role: 'COO, PrismPay',
  },
]

export default function Testimonials() {
  return (
    <Section title="Trusted by teams building the next SaaS companies" description="Hear how billing teams stay on top of revenue and retention with high confidence.">
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-slate-700">“{item.quote}”</p>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="font-semibold text-slate-950">{item.name}</p>
              <p className="mt-1 text-sm text-slate-500">{item.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
