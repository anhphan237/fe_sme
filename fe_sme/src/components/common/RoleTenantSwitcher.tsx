import { useEffect, useMemo } from 'react'
import { useTenantsQuery } from '../../hooks/queries'
import { useAppStore } from '../../store/useAppStore'
import { Badge } from '../ui/Badge'
import { ROLE_LABELS, getPrimaryRole, hasRequiredRole } from '../../shared/rbac'

export function RoleTenantSwitcher() {
  const { currentTenant, setTenant, currentUser } = useAppStore()
  const canLoadTenants =
    Boolean(currentUser?.companyId) ||
    hasRequiredRole(currentUser?.roles ?? [], ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])
  const { data: tenants } = useTenantsQuery(canLoadTenants)

  useEffect(() => {
    if (!currentUser?.companyId) {
      if (currentTenant) {
        setTenant(null)
      }
      return
    }
    if (!currentTenant && tenants && tenants.length > 0) {
      const matched = tenants.find((tenant) => tenant.id === currentUser.companyId)
      if (matched) {
        setTenant(matched)
      }
    }
  }, [currentTenant, currentUser, setTenant, tenants])

  const roleLabel = useMemo(() => {
    if (!currentUser?.roles?.length) {
      return '—'
    }
    const primary = getPrimaryRole(currentUser.roles)
    const label = ROLE_LABELS[primary]
    if (label) return label
    // Backend role chưa có trong ROLE_LABELS → hiển thị dạng "Employee" từ "EMPLOYEE"
    return primary.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  }, [currentUser?.roles])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="rounded-full border border-stroke bg-white px-3 py-2 text-sm">
        {currentUser?.name ?? 'Guest'}
      </div>
      <Badge>{roleLabel}</Badge>
      {currentUser?.roles?.length && currentUser.roles.length > 1 && (
        <Badge>+{currentUser.roles.length - 1} roles</Badge>
      )}
      {currentTenant && <Badge>{currentTenant.name}</Badge>}
    </div>
  )
}
