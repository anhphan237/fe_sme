/**
 * Identity module — data mappers (shared by Pages)
 * Transforms raw gateway responses into typed UI models.
 */
import type { User, UserDetail } from "@/shared/types";
import type { Role } from "@/interface/common";
import type {
  AppUser,
  LoginResponse,
  UserListItem,
  GetUserResponse,
} from "@/interface/identity";

// ── Role helpers ────────────────────────────────────────────

const KNOWN_ROLES: Role[] = [
  "ADMIN",
  "STAFF",
  "HR",
  "IT",
  "MANAGER",
  "EMPLOYEE",
];

export function normalizeRoles(roles: unknown): Role[] {
  const raw = Array.isArray(roles) ? roles : [];
  const mapped = raw
    .map((r) => (typeof r === "string" ? r.toUpperCase() : String(r)))
    .filter((r): r is Role => KNOWN_ROLES.includes(r as Role));
  return mapped.length ? mapped : ["EMPLOYEE"];
}

// ── Entity mappers ──────────────────────────────────────────

export function mapUser(u: UserListItem | Record<string, unknown>): User {
  const raw = u as Record<string, unknown>;
  const roles = normalizeRoles(
    raw["roles"] ?? (raw["roleCode"] ? [raw["roleCode"]] : ["EMPLOYEE"]),
  );
  return {
    id: String(raw["userId"] ?? raw["id"] ?? ""),
    name: String(raw["fullName"] ?? raw["name"] ?? ""),
    email: String(raw["email"] ?? ""),
    roles,
    companyId:
      (raw["companyId"] as string | null) ??
      (raw["tenantId"] as string | null) ??
      null,
    department: String(raw["departmentName"] ?? raw["department"] ?? ""),
    departmentId: (raw["departmentId"] as string | null) ?? null,
    status:
      raw["status"] === "DISABLED"
        ? "Inactive"
        : raw["status"] === "INVITED"
          ? "Invited"
          : "Active",
    employeeId: (raw["employeeId"] as string | null) ?? null,
    managerUserId: (raw["managerUserId"] as string | null) ?? null,
    manager: raw["managerName"] as string | undefined,
    createdAt: String(
      raw["createdAt"] ?? new Date().toISOString().slice(0, 10),
    ),
  };
}

export function mapUserDetail(d: GetUserResponse): UserDetail {
  return {
    userId: d.userId ?? "",
    email: d.email ?? "",
    fullName: d.fullName ?? "",
    phone: d.phone ?? null,
    status:
      d.status === "DISABLED"
        ? "DISABLED"
        : d.status === "INVITED"
          ? "INVITED"
          : "ACTIVE",
    employeeId: d.employeeId ?? null,
    departmentId: d.departmentId ?? null,
    employeeCode: d.employeeCode ?? null,
    employeeName: d.employeeName ?? d.fullName ?? null,
    employeeEmail: d.employeeEmail ?? d.email ?? null,
    employeePhone: d.employeePhone ?? d.phone ?? null,
    jobTitle: d.jobTitle ?? null,
    managerUserId: d.managerUserId ?? null,
    startDate: d.startDate ?? null,
    workLocation: d.workLocation ?? null,
    employeeStatus: d.employeeStatus ?? d.status ?? null,
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
