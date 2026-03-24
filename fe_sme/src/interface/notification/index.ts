// ============================================================
// Notification Module Interfaces
// Maps to BE: modules/notification
// Operations: com.sme.notification.*
// ============================================================

// ---------------------------
// Request
// ---------------------------

/** com.sme.notification.list — matches BE NotificationListRequest */
export interface NotificationListRequest {
  /** true = only unread, false/absent = all */
  unreadOnly?: boolean;
  /** Page size, default 20 on BE */
  limit?: number;
  /** Row offset for pagination, default 0 */
  offset?: number;
}

/** com.sme.notification.markRead — matches BE NotificationMarkReadRequest */
export interface NotificationMarkReadRequest {
  notificationIds: string[];
}

// ---------------------------
// Response (raw, as returned by BE REST)
// ---------------------------

/**
 * Single notification item as returned by BE REST API.
 * Field naming follows BE: content (not body), status string (not bool read).
 */
export interface NotificationItemRaw {
  notificationId: string;
  type?: string | null;
  title: string;
  content: string;
  /** "READ" | "UNREAD" */
  status: string;
  readAt?: string | null;
  createdAt: string;
  refType?: string | null;
  refId?: string | null;
}

/** com.sme.notification.list → response data — matches BE NotificationListResponse */
export interface NotificationListResponse {
  items: NotificationItemRaw[];
  totalCount: number;
}

/** com.sme.notification.markRead → response data — matches BE NotificationMarkReadResponse */
export interface NotificationMarkReadResponse {
  markedCount: number;
}

// ---------------------------
// Display model (used by UI & WS push)
// ---------------------------

/**
 * Normalised notification item used by hooks and UI components.
 * The WS push (WsNotificationPayload.java) already maps content→body,
 * status→read so it matches this interface directly.
 * The REST list items are normalised in useNotifications hook.
 */
export interface NotificationItem {
  notificationId: string;
  title: string;
  /** Mapped from BE content field */
  body: string;
  /** true = already read */
  read: boolean;
  createdAt: string;
  type?: string | null;
  refType?: string | null;
  refId?: string | null;
  companyId?: string | null;
}

// ---------------------------
// WebSocket push payload
// ---------------------------

/**
 * Payload shape that BE must push to `/queue/notifications/{userId}`.
 * Fields use the display-model naming (body/read) so the FE can parse
 * directly without any transformation — matches NotificationItem exactly.
 *
 * BE Java class: WsNotificationPayload.java
 * {
 *   "notificationId": "uuid",
 *   "title": "string",
 *   "body": "string",          // ← content field mapped to body
 *   "read": false,             // ← always false for a new push
 *   "createdAt": "ISO-8601",
 *   "type": "string | null",
 *   "refType": "string | null",
 *   "refId": "string | null",
 *   "companyId": "string | null"
 * }
 */
export type WsNotificationPayload = NotificationItem;
