/**
 * Constants — global application constants
 * Adapted from PMS internal system for SME Management
 */

// ──────────────────────────────────────────────
// App Config
// ──────────────────────────────────────────────

export const APP_CONFIG = {
  /** localStorage key for JWT access token */
  ACCESS_TOKEN: "auth_token",
  /** localStorage key for refresh token */
  REFRESH_TOKEN: "refresh_token",
  /** Default page size for paginated lists */
  DEFAULT_PAGE_SIZE: 20,
  /** API gateway path */
  GATEWAY_PATH: "/api/v1/gateway",
} as const;

// ──────────────────────────────────────────────
// Event Bus Types
// ──────────────────────────────────────────────

/** Keys for events emitted via eventBus */
export const EventTypes = {
  /** Trigger an antd message notification */
  SHOW_MESSAGE: "SHOW_MESSAGE",
  /** Trigger logout flow */
  LOGOUT: "LOGOUT",
  /** Reload current tenant/user data */
  RELOAD_USER: "RELOAD_USER",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// ──────────────────────────────────────────────
// Toast Message
// ──────────────────────────────────────────────

export const ToastMessageStatus = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;
export type ToastMessageStatus =
  (typeof ToastMessageStatus)[keyof typeof ToastMessageStatus];

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────

export const AppRouters = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  REGISTER: "/register",
  FORBIDDEN: "/forbidden",
} as const;

// ──────────────────────────────────────────────
// Default Roles
// ──────────────────────────────────────────────

export const DefaultRoles = {
  ADMIN: "ADMIN",
  HR: "HR",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
  IT: "IT",
  STAFF: "STAFF",
} as const;

// ──────────────────────────────────────────────
// Status Labels
// ──────────────────────────────────────────────

export const USER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  INVITED: "Đã mời",
  DISABLED: "Đã khóa",
};

export const ENTITY_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
};
