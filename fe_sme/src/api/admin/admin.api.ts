import { gatewayRequest } from "../core/gateway";
import { PLATFORM_COMPANY_ID } from "@/constants/admin-platform";
import {
  mapPlatformTemplateDetailResponse,
  mapPlatformTemplateListResponse,
} from "@/utils/mappers/admin-template";
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
  PlatformTemplateListRequest,
  PlatformTemplateDetailRequest,
  UpdatePlatformTemplateRequest,
  DeactivatePlatformTemplateRequest,
  DeletePlatformTemplateRequest,
  ActivatePlatformTemplateRequest,
  DeletePlatformTemplateResponse,
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

const platformTemplateRequest = <TReq, TRes>(
  operationType: string,
  payload: TReq,
) =>
  gatewayRequest<TReq, TRes>(operationType, payload, {
    tenantId: PLATFORM_COMPANY_ID,
  });

export const apiCreatePlatformTemplate = (
  payload: CreatePlatformTemplateRequest,
) =>
  platformTemplateRequest<CreatePlatformTemplateRequest, CreatePlatformTemplateResponse>(
    "com.sme.platform.template.create",
    payload,
  );

export const apiListPlatformTemplates = (
  payload: PlatformTemplateListRequest,
) =>
  platformTemplateRequest<PlatformTemplateListRequest, unknown>(
    "com.sme.platform.template.list",
    payload,
  ).then(mapPlatformTemplateListResponse);

export const apiGetPlatformTemplateDetail = (
  payload: PlatformTemplateDetailRequest,
) =>
  platformTemplateRequest<PlatformTemplateDetailRequest, unknown>(
    "com.sme.platform.template.detail",
    payload,
  ).then(mapPlatformTemplateDetailResponse);

export const apiUpdatePlatformTemplate = (
  payload: UpdatePlatformTemplateRequest,
) =>
  platformTemplateRequest<UpdatePlatformTemplateRequest, CreatePlatformTemplateResponse>(
    "com.sme.platform.template.update",
    payload,
  );

export const apiActivatePlatformTemplate = (
  payload: ActivatePlatformTemplateRequest,
) =>
  platformTemplateRequest<ActivatePlatformTemplateRequest, CreatePlatformTemplateResponse>(
    "com.sme.platform.template.activate",
    payload,
  );

export const apiDeactivatePlatformTemplate = (
  payload: DeactivatePlatformTemplateRequest,
) =>
  platformTemplateRequest<DeactivatePlatformTemplateRequest, CreatePlatformTemplateResponse>(
    "com.sme.platform.template.deactivate",
    payload,
  );

export const apiDeletePlatformTemplate = (
  payload: DeletePlatformTemplateRequest,
) =>
  platformTemplateRequest<DeletePlatformTemplateRequest, DeletePlatformTemplateResponse>(
    "com.sme.platform.template.delete",
    payload,
  );
