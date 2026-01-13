interface TabItem {
  label: string
  value: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.value}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            value === item.value
              ? 'bg-slate-900 text-white'
              : 'border border-stroke bg-white text-muted hover:bg-slate-50'
          }`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

