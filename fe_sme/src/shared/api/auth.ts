import { fetchJson } from './client'
import { gatewayRequest, isGatewayEnabled, useGateway } from './gateway'
import type { Role, User } from '../types'

export interface LoginPayload {
  email: string
  password: string
}

/** Check if email is already registered. Returns true if exists, false otherwise. */
export async function checkEmailExists(email: string): Promise<boolean> {
  if (!isGatewayEnabled()) return false
  try {
    const res = await gatewayRequest<{ email: string }, boolean | { exists?: boolean }>(
      'com.sme.identity.auth.checkEmailExists',
      { email },
      { tenantId: null, requestIdPrefix: 'check-email' }
    )
    if (typeof res === 'boolean') return res
    return Boolean((res as any)?.exists ?? (res as any)?.data)
  } catch {
    return false
  }
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

/** Build User + token from register response. BE returns data: { companyId, adminUserId, accessToken } */
function parseRegisterResponse(
  res: any,
  payload: RegisterCompanyPayload
): { user: User | null; token: string } {
  const raw = res?.data ?? res?.result ?? res ?? {}
  const token = raw?.accessToken ?? raw?.token ?? res?.accessToken ?? res?.token ?? ''

  const rawUser = raw?.user ?? raw?.admin ?? res?.user ?? res?.admin
  if (rawUser) {
    const user = normalizeUser({ ...rawUser, email: rawUser.email ?? rawUser.username })
    return { user, token }
  }

  if (token && (raw?.adminUserId ?? raw?.companyId)) {
    const user: User = {
      id: raw.adminUserId ?? raw.userId ?? '',
      name: payload.admin.fullName ?? '',
      email: payload.admin.username,
      roles: ['COMPANY_ADMIN'],
      companyId: raw.companyId ?? null,
      department: '',
      status: 'Active',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    return { user, token }
  }

  return { user: null, token }
}

export async function registerCompany(payload: RegisterCompanyPayload) {
  if (useGateway()) {
    const res = await gatewayRequest<RegisterCompanyPayload, any>(
      'com.sme.company.register',
      payload,
      { tenantId: null, requestIdPrefix: 'company-register' }
    )
    const { user, token } = parseRegisterResponse(res, payload)
    if ((!user || !token) && payload.admin?.username && payload.admin?.password) {
      try {
        const loginRes = await login({
          email: payload.admin.username,
          password: payload.admin.password,
        })
        if (loginRes?.user && loginRes?.token) {
          return { user: loginRes.user, token: loginRes.token }
        }
      } catch {
        // fall through to return parsed user/token
      }
    }
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

/** Get current user. Safe to call from useEffect (uses isGatewayEnabled, not useGateway). */
export async function me() {
  if (isGatewayEnabled()) {
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
