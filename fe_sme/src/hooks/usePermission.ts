/**
 * usePermission - ported from PMS internal system
 * Permission/role-based access control utility
 */
import { useAppStore } from "@/store/useAppStore";

type RequiredRole = string | string[];

/**
 * Check if user has permission based on roles
 * @param currentRole - required role(s) for the resource. Use 'all' to allow any.
 * @param permissions - the user's current permission list
 * @param checkFullPermission - if true, requires 'f' (full) permission, not just 'v' (view)
 */
export const hasPermission = (
  currentRole: RequiredRole | undefined,
  permissions: string[],
  checkFullPermission = false,
): boolean => {
  if (!permissions || !currentRole) return false;
  if (currentRole === "all") return true;

  const roles = Array.isArray(currentRole) ? currentRole : [currentRole];

  for (const perm of permissions) {
    const [role, action = ""] = perm.split(".");
    if (roles.includes(role)) {
      if (action === "f" || (action === "v" && !checkFullPermission)) {
        return true;
      }
      return false;
    }
  }

  return false;
};

/**
 * Hook to check permissions from store
 * @example
 * const { can, canFull } = usePermission()
 * can('employee') // true if user has view or full permission on 'employee'
 * canFull('employee') // true only if user has full permission on 'employee'
 */
export const usePermission = () => {
  const permissions = useAppStore((s) => s.permissions);
  const roles = useAppStore((s) => s.roles);

  const can = (resource: RequiredRole): boolean =>
    hasPermission(resource, permissions, false);

  const canFull = (resource: RequiredRole): boolean =>
    hasPermission(resource, permissions, true);

  const hasRole = (role: string | string[]): boolean => {
    const required = Array.isArray(role) ? role : [role];
    return roles.some((r) => required.includes(r));
  };

  return { can, canFull, hasRole, permissions, roles };
};
