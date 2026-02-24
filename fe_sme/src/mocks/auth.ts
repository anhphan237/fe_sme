import type { AuthTokenPayload } from '../shared/types'

type BufferConstructor = {
  from: (input: string, encoding: string) => { toString: (encoding: string) => string }
}

const getBuffer = () => (globalThis as { Buffer?: BufferConstructor }).Buffer

const encodeSegment = (value: object) => {
  const json = JSON.stringify(value)
  if (typeof btoa === 'function') {
    return btoa(json)
  }
  const buffer = getBuffer()
  if (!buffer) {
    return ''
  }
  return buffer.from(json, 'utf-8').toString('base64')
}

const decodeSegment = (value: string) => {
  if (typeof atob === 'function') {
    return atob(value)
  }
  const buffer = getBuffer()
  if (!buffer) {
    return ''
  }
  return buffer.from(value, 'base64').toString('utf-8')
}

export const createMockToken = (payload: AuthTokenPayload) =>
  `mock.${encodeSegment(payload)}.token`

export const parseMockToken = (token: string | null): AuthTokenPayload | null => {
  if (!token) {
    return null
  }
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }
  try {
    const payloadJson = decodeSegment(parts[1])
    if (!payloadJson) {
      return null
    }
    return JSON.parse(payloadJson) as AuthTokenPayload
  } catch {
    return null
  }
}
