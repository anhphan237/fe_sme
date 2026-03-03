/**
 * Helpers — utility functions
 * Adapted from PMS internal system (uses dayjs instead of moment)
 */

import dayjs from "dayjs";

// ──────────────────────────────────────────────
// ID
// ──────────────────────────────────────────────

/** Generate a UUID v4 string */
export function uuidV4(): string {
  const uuid = new Array(36);
  for (let i = 0; i < 36; i++) {
    uuid[i] = Math.floor(Math.random() * 16);
  }
  uuid[14] = 4;
  uuid[19] = (uuid[19] &= ~(1 << 2)) | (1 << 3);
  uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
  return uuid.map((x) => (x === "-" ? "-" : x.toString(16))).join("");
}

// ──────────────────────────────────────────────
// Currency / Number
// ──────────────────────────────────────────────

/** Format a number as VND currency string */
export function formatCurrency(
  value: number,
  style: "decimal" | "percent" | "currency" = "currency",
): string {
  const result = new Intl.NumberFormat("vi-VN", {
    style,
    currency: "VND",
  }).format(value);
  return result === "NaN" ? "" : result;
}

/** Format a number with thousand separators */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

// ──────────────────────────────────────────────
// String
// ──────────────────────────────────────────────

/** Trim + lowercase for search comparison */
export function normalizeSearch(s: string): string {
  return s.trim().toLowerCase();
}

/** Check if search term is contained in any of the provided values */
export function isContainOr(
  search: string,
  values: (string | number | undefined)[],
): boolean {
  const term = normalizeSearch(search);
  return values.some(
    (v) => v != null && String(v).toLowerCase().includes(term),
  );
}

// ──────────────────────────────────────────────
// Date
// ──────────────────────────────────────────────

/** Format date string or dayjs object to display format */
export function formatDate(
  date: string | Date | null | undefined,
  format = "DD/MM/YYYY",
): string {
  if (!date) return "-";
  return dayjs(date).format(format);
}

/** Format datetime to display format (UTC+7 offset) */
export function formatDateTimeDisplay(
  date: string | Date | null | undefined,
  format = "DD/MM/YYYY HH:mm",
): string {
  if (!date) return "-";
  return dayjs(date).utcOffset(7).format(format);
}

// ──────────────────────────────────────────────
// JWT
// ──────────────────────────────────────────────

/** Decode a JWT payload without verification */
export function parseJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

/** Check if a JWT token is expired */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt<{ exp?: number }>(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

// ──────────────────────────────────────────────
// Form
// ──────────────────────────────────────────────

type FieldError = { isValid: boolean; message: string };

/** Build default form error object from field names */
export function getDefaultFormError(
  fields: string[],
): Record<string, FieldError> {
  return Object.fromEntries(
    fields.map((f) => [f, { isValid: true, message: "" }]),
  );
}
