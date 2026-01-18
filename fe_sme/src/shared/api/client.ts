import { api as mockApi } from '../../mock-backend'

const useInMemoryBackend =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_USE_IN_MEMORY_BACKEND === 'true'

const parseBody = (body?: BodyInit | null) => {
  if (!body) return undefined
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return body
    }
  }
  return body
}

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
  if (useInMemoryBackend) {
    const url = typeof input === 'string' ? input : input.toString()
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = parseBody(init?.body ?? null)
    try {
      if (method === 'GET') return (await mockApi.get(url)) as T
      if (method === 'POST') return (await mockApi.post(url, body)) as T
      if (method === 'PATCH' || method === 'PUT') {
        return (await mockApi.patch(url, body)) as T
      }
      if (method === 'DELETE') {
        return (await mockApi.patch(url, { _method: 'DELETE' })) as T
      }
      throw new Error('Unsupported method')
    } catch (error: any) {
      throw new Error(error?.message ?? 'Request failed')
    }
  }

  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
  }

  if (response.status === 204) {
    return {} as T
  }

  return (await response.json()) as T
}
