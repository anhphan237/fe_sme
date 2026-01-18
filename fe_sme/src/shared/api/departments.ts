import { fetchJson } from './client'
import type { Department } from '../types'

export async function getDepartments() {
  return fetchJson<Department[]>('/api/departments')
}
