interface ProgressProps {
  value: number
}

export function Progress({ value }: ProgressProps) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-brand"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

