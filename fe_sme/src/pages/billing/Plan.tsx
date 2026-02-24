import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import {
  usePlansQuery,
  useSubscriptionQuery,
  useCreateSubscription,
  useUpdateSubscription,
} from '../../hooks/queries'
import { generateInvoice } from '../../shared/api/billing'
import { useAppStore } from '../../store/useAppStore'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { useQueryClient } from '@tanstack/react-query'
import type { Subscription } from '../../shared/types'

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function getCurrentPeriod() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 1)
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  }
}

async function handleSuccess(
  res: Subscription | undefined,
  navigate: (path: string) => void,
  addToast: (msg: string) => void,
  queryClient: any,
  setSelected: (v: string | null) => void
) {
  queryClient.invalidateQueries({ queryKey: ['subscription'] })
  queryClient.invalidateQueries({ queryKey: ['plans'] })
  setSelected(null)

  let invoiceId = res?.invoiceId
  const subscriptionId = res?.subscriptionId
  const prorateChargeVnd = res?.prorateChargeVnd ?? 0

  if (!invoiceId && subscriptionId) {
    try {
      const { periodStart, periodEnd } = getCurrentPeriod()
      const gen = await generateInvoice(subscriptionId, periodStart, periodEnd)
      invoiceId = (gen as { invoiceId?: string })?.invoiceId
    } catch {
      /* backend may not support or invoice exists */
    }
  }

  if (invoiceId) {
    const amount = prorateChargeVnd > 0 ? formatVnd(prorateChargeVnd) : '0 ₫'
    navigate(`/billing/checkout/${invoiceId}?amount=${encodeURIComponent(amount)}`)
    addToast('Please complete payment.')
  } else if (prorateChargeVnd > 0) {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    navigate('/billing/invoices')
    addToast('Invoice created. Please pay the prorate amount.')
  } else if (subscriptionId) {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    navigate('/billing/invoices')
    addToast('Subscription created. Check Invoices and pay when ready.')
  } else {
    addToast('Plan updated successfully.')
  }
}

function BillingPlan() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const currentTenant = useAppStore((s) => s.currentTenant)
  const { data, isLoading } = usePlansQuery()
  const { data: subscription } = useSubscriptionQuery()
  const createSub = useCreateSubscription()
  const updateSub = useUpdateSubscription()
  const addToast = useToast()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)

  const HIDDEN_PLANS = ['Basic Plan', 'Premium Plan']
  const plans = data?.filter((p) => !HIDDEN_PLANS.includes(p.name)) ?? []
  const currentPlanCode = (subscription as any)?.planCode ?? ''
  const companyId = currentUser?.companyId ?? currentTenant?.id ?? ''

  const handleConfirm = () => {
    if (!selected) return

    if (subscription && (subscription as Subscription).subscriptionId) {
      const sub = subscription as Subscription
      updateSub.mutate(
        {
          subscriptionId: sub.subscriptionId,
          planCode: selected,
          status: 'ACTIVE',
        },
        {
          onSuccess: (res) =>
            handleSuccess(res as Subscription, navigate, addToast, queryClient, setSelected),
          onError: (err) => addToast(`Failed: ${err.message}`),
        }
      )
    } else if (companyId) {
      createSub.mutate(
        { companyId: String(companyId), planCode: selected },
        {
          onSuccess: (res) =>
            handleSuccess(res as Subscription, navigate, addToast, queryClient, setSelected),
          onError: (err) => addToast(`Failed: ${err.message}`),
        }
      )
    } else {
      addToast('No company selected. Please switch tenant or contact support.')
    }
  }

  const isPending = createSub.isPending || updateSub.isPending

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
          <Button type="button" disabled={isPending} onClick={handleConfirm}>
            {isPending ? 'Processing...' : 'Confirm change'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default BillingPlan

