import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type {
  Evaluation,
  OnboardingComment,
  OnboardingInstance,
  OnboardingTask,
  OnboardingTemplate,
} from '../types'

function mapTemplate(t: any): OnboardingTemplate {
  const rawStages = t?.checklists ?? t?.stages
  const stages = Array.isArray(rawStages)
    ? rawStages.map((c: any) => ({
        id: c.checklistTemplateId ?? c.id ?? '',
        name: c.name ?? '',
        tasks: (c.tasks ?? []).map((task: any) => ({
          id: task.taskTemplateId ?? task.id ?? '',
          title: task.name ?? task.title ?? '',
          ownerRole: (task.ownerRefId ?? 'HR') as any,
          dueOffset: String(task.dueDaysOffset ?? task.dueOffset ?? 0),
          required: task.requireAck ?? task.required ?? false,
          status: task.status,
          dueDate: task.dueDate,
        })),
      }))
    : []
  return {
    id: t?.templateId ?? t?.id ?? '',
    name: t.name ?? '',
    description: t.description ?? '',
    stages,
    updatedAt: t.updatedAt ?? new Date().toISOString().slice(0, 10),
    companyId: t.companyId ?? null,
  }
}

function mapInstance(i: any): OnboardingInstance {
  return {
    id: i.instanceId ?? i.id ?? '',
    employeeId: i.employeeId ?? '',
    employeeUserId:
      i.employeeUserId ??
      i.employeeUserID ??
      i.employee_user_id ??
      i.userId ??
      i.employee?.userId ??
      null,
    managerUserId: i.managerUserId ?? i.manager_user_id ?? null,
    managerName: i.managerName ?? i.manager_name ?? null,
    templateId: i.templateId ?? '',
    startDate: i.startDate ?? i.createdAt ?? '',
    progress: i.progress ?? 0,
    status: i.status === 'COMPLETED' ? 'Completed' : i.status === 'CANCELLED' ? 'Paused' : 'Active',
    companyId: i.companyId ?? null,
  }
}

export async function getTemplates(status?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ status?: string }, any>(
      'com.sme.onboarding.template.list',
      { status: status ?? 'ACTIVE' },
      { requestIdPrefix: 'onboarding-template-list', flatPayload: true }
    )
    // Backend returns data: { templates: [...] } — gateway returns data, so res = { templates: [...] }
    const list = Array.isArray(res)
      ? res
      : res?.templates ??
        res?.items ??
        res?.list ??
        res?.result ??
        (Array.isArray(res?.data) ? res.data : null) ??
        res?.data?.items ??
        res?.data?.list ??
        res?.data?.templates ??
        []
    const arr = Array.isArray(list) ? list : []
    const out: OnboardingTemplate[] = []
    for (let i = 0; i < arr.length; i++) {
      try {
        out.push(mapTemplate(arr[i] ?? {}))
      } catch {
        // skip invalid item
      }
    }
    return out
  }
  return fetchJson<OnboardingTemplate[]>('/api/onboarding/templates')
}

export async function getTemplate(id: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ templateId: string }, any>(
      'com.sme.onboarding.template.get',
      { templateId: id },
      { requestIdPrefix: 'onboarding-template-get' }
    )
    // Backend may return template, data, result, payload, or payload at top level
    const raw = res?.template ?? res?.data ?? res?.result ?? res?.payload ?? res
    const template = raw && typeof raw === 'object' ? raw : {}
    return mapTemplate(template)
  }
  return fetchJson<OnboardingTemplate>(`/api/onboarding/templates/${id}`)
}

export interface CreateOnboardingTemplatePayload {
  name: string
  description?: string
  status?: string
  createdBy?: string
  checklists?: Array<{
    name: string
    stage: string
    sortOrder: number
    status?: string
    tasks: Array<{
      title: string
      description?: string
      ownerType: string
      ownerRefId: string
      dueDaysOffset: number
      requireAck: boolean
      sortOrder: number
      status?: string
    }>
  }>
}

/** Build payload for com.sme.onboarding.template.create (checklists + tasks with ownerType, ownerRefId, dueDaysOffset) */
export function buildCreateTemplatePayload(
  payload: CreateOnboardingTemplatePayload & { createdBy: string }
): CreateOnboardingTemplatePayload & { createdBy: string } {
  return {
    name: payload.name,
    description: payload.description ?? '',
    status: payload.status ?? 'ACTIVE',
    createdBy: payload.createdBy,
    checklists: (payload.checklists ?? []).map((c, i) => ({
      name: c.name,
      stage: c.stage,
      sortOrder: c.sortOrder ?? i + 1,
      status: c.status ?? 'ACTIVE',
      tasks: (c.tasks ?? []).map((t, j) => ({
        title: t.title,
        description: t.description ?? '',
        ownerType: t.ownerType,
        ownerRefId: t.ownerRefId,
        dueDaysOffset: t.dueDaysOffset,
        requireAck: t.requireAck ?? false,
        sortOrder: t.sortOrder ?? j + 1,
        status: t.status ?? 'ACTIVE',
      })),
    })),
  }
}

const STAGE_VALUES = ['PRE_BOARDING', 'DAY_1', 'DAY_7', 'DAY_30', 'DAY_60'] as const
function parseDueOffset(s: string): number {
  if (s == null || s === '') return 0
  const n = parseInt(String(s).replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

/** Convert OnboardingTemplate (from API) to CreateOnboardingTemplatePayload for edit/duplicate */
export function templateToCreateForm(t: OnboardingTemplate): CreateOnboardingTemplatePayload {
  const stages = t.stages ?? []
  const defaultChecklist = (): NonNullable<CreateOnboardingTemplatePayload['checklists']>[0] => ({
    name: '',
    stage: 'DAY_1',
    sortOrder: 1,
    status: 'ACTIVE',
    tasks: [
      {
        title: '',
        description: '',
        ownerType: 'ROLE',
        ownerRefId: 'HR',
        dueDaysOffset: 0,
        requireAck: false,
        sortOrder: 1,
        status: 'ACTIVE',
      },
    ],
  })
  return {
    name: t.name ?? '',
    description: t.description ?? '',
    status: 'ACTIVE',
    checklists: stages.length
      ? stages.map((stage, i) => ({
      name: stage.name ?? '',
      stage: STAGE_VALUES[i] ?? 'DAY_1',
      sortOrder: i + 1,
      status: 'ACTIVE',
      tasks: (stage.tasks ?? []).map((task, j) => ({
        title: task.title ?? '',
        description: '',
        ownerType: 'ROLE',
        ownerRefId: (task.ownerRole ?? 'HR') as string,
        dueDaysOffset: parseDueOffset(task.dueOffset ?? '0'),
        requireAck: task.required ?? false,
        sortOrder: j + 1,
        status: 'ACTIVE',
      })),
    }))
      : [defaultChecklist()],
  }
}

export async function saveTemplate(payload: Partial<OnboardingTemplate> | CreateOnboardingTemplatePayload) {
  if (useGateway()) {
    const p = payload as CreateOnboardingTemplatePayload & { id?: string; templateId?: string; createdBy?: string }
    const templateId = p.templateId ?? p.id
    const isCreate = !templateId || templateId === 'new'
    const createPayload = isCreate && p.createdBy && p.checklists?.length
      ? buildCreateTemplatePayload({ ...p, createdBy: p.createdBy })
      : null
    const updatePayload =
      !isCreate && templateId
        ? {
            templateId,
            name: p.name,
            description: p.description ?? '',
            status: p.status ?? 'ACTIVE',
            ...(p.checklists?.length ? { checklists: p.checklists } : {}),
          }
        : null
    const res = await gatewayRequest<any, any>(
      templateId && templateId !== 'new' ? 'com.sme.onboarding.template.update' : 'com.sme.onboarding.template.create',
      isCreate ? (createPayload ?? (p as CreateOnboardingTemplatePayload)) : updatePayload!,
      { requestIdPrefix: 'onboarding-template' }
    )
    return mapTemplate(res ?? p)
  }
  return fetchJson<OnboardingTemplate>('/api/onboarding/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteTemplate(id: string) {
  if (useGateway()) {
    await gatewayRequest<{ templateId: string }, unknown>(
      'com.sme.onboarding.template.delete',
      { templateId: id },
      { requestIdPrefix: 'onboarding-template-delete' }
    )
    return
  }
  return fetchJson(`/api/onboarding/templates/${id}`, { method: 'DELETE' })
}

export async function getInstances(employeeId?: string, status?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<
      { employeeId?: string; status?: string },
      any
    >(
      'com.sme.onboarding.instance.list',
      { employeeId, status: status ?? 'ACTIVE' },
      { requestIdPrefix: 'onboarding-instance-list', flatPayload: true }
    )
    const list =
      Array.isArray(res)
        ? res
        : res?.instances ??
          res?.items ??
          res?.list ??
          res?.result ??
          (Array.isArray(res?.data) ? res.data : null) ??
          res?.data?.instances ??
          res?.data?.items ??
          res?.data?.list ??
          []
    const arr = Array.isArray(list) ? list : []
    const out: OnboardingInstance[] = []
    for (let i = 0; i < arr.length; i++) {
      try {
        out.push(mapInstance(arr[i] ?? {}))
      } catch {
        // skip invalid item
      }
    }
    return out
  }
  return fetchJson<OnboardingInstance[]>('/api/onboarding/instances')
}

export async function getInstance(id: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ instanceId: string }, any>(
      'com.sme.onboarding.instance.get',
      { instanceId: id },
      { requestIdPrefix: 'onboarding-instance-get' }
    )
    const raw = res?.instance ?? res?.data ?? res?.result ?? res?.payload ?? res
    const obj = raw && typeof raw === 'object' ? raw : {}
    return mapInstance(obj)
  }
  return fetchJson<OnboardingInstance>(`/api/onboarding/instances/${id}`)
}

export interface CreateOnboardingInstancePayload {
  employeeId: string
  templateId: string
  managerId: string
  requestNo?: string
}

export async function startInstance(payload: Partial<OnboardingInstance> | CreateOnboardingInstancePayload) {
  if (useGateway()) {
    const p = payload as CreateOnboardingInstancePayload
    const res = await gatewayRequest<CreateOnboardingInstancePayload, any>(
      'com.sme.onboarding.instance.create',
      {
        employeeId: p.employeeId ?? '',
        templateId: p.templateId ?? '',
        managerId: p.managerId ?? '',
        requestNo: p.requestNo,
      },
      { requestIdPrefix: 'onboarding-instance-create' }
    )
    return mapInstance(res ?? p)
  }
  return fetchJson<OnboardingInstance>('/api/onboarding/instances', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function activateInstance(instanceId: string, requestNo?: string) {
  if (useGateway()) {
    return gatewayRequest<{ instanceId: string; requestNo?: string }, any>(
      'com.sme.onboarding.instance.activate',
      { instanceId, requestNo },
      { requestIdPrefix: 'onboarding-instance-activate' }
    )
  }
  return getInstance(instanceId)
}

export async function cancelInstance(instanceId: string, reason: string) {
  if (useGateway()) {
    return gatewayRequest<{ instanceId: string; reason: string }, unknown>(
      'com.sme.onboarding.instance.cancel',
      { instanceId, reason },
      { requestIdPrefix: 'onboarding-instance-cancel' }
    )
  }
  return fetchJson<OnboardingInstance>(`/api/onboarding/instances/${instanceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Paused' }),
  })
}

export async function completeInstance(instanceId: string) {
  if (useGateway()) {
    return gatewayRequest<{ instanceId: string }, any>(
      'com.sme.onboarding.instance.complete',
      { instanceId },
      { requestIdPrefix: 'onboarding-instance-complete' }
    )
  }
  return fetchJson<OnboardingInstance>(`/api/onboarding/instances/${instanceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Completed' }),
  })
}

export async function generateOnboardingTasks(instanceId: string, managerId: string, itStaffUserId?: string) {
  if (useGateway()) {
    return gatewayRequest<
      { instanceId: string; managerId: string; itStaffUserId?: string },
      unknown
    >('com.sme.onboarding.task.generate', { instanceId, managerId, itStaffUserId }, {
      requestIdPrefix: 'onboarding-task-generate',
    })
  }
  return Promise.resolve()
}

export async function updateOnboardingTaskStatus(taskId: string, status: string) {
  if (useGateway()) {
    return gatewayRequest<{ taskId: string; status: string }, unknown>(
      'com.sme.onboarding.task.updateStatus',
      { taskId, status },
      { requestIdPrefix: 'onboarding-task-update-status' }
    )
  }
  return fetchJson(`/api/onboarding/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function saveEvaluation(payload: Partial<Evaluation>) {
  return fetchJson<Evaluation>('/api/onboarding/evaluations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface ListTasksByOnboardingOptions {
  status?: string
  page?: number
  size?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/** List tasks by onboarding instance. Gateway: com.sme.onboarding.task.listByOnboarding (bắt buộc onboardingId). */
export async function getOnboardingTasksByInstance(
  onboardingId: string,
  options?: ListTasksByOnboardingOptions
): Promise<OnboardingTask[]> {
  if (useGateway()) {
    const payload = {
      onboardingId,
      ...(options?.status && { status: options.status }),
      ...(options?.page != null && { page: options.page }),
      ...(options?.size != null && { size: options.size }),
      ...(options?.sortBy && { sortBy: options.sortBy }),
      ...(options?.sortOrder && { sortOrder: options.sortOrder }),
    }
    const res = await gatewayRequest<
      { onboardingId: string; status?: string; page?: number; size?: number; sortBy?: string; sortOrder?: string },
      any
    >('com.sme.onboarding.task.listByOnboarding', payload, {
      requestIdPrefix: 'onboarding-task-list-by-onboarding',
    })
    const list =
      Array.isArray(res)
        ? res
        : res?.content ??
          res?.tasks ??
          res?.items ??
          res?.list ??
          res?.result ??
          (Array.isArray(res?.data) ? res.data : null) ??
          res?.data?.content ??
          res?.data?.tasks ??
          res?.data?.items ??
          []
    const arr = Array.isArray(list) ? list : []
    return arr.map((t: any) => ({
      id: t.taskId ?? t.id ?? '',
      title: t.name ?? t.title ?? '',
      ownerRole: (t.ownerRefId ?? t.ownerRole ?? 'EMPLOYEE') as any,
      dueOffset: String(t.dueDaysOffset ?? t.dueOffset ?? 0),
      required: t.requireAck ?? t.required ?? false,
      status: mapTaskStatus(t.status),
      dueDate: t.dueDate,
    })) as OnboardingTask[]
  }
  return fetchJson<OnboardingTask[]>(`/api/onboarding/instances/${onboardingId}/tasks`)
}

function mapTaskStatus(s: string | undefined): 'Pending' | 'In Progress' | 'Done' | undefined {
  if (!s) return undefined
  const u = s.toUpperCase()
  if (u === 'DONE' || u === 'COMPLETED') return 'Done'
  if (u === 'IN_PROGRESS' || u === 'IN PROGRESS') return 'In Progress'
  return 'Pending'
}

export async function getTasks(onboardingId?: string) {
  if (onboardingId) return getOnboardingTasksByInstance(onboardingId)
  return fetchJson<OnboardingTask[]>('/api/onboarding/tasks')
}

export async function createTask(payload: Partial<OnboardingTask>) {
  return fetchJson<OnboardingTask>('/api/onboarding/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getComments() {
  return fetchJson<OnboardingComment[]>('/api/onboarding/comments')
}

export async function createComment(payload: Partial<OnboardingComment>) {
  return fetchJson<OnboardingComment>('/api/onboarding/comments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

