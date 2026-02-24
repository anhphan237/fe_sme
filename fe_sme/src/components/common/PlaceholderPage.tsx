import { Card } from '../ui/Card'
import { PageHeader } from './PageHeader'

interface PlaceholderPageProps {
  title: string
  subtitle: string
  items?: string[]
}

export function PlaceholderPage({ title, subtitle, items = [] }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <p className="text-sm text-muted">
          This is a placeholder view for the demo environment.
        </p>
        {items.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <li key={item} className="rounded-2xl border border-stroke bg-slate-50 px-4 py-2">
                {item}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
