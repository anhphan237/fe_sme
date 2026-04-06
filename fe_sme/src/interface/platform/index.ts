// ============================================================
// Platform Admin Module Interfaces
// Maps to BE: modules/platform (new - to be implemented)
// Operations: com.sme.platform.*
// Access: ADMIN + STAFF roles only
// ============================================================

// ---------------------------
// Platform Dashboard Overview
// ---------------------------

/** com.sme.platform.dashboard.overview */
export interface PlatformDashboardOverviewRequest {
  startDate: string;
  endDate: string;
}

export interface PlatformDashboardOverviewResponse {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  totalOnboardingInstances: number;
  activeOnboardingInstances: number;
  completedOnboardingInstances: number;
  platformCompletionRate: number;
  atRiskCount: number;
  [key: string]: unknown;
}

// ---------------------------
// Company Management
// ---------------------------

/** com.sme.platform.company.list */
export interface PlatformCompanyListRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  plan?: string;
  status?: string;
}

export interface PlatformCompanyItem {
  companyId: string;
  name: string;
  industry: string;
  size: string;
  plan: string;
  status: string;
  activeOnboardings: number;
  completionRate: number;
  createdAt: string;
}

export interface PlatformCompanyListResponse {
  items: PlatformCompanyItem[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

/** com.sme.platform.company.get */
export interface PlatformCompanyGetRequest {
  companyId: string;
}

export interface PlatformCompanyDetailResponse {
  companyId: string;
  name: string;
  industry: string;
  size: string;
  plan: string;
  status: string;
  adminEmail: string;
  createdAt: string;
  // Onboarding stats
  totalOnboardings: number;
  activeOnboardings: number;
  completedOnboardings: number;
  cancelledOnboardings: number;
  completionRate: number;
  // Task stats
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  // Department breakdown
  departments: PlatformCompanyDepartmentStat[];
  [key: string]: unknown;
}

export interface PlatformCompanyDepartmentStat {
  departmentId: string;
  departmentName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

// ---------------------------
// Onboarding Monitor (cross-company)
// ---------------------------

/** com.sme.platform.onboarding.overview */
export interface PlatformOnboardingOverviewRequest {
  startDate: string;
  endDate: string;
  page?: number;
  pageSize?: number;
}

export interface PlatformOnboardingCompanyStat {
  companyId: string;
  companyName: string;
  totalInstances: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  completionRate: number;
  atRisk: boolean;
}

export interface PlatformOnboardingOverviewResponse {
  totalInstances: number;
  activeInstances: number;
  completedInstances: number;
  cancelledInstances: number;
  overallCompletionRate: number;
  atRiskCount: number;
  companies: PlatformOnboardingCompanyStat[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

// ---------------------------
// Platform Templates (global shared library)
// ---------------------------

/** com.sme.platform.template.list */
export interface PlatformTemplateListRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface PlatformTemplateItem {
  templateId: string;
  name: string;
  description: string;
  status: string;
  checklistCount: number;
  taskCount: number;
  usedByCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTemplateListResponse {
  items: PlatformTemplateItem[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

/** com.sme.platform.template.create */
export interface PlatformTemplateCreateRequest {
  name: string;
  description?: string;
}

/** com.sme.platform.template.update */
export interface PlatformTemplateUpdateRequest {
  templateId: string;
  name?: string;
  description?: string;
}

/** com.sme.platform.template.publish */
export interface PlatformTemplatePublishRequest {
  templateId: string;
}

/** com.sme.platform.template.archive */
export interface PlatformTemplateArchiveRequest {
  templateId: string;
}

// ---------------------------
// Company Actions
// ---------------------------

/** com.sme.platform.company.activate */
export interface PlatformCompanyActivateRequest {
  companyId: string;
}

/** com.sme.platform.company.deactivate */
export interface PlatformCompanyDeactivateRequest {
  companyId: string;
}

/** com.sme.platform.company.delete */
export interface PlatformCompanyDeleteRequest {
  companyId: string;
}

// ---------------------------
// Subscription Management
// ---------------------------

/** com.sme.platform.subscription.list */
export interface PlatformSubscriptionListRequest {
  page?: number;
  pageSize?: number;
  companyId?: string;
  status?: string;
}

export interface PlatformSubscriptionItem {
  subscriptionId: string;
  companyName: string;
  plan: string;
  status: string;
  billingCycle: string;
  nextRenewal: string;
  amount: number;
}

export interface PlatformSubscriptionListResponse {
  items: PlatformSubscriptionItem[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

/** com.sme.platform.subscription.detail */
export interface PlatformSubscriptionDetailRequest {
  subscriptionId: string;
}

export interface PlatformSubscriptionDetailResponse {
  subscriptionId: string;
  companyName: string;
  plan: string;
  status: string;
  billingCycle: string;
  nextRenewal: string;
  amount: number;
  paymentHistory: {
    paymentId: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
  [key: string]: unknown;
}

// ---------------------------
// Billing Plan Management
// ---------------------------

/** com.sme.platform.plan.list */
export interface PlatformPlanListRequest {
  // no params required
}

export interface PlatformPlanItem {
  planCode: string;
  name: string;
  price: number;
  billingCycle: string;
  maxEmployees: number;
  features: string[];
}

export interface PlatformPlanListResponse {
  plans: PlatformPlanItem[];
  [key: string]: unknown;
}

/** com.sme.platform.plan.create */
export interface PlatformPlanCreateRequest {
  planCode: string;
  name: string;
  price: number;
  billingCycle: string;
  maxEmployees: number;
  features: string[];
}

/** com.sme.platform.plan.update */
export interface PlatformPlanUpdateRequest {
  planCode: string;
  name?: string;
  price?: number;
  features?: string[];
}

/** com.sme.platform.plan.delete */
export interface PlatformPlanDeleteRequest {
  planCode: string;
}

// ---------------------------
// Feedback Management
// ---------------------------

/** com.sme.platform.feedback.list */
export interface PlatformFeedbackListRequest {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface PlatformFeedbackItem {
  feedbackId: string;
  userId: string;
  companyName: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface PlatformFeedbackListResponse {
  items: PlatformFeedbackItem[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

/** com.sme.platform.feedback.detail */
export interface PlatformFeedbackDetailRequest {
  feedbackId: string;
}

/** com.sme.platform.feedback.resolve */
export interface PlatformFeedbackResolveRequest {
  feedbackId: string;
  resolution?: string;
}

// ---------------------------
// System Health & Logs
// ---------------------------

/** com.sme.platform.system.health */
export interface PlatformSystemHealthResponse {
  status: "UP" | "DEGRADED" | "DOWN";
  services: {
    name: string;
    status: "UP" | "DOWN";
    latencyMs?: number;
  }[];
  [key: string]: unknown;
}

/** com.sme.platform.system.errorLog */
export interface PlatformSystemErrorLogRequest {
  page?: number;
  pageSize?: number;
  severity?: string;
  from?: string;
  to?: string;
}

export interface PlatformSystemErrorLogItem {
  logId: string;
  message: string;
  severity: string;
  timestamp: string;
  stackTrace?: string;
}

export interface PlatformSystemErrorLogResponse {
  items: PlatformSystemErrorLogItem[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

/** com.sme.platform.system.activityLog */
export interface PlatformSystemActivityLogRequest {
  page?: number;
  pageSize?: number;
  actorId?: string;
  from?: string;
  to?: string;
}

export interface PlatformSystemActivityLogItem {
  actorId: string;
  action: string;
  resource: string;
  timestamp: string;
}

export interface PlatformSystemActivityLogResponse {
  items: PlatformSystemActivityLogItem[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

// ---------------------------
// Dunning (Failed Payment Recovery)
// ---------------------------

/** com.sme.billing.dunning.retry */
export interface PlatformDunningRetryRequest {
  subscriptionId: string;
}

export interface PlatformDunningRetryResponse {
  retried: boolean;
  nextAttemptAt?: string;
}
