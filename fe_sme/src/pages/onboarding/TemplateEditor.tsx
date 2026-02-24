import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { Stepper } from '../../components/ui/Stepper'
import { useSaveTemplate, useTemplateQuery } from '../../hooks/queries'
import { useToast } from '../../components/ui/Toast'
import { useAppStore } from '../../store/useAppStore'
import { buildCreateTemplatePayload, templateToCreateForm } from '../../shared/api/onboarding'
import type { CreateOnboardingTemplatePayload } from '../../shared/api/onboarding'
import { ROLE_LABELS } from '../../shared/rbac'
import type { OnboardingTemplate } from '../../shared/types'

const WIZARD_STEPS = ['Template', 'Stages', 'Tasks', 'Review']

const STAGE_OPTIONS = [
  { value: 'PRE_BOARDING', label: 'Pre-boarding' },
  { value: 'DAY_1', label: 'First day' },
  { value: 'DAY_7', label: 'Day 7' },
  { value: 'DAY_30', label: 'Day 30' },
  { value: 'DAY_60', label: 'Day 60' },
]

const OWNER_TYPE_OPTIONS = [
  { value: 'ROLE', label: 'Role' },
  { value: 'DEPARTMENT', label: 'Department' },
]

const ROLE_REF_OPTIONS = ['HR', 'MANAGER', 'COMPANY_ADMIN', 'EMPLOYEE'] as const

type ChecklistForm = CreateOnboardingTemplatePayload['checklists'] extends (infer C)[] | undefined
  ? NonNullable<C>
  : never
type TaskForm = ChecklistForm['tasks'][number]

const emptyTask = (): TaskForm => ({
  title: '',
  description: '',
  ownerType: 'ROLE',
  ownerRefId: 'HR',
  dueDaysOffset: 0,
  requireAck: false,
  sortOrder: 1,
  status: 'ACTIVE',
})

const emptyChecklist = (): ChecklistForm => ({
  name: '',
  stage: 'DAY_1',
  sortOrder: 1,
  status: 'ACTIVE',
  tasks: [emptyTask()],
})

const initialCreateForm = (): CreateOnboardingTemplatePayload => ({
  name: '',
  description: '',
  status: 'ACTIVE',
  checklists: [emptyChecklist()],
})

const inputClass =
  'w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] transition focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20'
const labelClass = 'mb-1.5 block text-sm font-medium text-[#1d1d1f]'

function TemplateEditor() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const currentUser = useAppStore((s) => s.currentUser)
  const { data, isLoading } = useTemplateQuery(templateId)
  const saveTemplate = useSaveTemplate()

  const isCreate = templateId === 'new' || !templateId
  const duplicateFrom = (location.state as { duplicateFrom?: OnboardingTemplate })?.duplicateFrom
  const [createForm, setCreateForm] = useState<CreateOnboardingTemplatePayload>(initialCreateForm)
  const [wizardStep, setWizardStep] = useState(0)
  const [tasksStageIndex, setTasksStageIndex] = useState(0)
  const editFormSynced = useRef(false)

  const checklists = createForm.checklists ?? []
  const activeChecklist = checklists[tasksStageIndex]

  // Prefill form for duplicate (create from existing)
  useEffect(() => {
    if (!isCreate || !duplicateFrom) return
    setCreateForm(templateToCreateForm(duplicateFrom))
  }, [isCreate, duplicateFrom])

  // Reset sync flag when editing a different template
  useEffect(() => {
    if (isCreate) return
    editFormSynced.current = false
  }, [templateId, isCreate])

  // Prefill form for edit when template data is loaded
  useEffect(() => {
    if (isCreate || !data) return
    if (editFormSynced.current) return
    editFormSynced.current = true
    setCreateForm(templateToCreateForm(data))
  }, [isCreate, data])

  useEffect(() => {
    if (!isCreate) return
    setTasksStageIndex((s) => Math.min(s, Math.max(0, checklists.length - 1)))
  }, [isCreate, checklists.length])

  const template = useMemo(
    () =>
      data ?? {
        name: '',
        description: '',
        stages: [
          {
            id: 'stage-new',
            name: 'New stage',
            tasks: [
              { id: 'task-new', title: 'New task', ownerRole: 'EMPLOYEE' as const, dueOffset: 'Day 1', required: false },
            ],
          },
        ],
      },
    [data]
  )

  const handleSaveCreate = async () => {
    const createdBy = currentUser?.id ?? ''
    if (!createdBy) {
      toast('You must be logged in to create a template.')
      return
    }
    if (!createForm.name?.trim()) {
      toast('Template name is required.')
      return
    }
    const payload = buildCreateTemplatePayload({ ...createForm, createdBy })
    try {
      await saveTemplate.mutateAsync(payload)
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast('Template created.')
      navigate('/onboarding/templates')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to create template.')
    }
  }

  const handleSaveEdit = async () => {
    if (!templateId || templateId === 'new') return
    if (!createForm.name?.trim()) {
      toast('Template name is required.')
      return
    }
    try {
      await saveTemplate.mutateAsync({
        ...createForm,
        templateId,
        id: templateId,
      })
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['template', templateId] })
      toast('Template saved.')
      navigate('/onboarding/templates')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save template.')
    }
  }

  const updateCreateForm = (updates: Partial<CreateOnboardingTemplatePayload>) => {
    setCreateForm((prev) => ({ ...prev, ...updates }))
  }

  const updateChecklist = (index: number, updates: Partial<ChecklistForm>) => {
    setCreateForm((prev) => {
      const list = [...(prev.checklists ?? [])]
      list[index] = { ...list[index], ...updates }
      return { ...prev, checklists: list }
    })
  }

  const updateTask = (checklistIndex: number, taskIndex: number, updates: Partial<TaskForm>) => {
    setCreateForm((prev) => {
      const list = [...(prev.checklists ?? [])]
      const tasks = [...(list[checklistIndex]?.tasks ?? [])]
      tasks[taskIndex] = { ...tasks[taskIndex], ...updates }
      list[checklistIndex] = { ...list[checklistIndex], tasks }
      return { ...prev, checklists: list }
    })
  }

  const addChecklist = () => {
    setCreateForm((prev) => ({
      ...prev,
      checklists: [...(prev.checklists ?? []), emptyChecklist()],
    }))
  }

  const removeChecklist = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      checklists: prev.checklists?.filter((_, i) => i !== index) ?? [],
    }))
    setTasksStageIndex((s) => Math.min(s, Math.max(0, (createForm.checklists?.length ?? 1) - 2)))
  }

  const addTask = (checklistIndex: number) => {
    setCreateForm((prev) => {
      const list = [...(prev.checklists ?? [])]
      const tasks = [...(list[checklistIndex]?.tasks ?? []), emptyTask()]
      tasks[tasks.length - 1].sortOrder = tasks.length
      list[checklistIndex] = { ...list[checklistIndex], tasks }
      return { ...prev, checklists: list }
    })
  }

  const removeTask = (checklistIndex: number, taskIndex: number) => {
    setCreateForm((prev) => {
      const list = [...(prev.checklists ?? [])]
      const tasks = (list[checklistIndex]?.tasks ?? []).filter((_, i) => i !== taskIndex)
      list[checklistIndex] = { ...list[checklistIndex], tasks: tasks.length ? tasks : [emptyTask()] }
      return { ...prev, checklists: list }
    })
  }

  const canNext = () => {
    if (wizardStep === 0) return !!createForm.name?.trim()
    if (wizardStep === 1) return checklists.length > 0 && checklists.every((c) => c.name?.trim())
    return true
  }

  const totalTasks = checklists.reduce((sum, c) => sum + (c.tasks?.length ?? 0), 0)

  // Edit mode: wait for template data then show wizard
  if (!isCreate && isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <PageHeader title="Edit template" subtitle="Loading…" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  // Create or Edit flow: same wizard (create vs edit labels/actions)
  const isEdit = !isCreate && data
  if (isCreate || isEdit) {
    return (
      <div className="min-h-screen bg-slate-50/60 pb-28">
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <PageHeader
            title={isEdit ? 'Edit onboarding template' : duplicateFrom ? 'Duplicate onboarding template' : 'New onboarding template'}
            subtitle="Set up checklists and tasks in a few steps."
          />

          <Stepper steps={WIZARD_STEPS} current={wizardStep} />

          <div className="mt-8">
            {/* Step 0: Template info */}
            {wizardStep === 0 && (
              <Card className="overflow-hidden p-0 shadow-sm">
                <div className="border-b border-stroke bg-white/80 px-6 py-4">
                  <h2 className="text-lg font-semibold text-[#1d1d1f]">Template details</h2>
                  <p className="text-sm text-muted">Name and describe this onboarding template.</p>
                </div>
                <div className="space-y-6 p-6">
                  <div>
                    <label className={labelClass}>Template name *</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => updateCreateForm({ name: e.target.value })}
                      placeholder="e.g. Standard Employee Onboarding"
                      className={inputClass}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      value={createForm.description ?? ''}
                      onChange={(e) => updateCreateForm({ description: e.target.value })}
                      placeholder="Default onboarding template for new employees"
                      rows={4}
                      className={inputClass + ' resize-none'}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Step 1: Stages */}
            {wizardStep === 1 && (
              <Card className="overflow-hidden p-0 shadow-sm">
                <div className="border-b border-stroke bg-white/80 px-6 py-4">
                  <h2 className="text-lg font-semibold text-[#1d1d1f]">Stages (checklists)</h2>
                  <p className="text-sm text-muted">Add the phases of your onboarding (e.g. Pre-boarding, First day).</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-4">
                    {checklists.map((c, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-stroke bg-white p-4 shadow-sm"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-muted">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1 space-y-2 sm:flex sm:items-center sm:gap-4 sm:space-y-0">
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => updateChecklist(i, { name: e.target.value })}
                            placeholder="Stage name"
                            className={inputClass + ' sm:max-w-[200px]'}
                          />
                          <select
                            value={c.stage}
                            onChange={(e) => updateChecklist(i, { stage: e.target.value })}
                            className={inputClass + ' sm:max-w-[180px]'}
                          >
                            {STAGE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="shrink-0 text-red-600 hover:bg-red-50"
                          onClick={() => removeChecklist(i)}
                          disabled={checklists.length <= 1}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button type="button" variant="secondary" className="mt-4 w-full" onClick={addChecklist}>
                    + Add stage
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 2: Tasks */}
            {wizardStep === 2 && (
              <Card className="overflow-hidden p-0 shadow-sm">
                <div className="border-b border-stroke bg-white/80 px-6 py-4">
                  <h2 className="text-lg font-semibold text-[#1d1d1f]">Tasks</h2>
                  <p className="text-sm text-muted">Define tasks for each stage. Select a stage, then add or edit tasks.</p>
                </div>
                <div className="p-6">
                  {/* Stage tabs */}
                  <div className="mb-6 flex flex-wrap gap-2">
                    {checklists.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTasksStageIndex(i)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          i === tasksStageIndex
                            ? 'border-[#0071e3] bg-[#0071e3] text-white'
                            : 'border-stroke bg-white text-muted hover:bg-slate-50'
                        }`}
                      >
                        {c.name || `Stage ${i + 1}`}
                      </button>
                    ))}
                  </div>

                  {activeChecklist && (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[#1d1d1f]">
                          Tasks for “{activeChecklist.name || `Stage ${tasksStageIndex + 1}`}”
                        </h3>
                        <Button type="button" variant="secondary" onClick={() => addTask(tasksStageIndex)}>
                          + Add task
                        </Button>
                      </div>
                      <ul className="space-y-4">
                        {(activeChecklist.tasks ?? []).map((task, ti) => (
                          <li
                            key={ti}
                            className="rounded-xl border border-stroke bg-white p-4 shadow-sm"
                          >
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="sm:col-span-2">
                                <label className={labelClass}>Title</label>
                                <input
                                  type="text"
                                  value={task.title}
                                  onChange={(e) => updateTask(tasksStageIndex, ti, { title: e.target.value })}
                                  placeholder="Task title"
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Due (days from start)</label>
                                <input
                                  type="number"
                                  value={task.dueDaysOffset}
                                  onChange={(e) =>
                                    updateTask(tasksStageIndex, ti, {
                                      dueDaysOffset: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className={inputClass}
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <label className="flex flex-1 items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={task.requireAck}
                                    onChange={(e) =>
                                      updateTask(tasksStageIndex, ti, { requireAck: e.target.checked })
                                    }
                                    className="h-4 w-4 rounded border-stroke"
                                  />
                                  <span className="text-sm">Require ack</span>
                                </label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => removeTask(tasksStageIndex, ti)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className={labelClass}>Description (optional)</label>
                                <input
                                  type="text"
                                  value={task.description ?? ''}
                                  onChange={(e) =>
                                    updateTask(tasksStageIndex, ti, { description: e.target.value })
                                  }
                                  placeholder="Short description"
                                  className={inputClass}
                                />
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className={labelClass}>Owner type</label>
                                  <select
                                    value={task.ownerType}
                                    onChange={(e) =>
                                      updateTask(tasksStageIndex, ti, { ownerType: e.target.value })
                                    }
                                    className={inputClass}
                                  >
                                    {OWNER_TYPE_OPTIONS.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <label className={labelClass}>Owner</label>
                                  {task.ownerType === 'ROLE' ? (
                                    <select
                                      value={task.ownerRefId}
                                      onChange={(e) =>
                                        updateTask(tasksStageIndex, ti, { ownerRefId: e.target.value })
                                      }
                                      className={inputClass}
                                    >
                                      {ROLE_REF_OPTIONS.map((r) => (
                                        <option key={r} value={r}>
                                          {ROLE_LABELS[r] ?? r}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={task.ownerRefId}
                                      onChange={(e) =>
                                        updateTask(tasksStageIndex, ti, { ownerRefId: e.target.value })
                                      }
                                      placeholder="Dept code (e.g. IT)"
                                      className={inputClass}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* Step 3: Review */}
            {wizardStep === 3 && (
              <Card className="overflow-hidden p-0 shadow-sm">
                <div className="border-b border-stroke bg-white/80 px-6 py-4">
                  <h2 className="text-lg font-semibold text-[#1d1d1f]">Review</h2>
                  <p className="text-sm text-muted">Check the template before creating.</p>
                </div>
                <div className="space-y-6 p-6">
                  <div className="rounded-xl border border-stroke bg-slate-50/50 p-4">
                    <h3 className="text-sm font-semibold text-muted">Template</h3>
                    <p className="mt-1 font-medium text-[#1d1d1f]">{createForm.name || '—'}</p>
                    {createForm.description && (
                      <p className="mt-1 text-sm text-muted">{createForm.description}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-muted">
                      {checklists.length} stage(s) · {totalTasks} task(s)
                    </h3>
                    <ul className="space-y-3">
                      {checklists.map((c, i) => (
                        <li key={i} className="rounded-lg border border-stroke bg-white p-4">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-muted">
                              {STAGE_OPTIONS.find((o) => o.value === c.stage)?.label ?? c.stage}
                            </span>
                            <span className="font-medium">{c.name || `Stage ${i + 1}`}</span>
                          </div>
                          <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-muted">
                            {(c.tasks ?? []).map((t, j) => (
                              <li key={j}>
                                {t.title || 'Untitled task'} — due {t.dueDaysOffset} day(s), owner{' '}
                                {t.ownerType}: {t.ownerRefId}
                                {t.requireAck && ' · ack required'}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Wizard footer */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stroke bg-white/95 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
            <div className="flex gap-2">
              {wizardStep > 0 ? (
                <Button variant="secondary" onClick={() => setWizardStep((s) => s - 1)}>
                  Back
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => navigate('/onboarding/templates')}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={() => setWizardStep((s) => s + 1)}
                  disabled={!canNext()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={isEdit ? handleSaveEdit : handleSaveCreate}
                  disabled={saveTemplate.isPending || !createForm.name?.trim()}
                >
                  {saveTemplate.isPending
                    ? isEdit
                      ? 'Saving…'
                      : 'Creating…'
                    : isEdit
                      ? 'Save changes'
                      : 'Create template'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default TemplateEditor
