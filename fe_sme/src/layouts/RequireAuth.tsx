import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import type { Role } from "../shared/types";
import { hasRequiredRole } from "../shared/rbac";

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

// Redirect logged-in users away from guest-only pages (e.g. landing)
export function GuestRoute({ children }: GuestRouteProps) {
  const currentUser = useAppStore((state) => state.currentUser);

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const currentUser = useAppStore((state) => state.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function RequireRoles({ children, requiredRoles }: RequireRolesProps) {
  const currentUser = useAppStore((state) => state.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRequiredRole(currentUser.roles, requiredRoles)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
