import { gatewayRequest } from "../core/gateway";
import type {
  CompanyOnboardingSummaryRequest,
  CompanyOnboardingSummaryResponse,
  CompanyOnboardingFunnelRequest,
  CompanyOnboardingFunnelResponse,
  CompanyOnboardingByDepartmentRequest,
  CompanyOnboardingByDepartmentResponse,
  CompanyTaskCompletionRequest,
  CompanyTaskCompletionResponse,
} from "@/interface/admin";

// ── Company Analytics ────────────────────────────────────────

/** com.sme.analytics.company.onboarding.summary */
export const apiGetCompanyOnboardingSummary = (
  payload: CompanyOnboardingSummaryRequest,
) =>
  gatewayRequest<
    CompanyOnboardingSummaryRequest,
    CompanyOnboardingSummaryResponse
  >("com.sme.analytics.company.onboarding.summary", payload);

/** com.sme.analytics.company.onboarding.funnel */
export const apiGetCompanyOnboardingFunnel = (
  payload: CompanyOnboardingFunnelRequest,
) =>
  gatewayRequest<
    CompanyOnboardingFunnelRequest,
    CompanyOnboardingFunnelResponse
  >("com.sme.analytics.company.onboarding.funnel", payload);

/** com.sme.analytics.company.onboarding.byDepartment */
export const apiGetCompanyOnboardingByDepartment = (
  payload: CompanyOnboardingByDepartmentRequest,
) =>
  gatewayRequest<
    CompanyOnboardingByDepartmentRequest,
    CompanyOnboardingByDepartmentResponse
  >("com.sme.analytics.company.onboarding.byDepartment", payload);

/** com.sme.analytics.company.task.completion */
export const apiGetCompanyTaskCompletion = (
  payload: CompanyTaskCompletionRequest,
) =>
  gatewayRequest<CompanyTaskCompletionRequest, CompanyTaskCompletionResponse>(
    "com.sme.analytics.company.task.completion",
    payload,
  );
