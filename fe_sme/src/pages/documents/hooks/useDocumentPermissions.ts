import { useMemo } from "react";
import { useUserStore } from "@/stores/user.store";

export interface DocumentPermissions {
  /** HR / Manager / Admin: create folder + create document page */
  canCreate: boolean;

  /** HR / Admin: delete document */
  canDelete: boolean;

  /** HR / Manager / Admin: create, rename, move, delete folder */
  canManageFolder: boolean;

  /** HR / Manager / Admin: publish document */
  canPublish: boolean;

  /** HR / Admin: manage access rules - disabled in V1 UI if BE API is not available */
  canManageAccessRules: boolean;

  /** HR / Manager / Admin: view access rules - disabled in V1 UI if BE API is not available */
  canViewAccessRules: boolean;

  /** HR / Manager / Admin: view document statistics */
  canViewStats: boolean;

  /** Employee / Manager: acknowledge or confirm reading document */
  canAcknowledge: boolean;

  /** HR / Manager / Admin: view version history */
  canViewVersions: boolean;

  /** HR / Manager / Admin: edit document content */
  canEdit: boolean;

  /** Everyone with login can read document if BE returns it */
  canRead: boolean;
}

type RawRole =
  | string
  | {
      code?: string;
      roleCode?: string;
      name?: string;
      authority?: string;
    };

const normalizeRole = (role: RawRole): string => {
  if (typeof role === "string") return role.trim().toUpperCase();

  return (
    role.code ??
    role.roleCode ??
    role.name ??
    role.authority ??
    ""
  )
    .trim()
    .toUpperCase();
};

const toRoleCodes = (roles: RawRole[] | undefined | null): string[] => {
  if (!Array.isArray(roles)) return [];

  return roles
    .map(normalizeRole)
    .filter(Boolean)
    .map((role) => {
      if (role.startsWith("ROLE_")) return role.replace(/^ROLE_/, "");
      return role;
    });
};

const hasAnyRole = (roles: string[], allowedRoles: string[]) =>
  roles.some((role) => allowedRoles.includes(role));

const ADMIN_ROLES = [
  "ADMIN",
  "ADMIN_PLATFORM",
  "PLATFORM_ADMIN",
  "COMPANY_ADMIN",
  "HR_ADMIN",
];

const HR_ROLES = ["HR", "HR_ADMIN", "COMPANY_ADMIN"];

const MANAGER_ROLES = ["MANAGER"];

const EMPLOYEE_ROLES = ["EMPLOYEE"];

const DOCUMENT_MANAGER_ROLES = [
  ...ADMIN_ROLES,
  ...HR_ROLES,
  ...MANAGER_ROLES,
];

const DOCUMENT_OWNER_ROLES = [...ADMIN_ROLES, ...HR_ROLES];

export function useDocumentPermissions(): DocumentPermissions {
  const rawRoles = useUserStore((state) => state.currentUser?.roles ?? []);

  const roles = useMemo(() => toRoleCodes(rawRoles as RawRole[]), [rawRoles]);

  const isDocumentManager = hasAnyRole(roles, DOCUMENT_MANAGER_ROLES);
  const isDocumentOwner = hasAnyRole(roles, DOCUMENT_OWNER_ROLES);
  const isEmployee = hasAnyRole(roles, EMPLOYEE_ROLES);
  const isManager = hasAnyRole(roles, MANAGER_ROLES);

  return {
    canRead: roles.length > 0,

    canCreate: isDocumentManager,

    canDelete: isDocumentOwner,

    canManageFolder: isDocumentManager,

    canPublish: isDocumentManager,

    canManageAccessRules: isDocumentOwner,

    canViewAccessRules: isDocumentManager,

    canViewStats: isDocumentManager,

    canAcknowledge: isEmployee || isManager,

    canViewVersions: isDocumentManager,

    canEdit: isDocumentManager,
  };
}