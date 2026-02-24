import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { usePlansQuery, useSubscriptionQuery, useUpdateSubscription } from '../../hooks/queries'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { useQueryClient } from '@tanstack/react-query'

function BillingPlan() {
  const { data, isLoading } = usePlansQuery()
  const { data: subscription } = useSubscriptionQuery()
  const updateSub = useUpdateSubscription()
  const addToast = useToast()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)

  const HIDDEN_PLANS = ['Basic Plan', 'Premium Plan']
  const plans = data?.filter((p) => !HIDDEN_PLANS.includes(p.name)) ?? []
  const currentPlanCode = (subscription as any)?.planCode ?? ''

  const handleConfirm = () => {
    if (!selected || !subscription) return
    updateSub.mutate(
      {
        subscriptionId: (subscription as any).subscriptionId,
        planCode: selected,
        status: 'ACTIVE',
      },
      {
        onSuccess: () => {
          addToast('Plan updated successfully.')
          queryClient.invalidateQueries({ queryKey: ['subscription'] })
          queryClient.invalidateQueries({ queryKey: ['plans'] })
          setSelected(null)
        },
        onError: (err) => addToast(`Failed: ${err.message}`),
      }
    )
  }

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
          {plans.map((plan) => {
            const isCurrent = plan.code === currentPlanCode
            return (
              <Card
                key={plan.id}
                className={isCurrent ? 'border-2 border-brand' : ''}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-2xl font-semibold">{plan.price}</p>
                <p className="text-sm text-muted">{plan.limits}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Button
                  className="mt-6"
                  disabled={isCurrent}
                  onClick={() => setSelected(plan.code)}
                >
                  {isCurrent ? 'Current Plan' : 'Upgrade/Downgrade'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={!!selected} title="Plan change" onClose={() => setSelected(null)}>
        <div className="space-y-3 text-sm">
          <p>Switch to plan <strong>{selected}</strong>?</p>
          <p>Prorate will be calculated automatically.</p>
          <Button disabled={updateSub.isPending} onClick={handleConfirm}>
            {updateSub.isPending ? 'Updating...' : 'Confirm change'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default BillingPlan

