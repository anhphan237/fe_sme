import { fetchJson } from './client'
import type { RoleDefinition } from '../types'

export async function getRoles() {
  return fetchJson<RoleDefinition[]>('/api/roles')
}

export async function updateRole(id: string, payload: Partial<RoleDefinition>) {
  return fetchJson<RoleDefinition>(`/api/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

