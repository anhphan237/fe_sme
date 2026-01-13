import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Pill({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border border-stroke px-2.5 py-1 text-xs font-medium text-slate-600',
        className
      )}
      {...props}
    />
  )
}

