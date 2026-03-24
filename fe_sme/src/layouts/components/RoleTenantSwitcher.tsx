import { useMemo } from "react";
import { Tag } from "antd";
import { useUserStore } from "@/stores/user.store";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { useLocale } from "@/i18n";

export function RoleTenantSwitcher() {
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const currentTenant = useUserStore((s) => s.currentTenant);

  const roleLabel = useMemo(() => {
    if (!currentUser?.roles?.length) return "—";
    const primary = getPrimaryRole(currentUser.roles);
    const label = ROLE_LABELS[primary];
    if (label) return label;
    return primary
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [currentUser?.roles]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag
        style={{
          borderRadius: 999,
          border: "1px solid #e2e8f0",
          background: "#fff",
          color: "#475569",
          fontSize: 12,
          fontWeight: 500,
          padding: "2px 10px",
          margin: 0,
        }}>
        {currentUser?.name ?? t("layout.user.guest")}
      </Tag>

      <Tag
        color="blue"
        style={{
          borderRadius: 999,
          fontSize: 12,
          padding: "2px 10px",
          margin: 0,
        }}>
        {roleLabel}
      </Tag>

      {currentUser?.roles && currentUser.roles.length > 1 && (
        <Tag
          style={{
            borderRadius: 999,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            color: "#64748b",
            fontSize: 12,
            padding: "2px 10px",
            margin: 0,
          }}>
          +{currentUser.roles.length - 1} {t("layout.user.roles_more")}
        </Tag>
      )}

      {currentTenant && (
        <Tag
          color="geekblue"
          style={{
            borderRadius: 999,
            fontSize: 12,
            padding: "2px 10px",
            margin: 0,
          }}>
          {currentTenant.name}
        </Tag>
      )}
    </div>
  );
}
