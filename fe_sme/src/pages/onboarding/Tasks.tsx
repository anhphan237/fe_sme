import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { useOnboardingTasksByInstanceQuery, useUpdateOnboardingTaskStatus, useInstancesQuery } from '../../hooks/queries'
import { useAppStore } from '../../store/useAppStore'
import type { OnboardingTask } from '../../shared/types'

const STATUS_DONE = 'Done'
const STATUS_COMPLETED_API = 'DONE'

function Tasks() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const currentUser = useAppStore((s) => s.currentUser)
  const userId = currentUser?.id
  const isEmployee = Boolean(currentUser?.roles?.includes('EMPLOYEE') && !currentUser?.roles?.some((r) => r === 'HR' || r === 'MANAGER'))
  const { data: instances } = useInstancesQuery(
    isEmployee && userId ? { employeeId: userId, status: 'ACTIVE' } : undefined
  )
  const myInstances = instances?.filter((i) => i.employeeId === userId) ?? []
  const onboardingId = myInstances[0]?.id
  const { data: tasks, isLoading, isError, error, refetch } = useOnboardingTasksByInstanceQuery(onboardingId)
  const updateStatus = useUpdateOnboardingTaskStatus()
  const completedCount = tasks?.filter((t) => t.status === STATUS_DONE).length ?? 0
  const totalCount = tasks?.length ?? 0

  const handleToggleTask = async (task: OnboardingTask) => {
    const isDone = task.status === STATUS_DONE
    const nextStatus = isDone ? 'PENDING' : STATUS_COMPLETED_API
    try {
      await updateStatus.mutateAsync({ taskId: task.id, status: nextStatus })
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks-by-instance'] })
      toast(isDone ? 'Task marked incomplete.' : 'Task marked complete.')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to update task.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Track onboarding tasks and assignments by role. Mark tasks complete when done."
      />

      {totalCount > 0 && (
        <Card className="p-4">
          <p className="text-sm text-muted">
            You have completed <strong>{completedCount}</strong> of <strong>{totalCount}</strong> tasks.
          </p>
        </Card>
      )}

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            {error != null && typeof (error as Error).message === 'string'
              ? (error as Error).message
              : 'Something went wrong.'}{' '}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : tasks && tasks.length > 0 ? (
          <ul className="divide-y divide-stroke">
            {tasks.map((task) => {
              const isDone = task.status === STATUS_DONE
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50"
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleTask(task)}
                      disabled={updateStatus.isPending}
                      className="h-5 w-5 rounded border-stroke text-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                    />
                    <span className={isDone ? 'text-muted line-through' : 'font-medium'}>
                      {task.title}
                    </span>
                  </label>
                  {task.dueDate && (
                    <span className="ml-auto text-sm text-muted">Due: {task.dueDate}</span>
                  )}
                  {task.status && task.status !== STATUS_DONE && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-muted">
                      {task.status}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No tasks yet"
              description={
                myInstances.length > 0
                  ? 'Your onboarding tasks will appear here once they are assigned. You can also open your onboarding to see progress.'
                  : 'You have no onboarding tasks. Start an onboarding from the Onboarding Employee page to get tasks.'
              }
              actionLabel={myInstances.length > 0 ? 'Open my onboarding' : undefined}
              onAction={
                myInstances.length > 0
                  ? () => navigate(`/onboarding/employees/${myInstances[0].id}`)
                  : () => navigate('/onboarding/employees')
              }
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default Tasks
