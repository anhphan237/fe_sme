import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type { FinanceSnapshot, Tenant } from '../types'

export async function getSaTenants() {
  return fetchJson<Tenant[]>('/api/sa/tenants')
}

export async function getSaFinance() {
  return fetchJson<FinanceSnapshot[]>('/api/sa/finance')
}

export interface PlatformSubscriptionMetricsPayload {
  startDate: string
  endDate: string
}

export async function getPlatformSubscriptionMetrics(payload: PlatformSubscriptionMetricsPayload) {
  if (useGateway()) {
    return gatewayRequest<PlatformSubscriptionMetricsPayload, any>(
      'com.sme.analytics.platform.subscription.metrics',
      payload
    )
  }
  return getSaFinance()
}

