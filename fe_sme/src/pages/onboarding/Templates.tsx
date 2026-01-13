import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { useTemplatesQuery } from '../../hooks/queries'

function Templates() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useTemplatesQuery()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        subtitle="Manage onboarding templates by role and department."
        actionLabel="New Template"
        onAction={() => navigate('/onboarding/templates/new')}
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
              title="No templates yet"
              description="Create your first onboarding template to get started."
              actionLabel="New Template"
              onAction={() => navigate('/onboarding/templates/new')}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Template name</th>
                <th className="px-4 py-3">Stages</th>
                <th className="px-4 py-3">Tasks</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((template) => (
                <tr key={template.id} className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{template.name}</td>
                  <td className="px-4 py-3 text-muted">{template.stages.length}</td>
                  <td className="px-4 py-3 text-muted">
                    {template.stages.reduce((sum, stage) => sum + stage.tasks.length, 0)}
                  </td>
                  <td className="px-4 py-3 text-muted">{template.updatedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => navigate(`/onboarding/templates/${template.id}`)}>
                        View
                      </Button>
                      <Button variant="ghost">Edit</Button>
                      <Button variant="ghost">Duplicate</Button>
                      <Button variant="ghost">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

export default Templates

