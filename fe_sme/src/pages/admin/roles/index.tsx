import { useState } from "react";
import { Checkbox } from "antd";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/ui/Card";
import BaseButton from "@/components/button";
import { Badge } from "../../../components/ui/Badge";
import { useToast } from "../../../components/ui/Toast";
import { useLocale } from "@/i18n";

import type { Role } from "../../../shared/types";
import { ROLE_LABELS } from "../../../shared/rbac";

// ── Permission catalogue ───────────────────────────────────

type PermEntry = { code: string; groupKey: string };

const ALL_PERMISSIONS: PermEntry[] = [
  // Organisation
  { code: "manage_departments", groupKey: "organisation" },
  { code: "manage_users", groupKey: "organisation" },
  { code: "manage_roles", groupKey: "organisation" },
  { code: "view_company_billing", groupKey: "organisation" },
  // HR / Onboarding
  { code: "manage_employee_profiles", groupKey: "hr_onboarding" },
  { code: "manage_onboarding_templates", groupKey: "hr_onboarding" },
  { code: "create_onboarding_instances", groupKey: "hr_onboarding" },
  { code: "assign_tasks", groupKey: "hr_onboarding" },
  { code: "track_onboarding_progress", groupKey: "hr_onboarding" },
  { code: "manage_automation", groupKey: "hr_onboarding" },
  { code: "manage_surveys", groupKey: "hr_onboarding" },
  { code: "view_survey_analytics", groupKey: "hr_onboarding" },
  // Content
  { code: "manage_documents", groupKey: "content" },
  { code: "manage_kb", groupKey: "content" },
  // Team
  { code: "view_team_onboarding", groupKey: "team" },
  { code: "update_assigned_tasks", groupKey: "team" },
  // Collaboration
  { code: "comment_tasks", groupKey: "collaboration" },
  { code: "upload_attachments", groupKey: "collaboration" },
  // Employee self-service
  { code: "view_my_onboarding", groupKey: "self_service" },
  { code: "update_task_status", groupKey: "self_service" },
  { code: "answer_surveys", groupKey: "self_service" },
  { code: "view_documents", groupKey: "self_service" },
];

// ── Default permission sets per role ──────────────────────

const DEFAULT_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    "manage_departments",
    "manage_users",
    "manage_roles",
    "view_company_billing",
    "manage_employee_profiles",
    "manage_onboarding_templates",
    "create_onboarding_instances",
    "assign_tasks",
    "track_onboarding_progress",
    "manage_automation",
    "manage_surveys",
    "view_survey_analytics",
    "manage_documents",
    "manage_kb",
    "view_team_onboarding",
    "update_assigned_tasks",
    "comment_tasks",
    "upload_attachments",
    "answer_surveys",
    "view_documents",
  ],
  STAFF: [],
  HR: [
    "manage_employee_profiles",
    "manage_onboarding_templates",
    "create_onboarding_instances",
    "assign_tasks",
    "track_onboarding_progress",
    "manage_automation",
    "manage_surveys",
    "view_survey_analytics",
    "manage_documents",
    "manage_kb",
    "view_team_onboarding",
    "update_assigned_tasks",
    "answer_surveys",
    "view_documents",
  ],
  MANAGER: [
    "view_team_onboarding",
    "update_assigned_tasks",
    "comment_tasks",
    "upload_attachments",
    "answer_surveys",
    "view_documents",
  ],
  IT: [
    "manage_kb",
    "manage_documents",
    "view_team_onboarding",
    "view_documents",
  ],
  EMPLOYEE: [
    "view_my_onboarding",
    "update_task_status",
    "comment_tasks",
    "upload_attachments",
    "answer_surveys",
    "view_documents",
  ],
};

// Company-level roles only
const COMPANY_ROLES: Role[] = ["ADMIN", "HR", "MANAGER", "IT", "EMPLOYEE"];

const GROUPS = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.groupKey)));

// ── Page component ────────────────────────────────────────

function AdminRoles() {
  const toast = useToast();
  const { t } = useLocale();
  const [activeRole, setActiveRole] = useState<Role>("ADMIN");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Current (edited) permissions per role
  const [permsState, setPermsState] = useState<Record<Role, Set<string>>>(
    () => {
      const map = {} as Record<Role, Set<string>>;
      for (const role of COMPANY_ROLES)
        map[role] = new Set(DEFAULT_PERMISSIONS[role]);
      return map;
    },
  );

  // Last-saved permissions per role (for hasChanges & diff calculation)
  const [savedPerms, setSavedPerms] = useState<Record<Role, Set<string>>>(
    () => {
      const map = {} as Record<Role, Set<string>>;
      for (const role of COMPANY_ROLES)
        map[role] = new Set(DEFAULT_PERMISSIONS[role]);
      return map;
    },
  );

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
    setPermsState((prev) => ({
      ...prev,
      [activeRole]: new Set(saved),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // TODO: com.sme.identity.role.grantPermission / revokePermission not yet in backend
      // Changes are applied to local state only
      setSavedPerms((prev) => ({
        ...prev,
        [activeRole]: new Set(active),
      }));
      toast(t("role.save_success"));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("role.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("role.page_title")}
        subtitle={t("role.page_subtitle")}
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Left — role list */}
        <Card className="self-start space-y-1 p-4">
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
        </Card>

        {/* Right — permission matrix */}
        <Card className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                {ROLE_LABELS[activeRole]}
              </h3>
              <p className="text-sm text-muted">
                {t(`role.desc.${activeRole.toLowerCase()}`)}
              </p>
            </div>
            <Badge>
              {t("role.permissions_count", {
                current: active.size,
                total: ALL_PERMISSIONS.length,
              })}
            </Badge>
          </div>

          {GROUPS.map((groupKey) => {
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
        </Card>
      </div>
    </div>
  );
}

export default AdminRoles;
