import { useMemo } from "react";
import { useUserStore } from "@/stores/user.store";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
      {children}
    </span>
  );
}

export function RoleTenantSwitcher() {
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
      <div className="rounded-full border border-stroke bg-white px-3 py-2 text-sm">
        {currentUser?.name ?? "Guest"}
      </div>
      <Badge>{roleLabel}</Badge>
      {currentUser?.roles && currentUser.roles.length > 1 && (
        <Badge>+{currentUser.roles.length - 1} roles</Badge>
      )}
      {currentTenant && <Badge>{currentTenant.name}</Badge>}
    </div>
  );
}
