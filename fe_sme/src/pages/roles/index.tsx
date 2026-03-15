import { useState } from "react";
import { Checkbox } from "antd";
import BaseButton from "@/components/button";
import { notify } from "@/utils/notify";
import { useLocale } from "@/i18n";

import type { Role } from "@/shared/types";
import { ROLE_LABELS } from "@/shared/rbac";
import {
  ALL_PERMISSIONS,
  COMPANY_ROLES,
  DEFAULT_PERMISSIONS,
  PERMISSION_GROUPS,
} from "@/constants/permission";

// ── Page component ────────────────────────────────────────

const buildPermMap = (): Record<Role, Set<string>> => {
  const map = {} as Record<Role, Set<string>>;
  for (const role of COMPANY_ROLES)
    map[role] = new Set(DEFAULT_PERMISSIONS[role]);
  return map;
};

const AdminRoles = () => {
  const { t } = useLocale();
  const [activeRole, setActiveRole] = useState<Role>("ADMIN");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [permsState, setPermsState] =
    useState<Record<Role, Set<string>>>(buildPermMap);
  const [savedPerms, setSavedPerms] =
    useState<Record<Role, Set<string>>>(buildPermMap);

  const toggle = (code: string) => {
    setSaveError(null);
    setPermsState((prev) => {
      const next = new Set(prev[activeRole]);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return { ...prev, [activeRole]: next };
    });
  };

  const active = permsState[activeRole];
  const saved = savedPerms[activeRole];
  const hasChanges =
    active.size !== saved.size || [...active].some((c) => !saved.has(c));

  const handleReset = () => {
    setSaveError(null);
    setPermsState((prev) => ({ ...prev, [activeRole]: new Set(saved) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // TODO: com.sme.identity.role.grantPermission / revokePermission not yet in backend
      // Changes are applied to local state only
      setSavedPerms((prev) => ({ ...prev, [activeRole]: new Set(active) }));
      notify.success(t("role.save_success"));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("role.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col p-4">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Left — role list */}
        <div className="self-start space-y-1 rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("role.company_roles")}
          </p>
          {COMPANY_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => {
                setActiveRole(role);
                setSaveError(null);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                role === activeRole
                  ? "bg-slate-900 text-white"
                  : "text-ink hover:bg-slate-50"
              }`}>
              <span>{ROLE_LABELS[role]}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  role === activeRole
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-muted"
                }`}>
                {permsState[role].size}
              </span>
            </button>
          ))}
        </div>

        {/* Right — permission matrix */}
        <div className="space-y-5 rounded-xl border border-stroke bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                {ROLE_LABELS[activeRole]}
              </h3>
              <p className="text-sm text-muted">
                {t(`role.desc.${activeRole.toLowerCase()}`)}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-muted">
              {t("role.permissions_count", {
                current: active.size,
                total: ALL_PERMISSIONS.length,
              })}
            </span>
          </div>

          {PERMISSION_GROUPS.map((groupKey) => {
            const groupPerms = ALL_PERMISSIONS.filter(
              (p) => p.groupKey === groupKey,
            );
            return (
              <div key={groupKey} className="space-y-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {t(`role.group.${groupKey}`)}
                </p>
                {groupPerms.map((perm) => {
                  const checked = active.has(perm.code);
                  return (
                    <div
                      key={perm.code}
                      onClick={() => toggle(perm.code)}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-stroke px-4 py-2.5 text-sm transition-colors hover:bg-slate-50">
                      <span className={checked ? "text-ink" : "text-muted"}>
                        {t(`role.perm.${perm.code}`)}
                      </span>
                      <Checkbox checked={checked} />
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="flex items-center justify-between gap-4 border-t border-stroke pt-4">
            <div>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <BaseButton
                  type="text"
                  htmlType="button"
                  onClick={handleReset}
                  disabled={saving}
                  label="global.reset"
                />
              )}
              <BaseButton
                type="primary"
                htmlType="button"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                label={saving ? "role.saving" : "role.save_changes"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRoles;
