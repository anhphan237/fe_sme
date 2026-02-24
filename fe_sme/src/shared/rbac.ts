import type { Role } from './types'

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  HR: 'HR',
  IT: 'IT',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
}

const ROLE_PRIORITY: Role[] = [
  'ADMIN',
  'STAFF',
  'HR',
  'IT',
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
  roles.some((role) => role === 'ADMIN' || role === 'STAFF')
