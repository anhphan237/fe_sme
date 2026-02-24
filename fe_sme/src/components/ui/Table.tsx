import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stroke">
      <table
        className={clsx('w-full border-collapse text-sm', className)}
        {...props}
      />
    </div>
  )
}

