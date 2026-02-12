import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type { SurveyInstance, SurveyResponse, SurveyTemplate } from '../types'

export interface SurveyInstanceListPayload {
  templateId?: string
  status?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export async function getSurveyTemplates() {
  return fetchJson<SurveyTemplate[]>('/api/survey-templates')
}

export async function saveSurveyTemplate(payload: Partial<SurveyTemplate>) {
  return fetchJson<SurveyTemplate>('/api/survey-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getSurveyInstances(filters?: SurveyInstanceListPayload) {
  if (useGateway()) {
    const res = await gatewayRequest<
      SurveyInstanceListPayload,
      { items?: any[]; list?: any[] }
    >(
      'com.sme.survey.instance.list',
      filters ?? {
        status: 'SENT',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T23:59:59.999Z',
        limit: 20,
        offset: 0,
      }
    )
    const list = res?.items ?? res?.list ?? []
    return (Array.isArray(list) ? list : []) as SurveyInstance[]
  }
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

export interface SatisfactionReportPayload {
  templateId?: string
  stage?: number
  startDate: string
  endDate: string
}

export async function getSatisfactionReport(payload: SatisfactionReportPayload) {
  if (useGateway()) {
    return gatewayRequest<SatisfactionReportPayload, any>(
      'com.sme.survey.report.satisfaction',
      payload
    )
  }
  return Promise.resolve({ summary: [], byStage: [] })
}

