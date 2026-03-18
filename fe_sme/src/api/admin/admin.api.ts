import { gatewayRequest } from "../core/gateway";
import type {
  PlatformSubscriptionMetricsRequest,
  CompanyOnboardingSummaryRequest,
  CompanyOnboardingFunnelRequest,
  CompanyOnboardingByDepartmentRequest,
  CompanyTaskCompletionRequest,
} from "@/interface/admin";

// ── Platform Analytics ────────────────────────────────────────

/** com.sme.analytics.platform.subscription.metrics */
export const apiGetPlatformSubscriptionMetrics = (
  payload: PlatformSubscriptionMetricsRequest,
) =>
  gatewayRequest<PlatformSubscriptionMetricsRequest, unknown>(
    "com.sme.analytics.platform.subscription.metrics",
    payload,
  );

// ── Company Analytics ────────────────────────────────────────

/** com.sme.analytics.company.onboarding.summary */
export const apiGetCompanyOnboardingSummary = (
  payload: CompanyOnboardingSummaryRequest,
) =>
  gatewayRequest<CompanyOnboardingSummaryRequest, unknown>(
    "com.sme.analytics.company.onboarding.summary",
    payload,
  );

/** com.sme.analytics.company.onboarding.funnel */
export const apiGetCompanyOnboardingFunnel = (
  payload: CompanyOnboardingFunnelRequest,
) =>
  gatewayRequest<CompanyOnboardingFunnelRequest, unknown>(
    "com.sme.analytics.company.onboarding.funnel",
    payload,
  );

/** com.sme.analytics.company.onboarding.byDepartment */
export const apiGetCompanyOnboardingByDepartment = (
  payload: CompanyOnboardingByDepartmentRequest,
) =>
  gatewayRequest<CompanyOnboardingByDepartmentRequest, unknown>(
    "com.sme.analytics.company.onboarding.byDepartment",
    payload,
  );

/** com.sme.analytics.company.task.completion */
export const apiGetCompanyTaskCompletion = (
  payload: CompanyTaskCompletionRequest,
) =>
  gatewayRequest<CompanyTaskCompletionRequest, unknown>(
    "com.sme.analytics.company.task.completion",
    payload,
  );
