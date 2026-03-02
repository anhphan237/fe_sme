// ============================================================
// Core API types — shared across all module API files
// Mirrors PMS ParamsGetList + adapted for Gateway pattern
// ============================================================

// ------------------------------------------------------------
// Search / Filter params (like PMS ParamsGetList)
// ------------------------------------------------------------

/** Standardized search/filter params for list/search operations */
export interface GatewaySearchParams {
  page?: number;
  size?: number;
  search?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// ------------------------------------------------------------
// List response wrapper
// ------------------------------------------------------------

/** Standardized list response — handles different BE response shapes */
export interface GatewayListResponse<T> {
  items?: T[];
  content?: T[];
  list?: T[];
  total?: number;
  page?: number;
  size?: number;
}

// ------------------------------------------------------------
// Utility helpers
// ------------------------------------------------------------

/**
 * Extract an array from various BE response shapes.
 * Tries each `keys` property in order; falls back to `[]`.
 *
 * @example
 * ```ts
 * const users = extractList<UserListItem>(res, "users", "items", "content");
 * ```
 */
export function extractList<T>(res: unknown, ...keys: string[]): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object") {
    const obj = res as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}
