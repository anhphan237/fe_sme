import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDepartmentsQuery } from '../../hooks/queries'

function Departments() {
  const { data, isLoading, isError, refetch } = useDepartmentsQuery()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="Create and maintain the org structure for this tenant."
      />

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            Something went wrong.{' '}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : data && data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No departments yet"
              description="Create your first department to organize teams."
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Department ID</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((dept) => (
                <tr key={dept.id} className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{dept.name}</td>
                  <td className="px-4 py-3 text-muted">{dept.id}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

export default Departments
