import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useRolesQuery } from '../../hooks/queries'
import { Skeleton } from '../../components/ui/Skeleton'

const permissions = [
  'manage_users',
  'manage_templates',
  'view_reports',
  'assign_tasks',
  'review_evaluations',
  'complete_tasks',
  'submit_surveys',
]

function AdminRoles() {
  const { data, isLoading, isError, refetch } = useRolesQuery()
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeRole = data?.find((role) => role.id === activeId) ?? data?.[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        subtitle="Control access and permissions across the platform."
      />

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : isError ? (
        <Card>
          <p className="text-sm">
            Something went wrong.{' '}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="space-y-3">
            <h3 className="text-lg font-semibold">Roles</h3>
            <div className="space-y-2">
              {data?.map((role) => (
                <button
                  key={role.id}
                  className={`w-full rounded-2xl border px-4 py-2 text-left text-sm font-medium ${
                    role.id === activeRole?.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-stroke bg-white text-muted'
                  }`}
                  onClick={() => setActiveId(role.id)}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold">Permissions matrix</h3>
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted">
                <tr>
                  <th className="py-2">Permission</th>
                  <th className="py-2">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm} className="border-t border-stroke">
                    <td className="py-3 font-medium">{perm}</td>
                    <td className="py-3">
                      <input
                        type="checkbox"
                        defaultChecked={activeRole?.permissions.includes(perm)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6">
              <Button>Save</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AdminRoles

