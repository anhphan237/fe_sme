import { gatewayRequest } from "../core/gateway";
import type {
  LoginRequest,
  LoginResponse,
  CheckEmailResponse,
  UserListRequest,
  UserListResponse,
  UserListItem,
  GetUserResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  BulkCreateUsersRequest,
  BulkCreateUsersResponse,
  BulkUserImportValidateResponse,
  BulkUserImportCommitResponse,
} from "@/interface/identity";
import type { Role } from "@/interface/common";

// ── Auth ──────────────────────────────────────────────────

/** com.sme.identity.auth.login */
export const apiLogin = (payload: LoginRequest) =>
  gatewayRequest<LoginRequest, LoginResponse>(
    "com.sme.identity.auth.login",
    payload,
    { tenantId: null },
  );

/** com.sme.identity.auth.checkEmailExists */
export const apiCheckEmailExists = (email: string) =>
  gatewayRequest<{ email: string }, CheckEmailResponse>(
    "com.sme.identity.auth.checkEmailExists",
    { email },
    { tenantId: null },
  );

// ── User ──────────────────────────────────────────────────

/** com.sme.identity.user.list */
export const apiSearchUsers = (params?: UserListRequest) =>
  gatewayRequest<UserListRequest, UserListResponse | UserListItem[]>(
    "com.sme.identity.user.list",
    params ?? {},
  );

/** com.sme.identity.user.get */
export const apiGetUserById = (userId: string) =>
  gatewayRequest<{ userId: string }, GetUserResponse>(
    "com.sme.identity.user.get",
    { userId },
  );

/** com.sme.identity.user.create */
export const apiCreateUser = (payload: CreateUserRequest) =>
  gatewayRequest<CreateUserRequest, CreateUserResponse>(
    "com.sme.identity.user.create",
    payload,
  );

/** com.sme.identity.user.update */
export const apiUpdateUser = (payload: UpdateUserRequest) =>
  gatewayRequest<UpdateUserRequest, void>(
    "com.sme.identity.user.update",
    payload,
  );

/** com.sme.identity.user.disable */
export const apiDisableUser = (userId: string) =>
  gatewayRequest<{ userId: string; disabled: boolean }, void>(
    "com.sme.identity.user.disable",
    { userId, disabled: true },
  );

// ── Role ──────────────────────────────────────────────────

/** com.sme.identity.role.assign */
export const apiAssignRole = (userId: string, roleCode: Role) =>
  gatewayRequest<{ userId: string; roleCode: Role }, void>(
    "com.sme.identity.role.assign",
    { userId, roleCode },
  );

/** com.sme.identity.role.revoke */
export const apiRevokeRole = (userId: string, roleCode: Role) =>
  gatewayRequest<{ userId: string; roleCode: Role }, void>(
    "com.sme.identity.role.revoke",
    { userId, roleCode },
  );

// ── Session ───────────────────────────────────────────────

/** Logout — gateway is stateless, resolve immediately */
export const apiLogout = (): Promise<{ ok: boolean }> =>
  Promise.resolve({ ok: true });

/** POST /api/v1/invite/set-password (public endpoint — no auth required) */
export const apiInviteSetPassword = async (
  token: string,
  password: string,
): Promise<void> => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
  const base =
    import.meta.env.DEV && BASE_URL ? "" : BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/invite/set-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `Request failed (${res.status})`;
    try {
      const json = JSON.parse(text) as { message?: string; errorCode?: string };
      msg = json.message ?? json.errorCode ?? msg;
    } catch {
      /* non-JSON */
    }
    throw new Error(String(msg));
  }
};

/** com.sme.identity.user.bulkCreate */
export const apiBulkCreateUsers = (payload: BulkCreateUsersRequest) =>
  gatewayRequest<BulkCreateUsersRequest, BulkCreateUsersResponse>(
    "com.sme.identity.user.bulkCreate",
    payload,
  );

// ── Excel Bulk Import ─────────────────────────────────────

const BULK_IMPORT_BASE = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/v1/users/bulk-import`;

const getBulkImportHeaders = () => {
  const token =
    (typeof window !== "undefined" && localStorage.getItem("auth_token")) || "";
  return { Authorization: `Bearer ${token}` };
};

/** GET /api/v1/users/bulk-import/excel-template — download .xlsx template */
export const apiDownloadBulkImportTemplate = async (): Promise<Blob> => {
  const res = await fetch(`${BULK_IMPORT_BASE}/excel-template`, {
    method: "GET",
    headers: getBulkImportHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to download template (${res.status})`);
  return res.blob();
};

/** POST /api/v1/users/bulk-import/validate — validate uploaded .xlsx file */
export const apiValidateBulkImportExcel = async (
  file: File,
): Promise<BulkUserImportValidateResponse> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BULK_IMPORT_BASE}/validate`, {
    method: "POST",
    headers: getBulkImportHeaders(),
    body: form,
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.message ?? `Validation failed (${res.status})`);
  return json.data as BulkUserImportValidateResponse;
};

/** POST /api/v1/users/bulk-import/commit — create users from uploaded .xlsx file */
export const apiCommitBulkImportExcel = async (
  file: File,
): Promise<BulkUserImportCommitResponse> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BULK_IMPORT_BASE}/commit`, {
    method: "POST",
    headers: getBulkImportHeaders(),
    body: form,
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.message ?? `Commit failed (${res.status})`);
  return json.data as BulkUserImportCommitResponse;
};
