/**
 * Identity data mappers shared by pages and hooks.
 * They normalize gateway payloads to stable UI models.
 */
import type { Role } from "@/interface/common";
import type {
  AppUser,
  GetUserResponse,
  LoginResponse,
  UserListItem,
} from "@/interface/identity";
import type { User, UserDetail } from "@/shared/types";

const KNOWN_ROLES: Role[] = [
  "ADMIN",
  "STAFF",
  "HR",
  "IT",
  "MANAGER",
  "EMPLOYEE",
];

const toUpper = (value: unknown): string =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeDateValue = (value: unknown): string | null => {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e11 ? value * 1000 : value;
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      return normalizeDateValue(Number(trimmed));
    }
    return trimmed;
  }
  return null;
};

const toUserStatus = (value: unknown): User["status"] => {
  const upper = toUpper(value);
  if (upper === "DISABLED" || upper === "INACTIVE") return "Inactive";
  if (upper === "PENDING" || upper === "INVITED") return "Invited";
  return "Active";
};

const toUserDetailStatus = (value: unknown): UserDetail["status"] => {
  const upper = toUpper(value);
  if (upper === "DISABLED") return "DISABLED";
  if (upper === "INACTIVE") return "INACTIVE";
  if (upper === "PENDING" || upper === "INVITED") return "INVITED";
  return "ACTIVE";
};

export function normalizeRoles(roles: unknown): Role[] {
  const raw = Array.isArray(roles) ? roles : [];
  const mapped = raw
    .map((role) =>
      typeof role === "string" ? role.trim().toUpperCase() : String(role),
    )
    .filter((role): role is Role => KNOWN_ROLES.includes(role as Role));

  return mapped.length ? mapped : ["EMPLOYEE"];
}

export function mapUser(u: UserListItem | Record<string, unknown>): User {
  const raw = u as Record<string, unknown>;
  const roles = normalizeRoles(
    raw["roles"] ?? (raw["roleCode"] ? [raw["roleCode"]] : ["EMPLOYEE"]),
  );

  return {
    id: String(raw["userId"] ?? raw["id"] ?? ""),
    name: String(raw["fullName"] ?? raw["name"] ?? ""),
    email: String(raw["email"] ?? ""),
    phone: toNullableString(raw["phone"]),
    roles,
    companyId:
      toNullableString(raw["companyId"]) ?? toNullableString(raw["tenantId"]),
    department:
      toNullableString(raw["departmentName"]) ??
      toNullableString(raw["department"]) ??
      "",
    departmentId: toNullableString(raw["departmentId"]),
    status: toUserStatus(raw["status"]),
    employeeId: toNullableString(raw["employeeId"]),
    managerUserId: toNullableString(raw["managerUserId"]),
    manager: toNullableString(raw["managerName"]) ?? undefined,
    // Keep empty string when BE omits createdAt so UI can render "—" explicitly.
    createdAt: normalizeDateValue(raw["createdAt"]) ?? "",
  };
}

export function mapUserDetail(d: GetUserResponse): UserDetail {
  return {
    userId: d.userId ?? "",
    email: d.email ?? "",
    fullName: d.fullName ?? "",
    phone: d.phone ?? null,
    status: toUserDetailStatus(d.status),
    employeeId: d.employeeId ?? null,
    departmentId: d.departmentId ?? null,
    employeeCode: d.employeeCode ?? null,
    employeeName: d.employeeName ?? d.fullName ?? null,
    employeeEmail: d.employeeEmail ?? d.email ?? null,
    employeePhone: d.employeePhone ?? d.phone ?? null,
    jobTitle: d.jobTitle ?? null,
    managerUserId: d.managerUserId ?? null,
    startDate: normalizeDateValue(d.startDate),
    workLocation: d.workLocation ?? null,
    employeeStatus: d.employeeStatus ?? (d.status ? String(d.status) : null),
  };
}

export function mapLoginToAppUser(res: LoginResponse): AppUser {
  const u = res.user;
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    roles: normalizeRoles([u.roleCode]),
    companyId: u.tenantId ?? null,
    department: "",
    status: "Active",
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

export function mergeUserWithDetail(
  user: User,
  detail: GetUserResponse | UserDetail,
): User {
  return {
    ...user,
    departmentId: detail.departmentId ?? user.departmentId ?? null,
    department:
      ("departmentName" in detail
        ? (detail.departmentName as string | undefined)
        : undefined) ??
      user.department ??
      "",
    employeeId:
      ("employeeId" in detail ? detail.employeeId : null) ??
      user.employeeId ??
      null,
    managerUserId:
      ("managerUserId" in detail ? detail.managerUserId : null) ??
      user.managerUserId ??
      null,
  };
}
