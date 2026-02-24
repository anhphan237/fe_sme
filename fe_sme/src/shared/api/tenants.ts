import { fetchJson } from './client'
import type { Tenant } from '../types'

export async function getTenants() {
  return fetchJson<Tenant[]>('/api/tenants')
}

export async function updateTenant(id: string, payload: Partial<Tenant>) {
  return fetchJson<Tenant>(`/api/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

