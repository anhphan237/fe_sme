import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type { Role, User } from '../types'

export interface LoginPayload {
  email: string
  password: string
}

const KNOWN_ROLES = [
  'PLATFORM_ADMIN', 'PLATFORM_MANAGER', 'PLATFORM_STAFF',
  'COMPANY_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE',
] as const

/** Map backend role codes to app Role (BE có thể dùng ADMIN, app dùng COMPANY_ADMIN) */
const BACKEND_ROLE_MAP: Record<string, Role> = {
  ADMIN: 'COMPANY_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  PLATFORM_MANAGER: 'PLATFORM_MANAGER',
  PLATFORM_STAFF: 'PLATFORM_STAFF',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  HR: 'HR',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
}

function normalizeRoles(roles: unknown): Role[] {
  const raw = Array.isArray(roles) ? roles : []
  const mapped = raw
    .map((r) => (typeof r === 'string' ? r.toUpperCase() : String(r)))
    .map((r) => BACKEND_ROLE_MAP[r] ?? ((KNOWN_ROLES as readonly string[]).includes(r) ? (r as Role) : null))
    .filter((r): r is Role => r != null)
  return mapped.length ? mapped : ['EMPLOYEE']
}

/** Normalize backend user to app User type */
function normalizeUser(u: any): User {
  const roles = normalizeRoles(u.roles ?? (u.roleCode ? [u.roleCode] : ['EMPLOYEE']))
  return {
    id: u.id ?? u.userId ?? '',
    name: u.fullName ?? u.name ?? '',
    email: u.email ?? '',
    roles: roles.length ? roles : ['EMPLOYEE'],
    companyId: u.companyId ?? u.tenantId ?? null,
    department: u.departmentName ?? u.department ?? '',
    status: u.status === 'DISABLED' ? 'Inactive' : u.status === 'INVITED' ? 'Invited' : 'Active',
    createdAt: u.createdAt ?? new Date().toISOString().slice(0, 10),
  }
}

export async function login(payload: LoginPayload) {
  if (useGateway()) {
    const res = await gatewayRequest<LoginPayload, any>(
      'com.sme.identity.auth.login',
      payload,
      { tenantId: null }
    )
    const rawUser = res?.user ?? res?.data?.user ?? res
    const token =
      res?.token ??
      res?.accessToken ??
      res?.data?.token ??
      res?.data?.accessToken ??
      ''
    if (!token && !rawUser?.id && !rawUser?.userId) {
      const msg = (res?.message ?? res?.error) || 'Invalid response from server (missing user/token)'
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
    const user = normalizeUser(rawUser ?? {})
    return { user, token }
  }
  return fetchJson<{ user: User; token: string }>('/api/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface RegisterCompanyPayload {
  company: { name: string; taxCode: string; address: string; timezone?: string }
  admin: { username: string; password: string; fullName: string; phone?: string }
}

export async function registerCompany(payload: RegisterCompanyPayload) {
  if (useGateway()) {
    const res = await gatewayRequest<RegisterCompanyPayload, any>(
      'com.sme.company.register',
      payload,
      { tenantId: null, requestIdPrefix: 'company-register' }
    )
    const user = res?.admin ? normalizeUser({ ...res.admin, email: res.admin.username }) : null
    const token = res?.token ?? res?.accessToken ?? ''
    return { user, token }
  }
  return fetchJson<{ user: User; token: string }>('/api/register-company', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function logout() {
  if (useGateway()) return { ok: true }
  return fetchJson<{ ok: boolean }>('/api/logout', { method: 'POST' })
}

export async function me() {
  if (useGateway()) {
    const res = await gatewayRequest<Record<string, never>, any>(
      'com.sme.identity.user.me',
      {},
      { tenantId: null }
    ).catch(() => null)
    if (!res?.user) return { user: null }
    return { user: normalizeUser(res.user) }
  }
  return fetchJson<{ user: User | null }>('/api/me')
}
