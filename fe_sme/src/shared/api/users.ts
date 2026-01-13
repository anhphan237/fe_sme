import { fetchJson } from './client'
import type { User } from '../types'

export async function getUsers() {
  return fetchJson<User[]>('/api/users')
}

export async function inviteUser(payload: Partial<User> & { email: string }) {
  return fetchJson<User>('/api/users/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateUser(id: string, payload: Partial<User>) {
  return fetchJson<User>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

