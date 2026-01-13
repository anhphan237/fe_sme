import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

interface PageHeaderProps {
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
  extra?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  extra,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {extra}
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

