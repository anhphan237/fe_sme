import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { useInstancesQuery, useStartInstance, useTemplatesQuery } from '../../hooks/queries'
import { useUsersQuery } from '../../hooks/queries'
import { useToast } from '../../components/ui/Toast'

function Employees() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: instances, isLoading, isError, refetch } = useInstancesQuery()
  const { data: users } = useUsersQuery()
  const { data: templates } = useTemplatesQuery()
  const startInstance = useStartInstance()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    employeeId: '',
    templateId: '',
    startDate: '',
  })

  const handleStart = async () => {
    const instance = await startInstance.mutateAsync({
      employeeId: form.employeeId,
      templateId: form.templateId,
      startDate: form.startDate,
      progress: 0,
    })
    toast('Onboarding started.')
    setOpen(false)
    navigate(`/onboarding/employees/${instance.id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Track onboarding status across teams."
        actionLabel="Start Onboarding"
        onAction={() => setOpen(true)}
      />

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            placeholder="Search employee"
            className="rounded-2xl border border-stroke px-4 py-2 text-sm"
          />
          <select className="rounded-2xl border border-stroke px-4 py-2 text-sm">
            <option>Status</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
          <input
            type="date"
            className="rounded-2xl border border-stroke px-4 py-2 text-sm"
          />
        </div>
      </Card>

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
        ) : instances && instances.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No onboarding instances"
              description="Start a new onboarding to track employees."
              actionLabel="Start Onboarding"
              onAction={() => setOpen(true)}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Start date</th>
                <th className="px-4 py-3">Progress %</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances?.map((instance) => {
                const employee = users?.find((user) => user.id === instance.employeeId)
                return (
                  <tr key={instance.id} className="border-t border-stroke hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{employee?.name}</td>
                    <td className="px-4 py-3 text-muted">{employee?.role}</td>
                    <td className="px-4 py-3 text-muted">{instance.startDate}</td>
                    <td className="px-4 py-3 text-muted">{instance.progress}%</td>
                    <td className="px-4 py-3 text-muted">{instance.status}</td>
                    <td className="px-4 py-3 text-muted">{employee?.manager ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/onboarding/employees/${instance.id}`)}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={open} title="Start onboarding" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm">
            Select employee
            <select
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.employeeId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, employeeId: event.target.value }))
              }
            >
              <option value="">Select</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Pick template
            <select
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.templateId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, templateId: event.target.value }))
              }
            >
              <option value="">Select</option>
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Confirm start date
            <input
              type="date"
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.startDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, startDate: event.target.value }))
              }
            />
          </label>
          <Button onClick={handleStart}>Create onboarding</Button>
        </div>
      </Modal>
    </div>
  )
}

export default Employees

