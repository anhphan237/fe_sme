import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition',
        variant === 'primary' && 'bg-brand text-white hover:bg-brandDark',
        variant === 'secondary' &&
          'border border-stroke bg-white text-ink hover:bg-slate-50',
        variant === 'ghost' && 'text-ink hover:bg-slate-100',
        variant === 'destructive' && 'bg-red-500 text-white hover:bg-red-600',
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

