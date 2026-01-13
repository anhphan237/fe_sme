import { useEffect } from 'react'
import { useTenantsQuery } from '../../hooks/queries'
import { useAppStore } from '../../store/useAppStore'
import type { Role } from '../../shared/types'

const roles: Role[] = ['HR Admin', 'Manager', 'Employee', 'Super Admin']

export function RoleTenantSwitcher() {
  const { data: tenants } = useTenantsQuery()
  const { currentTenant, setTenant, role, setRole, currentUser, setUser } =
    useAppStore()

  useEffect(() => {
    if (!currentTenant && tenants && tenants.length > 0) {
      setTenant(tenants[0])
    }
  }, [currentTenant, setTenant, tenants])

  const handleRoleChange = (value: Role) => {
    setRole(value)
    if (currentUser) {
      setUser({ ...currentUser, role: value })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded-full border border-stroke bg-white px-3 py-2 text-sm"
        value={role}
        onChange={(event) => handleRoleChange(event.target.value as Role)}
      >
        {roles.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select
        className="rounded-full border border-stroke bg-white px-3 py-2 text-sm"
        value={currentTenant?.id ?? ''}
        onChange={(event) => {
          const next = tenants?.find((tenant) => tenant.id === event.target.value)
          if (next) {
            setTenant(next)
          }
        }}
      >
        {tenants?.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </div>
  )
}

