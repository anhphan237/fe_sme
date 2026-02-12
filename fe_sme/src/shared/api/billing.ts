import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type { BillingPlan, Invoice, UsageMetric } from '../types'

export async function getPlans() {
  return fetchJson<BillingPlan[]>('/api/plans')
}

export async function getCurrentPlan(planId?: string) {
  if (useGateway()) {
    return gatewayRequest<{ planId?: string }, any>(
      'com.sme.billing.plan.get',
      planId ? { planId } : {}
    )
  }
  const sub = await getSubscription()
  return fetchJson<BillingPlan[]>(`/api/plans`).then((plans) =>
    plans.find((p) => p.id === sub.planId)
  )
}

export async function getSubscription() {
  if (useGateway()) {
    const plan = await getCurrentPlan()
    return { planId: plan?.id ?? plan?.planCode ?? '' }
  }
  return fetchJson<{ planId: string }>('/api/subscription')
}

export async function updateSubscription(payload: {
  subscriptionId?: string
  planCode?: string
  planId?: string
  status?: string
}) {
  if (useGateway() && (payload.subscriptionId || payload.planCode !== undefined)) {
    return gatewayRequest<any, unknown>(
      'com.sme.billing.subscription.update',
      {
        subscriptionId: payload.subscriptionId,
        planCode: payload.planCode,
        status: payload.status ?? 'ACTIVE',
      }
    )
  }
  return fetchJson<{ ok: boolean }>('/api/subscription', {
    method: 'PATCH',
    body: JSON.stringify({ planId: payload.planId ?? payload.planCode }),
  })
}

export async function getUsage(month?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ month?: string }, any>(
      'com.sme.billing.usage.check',
      month ? { month } : {}
    )
    if (res?.used !== undefined)
      return [{ label: 'Employees onboarded', used: res.used, limit: res.limit ?? 0 }] as UsageMetric[]
    return (res?.items ?? res ?? []) as UsageMetric[]
  }
  return fetchJson<UsageMetric[]>('/api/usage')
}

export async function getInvoices() {
  return fetchJson<Invoice[]>('/api/invoices')
}

export async function createPaymentIntent(invoiceId: string) {
  if (useGateway()) {
    return gatewayRequest<{ invoiceId: string }, any>(
      'com.sme.billing.payment.createIntent',
      { invoiceId }
    )
  }
  return connectPayment({ provider: 'stripe' })
}

export async function connectPayment(payload: { provider: string }) {
  return fetchJson<{ ok: boolean }>(
    '/api/payment/connect',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

export async function dunningRetry(dunningCaseId?: string, subscriptionId?: string) {
  if (useGateway()) {
    return gatewayRequest<
      { dunningCaseId?: string; subscriptionId?: string },
      unknown
    >('com.sme.billing.dunning.retry', {
      ...(dunningCaseId && { dunningCaseId }),
      ...(subscriptionId && { subscriptionId }),
    })
  }
  return Promise.resolve()
}

