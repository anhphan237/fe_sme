import { fetchJson } from './client'
import type { DiscountCode, FinanceSnapshot, Tenant } from '../types'

export async function getSaTenants() {
  return fetchJson<Tenant[]>('/api/sa/tenants')
}

export async function getSaFinance() {
  return fetchJson<FinanceSnapshot[]>('/api/sa/finance')
}

export async function getDiscountCodes() {
  return fetchJson<DiscountCode[]>('/api/sa/discount-codes')
}

export async function createDiscountCode(payload: Partial<DiscountCode>) {
  return fetchJson<DiscountCode>('/api/sa/discount-codes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateDiscountCode(
  id: string,
  payload: Partial<DiscountCode>
) {
  return fetchJson<DiscountCode>(`/api/sa/discount-codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteDiscountCode(id: string) {
  return fetchJson<{ ok: boolean }>(`/api/sa/discount-codes/${id}`, {
    method: 'DELETE',
  })
}

