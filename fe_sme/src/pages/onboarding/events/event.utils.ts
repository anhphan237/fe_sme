import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { Dayjs } from "dayjs";
import type { DefaultOptionType } from "antd/es/select";

import type {
  CompanyEventListItem,
  DepartmentOption,
  EventGroup,
  RecordLike,
  UserOption,
} from "./event.types";

dayjs.extend(utc);
dayjs.extend(timezone);

export const EVENT_TIMEZONE = "Asia/Ho_Chi_Minh";

export const normalizeArrayPayload = (
  raw: unknown,
  keys: string[],
): RecordLike[] => {
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is RecordLike => typeof item === "object" && item !== null,
    );
  }

  if (typeof raw !== "object" || raw === null) {
    return [];
  }

  const obj = raw as RecordLike;

  for (const key of keys) {
    const value = obj[key];

    if (Array.isArray(value)) {
      return value.filter(
        (item): item is RecordLike =>
          typeof item === "object" && item !== null,
      );
    }
  }

  return [];
};

export const normalizeDepartments = (raw: unknown): DepartmentOption[] => {
  const list = normalizeArrayPayload(raw, ["items", "departments", "data"]);
  const result: DepartmentOption[] = [];

  list.forEach((item) => {
    const value = String(
      item.departmentId ?? item.department_id ?? item.id ?? item.value ?? "",
    ).trim();

    if (!value) return;

    const label = String(
      item.name ?? item.departmentName ?? item.label ?? value,
    ).trim();

    result.push({ value, label });
  });

  return result;
};

export const normalizeUsers = (raw: unknown): UserOption[] => {
  const list = normalizeArrayPayload(raw, ["users", "items", "data"]);
  const result: UserOption[] = [];

  list.forEach((item) => {
    const value = String(item.userId ?? item.user_id ?? item.id ?? "").trim();

    if (!value) return;

    const status = String(
      item.status ?? item.userStatus ?? item.user_status ?? "",
    )
      .trim()
      .toUpperCase();

    if (status !== "ACTIVE") return;

    const roleCode = String(
      item.roleCode ??
        item.role_code ??
        item.role ??
        item.roleName ??
        item.role_name ??
        "",
    )
      .trim()
      .toUpperCase();

    if (roleCode && roleCode !== "EMPLOYEE") return;

    const fullName = String(
      item.fullName ?? item.full_name ?? item.name ?? "",
    ).trim();

    const email = String(item.email ?? "").trim();

    const departmentObj =
      typeof item.department === "object" && item.department !== null
        ? (item.department as RecordLike)
        : undefined;

    const departmentId = String(
      item.departmentId ??
        item.department_id ??
        departmentObj?.departmentId ??
        departmentObj?.department_id ??
        departmentObj?.id ??
        "",
    ).trim();

    const departmentName = String(
      item.departmentName ??
        item.department_name ??
        departmentObj?.name ??
        "",
    ).trim();

    const baseLabel =
      fullName && email
        ? `${fullName} • ${email}`
        : fullName || email || value;

    const label = departmentName
      ? `${baseLabel} — ${departmentName}`
      : baseLabel;

    result.push({
      value,
      label,
      fullName: fullName || undefined,
      email: email || undefined,
      departmentId: departmentId || undefined,
      departmentName: departmentName || undefined,
      status,
      roleCode,
    });
  });

  return result;
};

export const buildGroupedUserOptions = (
  users: UserOption[],
  noDepartmentLabel = "Chưa có phòng ban",
): DefaultOptionType[] => {
  const grouped = new Map<string, UserOption[]>();

  users.forEach((user) => {
    const groupName = user.departmentName || noDepartmentLabel;
    const current = grouped.get(groupName) ?? [];
    current.push(user);
    grouped.set(groupName, current);
  });

  return Array.from(grouped.entries()).map(([label, options]) => ({
    label,
    options,
  }));
};

/**
 * Convert BE datetime về giờ Việt Nam để hiển thị/gom lịch.
 * Ví dụ:
 * 2026-04-29T21:20:00.000+00:00
 * => 2026-04-30 04:20 Asia/Ho_Chi_Minh
 */
export const toEventTime = (value?: string): Dayjs | undefined => {
  if (!value) return undefined;

  const parsed = dayjs(value);

  if (!parsed.isValid()) {
    return undefined;
  }

  return parsed.tz(EVENT_TIMEZONE);
};

/**
 * Dùng khi gửi lên BE.
 * Không dùng toISOString vì toISOString sẽ ép về UTC và làm lệch ngày trên request.
 *
 * Ví dụ HR chọn:
 * 30/04/2026 04:20
 *
 * FE gửi:
 * 2026-04-30T04:20:00+07:00
 */
export const toBackendEventDateTime = (value: Dayjs) => {
  return value
    .tz(EVENT_TIMEZONE, true)
    .second(0)
    .millisecond(0)
    .format("YYYY-MM-DDTHH:mm:ssZ");
};

export const formatDateTime = (value?: string) => {
  const parsed = toEventTime(value);

  return parsed ? parsed.format("DD/MM/YYYY HH:mm") : "-";
};

export const formatDate = (value?: string) => {
  const parsed = toEventTime(value);

  return parsed ? parsed.format("DD/MM/YYYY") : "-";
};

export const formatTime = (value?: string) => {
  const parsed = toEventTime(value);

  return parsed ? parsed.format("HH:mm") : "-";
};

export const getEventDateKey = (value?: string) => {
  const parsed = toEventTime(value);

  return parsed ? parsed.format("YYYY-MM-DD") : "unknown-date";
};

export const getTodayEventDateKey = () => {
  return dayjs().tz(EVENT_TIMEZONE).format("YYYY-MM-DD");
};

export const isFutureEventDate = (value?: string) => {
  const parsed = toEventTime(value);

  if (!parsed) return false;

  return parsed.isAfter(dayjs().tz(EVENT_TIMEZONE));
};

export const groupEventsByDate = (
  events: CompanyEventListItem[],
): EventGroup[] => {
  const map = new Map<string, EventGroup>();

  events.forEach((event) => {
    const dateKey = getEventDateKey(event.eventAt);
    const dateLabel =
      dateKey === "unknown-date" ? "-" : formatDate(event.eventAt);

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        dateKey,
        dateLabel,
        items: [],
      });
    }

    map.get(dateKey)?.items.push(event);
  });

  return Array.from(map.values());
};

export const statusColor = (status?: string) => {
  const value = (status ?? "").toUpperCase();

  if (
    value === "PUBLISHED" ||
    value === "ACTIVE" ||
    value === "DONE" ||
    value === "COMPLETED" ||
    value === "SUBMITTED"
  ) {
    return "green";
  }

  if (
    value === "DRAFT" ||
    value === "ASSIGNED" ||
    value === "SENT" ||
    value === "NOT_STARTED"
  ) {
    return "blue";
  }

  if (
    value === "IN_PROGRESS" ||
    value === "PROCESSING" ||
    value === "PENDING"
  ) {
    return "gold";
  }

  if (
    value === "CANCELLED" ||
    value === "INACTIVE" ||
    value === "FAILED" ||
    value === "OVERDUE" ||
    value === "EXPIRED"
  ) {
    return "red";
  }

  return "default";
};

export const getStatusLabelKey = (status?: string) => {
  const value = (status ?? "").toUpperCase();

  switch (value) {
    case "PUBLISHED":
      return "onboarding.events.status.published";
    case "ACTIVE":
      return "onboarding.events.status.active";
    case "DONE":
    case "COMPLETED":
      return "onboarding.events.status.completed";
    case "SUBMITTED":
      return "onboarding.events.status.submitted";
    case "DRAFT":
      return "onboarding.events.status.draft";
    case "ASSIGNED":
    case "SENT":
      return "onboarding.events.status.sent";
    case "NOT_STARTED":
      return "onboarding.events.status.not_started";
    case "IN_PROGRESS":
    case "PROCESSING":
      return "onboarding.events.status.in_progress";
    case "PENDING":
      return "onboarding.events.status.pending";
    case "CANCELLED":
      return "onboarding.events.status.cancelled";
    case "INACTIVE":
      return "onboarding.events.status.inactive";
    case "FAILED":
      return "onboarding.events.status.failed";
    case "OVERDUE":
      return "onboarding.events.status.overdue";
    case "EXPIRED":
      return "onboarding.events.status.expired";
    default:
      return "onboarding.events.status.unknown";
  }
};

export const getSourceTypeLabelKey = (sourceType?: string) => {
  const value = (sourceType ?? "").toUpperCase();

  switch (value) {
    case "DEPARTMENT":
      return "onboarding.events.source_type.department";
    case "USER_LIST":
      return "onboarding.events.source_type.user_list";
    case "DEPARTMENT_PLUS_USERS":
      return "onboarding.events.source_type.department_plus_users";
    default:
      return "onboarding.events.source_type.unknown";
  }
};

export const eventStatusColor = statusColor;
export const eventStatusLabelKey = getStatusLabelKey;
export const sourceTypeLabelKey = getSourceTypeLabelKey;