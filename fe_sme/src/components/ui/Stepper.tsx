interface StepperProps {
  steps: string[]
  current: number
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <div
            className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${
              index <= current
                ? 'bg-slate-900 text-white'
                : 'border border-stroke text-muted'
            }`}
          >
            {index + 1}
          </div>
          <span className={index <= current ? 'font-semibold' : 'text-muted'}>
            {step}
          </span>
        </div>
      ))}
    </div>
  )
}

