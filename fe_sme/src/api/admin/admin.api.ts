import type { PlatformTemplateListRequest } from "@/interface/platform";
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
  CreatePlatformTemplateRequest,
  CreatePlatformTemplateResponse,
  PlatformTemplateDetailRequest,
  PlatformTemplateDetailResponse,
  UpdatePlatformTemplateRequest,
  DeactivatePlatformTemplateRequest,
  DeletePlatformTemplateRequest,
  ActivatePlatformTemplateRequest,
  DeletePlatformTemplateResponse,
  ListPlatformTemplateResponse,
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

// ============================================================
// Platform Global Onboarding Template
// ============================================================

export const apiCreatePlatformTemplate = (
  payload: CreatePlatformTemplateRequest,
) =>
  gatewayRequest<CreatePlatformTemplateRequest, CreatePlatformTemplateResponse>(
    "com.sme.platform.template.create",
    payload,
  );

export const apiListPlatformTemplates = (
  payload: PlatformTemplateListRequest,
) =>
  gatewayRequest<PlatformTemplateListRequest, ListPlatformTemplateResponse>(
    "com.sme.platform.template.list",
    payload,
  );

export const apiGetPlatformTemplateDetail = (
  payload: PlatformTemplateDetailRequest,
) =>
  gatewayRequest<PlatformTemplateDetailRequest, PlatformTemplateDetailResponse>(
    "com.sme.platform.template.detail",
    payload,
  );

export const apiUpdatePlatformTemplate = (
  payload: UpdatePlatformTemplateRequest,
) =>
  gatewayRequest<UpdatePlatformTemplateRequest, CreatePlatformTemplateResponse>(
    "com.sme.platform.template.update",
    payload,
  );

export const apiActivatePlatformTemplate = (
  payload: ActivatePlatformTemplateRequest,
) =>
  gatewayRequest<ActivatePlatformTemplateRequest, CreatePlatformTemplateResponse>(
    "com.sme.platform.template.activate",
    payload,
  );

export const apiDeactivatePlatformTemplate = (
  payload: DeactivatePlatformTemplateRequest,
) =>
  gatewayRequest<DeactivatePlatformTemplateRequest, CreatePlatformTemplateResponse>(
    "com.sme.platform.template.deactivate",
    payload,
  );

export const apiDeletePlatformTemplate = (
  payload: DeletePlatformTemplateRequest,
) =>
  gatewayRequest<DeletePlatformTemplateRequest, DeletePlatformTemplateResponse>(
    "com.sme.platform.template.delete",
    payload,
  );