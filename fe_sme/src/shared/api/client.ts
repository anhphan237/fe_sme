const getBaseUrl = () =>
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL as string) || ''

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
  const baseUrl = getBaseUrl().replace(/\/$/, '')
  const url =
    typeof input === 'string' && input.startsWith('/') && baseUrl
      ? `${baseUrl}${input}`
      : input

  const response = await fetch(url, {
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
