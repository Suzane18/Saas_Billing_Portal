import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
}

type ButtonProps =
  | ({ as?: 'button' } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as: 'a' } & AnchorHTMLAttributes<HTMLAnchorElement>)

export default function Button({
  className,
  variant = 'primary',
  as = 'button',
  ...props
}: BaseButtonProps & ButtonProps) {
  const baseStyles = [
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
  ]

  const variantStyles = {
    primary: 'bg-sky-600 text-white shadow-lg shadow-sky-200/40 hover:bg-sky-700',
    secondary: 'bg-white text-sky-700 border border-sky-200 hover:bg-sky-50',
    ghost: 'bg-transparent text-slate-700 hover:text-sky-700',
  }

  const classes = twMerge(clsx(baseStyles, variantStyles[variant], className))

  if (as === 'a') {
    return <a className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)} />
  }

  return <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)} />
}
