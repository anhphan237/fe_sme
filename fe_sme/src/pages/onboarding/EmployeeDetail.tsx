import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'
import { Progress } from '../../components/ui/Progress'
import { Pill } from '../../components/ui/Pill'
import { Drawer } from '../../components/ui/Drawer'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useInstancesQuery, useTemplatesQuery, useSaveEvaluation } from '../../hooks/queries'
import { useUsersQuery } from '../../hooks/queries'
import { Skeleton } from '../../components/ui/Skeleton'

function EmployeeDetail() {
  const { employeeId } = useParams()
  const { data: instances, isLoading, isError, refetch } = useInstancesQuery()
  const { data: templates } = useTemplatesQuery()
  const { data: users } = useUsersQuery()
  const saveEvaluation = useSaveEvaluation()
  const [tab, setTab] = useState('checklist')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [evalOpen, setEvalOpen] = useState(false)

  const instance = instances?.find((item) => item.id === employeeId)
  const employee = users?.find((user) => user.id === instance?.employeeId)
  const template = templates?.find((item) => item.id === instance?.templateId)
  const tasks = template?.stages.flatMap((stage) => stage.tasks) ?? []

  const milestones = useMemo(
    () => [
      { label: '7', status: 'Complete' },
      { label: '30', status: 'Pending' },
      { label: '60', status: 'Pending' },
    ],
    []
  )

  if (isLoading) {
    return <Skeleton className="h-64" />
  }

  if (isError) {
    return (
      <Card>
        <p className="text-sm">
          Something went wrong.{' '}
          <button className="font-semibold" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Detail"
        subtitle="Track checklist progress and evaluations."
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold">{employee?.name}</h3>
            <p className="text-sm text-muted">{employee?.role}</p>
            <p className="text-sm text-muted">
              Start date: {instance?.startDate}
            </p>
          </div>
          <div className="min-w-[220px] space-y-2">
            <p className="text-sm text-muted">Progress</p>
            <Progress value={instance?.progress ?? 0} />
          </div>
        </div>
      </Card>

      <Tabs
        items={[
          { label: 'Checklist', value: 'checklist' },
          { label: 'Evaluations', value: 'evaluations' },
          { label: 'Activity', value: 'activity' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'checklist' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold">Stage progress</h3>
            <div className="mt-4 space-y-4">
              {template?.stages.map((stage) => (
                <div key={stage.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{stage.name}</span>
                    <span className="text-muted">2/4</span>
                  </div>
                  <Progress value={60} />
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Tasks</h3>
            <div className="mt-4 space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  className="flex w-full items-center justify-between rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-sm"
                  onClick={() => setDrawerOpen(true)}
                >
                  <span>{task.title}</span>
                  <Pill>{task.required ? 'Required' : 'Optional'}</Pill>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'evaluations' && (
        <div className="grid gap-4 lg:grid-cols-3">
          {milestones.map((mile) => (
            <Card key={mile.label}>
              <h3 className="text-lg font-semibold">Day {mile.label}</h3>
              <p className="text-sm text-muted">Status: {mile.status}</p>
              {mile.status !== 'Complete' && (
                <Button className="mt-4" onClick={() => setEvalOpen(true)}>
                  Create evaluation
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <Card>
          <h3 className="text-lg font-semibold">Activity</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-stroke bg-slate-50 p-4">
              Task completed: CRM orientation
            </div>
            <div className="rounded-2xl border border-stroke bg-slate-50 p-4">
              Document acknowledged: Policy Document 3
            </div>
            <div className="rounded-2xl border border-stroke bg-slate-50 p-4">
              Survey submitted: Day 7 Pulse
            </div>
          </div>
        </Card>
      )}

      <Drawer open={drawerOpen} title="Task details" onClose={() => setDrawerOpen(false)}>
        <div className="space-y-3 text-sm">
          <p>Task details with comments, attachments, and reassign controls.</p>
          <Button>Mark done</Button>
        </div>
      </Drawer>

      <Modal open={evalOpen} title="Create evaluation" onClose={() => setEvalOpen(false)}>
        <div className="grid gap-3 text-sm">
          <label className="grid gap-2">
            Rating (1-5)
            <input type="number" min={1} max={5} className="rounded-2xl border border-stroke px-4 py-2" />
          </label>
          <label className="grid gap-2">
            Notes
            <textarea className="rounded-2xl border border-stroke px-4 py-2" rows={3} />
          </label>
          <Button
            onClick={async () => {
              await saveEvaluation.mutateAsync({ employeeId: employee?.id, milestone: '30', rating: 4 })
              setEvalOpen(false)
            }}
          >
            Save evaluation
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default EmployeeDetail

