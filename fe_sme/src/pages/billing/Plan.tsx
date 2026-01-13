import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { usePlansQuery } from '../../hooks/queries'
import { Skeleton } from '../../components/ui/Skeleton'

function BillingPlan() {
  const { data, isLoading } = usePlansQuery()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan"
        subtitle="Choose the plan that fits your onboarding volume."
      />

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {data?.map((plan) => (
            <Card
              key={plan.id}
              className={plan.current ? 'border-2 border-brand' : ''}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-2xl font-semibold">{plan.price}</p>
              <p className="text-sm text-muted">{plan.limits}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button className="mt-6" onClick={() => setOpen(true)}>
                {plan.current ? 'Current Plan' : 'Upgrade/Downgrade'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} title="Plan change" onClose={() => setOpen(false)}>
        <div className="space-y-3 text-sm">
          <p>Prorate preview: $42 credit applied.</p>
          <p>Effective on next billing cycle.</p>
          <Button>Confirm change</Button>
        </div>
      </Modal>
    </div>
  )
}

export default BillingPlan

