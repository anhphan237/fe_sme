// ============================================================
// Platform Admin Module Interfaces
// Maps to BE: modules/platform
// Operations: com.sme.platform.*
// Access: ADMIN + STAFF roles only
// ============================================================

import type {
  SubscriptionHistoryItem,
  SubscriptionHistoryRequest,
  SubscriptionHistoryResponse,
} from "@/interface/billing";

// ---------------------------
// Platform Company Analytics
// ---------------------------

/** com.sme.platform.analytics.company */
export interface PlatformCompanyAnalyticsRequest {
  startDate?: string;
  endDate?: string;
}

export interface PlatformCompanyAnalyticsResponse {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  suspendedCompanies: number;
  newCompanies: number;
  growthRate: number;
}

// ---------------------------
// Platform Onboarding Analytics
// ---------------------------

/** com.sme.platform.analytics.onboarding */
export interface PlatformOnboardingAnalyticsRequest {
  startDate?: string;
  endDate?: string;
}

export interface PlatformOnboardingAnalyticsResponse {
  totalOnboardings: number;
  completedOnboardings: number;
  completionRate: number;
  averageCompletionDays: number;
}

// ---------------------------
// Company Management
// ---------------------------

/** com.sme.platform.company.list */
export interface PlatformCompanyListRequest {
  page?: number;
  size?: number;
  search?: string;
  planCode?: string;
  status?: string;
}

export interface PlatformCompanyItem {
  companyId: string;
  name: string;
  status: string;
  createdAt: string;
  userCount: number;
  subscriptionStatus: string;
  planCode: string;
}

export interface PlatformCompanyListResponse {
  items: PlatformCompanyItem[];
  total: number;
}

/** com.sme.platform.company.detail */
export interface PlatformCompanyDetailRequest {
  companyId: string;
}

export interface PlatformCompanyDetailResponse {
  companyId: string;
  name: string;
  taxCode: string;
  address: string;
  status: string;
  createdAt: string;
  userCount: number;
  subscriptionId: string;
  subscriptionStatus: string;
  planCode: string;
  planName: string;
  currentPeriodEnd: string;
}

// ---------------------------
// Platform Templates (global shared library)
// ---------------------------

/** com.sme.onboarding.template.list */
export interface PlatformTemplateListRequest {
  keyword?: string;
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  level?: "PLATFORM" | "TENANT";
}

export interface PlatformTemplateItem {
  templateId: string;
  name: string;
  description: string;
  status: string;
  /** PLATFORM = global library; TENANT = company-owned */
  level?: "PLATFORM" | "TENANT";
  /** ONBOARDING or general task library */
  templateKind?: "ONBOARDING" | "TASK_LIBRARY";
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
  size: number;
}

/** com.sme.platform.template.create */
export interface PlatformTemplateCreateRequest {
  name: string;
  description?: string;
  /** PLATFORM = global library; TENANT = company-owned. Defaults to PLATFORM for admin. */
  level?: "PLATFORM" | "TENANT";
  /** Template kind. Defaults to ONBOARDING. */
  templateKind?: "ONBOARDING" | "TASK_LIBRARY";
  departmentTypeCode?: string;
}

/** com.sme.onboarding.template.update */
export interface PlatformTemplateUpdateRequest {
  templateId: string;
  name?: string;
  description?: string;
}

/** pending backend implementation */
export interface PlatformTemplatePublishRequest {
  templateId: string;
}

/** pending backend implementation */
export interface PlatformTemplateArchiveRequest {
  templateId: string;
}

/** com.sme.platform.template.activate */
export interface ActivatePlatformTemplateRequest {
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

/** com.sme.platform.company.suspend */
export interface PlatformCompanySuspendRequest {
  companyId: string;
  reason?: string;
}

export interface PlatformCompanySuspendResponse {
  companyId: string;
  status: string;
  message: string;
}

/** com.sme.platform.company.changePlan */
export interface PlatformCompanyChangePlanRequest {
  companyId: string;
  subscriptionId: string;
  newPlanId: string;
  billingCycle?: string;
  note?: string;
}

export interface PlatformCompanyChangePlanResponse {
  companyId: string;
  subscriptionId: string;
  oldPlanId: string;
  newPlanId: string;
  billingCycle: string;
  message: string;
}

/** com.sme.billing.subscription.history — aliases for platform UI */
export type PlatformSubscriptionHistoryRequest = SubscriptionHistoryRequest;
export type PlatformSubscriptionHistoryItem = SubscriptionHistoryItem;
export type PlatformSubscriptionHistoryResponse = SubscriptionHistoryResponse;

// ---------------------------
// Subscription Management
// ---------------------------

/** com.sme.platform.subscription.list */
export interface PlatformSubscriptionListRequest {
  page?: number;
  size?: number;
  companyId?: string;
  status?: string;
  planCode?: string;
}

export interface PlatformSubscriptionItem {
  subscriptionId: string;
  companyId: string;
  companyName: string;
  planCode: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface PlatformSubscriptionListResponse {
  items: PlatformSubscriptionItem[];
  total: number;
}

/** com.sme.platform.subscription.detail */
export interface PlatformSubscriptionDetailRequest {
  subscriptionId: string;
}

export interface PlatformSubscriptionDetailResponse {
  subscriptionId: string;
  companyId: string;
  companyName: string;
  planCode: string;
  planName: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
}

// ---------------------------
// Billing Plan Management
// ---------------------------

/** com.sme.platform.plan.list */
export interface PlatformPlanListRequest {
  [key: string]: never;
}

export interface PlatformPlanItem {
  planId: string;
  code: string;
  name: string;
  employeeLimitPerMonth: number;
  priceVndMonthly: number;
  priceVndYearly: number;
  status: string;
}

export interface PlatformPlanListResponse {
  items: PlatformPlanItem[];
}

/** com.sme.platform.plan.create */
export interface PlatformPlanCreateRequest {
  code: string;
  name: string;
  employeeLimitPerMonth: number;
  priceVndMonthly: number;
  priceVndYearly: number;
}

/** com.sme.platform.plan.update */
export interface PlatformPlanUpdateRequest {
  planId: string;
  name?: string;
  employeeLimitPerMonth?: number;
  priceVndMonthly?: number;
  priceVndYearly?: number;
}

/** com.sme.platform.plan.delete */
export interface PlatformPlanDeleteRequest {
  planId: string;
}

// ---------------------------
// Feedback Management
// ---------------------------

/** com.sme.platform.feedback.list */
export interface PlatformFeedbackListRequest {
  page?: number;
  size?: number;
  status?: string;
}

export interface PlatformFeedbackItem {
  feedbackId: string;
  companyId: string;
  companyName: string;
  userId: string;
  subject: string;
  status: string;
  createdAt: string;
}

export interface PlatformFeedbackListResponse {
  items: PlatformFeedbackItem[];
  total: number;
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
}

/** com.sme.platform.system.errorLog */
export interface PlatformSystemErrorLogRequest {
  page?: number;
  size?: number;

  keyword?: string;
  errorCode?: string;
  severity?: string;
  status?: string;
  operationType?: string;
  companyId?: string;
  actorRole?: string;

  startDate?: string;
  endDate?: string;
}

export interface PlatformSystemErrorLogItem {
  errorId?: string;
  errorCode?: string;
  message?: string;
  stackTrace?: string;
  requestId?: string;
  createdAt?: string;

  operationType?: string;
  tenantId?: string;
  companyId?: string;
  actorUserId?: string;
  actorRole?: string;
  severity?: string;
  status?: string;
  payloadSnapshot?: string;

  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;

  // fallback cho data cũ
  logId?: string;
  timestamp?: string;
}
export interface PlatformSystemErrorLogResponse {
  items: PlatformSystemErrorLogItem[];
  total: number;
}

/** com.sme.platform.system.activityLog */
export interface PlatformSystemActivityLogRequest {
  /** Optional — omit to default to caller's own userId (BE self-default) */
  userId?: string;
  fromTime?: string;
  toTime?: string;
  page?: number;
  size?: number;
}

export interface PlatformSystemActivityLogItem {
  logId: string;
  companyId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
  createdAt: string;
}

export interface PlatformSystemActivityLogResponse {
  items: PlatformSystemActivityLogItem[];
  total: number;
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

// ---------------------------
// Financial Dashboard
// ---------------------------

/** com.sme.platform.dashboard.financial */
export interface PlatformFinancialDashboardRequest {
  startDate?: string;
  endDate?: string;
}

export interface PlatformFinancialDashboardResponse {
  mrr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  churnRate: number | null;
  failedPayments: number;
}

// ---------------------------
// Invoice Management
// ---------------------------

/** com.sme.platform.invoice.list */
export interface PlatformInvoiceListRequest {
  page?: number;
  size?: number;
  companyId?: string;
  status?: string;
}

export interface PlatformInvoiceItem {
  invoiceId: string;
  companyId: string;
  companyName: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt: string;
  createdAt: string;
}

export interface PlatformInvoiceListResponse {
  items: PlatformInvoiceItem[];
  total: number;
}

// ---------------------------
// Payment Management
// ---------------------------

/** com.sme.platform.payment.list */
export interface PlatformPaymentListRequest {
  page?: number;
  size?: number;

  companyId?: string;
  subscriptionId?: string;
  invoiceId?: string;
  status?: string;

  startDate?: string;
  endDate?: string;
}

export interface PlatformPaymentItem {
  transactionId?: string;
  paymentTransactionId?: string;

  companyId?: string;
  companyName?: string;

  subscriptionId?: string;
  invoiceId?: string;

  provider?: string;
  providerTxnId?: string;

  amount?: number;
  currency?: string;
  status?: string;
  failureReason?: string;

  createdAt?: string;
  paidAt?: string;
}

export interface PlatformPaymentListResponse {
  items: PlatformPaymentItem[];
  total: number;
  page?: number;
  size?: number;
}

// ---------------------------
// Revenue Analytics
// ---------------------------

/** com.sme.platform.analytics.revenue */
export interface PlatformRevenueAnalyticsRequest {
  startDate?: string;
  endDate?: string;
}

export interface RevenueByPlanItem {
  planId: string;
  planCode: string;
  planName: string;
  revenue: number;
  subscriptionCount: number;
}

export interface PlatformRevenueAnalyticsResponse {
  mrr: number;
  arr: number;
  totalRevenue: number;
  revenueByPlans: RevenueByPlanItem[];
}

// ---------------------------
// Subscription Analytics
// ---------------------------

/** com.sme.platform.analytics.subscription */
export interface PlatformSubscriptionAnalyticsRequest {
  startDate?: string;
  endDate?: string;
}

export interface PlatformSubscriptionAnalyticsResponse {
  totalSubscriptions: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  suspendedSubscriptions: number;
  churnRate: number | null;
}

// ---------------------------
// Usage Analytics
// ---------------------------

/** com.sme.platform.analytics.usage */
export interface PlatformUsageAnalyticsRequest {
  startDate?: string;
  endDate?: string;
}

export interface PlatformUsageAnalyticsResponse {
  totalOnboardings: number;
  totalCompletedOnboardings: number;
  totalSurveyResponses: number;
  totalFeedbacks: number;
  avgOnboardingsPerCompany: number | null;
}

// ---------------------------
// Admin Audit Log
// ---------------------------

/** com.sme.platform.audit.adminLog */
export interface PlatformAdminAuditLogRequest {
  page?: number;
  size?: number;
}

export interface PlatformAdminAuditLogItem {
  logId: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

export interface PlatformAdminAuditLogResponse {
  items: PlatformAdminAuditLogItem[];
  total: number;
}

// ---------------------------
// Monitoring Metrics
// ---------------------------

/** com.sme.platform.monitoring.metrics */
export interface PlatformMonitoringMetricsResponse {
  usedMemoryMb: number;
  maxMemoryMb: number;
  heapUsagePercent: number | null;
  threadCount: number;
  availableProcessors: number;
  cpuUsagePercent: number | null;
}

// ============================================================
// Platform Analytics Dashboard (admin.md APIs)
// ============================================================

// Shared trend item (matched to BE TrendItem DTO)
export interface TrendItem {
  bucket: string;
  value: number;
  previousValue?: number;
  growthRate?: number | null;
}

// ---------------------------
// Dashboard Overview
// ---------------------------

/** com.sme.platform.dashboard.overview */
export interface PlatformDashboardOverviewRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
}

export interface PlatformDashboardOverviewResponse {
  startDate: string;
  endDate: string;
  groupBy: string;
  totalCompanies: number;
  companyGrowthRate: number | null;
  mrr: number;
  mrrGrowthRate: number | null;
  activeOnboardings: number;
  activeOnboardingsGrowthRate: number | null;
  riskOnboardings: number;
  riskOnboardingsGrowthRate: number | null;
  totalEmployees: number;
  employeeGrowthRate: number | null;
}

// ---------------------------
// Company Trend
// ---------------------------

/** com.sme.platform.analytics.company.trend */
export interface PlatformCompanyTrendRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
}

export interface PlatformCompanyTrendResponse {
  startDate: string;
  endDate: string;
  groupBy: string;
  items: TrendItem[];
}

// ---------------------------
// Revenue Trend
// ---------------------------

/** com.sme.platform.analytics.revenue.trend */
export interface PlatformRevenueTrendRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
}

export interface PlatformRevenueTrendResponse {
  startDate: string;
  endDate: string;
  groupBy: string;
  items: TrendItem[];
}

// ---------------------------
// Plan Trend
// ---------------------------

/** com.sme.platform.analytics.plan.trend */
export interface PlatformPlanTrendRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
}

export interface PlatformPlanTrendPoint {
  bucket: string;
  planCode: string;
  planName: string;
  count: number;
  previousCount?: number;
}

export interface PlatformPlanTrendResponse {
  data: PlatformPlanTrendPoint[];
}

// ---------------------------
// Employee Analytics
// ---------------------------

/** com.sme.platform.analytics.employee */
export interface PlatformEmployeeAnalyticsRequest {
  startDate: string;
  endDate: string;
}

export interface PlatformEmployeeAnalyticsResponse {
  totalEmployees: number;
  activeEmployees: number;
  newEmployees: number;
  churnedEmployees: number;
  avgEmployeesPerCompany: number | null;
}

// ---------------------------
// Employee Trend
// ---------------------------

/** com.sme.platform.analytics.employee.trend */
export interface PlatformEmployeeTrendRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
}

export interface PlatformEmployeeTrendResponse {
  startDate: string;
  endDate: string;
  groupBy: string;
  items: TrendItem[];
}

// ---------------------------
// Plan Distribution
// ---------------------------

/** com.sme.platform.analytics.plan.distribution */
export interface PlatformPlanDistributionRequest {
  startDate: string;
  endDate: string;
}

export interface PlanDistributionItem {
  planCode: string;
  planName: string;
  companyCount: number;
  percentage: number;
}

export interface PlatformPlanDistributionResponse {
  items: PlanDistributionItem[];
  total: number;
}

// ---------------------------
// Forecast
// ---------------------------

/** com.sme.platform.analytics.forecast */
export type ForecastMetric = "REVENUE" | "COMPANY" | "EMPLOYEE" | "ONBOARDING";

export interface PlatformForecastRequest {
  metric: ForecastMetric;
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
  forecastPoints?: number;
}

export interface ForecastPoint {
  period: string;
  actual?: number;
  forecast: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface PlatformForecastResponse {
  metric: ForecastMetric;
  data: ForecastPoint[];
}

// ---------------------------
// Onboarding Trend
// ---------------------------

/** com.sme.platform.analytics.onboarding.trend */
export interface PlatformOnboardingTrendRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
}

export interface PlatformOnboardingTrendItem {
  bucket: string;
  total: number;
  active: number;
  completed: number;
  risk: number;
  previousTotal?: number;
  growthRate?: number | null;
}

export interface PlatformOnboardingTrendResponse {
  startDate: string;
  endDate: string;
  groupBy: string;
  items: PlatformOnboardingTrendItem[];
}

// ---------------------------
// Risk Dashboard
// ---------------------------

/** com.sme.platform.dashboard.risk */
export interface PlatformRiskDashboardRequest {
  startDate: string;
  endDate: string;
}

export interface LowCompletionCompanyItem {
  companyId: string;
  companyName: string;
  completionRate: number;
}

export interface PlatformRiskDashboardResponse {
  riskOnboardings: number;
  failedPayments: number;
  suspendedCompanies: number;
  companiesNearPlanLimit: number;
  expiringSubscriptions: number;
  lowCompletionCompanies: number;
  lowCompletionCompanyItems: LowCompletionCompanyItem[];
}
