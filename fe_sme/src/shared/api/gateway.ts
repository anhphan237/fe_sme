/**
 * Gateway client for SME backend.
 * All operations go to POST {{baseURL}}/api/v1/gateway with operationType + payload.
 * See SME.postman_collection.json for operation types.
 */

import { useAppStore } from '../../store/useAppStore'

const BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || ''
const GATEWAY_PATH = '/api/v1/gateway'

let requestIdCounter = 0
function nextRequestId(prefix: string): string {
  requestIdCounter += 1
  return `req-${prefix}-${String(requestIdCounter).padStart(3, '0')}`
}

export interface GatewayBody<T = unknown> {
  operationType: string
  requestId?: string
  tenantId?: string | number | null
  payload: T
}

export interface GatewayResponse<T = unknown> {
  data?: T
  [key: string]: unknown
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('auth_token') || useAppStore.getState().token
}

function getTenantId(): string | number | null {
  const tenant = useAppStore.getState().currentTenant
  return tenant?.id ?? null
}

/**
 * Send a request to the SME gateway. Use when real backend is enabled (VITE_API_BASE_URL set).
 * For login/register, tenantId is not sent (null).
 * Use flatPayload: true when backend expects request params at top level (e.g. status as String, not nested in payload).
 */
export async function gatewayRequest<TReq = unknown, TRes = unknown>(
  operationType: string,
  payload: TReq,
  options?: {
    requestIdPrefix?: string
    tenantId?: string | number | null
    /** When true, send payload fields at top level: { operationType, requestId, tenantId, ...payload } */
    flatPayload?: boolean
  }
): Promise<TRes> {
  const url = `${BASE_URL.replace(/\/$/, '')}${GATEWAY_PATH}`
  const tenantId = options?.tenantId !== undefined ? options.tenantId : getTenantId()
  const requestId = options?.requestIdPrefix
    ? nextRequestId(options.requestIdPrefix)
    : undefined

  const body =
    options?.flatPayload && payload && typeof payload === 'object' && !Array.isArray(payload)
      ? {
          operationType,
          ...(requestId && { requestId }),
          ...(tenantId !== undefined && tenantId !== null ? { tenantId } : { tenantId: null }),
          ...(payload as Record<string, unknown>),
        }
      : {
          operationType,
          ...(requestId && { requestId }),
          ...(tenantId !== undefined && tenantId !== null ? { tenantId } : { tenantId: null }),
          payload,
        }

  const token = getToken()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(requestId ? { 'X-Request-Id': requestId } : {}),
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  let json: GatewayResponse<TRes> | Record<string, unknown> = {}
  try {
    json = text ? (JSON.parse(text) as GatewayResponse<TRes>) : {}
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const msg =
      (json as any)?.message ??
      (json as any)?.error ??
      (typeof (json as any)?.data === 'string' ? (json as any).data : null) ??
      text
    throw new Error(String(msg || `Gateway error ${res.status}`))
  }

  const data = (json as GatewayResponse<TRes>).data
  return (data !== undefined ? data : json) as TRes
}

/** Check if real API (gateway) should be used. Safe to call outside React (e.g. in useEffect). */
export function isGatewayEnabled(): boolean {
  return Boolean(BASE_URL) || (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV === true)
}

/** Check if real API (gateway) should be used. In dev with proxy, BASE_URL can be empty. */
export function useGateway(): boolean {
  return isGatewayEnabled()
}
