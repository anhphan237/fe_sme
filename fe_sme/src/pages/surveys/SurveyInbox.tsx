import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { useSurveyInstancesQuery } from '../../hooks/queries'

function SurveyInbox() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useSurveyInstancesQuery()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Survey Inbox"
        subtitle="Track pending surveys assigned to employees."
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
              title="No surveys"
              description="Surveys will appear here once scheduled."
              actionLabel="Send surveys"
              onAction={() => navigate('/surveys/send')}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Survey</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((survey) => (
                <tr key={survey.id} className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{survey.templateId}</td>
                  <td className="px-4 py-3 text-muted">{survey.dueDate}</td>
                  <td className="px-4 py-3 text-muted">{survey.status}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" onClick={() => navigate(`/surveys/inbox/${survey.id}`)}>
                      Open
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

export default SurveyInbox

