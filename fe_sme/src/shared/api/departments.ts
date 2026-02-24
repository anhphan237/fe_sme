import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type { Department } from '../types'

function mapDepartment(d: any): Department {
  return {
    id: d.departmentId ?? d.id ?? '',
    companyId: d.companyId ?? '',
    name: d.name ?? '',
    type: d.type ?? undefined,
    managerUserId: d.managerUserId ?? null,
  }
}

export async function getDepartments(companyId?: string) {
  if (useGateway()) {
    const payload = companyId ? { companyId } : {}
    const res = await gatewayRequest<{ companyId?: string }, { items?: any[]; list?: any[] }>(
      'com.sme.company.department.list',
      payload
    )
    const list = res?.items ?? res?.list ?? []
    return (Array.isArray(list) ? list : []).map(mapDepartment)
  }
  return fetchJson<Department[]>('/api/departments')
}

export interface CreateDepartmentPayload {
  companyId: string
  name: string
  type: string
  /** Required: userId of the manager (sent as managerId to backend). */
  managerId: string
}

export async function createDepartment(payload: CreateDepartmentPayload) {
  if (useGateway()) {
    const body = {
      companyId: payload.companyId,
      name: payload.name,
      type: payload.type,
      managerId: payload.managerId,
    }
    const res = await gatewayRequest<typeof body, any>(
      'com.sme.company.department.create',
      body,
      { requestIdPrefix: 'dept-create' }
    )
    return mapDepartment(res ?? {})
  }
  return fetchJson<Department>('/api/departments', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      type: payload.type,
      managerUserId: payload.managerId,
    }),
  })
}

export interface UpdateDepartmentPayload {
  departmentId: string
  name: string
  type?: string
  managerUserId?: string | null
}

export async function updateDepartment(payload: UpdateDepartmentPayload) {
  if (useGateway()) {
    const body = {
      departmentId: payload.departmentId,
      name: payload.name,
      ...(payload.type != null && { type: payload.type }),
      ...(payload.managerUserId != null && payload.managerUserId !== '' && { managerUserId: payload.managerUserId }),
    }
    const res = await gatewayRequest<typeof body, any>(
      'com.sme.company.department.update',
      body,
      { requestIdPrefix: 'dept-update' }
    )
    return mapDepartment(res ?? {})
  }
  return fetchJson<Department>(`/api/departments/${payload.departmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
