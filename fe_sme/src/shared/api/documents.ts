import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type { Acknowledgment, Document } from '../types'

function mapDocument(d: any): Document {
  return {
    id: d.documentId ?? d.id ?? '',
    title: d.name ?? d.title ?? '',
    tags: d.tags ?? [],
    required: d.required ?? false,
    updatedAt: d.updatedAt ?? new Date().toISOString().slice(0, 10),
    folder: d.folder ?? 'Company',
    companyId: d.companyId ?? null,
  }
}

export async function getDocuments() {
  if (useGateway()) {
    const res = await gatewayRequest<Record<string, never>, { items?: any[]; list?: any[] }>(
      'com.sme.content.document.list',
      {}
    )
    const list = res?.items ?? res?.list ?? []
    return (Array.isArray(list) ? list : []).map(mapDocument)
  }
  return fetchJson<Document[]>('/api/documents')
}

export async function getDocument(id: string) {
  const list = await getDocuments()
  const doc = list.find((d) => d.id === id)
  if (doc) return doc
  return fetchJson<Document>(`/api/documents/${id}`)
}

export interface UploadDocumentPayload {
  name: string
  fileUrl: string
  description?: string
}

export async function saveDocument(payload: Partial<Document> | UploadDocumentPayload) {
  if (useGateway()) {
    const p = payload as UploadDocumentPayload
    const res = await gatewayRequest<UploadDocumentPayload, any>(
      'com.sme.content.document.upload',
      { name: p.name ?? (payload as Document).title, fileUrl: p.fileUrl, description: p.description }
    )
    return mapDocument(res ?? payload)
  }
  return fetchJson<Document>('/api/documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateDocument(id: string, payload: Partial<Document>) {
  return fetchJson<Document>(`/api/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteDocument(id: string) {
  return fetchJson<{ ok: boolean }>(`/api/documents/${id}`, {
    method: 'DELETE',
  })
}

export async function getAcknowledgments() {
  return fetchJson<Acknowledgment[]>('/api/documents/acknowledgments')
}

export async function updateDocumentProgress(id: string, payload: Partial<Acknowledgment>) {
  return fetchJson<Acknowledgment>(`/api/documents/${id}/progress`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function acknowledgeDocument(documentId: string, onboardingId?: string) {
  if (useGateway()) {
    return gatewayRequest<{ documentId: string; onboardingId?: string }, any>(
      'com.sme.content.document.acknowledge',
      { documentId, onboardingId }
    )
  }
  return fetchJson<Acknowledgment>(`/api/documents/${documentId}/ack`, {
    method: 'POST',
  })
}

