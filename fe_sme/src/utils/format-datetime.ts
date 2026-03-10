/**
 * format-datetime — date utilities using dayjs (not moment)
 * Canonical kebab-case file. `formatDateTime.ts` re-exports from here.
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const VN_TZ = "Asia/Ho_Chi_Minh";
const DEFAULT_FORMAT = "DD/MM/YYYY HH:mm";

/** Format a date string (UTC) to Vietnam local time */
export function formatDateTime(
  date: string | Date | null | undefined,
  format: string = DEFAULT_FORMAT,
): string {
  if (!date) return "-";
  return dayjs.utc(date).tz(VN_TZ).format(format);
}

/** Format a date string to date only */
export function formatDate(
  date: string | Date | null | undefined,
  format = "DD/MM/YYYY",
): string {
  if (!date) return "-";
  return dayjs(date).format(format);
}

/** Format a date to ISO string (for API requests) */
export function toISODate(date: string | Date | null | undefined): string {
  if (!date) return "";
  return dayjs(date).toISOString();
}

/** Get start/end of today in ISO format */
export function getTodayRange(): { from: string; to: string } {
  const today = dayjs();
  return {
    from: today.startOf("day").toISOString(),
    to: today.endOf("day").toISOString(),
  };
}

/** Get start/end of current month */
export function getCurrentMonthRange(): { from: string; to: string } {
  const now = dayjs();
  return {
    from: now.startOf("month").toISOString(),
    to: now.endOf("month").toISOString(),
  };
}

/** Format relative time (e.g. "3 ngày trước") */
export function formatRelativeTime(
  date: string | Date | null | undefined,
): string {
  if (!date) return "-";
  const d = dayjs(date);
  const now = dayjs();
  const diffDays = now.diff(d, "day");

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "1 ngày trước";
  if (diffDays < 30) return `${diffDays} ngày trước`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
  return `${Math.floor(diffDays / 365)} năm trước`;
}
