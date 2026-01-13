import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/common/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Progress } from '../../components/ui/Progress'
import { Skeleton } from '../../components/ui/Skeleton'
import { useInstancesQuery, useDocumentsQuery } from '../../hooks/queries'
import { useAppStore } from '../../store/useAppStore'
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

const kpiMap = {
  'HR Admin': [
    { label: 'Active onboardings', value: '42' },
    { label: 'Tasks due this week', value: '18' },
    { label: 'Survey completion %', value: '86%' },
    { label: 'Plan usage this month', value: '72%' },
  ],
  Manager: [
    { label: 'Team onboardings', value: '9' },
    { label: 'Tasks assigned', value: '24' },
    { label: 'Pending evaluations', value: '4' },
    { label: 'Survey status', value: '78%' },
  ],
  Employee: [
    { label: 'Checklist progress %', value: '64%' },
    { label: 'Required docs pending', value: '3' },
    { label: 'Surveys due', value: '2' },
    { label: 'Messages from HR', value: '5' },
  ],
  'Super Admin': [
    { label: 'Active tenants', value: '34' },
    { label: 'New onboardings', value: '310' },
    { label: 'NPS score', value: '58' },
    { label: 'MRR growth', value: '+12%' },
  ],
}

const progressData = [
  { stage: 'Welcome', value: 24 },
  { stage: 'Systems', value: 18 },
  { stage: 'Role setup', value: 14 },
  { stage: 'First month', value: 9 },
]

function Dashboard() {
  const role = useAppStore((state) => state.role)
  const { data: instances, isLoading: instancesLoading, isError } =
    useInstancesQuery()
  const { data: documents, isLoading: docsLoading } = useDocumentsQuery()

  const kpis = kpiMap[role]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Role-based insights across onboarding progress and employee health."
        actionLabel="Create action"
        onAction={() => {}}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-muted">{kpi.label}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Onboarding Progress</h3>
              <p className="text-sm text-muted">Stages by volume</p>
            </div>
            <Badge>Last 30 days</Badge>
          </div>
          <div className="mt-6 h-64">
            {instancesLoading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
          <p className="text-sm text-muted">Next 24 hours</p>
          {instancesLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Finalize welcome kit for Leah Porter
              </li>
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Manager check-in: Marco Silva
              </li>
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Survey send: Day 7 pulse
              </li>
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Docs audit reminder
              </li>
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Update onboarding template
              </li>
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold">
            Documents Requiring Acknowledgment
          </h3>
          <p className="text-sm text-muted">This week</p>
          {docsLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {documents?.slice(0, 4).map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-2xl border border-stroke bg-slate-50 p-3"
                >
                  <span>{doc.title}</span>
                  <Badge>{doc.required ? 'Required' : 'Optional'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted">Timeline</p>
          {isError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm">
              Something went wrong. <button className="font-semibold">Retry</button>
            </div>
          ) : (
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-2xl border border-stroke bg-slate-50 p-3">
                <p className="font-semibold">Survey submitted</p>
                <p className="text-muted">Leah Porter completed day 7 survey.</p>
              </div>
              <div className="rounded-2xl border border-stroke bg-slate-50 p-3">
                <p className="font-semibold">Document acknowledged</p>
                <p className="text-muted">Policy Document 3 signed.</p>
              </div>
              <div className="rounded-2xl border border-stroke bg-slate-50 p-3">
                <p className="font-semibold">Checklist progress</p>
                <Progress value={64} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Dashboard

