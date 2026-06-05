'use client'

import { motion } from 'framer-motion'
import Button from '@/src/components/ui/Button'

export default function Hero() {
  return (
    <section id="top" className="overflow-hidden bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-16 sm:px-8 lg:flex-row lg:items-center lg:gap-20">
        <div className="max-w-2xl space-y-6">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700"
          >
            SaaS billing made easy
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl"
          >
            Manage Your SaaS Billing With Confidence
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="max-w-xl text-lg leading-8 text-slate-600"
          >
            Build recurring revenue, automate invoices, and keep every customer subscription in sync with a modern billing dashboard built for fast growth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Button as="a" href="/auth/register" variant="primary">
              Start free trial
            </Button>
            <Button as="a" href="#pricing" variant="secondary">
              View pricing
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="relative mx-auto w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/60 sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium text-slate-900">BillingFlow</span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">Live preview</span>
          </div>
          <div className="space-y-5">
            <div className="rounded-3xl bg-sky-50 p-5">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Active customers</span>
                <span className="font-semibold text-slate-900">1,280</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-2 w-4/5 rounded-full bg-sky-500" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Monthly revenue</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">$24.8k</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Subscriptions active</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">582</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
