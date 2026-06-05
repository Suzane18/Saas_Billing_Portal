import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export default function Section({
  title,
  description,
  children,
  className,
}: SectionProps) {
  return (
    <section className={`mx-auto max-w-7xl px-6 py-16 sm:px-8 ${className ?? ''}`}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">SaaS billing</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-slate-600 text-base leading-7">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}
