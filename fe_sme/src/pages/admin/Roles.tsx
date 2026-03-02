import { useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import type { Role } from "../../shared/types";
import { ROLE_LABELS } from "../../shared/rbac";

// ── Permission catalogue ───────────────────────────────────

type PermEntry = { code: string; label: string; group: string };

const ALL_PERMISSIONS: PermEntry[] = [
  // Organisation
  {
    code: "manage_departments",
    label: "Manage departments",
    group: "Organisation",
  },
  { code: "manage_users", label: "Manage users", group: "Organisation" },
  { code: "manage_roles", label: "Manage roles", group: "Organisation" },
  {
    code: "view_company_billing",
    label: "View company billing",
    group: "Organisation",
  },
  // HR / Onboarding
  {
    code: "manage_employee_profiles",
    label: "Manage employee profiles",
    group: "HR & Onboarding",
  },
  {
    code: "manage_onboarding_templates",
    label: "Manage onboarding templates",
    group: "HR & Onboarding",
  },
  {
    code: "create_onboarding_instances",
    label: "Create onboarding instances",
    group: "HR & Onboarding",
  },
  { code: "assign_tasks", label: "Assign tasks", group: "HR & Onboarding" },
  {
    code: "track_onboarding_progress",
    label: "Track onboarding progress",
    group: "HR & Onboarding",
  },
  {
    code: "manage_automation",
    label: "Manage automation",
    group: "HR & Onboarding",
  },
  { code: "manage_surveys", label: "Manage surveys", group: "HR & Onboarding" },
  {
    code: "view_survey_analytics",
    label: "View survey analytics",
    group: "HR & Onboarding",
  },
  // Content
  { code: "manage_documents", label: "Manage documents", group: "Content" },
  { code: "manage_kb", label: "Manage knowledge base", group: "Content" },
  // Team
  {
    code: "view_team_onboarding",
    label: "View team onboarding",
    group: "Team",
  },
  {
    code: "update_assigned_tasks",
    label: "Update assigned tasks",
    group: "Team",
  },
  // Collaboration
  { code: "comment_tasks", label: "Comment on tasks", group: "Collaboration" },
  {
    code: "upload_attachments",
    label: "Upload attachments",
    group: "Collaboration",
  },
  // Employee self-service
  {
    code: "view_my_onboarding",
    label: "View my onboarding",
    group: "Self-service",
  },
  {
    code: "update_task_status",
    label: "Update task status",
    group: "Self-service",
  },
  { code: "answer_surveys", label: "Answer surveys", group: "Self-service" },
  { code: "view_documents", label: "View documents", group: "Self-service" },
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
  // STAFF is a platform-level role - not shown here
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

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Full access: manages users, roles, billing and system settings.",
  STAFF: "Internal platform staff (platform-level, not company-level).",
  HR: "Owns employee onboarding workflows, surveys and documents.",
  MANAGER: "Guides team onboarding and updates assigned tasks.",
  IT: "Manages knowledge base and documentation.",
  EMPLOYEE: "Completes personal onboarding tasks and surveys.",
};

// Company-level roles only (platform roles managed separately)
const COMPANY_ROLES: Role[] = ["ADMIN", "HR", "MANAGER", "IT", "EMPLOYEE"];

// ── Page component ────────────────────────────────────────

function AdminRoles() {
  const toast = useToast();
  const [activeRole, setActiveRole] = useState<Role>("ADMIN");

  // Local editable permissions state (source-of-truth until BE grantPermission op is available)
  const [permsState, setPermsState] = useState<Record<Role, Set<string>>>(
    () => {
      const map = {} as Record<Role, Set<string>>;
      for (const role of COMPANY_ROLES) {
        map[role] = new Set(DEFAULT_PERMISSIONS[role]);
      }
      return map;
    },
  );

  const groups = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.group)));

  const toggle = (code: string) => {
    setPermsState((prev) => {
      const next = new Set(prev[activeRole]);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return { ...prev, [activeRole]: next };
    });
  };

  const handleSave = () => {
    // TODO: wire to com.sme.identity.role.grantPermission / revokePermission when BE ready
    toast(`Permissions for ${ROLE_LABELS[activeRole]} saved.`);
  };

  const active = permsState[activeRole];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure access for each role within your organisation."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Left — role list */}
        <Card className="self-start space-y-1 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Company roles
          </p>
          {COMPANY_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
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
                {ROLE_DESCRIPTIONS[activeRole]}
              </p>
            </div>
            <Badge>
              {active.size} / {ALL_PERMISSIONS.length} permissions
            </Badge>
          </div>

          {groups.map((group) => {
            const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
            return (
              <div key={group} className="space-y-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {group}
                </p>
                {groupPerms.map((perm) => {
                  const checked = active.has(perm.code);
                  return (
                    <label
                      key={perm.code}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-stroke px-4 py-2.5 text-sm transition-colors hover:bg-slate-50">
                      <span className={checked ? "text-ink" : "text-muted"}>
                        {perm.label}
                      </span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-slate-900"
                        checked={checked}
                        onChange={() => toggle(perm.code)}
                      />
                    </label>
                  );
                })}
              </div>
            );
          })}

          <div className="flex items-center justify-between border-t border-stroke pt-4">
            <p className="text-xs text-muted">
              Changes are saved locally until backend permission management is
              available.
            </p>
            <Button onClick={handleSave}>Save changes</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminRoles;
