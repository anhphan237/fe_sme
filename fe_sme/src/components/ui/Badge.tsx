import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600',
        className
      )}
      {...props}
    />
  )
}

