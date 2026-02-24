import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type {
  BillingPlan,
  Invoice,
  PaymentIntent,
  PaymentProvider,
  PaymentTransaction,
  Subscription,
  UsageMetric,
} from '../types'

/* ── helpers ─────────────────────────────────────────────── */

function formatVnd(amount: number | undefined | null): string {
  if (amount == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function mapPlan(p: any): BillingPlan {
  return {
    id: p.planId ?? p.id ?? '',
    code: p.code ?? '',
    name: p.name ?? '',
    price: formatVnd(p.priceVndMonthly),
    priceYearly: formatVnd(p.priceVndYearly),
    employeeLimit: p.employeeLimitPerMonth ?? 0,
    limits: `${p.employeeLimitPerMonth ?? 0} employees/month`,
    features: [
      `Up to ${p.employeeLimitPerMonth ?? 0} employees per month`,
      p.priceVndYearly ? `Yearly: ${formatVnd(p.priceVndYearly)}` : '',
    ].filter(Boolean),
    current: false,
  }
}

const INVOICE_STATUS_MAP: Record<string, Invoice['status']> = {
  PAID: 'Paid',
  ISSUED: 'Open',
  OVERDUE: 'Overdue',
}

function mapInvoice(inv: any): Invoice {
  return {
    id: inv.invoiceId ?? inv.id ?? '',
    invoiceNo: inv.invoiceNo ?? '',
    amount: formatVnd(inv.amountTotal ?? inv.amount),
    amountRaw: inv.amountTotal ?? 0,
    currency: inv.currency ?? 'VND',
    status: INVOICE_STATUS_MAP[inv.status] ?? inv.status ?? 'Open',
    date: inv.issuedAt
      ? new Date(inv.issuedAt).toLocaleDateString('vi-VN')
      : inv.date ?? '',
    dueDate: inv.dueAt
      ? new Date(inv.dueAt).toLocaleDateString('vi-VN')
      : undefined,
    companyId: inv.companyId ?? null,
    eInvoiceUrl: inv.eInvoiceUrl,
  }
}

function mapUsage(res: any): UsageMetric[] {
  return [
    {
      label: 'Employees onboarded',
      used: res.currentUsage ?? 0,
      limit: res.employeeLimitPerMonth ?? 0,
      alertLevel: res.alertLevel,
      limitPercent: res.limitPercent,
      month: res.month,
    },
  ]
}

function mapProvider(p: any): PaymentProvider {
  return {
    name: p.name ?? '',
    status: p.status === 'ACTIVE' ? 'Connected' : 'Disconnected',
    accountId: p.accountId,
    lastSync: p.lastSync,
  }
}

function mapPaymentIntent(p: any): PaymentIntent {
  const raw = p.status ?? ''
  const status = raw.toLowerCase().replace(/_/g, '_') as PaymentIntent['status']
  return {
    id: p.paymentIntentId ?? p.id ?? '',
    paymentTransactionId: p.paymentTransactionId,
    clientSecret: p.clientSecret ?? '',
    gateway: p.gateway,
    amount: p.amount ?? 0,
    currency: p.currency ?? 'VND',
    status,
    invoiceId: p.invoiceId ?? '',
  }
}

function mapTransaction(t: any): PaymentTransaction {
  return {
    id: t.id ?? '',
    invoiceId: t.invoiceId ?? '',
    amount: typeof t.amount === 'number' ? formatVnd(t.amount) : (t.amount ?? ''),
    currency: t.currency ?? 'VND',
    status: (t.status?.toLowerCase() ?? 'pending') as PaymentTransaction['status'],
    provider: t.provider ?? '',
    createdAt: t.createdAt ?? '',
    companyId: t.companyId ?? null,
  }
}

function mapSubscription(s: any): Subscription {
  return {
    subscriptionId: s.subscriptionId ?? '',
    planCode: s.planCode ?? '',
    status: s.status ?? '',
    billingCycle: s.billingCycle,
    currentPeriodStart: s.currentPeriodStart,
    currentPeriodEnd: s.currentPeriodEnd,
    autoRenew: s.autoRenew,
    prorateCreditVnd: s.prorateCreditVnd,
    prorateChargeVnd: s.prorateChargeVnd,
  }
}

/* ── 1. SUBSCRIPTION ─────────────────────────────────────── */

export async function createSubscription(companyId: string, planCode: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ companyId: string; planCode: string }, any>(
      'com.sme.billing.subscription.create',
      { companyId, planCode }
    )
    return mapSubscription(res)
  }
  return fetchJson<Subscription>('/api/subscription', {
    method: 'POST',
    body: JSON.stringify({ companyId, planCode }),
  })
}

export async function updateSubscription(payload: {
  subscriptionId?: string
  planCode?: string
  planId?: string
  status?: string
}) {
  if (useGateway()) {
    const res = await gatewayRequest<any, any>(
      'com.sme.billing.subscription.update',
      {
        subscriptionId: payload.subscriptionId,
        planCode: payload.planCode,
        status: payload.status ?? 'ACTIVE',
      }
    )
    return mapSubscription(res)
  }
  return fetchJson<{ ok: boolean }>('/api/subscription', {
    method: 'PATCH',
    body: JSON.stringify({ planId: payload.planId ?? payload.planCode }),
  })
}

export async function getSubscription(companyId?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ companyId?: string }, any>(
      'com.sme.billing.subscription.getCurrent',
      companyId ? { companyId } : {}
    )
    return mapSubscription(res)
  }
  return fetchJson<{ planId: string }>('/api/subscription') as Promise<any>
}

/* ── 2. PLAN ──────────────────────────────────────────────── */

export async function getPlans(status?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ status?: string }, any>(
      'com.sme.billing.plan.list',
      status ? { status } : {}
    )
    const list = res?.plans ?? res?.items ?? (Array.isArray(res) ? res : [])
    return list.map(mapPlan) as BillingPlan[]
  }
  return fetchJson<BillingPlan[]>('/api/plans')
}

export async function getCurrentPlan(planId?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ planId?: string }, any>(
      'com.sme.billing.plan.get',
      planId ? { planId } : {}
    )
    return mapPlan(res)
  }
  const sub = await getSubscription()
  return fetchJson<BillingPlan[]>('/api/plans').then((plans) =>
    plans.find((p) => p.id === sub.planId)
  )
}

/* ── 3. USAGE ─────────────────────────────────────────────── */

export async function trackUsage(subscriptionId: string, usageType: string, quantity: number) {
  if (useGateway()) {
    return gatewayRequest<
      { subscriptionId: string; usageType: string; quantity: number },
      { subscriptionId: string; usageType: string; quantity: number }
    >('com.sme.billing.usage.track', { subscriptionId, usageType, quantity })
  }
  return fetchJson('/api/usage/track', {
    method: 'POST',
    body: JSON.stringify({ subscriptionId, usageType, quantity }),
  })
}

export async function getUsage(month?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ month?: string }, any>(
      'com.sme.billing.usage.check',
      month ? { month } : {}
    )
    return mapUsage(res)
  }
  return fetchJson<UsageMetric[]>('/api/usage')
}

export async function getUsageSummary(subscriptionId?: string, month?: string) {
  if (useGateway()) {
    return gatewayRequest<{ subscriptionId?: string; month?: string }, any>(
      'com.sme.billing.usage.summary',
      {
        ...(subscriptionId && { subscriptionId }),
        ...(month && { month }),
      }
    )
  }
  return fetchJson('/api/usage/summary')
}

/* ── 4. INVOICE ───────────────────────────────────────────── */

export async function generateInvoice(
  subscriptionId: string,
  periodStart: string,
  periodEnd: string
) {
  if (useGateway()) {
    return gatewayRequest<
      { subscriptionId: string; periodStart: string; periodEnd: string },
      { invoiceId: string; status: string }
    >('com.sme.billing.invoice.generate', { subscriptionId, periodStart, periodEnd })
  }
  return fetchJson('/api/invoices', {
    method: 'POST',
    body: JSON.stringify({ subscriptionId, periodStart, periodEnd }),
  })
}

export async function getInvoices(subscriptionId?: string, status?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ subscriptionId?: string; status?: string }, any>(
      'com.sme.billing.invoice.list',
      {
        ...(subscriptionId && { subscriptionId }),
        ...(status && { status }),
      }
    )
    const list = res?.invoices ?? res?.items ?? (Array.isArray(res) ? res : [])
    return list.map(mapInvoice) as Invoice[]
  }
  return fetchJson<Invoice[]>('/api/invoices')
}

export async function getInvoice(invoiceId: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ invoiceId: string }, any>(
      'com.sme.billing.invoice.get',
      { invoiceId }
    )
    return mapInvoice(res)
  }
  return fetchJson<Invoice>(`/api/invoices/${invoiceId}`)
}

/* ── 5. PAYMENT ───────────────────────────────────────────── */

export async function createPaymentIntent(invoiceId: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ invoiceId: string }, any>(
      'com.sme.billing.payment.createIntent',
      { invoiceId }
    )
    return mapPaymentIntent(res)
  }
  return fetchJson<PaymentIntent>('/api/payment/create-intent', {
    method: 'POST',
    body: JSON.stringify({ invoiceId }),
  })
}

export async function connectPayment(payload: { provider: string }) {
  if (useGateway()) {
    return gatewayRequest<{ provider: string }, { ok: boolean }>(
      'com.sme.billing.payment.connect',
      payload
    )
  }
  return fetchJson<{ ok: boolean }>('/api/payment/connect', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getPaymentProviders() {
  if (useGateway()) {
    const res = await gatewayRequest<Record<string, never>, any>(
      'com.sme.billing.payment.providers',
      {}
    )
    const list = res?.providers ?? res?.items ?? (Array.isArray(res) ? res : [])
    return list.map(mapProvider) as PaymentProvider[]
  }
  return fetchJson<PaymentProvider[]>('/api/payment/providers')
}

export async function getPaymentStatus(paymentIntentId: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ paymentIntentId: string }, any>(
      'com.sme.billing.payment.status',
      { paymentIntentId }
    )
    return mapPaymentIntent(res)
  }
  return fetchJson<PaymentIntent>(`/api/payment/status/${paymentIntentId}`)
}

export async function getPaymentTransactions() {
  if (useGateway()) {
    const res = await gatewayRequest<Record<string, never>, any>(
      'com.sme.billing.payment.transactions',
      {}
    )
    const list = res?.transactions ?? res?.items ?? (Array.isArray(res) ? res : [])
    return list.map(mapTransaction) as PaymentTransaction[]
  }
  return fetchJson<PaymentTransaction[]>('/api/payment/transactions')
}

/* ── 6. DUNNING ───────────────────────────────────────────── */

export async function dunningRetry(dunningCaseId?: string, subscriptionId?: string) {
  if (useGateway()) {
    return gatewayRequest<
      { dunningCaseId?: string; subscriptionId?: string },
      {
        success: boolean
        message: string
        paymentIntentId: string
        clientSecret: string
        gateway: string
        retryCount: number
      }
    >('com.sme.billing.dunning.retry', {
      ...(dunningCaseId && { dunningCaseId }),
      ...(subscriptionId && { subscriptionId }),
    })
  }
  return Promise.resolve()
}
