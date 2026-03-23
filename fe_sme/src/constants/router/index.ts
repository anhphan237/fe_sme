export const AppRouters = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register-company",
  INVITE_ACCEPT: "/invite/accept",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  FORBIDDEN: "/403",
  // Admin
  ADMIN_DEPARTMENTS: "/admin/departments",
  ADMIN_USERS: "/admin/users",
  ADMIN_ROLES: "/admin/roles",
  ADMIN_KNOWLEDGE_BASE: "/admin/knowledge-base",
  // Settings
  SETTINGS_NOTIFICATIONS: "/settings/notifications",
  // Onboarding - HR
  ONBOARDING_HR: "/onboarding/hr",
  ONBOARDING_HR_EMPLOYEES: "/onboarding/hr/employees",
  ONBOARDING_HR_EMPLOYEES_NEW: "/onboarding/hr/employees/new",
  ONBOARDING_HR_TEMPLATES: "/onboarding/hr/templates",
  ONBOARDING_HR_TEMPLATES_NEW: "/onboarding/hr/templates/new",
  ONBOARDING_HR_TASKS: "/onboarding/hr/tasks",
  ONBOARDING_HR_AUTOMATION: "/onboarding/hr/automation",
  // Onboarding - Manager
  ONBOARDING_MANAGER: "/onboarding/manager",
  ONBOARDING_MANAGER_EMPLOYEES: "/onboarding/manager/employees",
  ONBOARDING_MANAGER_TASKS: "/onboarding/manager/tasks",
  // Onboarding - Employee
  ONBOARDING_EMPLOYEE: "/onboarding/employee",
  // Documents
  DOCUMENTS: "/documents",
  DOCUMENTS_ACKNOWLEDGMENTS: "/documents/acknowledgments",
  // Surveys
  SURVEYS_TEMPLATES: "/surveys/templates",
  SURVEYS_TEMPLATES_NEW: "/surveys/templates/new",
  SURVEYS_SEND: "/surveys/send",
  SURVEYS_INBOX: "/surveys/inbox",
  SURVEYS_REPORTS: "/surveys/reports",
  // Chatbot
  CHATBOT: "/chatbot",
  // Billing
  BILLING_PLAN: "/billing/plan",
  BILLING_USAGE: "/billing/usage",
  BILLING_INVOICES: "/billing/invoices",
  BILLING_PAYMENT: "/billing/payment",
  // Platform
  PLATFORM_TENANTS: "/platform/tenants",
  PLATFORM_PLANS: "/platform/plans",
  PLATFORM_SUBSCRIPTIONS: "/platform/subscriptions",
  PLATFORM_USAGE: "/platform/usage",
  PLATFORM_FINANCE: "/platform/finance",
  PLATFORM_DUNNING: "/platform/dunning",
  PLATFORM_INVOICES: "/platform/invoices",
  PLATFORM_PAYMENTS: "/platform/payments",
  PLATFORM_EMAIL_LOGS: "/platform/email-logs",
} as const;

export type AppRouter = (typeof AppRouters)[keyof typeof AppRouters];
