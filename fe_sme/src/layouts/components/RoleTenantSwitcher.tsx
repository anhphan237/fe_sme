import { type ReactNode, useMemo } from "react";
import { useUserStore } from "@/stores/user.store";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { useLocale } from "@/i18n";

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

export function RoleTenantSwitcher() {
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const currentTenant = useUserStore((s) => s.currentTenant);

  const roleLabel = useMemo(() => {
    if (!currentUser?.roles?.length) {
      return "—";
    }
    const primary = getPrimaryRole(currentUser.roles);
    const label = ROLE_LABELS[primary];
    if (label) return label;
    return primary
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [currentUser?.roles]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
        {currentUser?.name ?? t("layout.user.guest")}
      </div>
      <Badge>{roleLabel}</Badge>
      {currentUser?.roles && currentUser.roles.length > 1 && (
        <Badge>
          +{currentUser.roles.length - 1} {t("layout.user.roles_more")}
        </Badge>
      )}
      {currentTenant && <Badge>{currentTenant.name}</Badge>}
    </div>
  );
}
