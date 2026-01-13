import { fetchJson } from './client'
import type { Acknowledgment, Document } from '../types'

export async function getDocuments() {
  return fetchJson<Document[]>('/api/documents')
}

export async function getDocument(id: string) {
  return fetchJson<Document>(`/api/documents/${id}`)
}

export async function saveDocument(payload: Partial<Document>) {
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

export async function acknowledgeDocument(id: string) {
  return fetchJson<Acknowledgment>(`/api/documents/${id}/ack`, {
    method: 'POST',
  })
}

