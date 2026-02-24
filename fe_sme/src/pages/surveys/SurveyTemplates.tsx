import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useSurveyTemplatesQuery } from '../../hooks/queries'

function SurveyTemplates() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useSurveyTemplatesQuery()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Survey Templates"
        subtitle="Design the questions employees will answer at key milestones."
        actionLabel="New Template"
        onAction={() => navigate('/surveys/templates/new')}
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
              title="No survey templates"
              description="Create a survey template to start sending feedback requests."
              actionLabel="New Template"
              onAction={() => navigate('/surveys/templates/new')}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((template) => (
                <tr key={template.id} className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{template.name}</td>
                  <td className="px-4 py-3 text-muted">{template.questions.length}</td>
                  <td className="px-4 py-3 text-muted">{template.target}</td>
                  <td className="px-4 py-3 text-muted">{template.updatedAt}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" onClick={() => navigate(`/surveys/templates/${template.id}`)}>
                      View
                    </Button>
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

export default SurveyTemplates

