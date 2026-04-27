import { gatewayRequest } from "../core/gateway";
import type {
  PlatformCompanyAnalyticsRequest,
  PlatformCompanyListRequest,
  PlatformCompanyDetailRequest,
  PlatformCompanyActivateRequest,
  PlatformCompanyDeactivateRequest,
  PlatformCompanyDeleteRequest,
  PlatformCompanySuspendRequest,
  PlatformCompanyChangePlanRequest,
  PlatformSubscriptionHistoryRequest,
  PlatformOnboardingAnalyticsRequest,
  PlatformTemplateListRequest,
  PlatformTemplateCreateRequest,
  PlatformTemplateUpdateRequest,
  PlatformTemplatePublishRequest,
  PlatformTemplateArchiveRequest,
  ActivatePlatformTemplateRequest,
  PlatformSubscriptionListRequest,
  PlatformSubscriptionDetailRequest,
  PlatformPlanListRequest,
  PlatformPlanCreateRequest,
  PlatformPlanUpdateRequest,
  PlatformPlanDeleteRequest,
  PlatformFeedbackListRequest,
  PlatformFeedbackDetailRequest,
  PlatformFeedbackResolveRequest,
  PlatformSystemErrorLogRequest,
  PlatformSystemActivityLogRequest,
  PlatformDunningRetryRequest,
  PlatformFinancialDashboardRequest,
  PlatformInvoiceListRequest,
  PlatformPaymentListRequest,
  PlatformRevenueAnalyticsRequest,
  PlatformSubscriptionAnalyticsRequest,
  PlatformUsageAnalyticsRequest,
  PlatformAdminAuditLogRequest,
  PlatformDashboardOverviewRequest,
  PlatformRiskDashboardRequest,
  PlatformRevenueTrendRequest,
  PlatformCompanyTrendRequest,
  PlatformOnboardingTrendRequest,
} from "@/interface/platform";

// ── Platform Analytics ─────────────────────────────────────────

/** com.sme.platform.analytics.company – company KPI overview */
export const apiGetPlatformCompanyAnalytics = (
  payload: PlatformCompanyAnalyticsRequest,
) =>
  gatewayRequest<PlatformCompanyAnalyticsRequest, unknown>(
    "com.sme.platform.analytics.company",
    payload,
  );

/** com.sme.platform.analytics.onboarding – platform-wide onboarding stats */
export const apiGetPlatformOnboardingAnalytics = (
  payload: PlatformOnboardingAnalyticsRequest,
) =>
  gatewayRequest<PlatformOnboardingAnalyticsRequest, unknown>(
    "com.sme.platform.analytics.onboarding",
    payload,
  );

// ── Company Management ─────────────────────────────────────────

/** com.sme.platform.company.list */
export const apiGetPlatformCompanyList = (
  payload: PlatformCompanyListRequest,
) =>
  gatewayRequest<PlatformCompanyListRequest, unknown>(
    "com.sme.platform.company.list",
    payload,
  );

/** com.sme.platform.company.detail */
export const apiGetPlatformCompanyDetail = (
  payload: PlatformCompanyDetailRequest,
) =>
  gatewayRequest<PlatformCompanyDetailRequest, unknown>(
    "com.sme.platform.company.detail",
    payload,
  );

// ── Platform Template Library ──────────────────────────────────

/** com.sme.onboarding.template.list */
export const apiGetPlatformTemplateList = (
  payload: PlatformTemplateListRequest,
) =>
  gatewayRequest<PlatformTemplateListRequest, unknown>(
    "com.sme.onboarding.template.list",
    payload,
  );

/** com.sme.platform.template.create — creates a PLATFORM-level template (admin only) */
export const apiCreatePlatformTemplate = (
  payload: PlatformTemplateCreateRequest,
) =>
  gatewayRequest<PlatformTemplateCreateRequest, unknown>(
    "com.sme.platform.template.create",
    payload,
  );

/** com.sme.platform.template.activate — activates a PLATFORM template so tenants can clone it */
export const apiActivatePlatformTemplate = (
  payload: ActivatePlatformTemplateRequest,
) =>
  gatewayRequest<ActivatePlatformTemplateRequest, unknown>(
    "com.sme.platform.template.activate",
    payload,
  );

/** com.sme.onboarding.template.update */
export const apiUpdatePlatformTemplate = (
  payload: PlatformTemplateUpdateRequest,
) =>
  gatewayRequest<PlatformTemplateUpdateRequest, unknown>(
    "com.sme.onboarding.template.update",
    payload,
  );

/** com.sme.onboarding.template.update – status: "PUBLISHED" */
export const apiPublishPlatformTemplate = (
  payload: PlatformTemplatePublishRequest,
) =>
  gatewayRequest<Record<string, unknown>, unknown>(
    "com.sme.onboarding.template.update",
    { templateId: payload.templateId, status: "PUBLISHED" },
  );

/** com.sme.onboarding.template.update – status: "ARCHIVED" */
export const apiArchivePlatformTemplate = (
  payload: PlatformTemplateArchiveRequest,
) =>
  gatewayRequest<Record<string, unknown>, unknown>(
    "com.sme.onboarding.template.update",
    { templateId: payload.templateId, status: "ARCHIVED" },
  );

// ── Company Actions ────────────────────────────────────────────

/** com.sme.platform.company.activate */
export const apiActivateCompany = (payload: PlatformCompanyActivateRequest) =>
  gatewayRequest<PlatformCompanyActivateRequest, unknown>(
    "com.sme.platform.company.activate",
    payload,
  );

/** com.sme.platform.company.deactivate */
export const apiDeactivateCompany = (
  payload: PlatformCompanyDeactivateRequest,
) =>
  gatewayRequest<PlatformCompanyDeactivateRequest, unknown>(
    "com.sme.platform.company.deactivate",
    payload,
  );

/** com.sme.platform.company.delete */
export const apiDeleteCompany = (payload: PlatformCompanyDeleteRequest) =>
  gatewayRequest<PlatformCompanyDeleteRequest, unknown>(
    "com.sme.platform.company.delete",
    payload,
  );

/** com.sme.platform.company.suspend */
export const apiSuspendCompany = (payload: PlatformCompanySuspendRequest) =>
  gatewayRequest<PlatformCompanySuspendRequest, unknown>(
    "com.sme.platform.company.suspend",
    payload,
  );

/** com.sme.platform.company.changePlan */
export const apiChangePlanCompany = (
  payload: PlatformCompanyChangePlanRequest,
) =>
  gatewayRequest<PlatformCompanyChangePlanRequest, unknown>(
    "com.sme.platform.company.changePlan",
    payload,
  );

/** com.sme.billing.subscription.history */
export const apiGetSubscriptionHistory = (
  payload: PlatformSubscriptionHistoryRequest,
) =>
  gatewayRequest<PlatformSubscriptionHistoryRequest, unknown>(
    "com.sme.billing.subscription.history",
    payload,
  );

// ── Subscription Management ────────────────────────────────────

/** com.sme.platform.subscription.list */
export const apiGetPlatformSubscriptionList = (
  payload: PlatformSubscriptionListRequest,
) =>
  gatewayRequest<PlatformSubscriptionListRequest, unknown>(
    "com.sme.platform.subscription.list",
    payload,
  );

/** com.sme.platform.subscription.detail */
export const apiGetPlatformSubscriptionDetail = (
  payload: PlatformSubscriptionDetailRequest,
) =>
  gatewayRequest<PlatformSubscriptionDetailRequest, unknown>(
    "com.sme.platform.subscription.detail",
    payload,
  );

// ── Billing Plan Management ────────────────────────────────────

/** com.sme.platform.plan.list */
export const apiGetPlatformPlanList = (payload: PlatformPlanListRequest = {}) =>
  gatewayRequest<PlatformPlanListRequest, unknown>(
    "com.sme.platform.plan.list",
    payload,
  );

/** com.sme.platform.plan.create */
export const apiCreatePlatformPlan = (payload: PlatformPlanCreateRequest) =>
  gatewayRequest<PlatformPlanCreateRequest, unknown>(
    "com.sme.platform.plan.create",
    payload,
  );

/** com.sme.platform.plan.update */
export const apiUpdatePlatformPlan = (payload: PlatformPlanUpdateRequest) =>
  gatewayRequest<PlatformPlanUpdateRequest, unknown>(
    "com.sme.platform.plan.update",
    payload,
  );

/** com.sme.platform.plan.delete */
export const apiDeletePlatformPlan = (payload: PlatformPlanDeleteRequest) =>
  gatewayRequest<PlatformPlanDeleteRequest, unknown>(
    "com.sme.platform.plan.delete",
    payload,
  );

// ── Feedback Management ────────────────────────────────────────

/** com.sme.platform.feedback.list */
export const apiGetPlatformFeedbackList = (
  payload: PlatformFeedbackListRequest,
) =>
  gatewayRequest<PlatformFeedbackListRequest, unknown>(
    "com.sme.platform.feedback.list",
    payload,
  );

/** com.sme.platform.feedback.detail */
export const apiGetPlatformFeedbackDetail = (
  payload: PlatformFeedbackDetailRequest,
) =>
  gatewayRequest<PlatformFeedbackDetailRequest, unknown>(
    "com.sme.platform.feedback.detail",
    payload,
  );

/** com.sme.platform.feedback.resolve */
export const apiResolvePlatformFeedback = (
  payload: PlatformFeedbackResolveRequest,
) =>
  gatewayRequest<PlatformFeedbackResolveRequest, unknown>(
    "com.sme.platform.feedback.resolve",
    payload,
  );

// ── System Health & Logs ───────────────────────────────────────

/** com.sme.platform.system.health */
export const apiGetSystemHealth = () =>
  gatewayRequest<Record<string, never>, unknown>(
    "com.sme.platform.system.health",
    {},
  );

/** com.sme.platform.system.errorLog */
export const apiGetSystemErrorLog = (payload: PlatformSystemErrorLogRequest) =>
  gatewayRequest<PlatformSystemErrorLogRequest, unknown>(
    "com.sme.platform.errorLog.list",
    payload,
  );

/** com.sme.platform.system.activityLog */
export const apiGetSystemActivityLog = (
  payload: PlatformSystemActivityLogRequest,
) =>
  gatewayRequest<PlatformSystemActivityLogRequest, unknown>(
    "com.sme.platform.system.activityLog",
    payload,
  );

// ── Dunning ────────────────────────────────────────────────────

/** com.sme.billing.dunning.retry */
export const apiRetryDunning = (payload: PlatformDunningRetryRequest) =>
  gatewayRequest<PlatformDunningRetryRequest, unknown>(
    "com.sme.billing.dunning.retry",
    payload,
  );

// ── Financial Dashboard ─────────────────────────────────────────

/** com.sme.platform.dashboard.financial */
export const apiGetPlatformFinancialDashboard = (
  payload: PlatformFinancialDashboardRequest,
) =>
  gatewayRequest<PlatformFinancialDashboardRequest, unknown>(
    "com.sme.platform.dashboard.financial",
    payload,
  );

// ── Invoice Management ──────────────────────────────────────────

/** com.sme.platform.invoice.list */
export const apiGetPlatformInvoiceList = (
  payload: PlatformInvoiceListRequest,
) =>
  gatewayRequest<PlatformInvoiceListRequest, unknown>(
    "com.sme.platform.invoice.list",
    payload,
  );

// ── Platform Payment Management ────────────────────────────────

/** com.sme.platform.payment.list */
export const apiGetPlatformPaymentList = (
  payload: PlatformPaymentListRequest,
) =>
  gatewayRequest<PlatformPaymentListRequest, unknown>(
    "com.sme.platform.payment.list",
    payload,
  );

// ── Additional Platform Analytics ──────────────────────────────

/** com.sme.platform.analytics.revenue */
export const apiGetPlatformRevenueAnalytics = (
  payload: PlatformRevenueAnalyticsRequest,
) =>
  gatewayRequest<PlatformRevenueAnalyticsRequest, unknown>(
    "com.sme.platform.analytics.revenue",
    payload,
  );

/** com.sme.platform.analytics.subscription */
export const apiGetPlatformSubscriptionAnalytics = (
  payload: PlatformSubscriptionAnalyticsRequest,
) =>
  gatewayRequest<PlatformSubscriptionAnalyticsRequest, unknown>(
    "com.sme.platform.analytics.subscription",
    payload,
  );

/** com.sme.platform.analytics.usage */
export const apiGetPlatformUsageAnalytics = (
  payload: PlatformUsageAnalyticsRequest,
) =>
  gatewayRequest<PlatformUsageAnalyticsRequest, unknown>(
    "com.sme.platform.analytics.usage",
    payload,
  );

// ── Admin Audit Log ─────────────────────────────────────────────

/** com.sme.platform.audit.adminLog */
export const apiGetPlatformAdminAuditLog = (
  payload: PlatformAdminAuditLogRequest,
) =>
  gatewayRequest<PlatformAdminAuditLogRequest, unknown>(
    "com.sme.platform.audit.adminLog",
    payload,
  );

// ── Monitoring ──────────────────────────────────────────────────

/** com.sme.platform.monitoring.metrics */
export const apiGetPlatformMonitoringMetrics = () =>
  gatewayRequest<Record<string, never>, unknown>(
    "com.sme.platform.monitoring.metrics",
    {},
  );

// ── Dashboard (Overview + Risk) ─────────────────────────────────

/** com.sme.platform.dashboard.overview */
export const apiGetPlatformDashboardOverview = (
  payload: PlatformDashboardOverviewRequest,
) =>
  gatewayRequest<PlatformDashboardOverviewRequest, unknown>(
    "com.sme.platform.dashboard.overview",
    payload,
  );

/** com.sme.platform.dashboard.risk */
export const apiGetPlatformRiskDashboard = (
  payload: PlatformRiskDashboardRequest,
) =>
  gatewayRequest<PlatformRiskDashboardRequest, unknown>(
    "com.sme.platform.dashboard.risk",
    payload,
  );

// ── Trend Analytics ─────────────────────────────────────────────

/** com.sme.platform.analytics.revenue.trend */
export const apiGetPlatformRevenueTrend = (
  payload: PlatformRevenueTrendRequest,
) =>
  gatewayRequest<PlatformRevenueTrendRequest, unknown>(
    "com.sme.platform.analytics.revenue.trend",
    payload,
  );

/** com.sme.platform.analytics.company.trend */
export const apiGetPlatformCompanyTrend = (
  payload: PlatformCompanyTrendRequest,
) =>
  gatewayRequest<PlatformCompanyTrendRequest, unknown>(
    "com.sme.platform.analytics.company.trend",
    payload,
  );

/** com.sme.platform.analytics.onboarding.trend */
export const apiGetPlatformOnboardingTrend = (
  payload: PlatformOnboardingTrendRequest,
) =>
  gatewayRequest<PlatformOnboardingTrendRequest, unknown>(
    "com.sme.platform.analytics.onboarding.trend",
    payload,
  );
