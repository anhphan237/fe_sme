import { gatewayRequest } from "../core/gateway";
import type {
  PlatformDashboardOverviewRequest,
  PlatformCompanyListRequest,
  PlatformCompanyGetRequest,
  PlatformOnboardingOverviewRequest,
  PlatformTemplateListRequest,
  PlatformTemplateCreateRequest,
  PlatformTemplateUpdateRequest,
  PlatformTemplatePublishRequest,
  PlatformTemplateArchiveRequest,
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
