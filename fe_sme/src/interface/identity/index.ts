// ============================================================
// Identity Module Interfaces
// Maps to BE: modules/identity
// Operations: com.sme.identity.auth.*, com.sme.identity.user.*, com.sme.identity.role.*
// ============================================================

import type { Role, UserStatus } from "../common";

// ---------------------------
// Auth
// ---------------------------

/** com.sme.identity.auth.login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** BE LoginUserInfo embedded inside LoginResponse */
export interface LoginUserInfo {
  id: string;
  fullName: string;
  email: string;
  roleCode: string;
  tenantId: string;
}

/** com.sme.identity.auth.login → response data */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: LoginUserInfo;
}

/** com.sme.identity.auth.checkEmailExists → response data */
export interface CheckEmailResponse {
  exists: boolean;
}

// ---------------------------
// User
// ---------------------------

/** com.sme.identity.user.create */
export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  /** default: ACTIVE */
  status?: UserStatus;
  companyId?: string;
  /** Required — sets employee_profiles.department_id */
  departmentId?: string;
  employeeCode?: string;
  jobTitle?: string;
  managerUserId?: string;
  startDate?: string;
  workLocation?: string;
  /** Single role code to assign */
  roleCode?: string;
}

/** com.sme.identity.user.create → response data */
export interface CreateUserResponse {
  userId: string;
  email: string;
  fullName: string;
}

/** com.sme.identity.user.update */
export interface UpdateUserRequest {
  userId: string;
  email?: string;
  fullName?: string;
  phone?: string;
  status?: UserStatus;
  newPassword?: string;
  departmentId?: string;
  employeeCode?: string;
  employeeName?: string;
  employeeEmail?: string;
  employeePhone?: string;
  jobTitle?: string;
  managerUserId?: string;
  startDate?: string;
  workLocation?: string;
  companyId?: string;
}

/** com.sme.identity.user.get — request */
export interface GetUserRequest {
  userId: string;
}

/** com.sme.identity.user.get — response (full detail) */
export interface GetUserResponse {
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: UserStatus;
  employeeId: string | null;
  departmentId: string | null;
  employeeCode: string | null;
  employeeName: string | null;
  employeeEmail: string | null;
  employeePhone: string | null;
  jobTitle: string | null;
  managerUserId: string | null;
  startDate: string | null;
  workLocation: string | null;
  employeeStatus: string | null;
}

/** com.sme.identity.user.disable */
export interface DisableUserRequest {
  userId: string;
}

/** com.sme.identity.user.list — request */
export interface UserListRequest {
  status?: UserStatus;
  departmentId?: string;
  keyword?: string;
}

/** Item in com.sme.identity.user.list → response.users[] */
export interface UserListItem {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  status: UserStatus;
  roles: string[];
  departmentId: string;
  departmentName: string;
}

/** com.sme.identity.user.list → full response data */
export interface UserListResponse {
  users: UserListItem[];
}

// ---------------------------
// Role
// ---------------------------

/** com.sme.identity.role.assign */
export interface AssignRoleRequest {
  userId: string;
  roleCode: Role;
}

/** com.sme.identity.role.revoke */
export interface RevokeRoleRequest {
  userId: string;
  roleCode: Role;
}

// ---------------------------
// Bulk Import
// ---------------------------

/** Single row in com.sme.identity.user.bulkCreate request */
export interface BulkCreateUserRow {
  email: string;
  fullName: string;
  phone?: string;
  roleCode?: string;
  departmentId?: string;
  jobTitle?: string;
  employeeCode?: string;
  startDate?: string;
  workLocation?: string;
}

/** com.sme.identity.user.bulkCreate */
export interface BulkCreateUsersRequest {
  users: BulkCreateUserRow[];
}

/** Single result row from bulk create */
export interface BulkCreateUserResult {
  index: number;
  success: boolean;
  message?: string;
  userId?: string;
}

/** com.sme.identity.user.bulkCreate → response data */
export interface BulkCreateUsersResponse {
  results: BulkCreateUserResult[];
  successCount: number;
  failedCount: number;
}

// ---------------------------
// App-level normalized User (used by store / pages)
// ---------------------------

/** Normalized User model for UI consumption */
export interface AppUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  companyId: string | null;
  department: string;
  status: "Active" | "Invited" | "Inactive";
  employeeId?: string | null;
  managerUserId?: string | null;
  manager?: string;
  createdAt: string;
}
