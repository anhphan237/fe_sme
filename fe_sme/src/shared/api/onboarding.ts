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
  const stages = (t.checklists ?? t.stages ?? []).map((c: any) => ({
    id: c.id ?? '',
    name: c.name ?? '',
    tasks: (c.tasks ?? []).map((task: any) => ({
      id: task.id ?? '',
      title: task.title ?? '',
      ownerRole: (task.ownerRefId ?? 'HR') as any,
      dueOffset: String(task.dueDaysOffset ?? 0),
      required: task.requireAck ?? false,
      status: task.status,
      dueDate: task.dueDate,
    })),
  }))
  return {
    id: t.templateId ?? t.id ?? '',
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
    templateId: i.templateId ?? '',
    startDate: i.startDate ?? i.createdAt ?? '',
    progress: i.progress ?? 0,
    status: i.status === 'COMPLETED' ? 'Completed' : i.status === 'CANCELLED' ? 'Paused' : 'Active',
    companyId: i.companyId ?? null,
  }
}

export async function getTemplates(status?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<{ status?: string }, { items?: any[]; list?: any[] }>(
      'com.sme.onboarding.template.list',
      { status: status ?? 'ACTIVE' }
    )
    const list = res?.items ?? res?.list ?? []
    return (Array.isArray(list) ? list : []).map(mapTemplate)
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
    return mapTemplate(res ?? {})
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

export async function saveTemplate(payload: Partial<OnboardingTemplate> | CreateOnboardingTemplatePayload) {
  if (useGateway()) {
    const p = payload as CreateOnboardingTemplatePayload & { id?: string; templateId?: string }
    const templateId = p.templateId ?? p.id
    const res = await gatewayRequest<any, any>(
      templateId ? 'com.sme.onboarding.template.update' : 'com.sme.onboarding.template.create',
      templateId
        ? { templateId, name: p.name, description: p.description, status: p.status ?? 'ACTIVE' }
        : (p as CreateOnboardingTemplatePayload),
      { requestIdPrefix: 'onboarding-template' }
    )
    return mapTemplate(res ?? p)
  }
  return fetchJson<OnboardingTemplate>('/api/onboarding/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getInstances(employeeId?: string, status?: string) {
  if (useGateway()) {
    const res = await gatewayRequest<
      { employeeId?: string; status?: string },
      { items?: any[]; list?: any[] }
    >('com.sme.onboarding.instance.list', { employeeId, status: status ?? 'ACTIVE' })
    const list = res?.items ?? res?.list ?? []
    return (Array.isArray(list) ? list : []).map(mapInstance)
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
    return mapInstance(res ?? {})
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

export async function getTasks() {
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

