import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type { Department } from '../types'

export async function getDepartments(companyId?: string) {
  if (useGateway()) {
    const payload = companyId ? { companyId } : {}
    const res = await gatewayRequest<{ companyId?: string }, { items?: Department[]; list?: Department[] }>(
      'com.sme.company.department.list',
      payload
    )
    const list = res?.items ?? res?.list ?? []
    return Array.isArray(list) ? list : []
  }
  return fetchJson<Department[]>('/api/departments')
}

export interface CreateDepartmentPayload {
  companyId: string
  name: string
  type: string
}

export async function createDepartment(payload: CreateDepartmentPayload) {
  if (useGateway()) {
    return gatewayRequest<CreateDepartmentPayload, Department>(
      'com.sme.company.department.create',
      payload,
      { requestIdPrefix: 'dept-create' }
    )
  }
  return fetchJson<Department>('/api/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface UpdateDepartmentPayload {
  departmentId: string
  name: string
  type: string
}

export async function updateDepartment(payload: UpdateDepartmentPayload) {
  if (useGateway()) {
    return gatewayRequest<UpdateDepartmentPayload, Department>(
      'com.sme.company.department.update',
      payload,
      { requestIdPrefix: 'dept-update' }
    )
  }
  return fetchJson<Department>(`/api/departments/${payload.departmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
