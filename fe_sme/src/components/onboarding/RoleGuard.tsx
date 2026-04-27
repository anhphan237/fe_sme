import React from "react";
import { useUserStore } from "@/stores/user.store";
import type { Role } from "@/enums/Role";

interface Props {
  /** User must have at least one of these roles to see children */
  roles: Role[];
  children: React.ReactNode;
  /** Rendered when access is denied. Defaults to null. */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on current user's roles.
 * Usage: <RoleGuard roles={["HR", "ADMIN"]}><SensitiveComponent /></RoleGuard>
 */
export const RoleGuard: React.FC<Props> = ({
  roles,
  children,
  fallback = null,
}) => {
  const currentUser = useUserStore((s) => s.currentUser);
  const userRoles = currentUser?.roles ?? [];
  const allowed = roles.some((r) => userRoles.includes(r));
  return <>{allowed ? children : fallback}</>;
};
