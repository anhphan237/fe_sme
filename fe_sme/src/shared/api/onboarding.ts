import { fetchJson } from './client'
import type {
  Evaluation,
  OnboardingComment,
  OnboardingInstance,
  OnboardingTask,
  OnboardingTemplate,
} from '../types'

export async function getTemplates() {
  return fetchJson<OnboardingTemplate[]>('/api/onboarding/templates')
}

export async function getTemplate(id: string) {
  return fetchJson<OnboardingTemplate>(`/api/onboarding/templates/${id}`)
}

export async function saveTemplate(payload: Partial<OnboardingTemplate>) {
  return fetchJson<OnboardingTemplate>('/api/onboarding/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getInstances() {
  return fetchJson<OnboardingInstance[]>('/api/onboarding/instances')
}

export async function getInstance(id: string) {
  return fetchJson<OnboardingInstance>(`/api/onboarding/instances/${id}`)
}

export async function startInstance(payload: Partial<OnboardingInstance>) {
  return fetchJson<OnboardingInstance>('/api/onboarding/instances', {
    method: 'POST',
    body: JSON.stringify(payload),
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

