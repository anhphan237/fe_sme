import { fetchJson } from './client'
import type { User } from '../types'
import { createMockToken } from '../../mocks/auth'

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload) {
  try {
    return await fetchJson<{ user: User; token: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      const { demoCredentials } = await import('../../mocks/credentials')
      const match = demoCredentials.find(
        (item) => item.email === payload.email && item.password === payload.password
      )
      if (match) {
        const { users } = await import('../../mocks/seed')
        const user = users.find((item) => item.email === match.email) ?? users[0]
        const token = createMockToken({
          user_id: user.id,
          company_id: user.companyId,
          roles: user.roles,
        })
        return { user, token }
      }
    }
    throw error
  }
}

export async function logout() {
  return fetchJson<{ ok: boolean }>('/api/logout', { method: 'POST' })
}

export async function me() {
  return fetchJson<{ user: User | null }>('/api/me')
}
