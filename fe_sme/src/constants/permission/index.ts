export const DefaultRoles = {
  ADMIN: "ADMIN",
  HR: "HR",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
  IT: "IT",
  STAFF: "STAFF",
} as const;

export type DefaultRole = (typeof DefaultRoles)[keyof typeof DefaultRoles];
