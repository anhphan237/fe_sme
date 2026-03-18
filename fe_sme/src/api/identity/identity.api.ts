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

// ── Bulk Import ───────────────────────────────────────────

/** com.sme.identity.user.bulkCreate */
export const apiBulkCreateUsers = (payload: BulkCreateUsersRequest) =>
  gatewayRequest<BulkCreateUsersRequest, BulkCreateUsersResponse>(
    "com.sme.identity.user.bulkCreate",
    payload,
  );
