// ============================================================
// Notification Module Interfaces
// Maps to BE: modules/notification
// Operations: com.sme.notification.*
// ============================================================

// ---------------------------
// Request
// ---------------------------

/** com.sme.notification.list */
export interface NotificationListRequest {
  read?: boolean;
  page?: number;
  size?: number;
}

/** com.sme.notification.markRead */
export interface NotificationMarkReadRequest {
  notificationId: string | "ALL";
}

// ---------------------------
// Response
// ---------------------------

/** Single notification item */
export interface NotificationItem {
  notificationId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  companyId?: string | null;
}

/** com.sme.notification.list → response data */
export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
}

/** com.sme.notification.markRead → response data */
export interface NotificationMarkReadResponse {
  updated: number;
}
