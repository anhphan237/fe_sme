import {
  Banknote,
  Bot,
  Briefcase,
  ClipboardCheck,
  FileText,
  Gauge,
  LayoutGrid,
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
        to: "/admin/departments",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.organization.users",
        to: "/admin/users",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.organization.roles",
        to: "/admin/roles",
        requiredRoles: ["HR"],
      },
    ],
  },
  {
    titleKey: "nav.onboarding",
    icon: ClipboardCheck,
    children: [
      {
        titleKey: "nav.onboarding.hr_workspace",
        to: "/onboarding/hr",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.onboarding.employees",
        to: "/onboarding/hr/employees",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.onboarding.new_employee",
        to: "/onboarding/hr/employees/new",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.onboarding.templates",
        to: "/onboarding/hr/templates",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.onboarding.tasks",
        to: "/onboarding/hr/tasks",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.onboarding.automation",
        to: "/onboarding/hr/automation",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.onboarding.knowledge_base",
        to: "/admin/knowledge-base",
        requiredRoles: ["HR"],
      },
      {
        titleKey: "nav.onboarding.manager_workspace",
        to: "/onboarding/manager",
        requiredRoles: ["MANAGER"],
      },
      {
        titleKey: "nav.onboarding.employees",
        to: "/onboarding/manager/employees",
        requiredRoles: ["MANAGER"],
      },
      {
        titleKey: "nav.onboarding.tasks",
        to: "/onboarding/manager/tasks",
        requiredRoles: ["MANAGER"],
      },
      {
        titleKey: "nav.onboarding.my_workspace",
        to: "/onboarding/employee",
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
      {
        titleKey: "nav.documents.acknowledgments",
        to: "/documents/acknowledgments",
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
        titleKey: "nav.billing.payment",
        to: "/billing/payment",
        requiredRoles: ["HR"],
      },
    ],
  },
  {
    titleKey: "nav.platform",
    icon: Briefcase,
    children: [
      {
        titleKey: "nav.platform.payments",
        to: "/platform/payments",
        requiredRoles: ["STAFF"],
      },
    ],
  },
];
