import { gatewayRequest } from "../core/gateway";
import type {
  PlatformDashboardOverviewRequest,
  PlatformCompanyListRequest,
  PlatformCompanyGetRequest,
  PlatformCompanyActivateRequest,
  PlatformCompanyDeactivateRequest,
  PlatformCompanyDeleteRequest,
  PlatformOnboardingOverviewRequest,
  PlatformTemplateListRequest,
  PlatformTemplateCreateRequest,
  PlatformTemplateUpdateRequest,
  PlatformTemplatePublishRequest,
  PlatformTemplateArchiveRequest,
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
} from "@/interface/platform";

// ── Platform Dashboard ─────────────────────────────────────────

/** com.sme.platform.dashboard.overview */
export const apiGetPlatformDashboardOverview = (
  payload: PlatformDashboardOverviewRequest,
) =>
  gatewayRequest<PlatformDashboardOverviewRequest, unknown>(
    "com.sme.platform.dashboard.overview",
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

/** com.sme.platform.company.get */
export const apiGetPlatformCompanyDetail = (
  payload: PlatformCompanyGetRequest,
) =>
  gatewayRequest<PlatformCompanyGetRequest, unknown>(
    "com.sme.platform.company.get",
    payload,
  );

// ── Onboarding Monitor ─────────────────────────────────────────

/** com.sme.platform.onboarding.overview */
export const apiGetPlatformOnboardingOverview = (
  payload: PlatformOnboardingOverviewRequest,
) =>
  gatewayRequest<PlatformOnboardingOverviewRequest, unknown>(
    "com.sme.platform.onboarding.overview",
    payload,
  );

// ── Platform Template Library ──────────────────────────────────

/** com.sme.platform.template.list */
export const apiGetPlatformTemplateList = (
  payload: PlatformTemplateListRequest,
) =>
  gatewayRequest<PlatformTemplateListRequest, unknown>(
    "com.sme.platform.template.list",
    payload,
  );

/** com.sme.platform.template.create */
export const apiCreatePlatformTemplate = (
  payload: PlatformTemplateCreateRequest,
) =>
  gatewayRequest<PlatformTemplateCreateRequest, unknown>(
    "com.sme.platform.template.create",
    payload,
  );

/** com.sme.platform.template.update */
export const apiUpdatePlatformTemplate = (
  payload: PlatformTemplateUpdateRequest,
) =>
  gatewayRequest<PlatformTemplateUpdateRequest, unknown>(
    "com.sme.platform.template.update",
    payload,
  );

/** com.sme.platform.template.publish */
export const apiPublishPlatformTemplate = (
  payload: PlatformTemplatePublishRequest,
) =>
  gatewayRequest<PlatformTemplatePublishRequest, unknown>(
    "com.sme.platform.template.publish",
    payload,
  );

/** com.sme.platform.template.archive */
export const apiArchivePlatformTemplate = (
  payload: PlatformTemplateArchiveRequest,
) =>
  gatewayRequest<PlatformTemplateArchiveRequest, unknown>(
    "com.sme.platform.template.archive",
    payload,
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
    "com.sme.platform.system.errorLog",
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
