import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type { User, UserDetail } from '../types'

function normalizeUser(u: any): User {
  return {
    id: u.id ?? u.userId ?? u.identityUserId ?? '',
    name: u.fullName ?? u.name ?? '',
    email: u.email ?? '',
    roles: Array.isArray(u.roles) ? u.roles : [u.roleCode ?? 'EMPLOYEE'],
    companyId: u.companyId ?? u.tenantId ?? null,
    department: u.departmentName ?? u.department ?? u.departmentId ?? '',
    status: u.status === 'DISABLED' ? 'Inactive' : u.status === 'INVITED' ? 'Invited' : 'Active',
    employeeId: u.employeeId ?? u.employeeProfileId ?? u.profileId ?? null,
    managerUserId: u.managerUserId ?? u.managerId ?? null,
    manager: u.managerName ?? u.manager ?? undefined,
    createdAt: u.createdAt ?? new Date().toISOString().slice(0, 10),
  }
}

/** Map response com.sme.identity.user.get sang UserDetail */
function mapUserDetailResponse(d: any): UserDetail {
  return {
    userId: d.userId ?? d.id ?? '',
    email: d.email ?? d.employeeEmail ?? '',
    fullName: d.fullName ?? d.employeeName ?? d.name ?? '',
    phone: d.phone ?? d.employeePhone ?? null,
    status: d.status === 'DISABLED' ? 'DISABLED' : d.status === 'INVITED' ? 'INVITED' : 'ACTIVE',
    employeeId: d.employeeId ?? null,
    departmentId: d.departmentId ?? null,
    employeeCode: d.employeeCode ?? null,
    employeeName: d.employeeName ?? d.fullName ?? null,
    employeeEmail: d.employeeEmail ?? d.email ?? null,
    employeePhone: d.employeePhone ?? d.phone ?? null,
    jobTitle: d.jobTitle ?? null,
    managerUserId: d.managerUserId ?? null,
    startDate: d.startDate ?? null,
    workLocation: d.workLocation ?? null,
    employeeStatus: d.employeeStatus ?? d.status ?? null,
  }
}

export async function getUsers() {
  if (useGateway()) {
    const res = await gatewayRequest<Record<string, never>, any>(
      'com.sme.identity.user.list',
      {},
      { requestIdPrefix: 'user-list' }
    )
    // Backend returns data: { users: [...] }
    const list =
      Array.isArray(res)
        ? res
        : res?.users ??
          res?.items ??
          res?.list ??
          res?.result ??
          (Array.isArray(res?.data) ? res.data : null) ??
          res?.data?.users ??
          res?.data?.items ??
          []
    return (Array.isArray(list) ? list : []).map(normalizeUser)
  }
  return fetchJson<User[]>('/api/users')
}

export interface CreateUserPayload {
  email: string
  fullName: string
  password: string
  phone?: string
  roleCode: string
  departmentId?: string
}

export async function createUser(payload: CreateUserPayload) {
  if (useGateway()) {
    const res = await gatewayRequest<CreateUserPayload, any>(
      'com.sme.identity.user.create',
      payload,
      { requestIdPrefix: 'user-create' }
    )
    return normalizeUser(res ?? payload)
  }
  return fetchJson<User>('/api/users/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function inviteUser(payload: Partial<User> & { email: string }) {
  return createUser({
    email: payload.email,
    fullName: payload.name ?? 'Invited User',
    password: (payload as any).password ?? 'changeme',
    phone: (payload as any).phone,
    roleCode: payload.roles?.[0] ?? 'EMPLOYEE',
  })
}

export interface UpdateUserPayload {
  userId: string
  fullName?: string
  phone?: string
}

export async function updateUser(id: string, payload: Partial<User>) {
  if (useGateway()) {
    const res = await gatewayRequest<UpdateUserPayload, any>(
      'com.sme.identity.user.update',
      { userId: id, fullName: payload.name, phone: (payload as any).phone },
      { requestIdPrefix: 'user-update' }
    )
    return normalizeUser(res ?? { ...payload, id })
  }
  return fetchJson<User>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function disableUser(userId: string, reason: string) {
  if (useGateway()) {
    return gatewayRequest<{ userId: string; reason: string }, unknown>(
      'com.sme.identity.user.disable',
      { userId, reason },
      { requestIdPrefix: 'user-disable' }
    )
  }
  return updateUser(userId, { status: 'Inactive' })
}

export async function assignRole(userId: string, roleCode: string) {
  if (useGateway()) {
    return gatewayRequest<{ userId: string; roleCode: string }, unknown>(
      'com.sme.identity.role.assign',
      { userId, roleCode },
      { requestIdPrefix: 'role-assign' }
    )
  }
  return fetchJson<User>(`/api/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ roleCode }),
  })
}

export async function getUserDetail(userId: string): Promise<UserDetail | User> {
  if (useGateway()) {
    const res = await gatewayRequest<{ userId: string }, any>(
      'com.sme.identity.user.get',
      { userId },
      { requestIdPrefix: 'user-get' }
    )
    // Backend returns data: { userId, email, fullName, phone, ... } — gateway returns data; unwrap if nested
    const raw = res?.user ?? res?.data ?? res
    const d = raw && typeof raw === 'object' ? raw : { userId }
    return mapUserDetailResponse(d)
  }
  return fetchJson<User>(`/api/users/${userId}`)
}

