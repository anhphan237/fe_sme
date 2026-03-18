export const DefaultRoles = {
  ADMIN: "ADMIN",
  HR: "HR",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
  IT: "IT",
  STAFF: "STAFF",
} as const;

export type DefaultRole = (typeof DefaultRoles)[keyof typeof DefaultRoles];

// ── Permission catalogue ──────────────────────────────────

export type PermEntry = { code: string; groupKey: string };

export const ALL_PERMISSIONS: PermEntry[] = [
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

/** Derived ordered list of unique permission group keys. */
export const PERMISSION_GROUPS: string[] = Array.from(
  new Set(ALL_PERMISSIONS.map((p) => p.groupKey)),
);

/** Company-level roles (excludes platform-only STAFF). */
import type { Role } from "@/shared/types";

export const COMPANY_ROLES: Role[] = [
  DefaultRoles.ADMIN,
  DefaultRoles.HR,
  DefaultRoles.MANAGER,
  DefaultRoles.IT,
  DefaultRoles.EMPLOYEE,
];

/** Default permission sets pre-assigned to each company role. */
export const DEFAULT_PERMISSIONS: Record<Role, string[]> = {
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
