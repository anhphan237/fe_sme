import { fetchJson } from './client'
import type { BillingPlan, Invoice, UsageMetric } from '../types'

export async function getPlans() {
  return fetchJson<BillingPlan[]>('/api/plans')
}

export async function getSubscription() {
  return fetchJson<{ planId: string }>('/api/subscription')
}

export async function updateSubscription(payload: { planId: string }) {
  return fetchJson<{ ok: boolean }>('/api/subscription', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function getUsage() {
  return fetchJson<UsageMetric[]>('/api/usage')
}

export async function getInvoices() {
  return fetchJson<Invoice[]>('/api/invoices')
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

