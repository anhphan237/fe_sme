// ============================================================
// Platform Admin Module Interfaces
// Maps to BE: modules/platform
// Operations: com.sme.platform.*
// Access: ADMIN + STAFF roles only
// ============================================================

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
  page?: number;
  size?: number;
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
  size: number;
}

/** com.sme.onboarding.template.create */
export interface PlatformTemplateCreateRequest {
  name: string;
  description?: string;
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
  size?: number;
  companyId?: string;
  status?: string;
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
  companyName: string;
  planCode: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
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
}

export interface PlatformSystemErrorLogItem {
  errorId: string;
  errorCode: string;
  message: string;
  requestId: string;
  createdAt: string;
  stackTrace?: string;
}

export interface PlatformSystemErrorLogResponse {
  items: PlatformSystemErrorLogItem[];
  total: number;
}

/** com.sme.platform.system.activityLog */
export interface PlatformSystemActivityLogRequest {
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
  status?: string;
}

export interface PlatformPaymentItem {
  paymentId: string;
  companyId: string;
  companyName: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
}

export interface PlatformPaymentListResponse {
  items: PlatformPaymentItem[];
  total: number;
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

// Shared
export interface TrendPoint {
  period: string;
  value: number;
  previousValue?: number;
}

// ---------------------------
// Dashboard Overview
// ---------------------------

/** com.sme.platform.dashboard.overview */
export interface PlatformDashboardOverviewRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
  comparePrevious?: boolean;
}

export interface PlatformDashboardOverviewResponse {
  totalCompanies: number;
  activeCompanies: number;
  newCompanies: number;
  suspendedCompanies: number;
  growthRate: number | null;
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  churnRate: number | null;
  totalOnboardings: number;
  completedOnboardings: number;
  completionRate: number | null;
  // comparison with previous period (when comparePrevious=true)
  previousTotalCompanies?: number;
  previousMrr?: number;
  previousActiveSubscriptions?: number;
}

// ---------------------------
// Company Trend
// ---------------------------

/** com.sme.platform.analytics.company.trend */
export interface PlatformCompanyTrendRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
  comparePrevious?: boolean;
  status?: string;
}

export interface PlatformCompanyTrendResponse {
  data: TrendPoint[];
}

// ---------------------------
// Revenue Trend
// ---------------------------

/** com.sme.platform.analytics.revenue.trend */
export interface PlatformRevenueTrendRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
  comparePrevious?: boolean;
}

export interface PlatformRevenueTrendResponse {
  data: TrendPoint[];
}

// ---------------------------
// Plan Trend
// ---------------------------

/** com.sme.platform.analytics.plan.trend */
export interface PlatformPlanTrendRequest {
  startDate: string;
  endDate: string;
  groupBy?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
  comparePrevious?: boolean;
}

export interface PlatformPlanTrendPoint {
  period: string;
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
  comparePrevious?: boolean;
}

export interface PlatformEmployeeTrendResponse {
  data: TrendPoint[];
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
  comparePrevious?: boolean;
}

export interface PlatformOnboardingTrendResponse {
  data: TrendPoint[];
}

// ---------------------------
// Risk Dashboard
// ---------------------------

/** com.sme.platform.dashboard.risk */
export interface PlatformRiskDashboardRequest {
  startDate: string;
  endDate: string;
}

export interface RiskItem {
  companyId: string;
  companyName: string;
  riskType: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  detectedAt: string;
}

export interface PlatformRiskDashboardResponse {
  items: RiskItem[];
  total: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}
