import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'
import type { Notification } from '../types'

export interface NotificationListPayload {
  unreadOnly?: boolean
  limit?: number
  offset?: number
}

export async function getNotifications(payload?: NotificationListPayload) {
  if (useGateway()) {
    const res = await gatewayRequest<
      NotificationListPayload,
      { items?: any[]; list?: any[] }
    >(
      'com.sme.notification.list',
      payload ?? { unreadOnly: false, limit: 20, offset: 0 }
    )
    const list = res?.items ?? res?.list ?? []
    return (Array.isArray(list) ? list : []) as Notification[]
  }
  return fetchJson<Notification[]>('/api/notifications').catch(() => [])
}

export async function markNotificationsRead(notificationIds: string[]) {
  if (useGateway()) {
    return gatewayRequest<{ notificationIds: string[] }, unknown>(
      'com.sme.notification.markRead',
      { notificationIds }
    )
  }
  return fetchJson<{ ok: boolean }>('/api/notifications/read', {
    method: 'POST',
    body: JSON.stringify({ notificationIds }),
  }).catch(() => ({ ok: true }))
}
