import type { Role } from './types'

export const ROLE_LABELS: Record<Role, string> = {
  PLATFORM_ADMIN: 'Platform Admin',
  PLATFORM_MANAGER: 'Platform Manager',
  PLATFORM_STAFF: 'Platform Staff',
  COMPANY_ADMIN: 'Company Admin',
  HR: 'HR',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
}

const ROLE_PRIORITY: Role[] = [
  'PLATFORM_ADMIN',
  'PLATFORM_MANAGER',
  'PLATFORM_STAFF',
  'COMPANY_ADMIN',
  'HR',
  'MANAGER',
  'EMPLOYEE',
]

export const getPrimaryRole = (roles: Role[]) =>
  ROLE_PRIORITY.find((role) => roles.includes(role)) ?? roles[0]

export const hasRequiredRole = (
  roles: Role[],
  requiredRoles?: Role[]
): boolean => {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }
  return requiredRoles.some((role) => roles.includes(role))
}

export const isPlatformRole = (roles: Role[]) =>
  roles.some((role) => role.startsWith('PLATFORM_'))
