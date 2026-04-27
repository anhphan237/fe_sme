import { useUserStore } from "@/stores/user.store";

export interface DocumentPermissions {
  /** HR, MANAGER: upload file + tạo EDITOR document */
  canCreate: boolean;
  /** ADMIN, HR: xóa tài liệu */
  canDelete: boolean;
  /** HR, MANAGER: tạo/đổi tên/xóa folder */
  canManageFolder: boolean;
  /** HR, MANAGER: publish document */
  canPublish: boolean;
  /** ADMIN, HR: quản lý access rules */
  canManageAccessRules: boolean;
  /** ADMIN, HR, MANAGER: xem access rules */
  canViewAccessRules: boolean;
  /** ADMIN, HR, MANAGER: xem stat cards */
  canViewStats: boolean;
  /** EMPLOYEE: acknowledge tài liệu */
  canAcknowledge: boolean;
  /** ADMIN, HR, MANAGER: xem version history */
  canViewVersions: boolean;
  /** HR, MANAGER, ADMIN, EMPLOYEE: chỉnh sửa nội dung */
  canEdit: boolean;
}

export function useDocumentPermissions(): DocumentPermissions {
  const roles = useUserStore((s) => s.currentUser?.roles ?? []);

  return {
    canCreate: roles.some((r) => ["HR", "MANAGER"].includes(r)),
    canDelete: roles.some((r) => ["ADMIN", "HR"].includes(r)),
    canManageFolder: roles.some((r) => ["HR", "MANAGER"].includes(r)),
    canPublish: roles.some((r) => ["HR", "MANAGER"].includes(r)),
    canManageAccessRules: roles.some((r) => ["ADMIN", "HR"].includes(r)),
    canViewAccessRules: roles.some((r) => ["ADMIN", "HR", "MANAGER"].includes(r)),
    canViewStats: roles.some((r) => ["ADMIN", "HR", "MANAGER"].includes(r)),
    canAcknowledge: roles.some((r) => ["EMPLOYEE"].includes(r)),
    canViewVersions: roles.some((r) => ["ADMIN", "HR", "MANAGER"].includes(r)),
    canEdit: roles.some((r) =>
      ["HR", "MANAGER", "ADMIN", "EMPLOYEE"].includes(r),
    ),
  };
}
