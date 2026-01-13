import { fetchJson } from './client'
import type { SurveyInstance, SurveyResponse, SurveyTemplate } from '../types'

export async function getSurveyTemplates() {
  return fetchJson<SurveyTemplate[]>('/api/survey-templates')
}

export async function saveSurveyTemplate(payload: Partial<SurveyTemplate>) {
  return fetchJson<SurveyTemplate>('/api/survey-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getSurveyInstances() {
  return fetchJson<SurveyInstance[]>('/api/survey-instances')
}

export async function getSurveyInstance(id: string) {
  return fetchJson<SurveyInstance>(`/api/survey-instances/${id}`)
}

export async function createSurveyInstance(payload: Partial<SurveyInstance>) {
  return fetchJson<SurveyInstance>('/api/survey-instances', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateSurveyInstance(
  id: string,
  payload: Partial<SurveyInstance>
) {
  return fetchJson<SurveyInstance>(`/api/survey-instances/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteSurveyInstance(id: string) {
  return fetchJson<{ ok: boolean }>(`/api/survey-instances/${id}`, {
    method: 'DELETE',
  })
}

export async function saveSurveyResponse(payload: Partial<SurveyResponse>) {
  return fetchJson<SurveyResponse>('/api/survey-responses', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

