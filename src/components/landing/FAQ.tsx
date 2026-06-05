'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Section from '@/src/components/ui/Section'

const faqItems = [
  {
    question: 'Can I switch between monthly and yearly billing?',
    answer: 'Yes — switching plans is easy, and annual plans automatically apply a savings discount for long-term customers.',
  },
  {
    question: 'How does the customer portal work?',
    answer: 'Customers can review invoices, update payment methods, and manage subscriptions without contacting support.',
  },
  {
    question: 'Do you support webhooks for billing updates?',
    answer: 'Absolutely. You can connect billing events to your own systems for realtime automation and reporting.',
  },
]

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  return (
    <Section title="Frequently asked questions" description="Answers to the most common billing and subscription questions.">
      <div id="faq" className="mt-12 space-y-4">
        {faqItems.map((item, index) => {
          const isOpen = activeIndex === index
          return (
            <div key={item.question} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setActiveIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between px-6 py-5 text-left text-slate-900"
              >
                <span className="text-base font-semibold">{item.question}</span>
                <span className="text-2xl text-sky-600">{isOpen ? '−' : '+'}</span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-6 pb-6 text-slate-600"
                  >
                    <p>{item.answer}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
