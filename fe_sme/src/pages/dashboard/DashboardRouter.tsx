import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/user.store";
import { getPrimaryRole, isPlatformRole } from "@/shared/rbac";

const ROLE_DASHBOARD_MAP: Partial<
  Record<ReturnType<typeof getPrimaryRole>, string>
> = {
  HR: "/dashboard/hr",
  MANAGER: "/dashboard/manager",
  EMPLOYEE: "/dashboard/employee",
};

export default function DashboardRouter() {
  const currentUser = useUserStore((s) => s.currentUser);
  const roles = currentUser?.roles ?? [];
  const primaryRole = getPrimaryRole(roles);

  if (isPlatformRole(roles)) {
    if (primaryRole === "ADMIN")
      return <Navigate to="/platform/admin/dashboard" replace />;
    if (primaryRole === "STAFF")
      return <Navigate to="/platform/staff/dashboard" replace />;
  }

  const target = (primaryRole && ROLE_DASHBOARD_MAP[primaryRole]) ?? "/403";
  return <Navigate to={target} replace />;
}
