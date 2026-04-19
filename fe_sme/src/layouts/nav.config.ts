import {
  Banknote,
  Bell,
  Bot,
  Briefcase,
  ClipboardCheck,
  FileText,
  Gauge,
  LayoutGrid,
  Monitor,
  Shield,
} from "lucide-react";
import type { Role } from "../shared/types";

export type NavChild = {
  titleKey: string;
  to: string;
  requiredRoles?: Role[];
};

export type NavSection = {
  titleKey: string;
  icon: typeof Gauge;
  to?: string;
  requiredRoles?: Role[];
  children?: NavChild[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "nav.dashboard",
    icon: Gauge,
    to: "/dashboard",
  },
  {
    titleKey: "nav.organization",
    icon: Shield,
    children: [
      {
        titleKey: "nav.organization.departments",
        to: "/hr/departments",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.organization.department_types",
        to: "/hr/department-types",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.organization.users",
        to: "/hr/users",
        requiredRoles: ["HR"],
      },
    ],
  },
  {
    titleKey: "nav.onboarding",
    icon: ClipboardCheck,
    children: [
      {
        titleKey: "nav.onboarding.dashboard",
        to: "/onboarding",
        requiredRoles: ["HR", "MANAGER", "EMPLOYEE"],
      },
      {
        titleKey: "nav.onboarding.employees",
        to: "/onboarding/employees",
        requiredRoles: ["HR", "MANAGER"],
      },
      {
        titleKey: "nav.onboarding.templates",
        to: "/onboarding/templates",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.onboarding.task_library",
        to: "/onboarding/task-library",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.onboarding.tasks",
        to: "/onboarding/tasks",
        requiredRoles: ["HR", "MANAGER", "EMPLOYEE"],
      },
      {
        titleKey: "nav.onboarding.approvals",
        to: "/onboarding/approvals",
        requiredRoles: ["HR", "MANAGER"],
      },
      {
        titleKey: "nav.onboarding.schedule",
        to: "/onboarding/schedule",
        requiredRoles: ["HR", "MANAGER", "EMPLOYEE"],
      },
      {
        titleKey: "nav.onboarding.my_journey",
        to: "/dashboard/employee",
        requiredRoles: ["EMPLOYEE"],
      },
    ],
  },
  {
    titleKey: "nav.documents",
    icon: FileText,
    children: [
      {
        titleKey: "nav.documents.library",
        to: "/documents",
        requiredRoles: ["HR", "MANAGER", "EMPLOYEE"],
      },
    ],
  },
  {
    titleKey: "nav.surveys",
    icon: LayoutGrid,
    children: [
      {
        titleKey: "nav.surveys.templates",
        to: "/surveys/templates",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.surveys.send",
        to: "/surveys/send",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.surveys.inbox",
        to: "/surveys/inbox",
        requiredRoles: ["HR", "MANAGER", "EMPLOYEE"],
      },
      {
        titleKey: "nav.surveys.reports",
        to: "/surveys/reports",
        requiredRoles: ["HR"],
      },
    ],
  },
  {
    titleKey: "nav.chatbot",
    icon: Bot,
    to: "/chatbot",
    requiredRoles: ["HR", "MANAGER", "EMPLOYEE"],
  },
  {
    titleKey: "nav.notifications",
    icon: Bell,
    to: "/notifications",
    requiredRoles: ["HR", "MANAGER", "EMPLOYEE"],
  },
  {
    titleKey: "nav.billing",
    icon: Banknote,
    children: [
      {
        titleKey: "nav.billing.plan",
        to: "/billing/plan",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.billing.usage",
        to: "/billing/usage",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.billing.invoices",
        to: "/billing/invoices",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.billing.transactions",
        to: "/billing/invoices?tab=transactions",
        requiredRoles: ["HR", "MANAGER"],
      },
    ],
  },

  // ── Platform Admin sidebar (ADMIN only) ──────────────────────────
  {
    titleKey: "nav.platform.admin",
    icon: Briefcase,
    requiredRoles: ["ADMIN"],
    children: [
      {
        titleKey: "nav.platform.dashboard",
        to: "/platform/admin/dashboard",
        requiredRoles: ["ADMIN"],
      },
      {
        titleKey: "nav.platform.companies",
        to: "/platform/admin/companies",
        requiredRoles: ["ADMIN"],
      },
      {
        titleKey: "nav.platform.plans",
        to: "/platform/admin/plans",
        requiredRoles: ["ADMIN"],
      },
      {
        titleKey: "nav.platform.onboarding_monitor",
        to: "/platform/admin/onboarding",
        requiredRoles: ["ADMIN"],
      },
      {
        titleKey: "nav.platform.feedback",
        to: "/platform/admin/feedback",
        requiredRoles: ["ADMIN"],
      },
      {
        titleKey: "nav.platform.system",
        to: "/platform/admin/system",
        requiredRoles: ["ADMIN"],
      },
    ],
  },

  // ── Platform Staff sidebar (STAFF only) ──────────────────────────
  {
    titleKey: "nav.platform.staff",
    icon: Monitor,
    requiredRoles: ["STAFF"],
    children: [
      {
        titleKey: "nav.platform.dashboard",
        to: "/platform/staff/dashboard",
        requiredRoles: ["STAFF"],
      },
      {
        titleKey: "nav.platform.payments",
        to: "/platform/staff/payments",
        requiredRoles: ["STAFF"],
      },
      {
        titleKey: "nav.platform.onboarding_monitor",
        to: "/platform/staff/onboarding",
        requiredRoles: ["STAFF"],
      },
    ],
  },
];
