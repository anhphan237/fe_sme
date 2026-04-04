import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/user.store";
import type { Role } from "@/shared/types";
import { hasRequiredRole } from "@/shared/rbac";

interface RequireAuthProps {
  children: ReactNode;
}

interface GuestRouteProps {
  children: ReactNode;
}

interface RequireRolesProps {
  children: ReactNode;
  requiredRoles: Role[];
}

/** Redirect logged-in users away from guest-only pages (e.g. landing) */
export function GuestRoute({ children }: GuestRouteProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Redirect unauthenticated users to /login */
export function RequireAuth({ children }: RequireAuthProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  console.log("[RequireAuth] currentUser=", currentUser?.id ?? null, "path=", window.location.pathname);
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Redirect if user lacks required roles */
export function RequireRoles({ children, requiredRoles }: RequireRolesProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!hasRequiredRole(currentUser.roles, requiredRoles))
    return <Navigate to="/403" replace />;
  return <>{children}</>;
}
