// ============================================================
// Common / Shared types shared across all modules
// ============================================================

/** App-level user roles - must match BE roleCode values */
export type Role = "ADMIN" | "STAFF" | "HR" | "IT" | "MANAGER" | "EMPLOYEE";

/** Generic user-facing status */
export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED" | "INACTIVE";

/** Generic entity status */
export type EntityStatus = "ACTIVE" | "INACTIVE";

// ------------------------------------------------------------
// Gateway wrapper types (aligned with BE OperationController)
// ------------------------------------------------------------

/** Shape of every outgoing gateway request body */
export interface GatewayRequestBody<T = unknown> {
  operationType: string;
  requestId?: string;
  tenantId?: string | number | null;
  payload: T;
}

/** Generic gateway response wrapper */
export interface GatewayResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
  errorCode?: string | null;
  [key: string]: unknown;
}

// ------------------------------------------------------------
// Pagination
// ------------------------------------------------------------

export interface PaginationParams {
  page?: number;
  size?: number;
  keyword?: string;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ------------------------------------------------------------
// API Error
// ------------------------------------------------------------

export interface ApiError {
  code: string;
  message: string;
}
