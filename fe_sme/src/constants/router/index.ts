export const AppRouters = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register-company",
  INVITE_ACCEPT: "/invite/accept",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  FORBIDDEN: "/403",
  // HR (formerly Admin)
  ADMIN_DEPARTMENTS: "/hr/departments",
  ADMIN_DEPARTMENT_TYPES: "/hr/department-types",
  ADMIN_USERS: "/hr/users",
  ADMIN_KNOWLEDGE_BASE: "/hr/knowledge-base",
  // Notifications
  NOTIFICATIONS: "/notifications",
  // Settings
  SETTINGS_NOTIFICATIONS: "/settings/notifications",
  // Onboarding - flat role-aware routes
  ONBOARDING: "/onboarding",
  ONBOARDING_DASHBOARD: "/onboarding",
  ONBOARDING_EMPLOYEES: "/onboarding/employees",
  ONBOARDING_EMPLOYEES_NEW: "/onboarding/employees/new",
  ONBOARDING_TEMPLATES: "/onboarding/templates",
  ONBOARDING_TEMPLATES_NEW: "/onboarding/templates/new",
  ONBOARDING_TASK_LIBRARY: "/onboarding/task-library",
  ONBOARDING_TASK_LIBRARY_DETAIL: "/onboarding/task-library/:templateId",
  ONBOARDING_TASKS: "/onboarding/tasks",
  ONBOARDING_MY_JOURNEY: "/onboarding/my-journey",
  // Documents
  DOCUMENTS: "/documents",
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
  BILLING_TRANSACTIONS: "/billing/transactions",
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
  PLATFORM_DASHBOARD: "/platform/dashboard",
  PLATFORM_COMPANIES: "/platform/companies",
  PLATFORM_ONBOARDING_MONITOR: "/platform/onboarding-monitor",
} as const;

export type AppRouter = (typeof AppRouters)[keyof typeof AppRouters];
