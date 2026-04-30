import { gatewayRequest } from "@/api/core/gateway";
import type {
  CompanyEventTemplateCreateRequest,
  CompanyEventTemplateCreateResponse,
  CompanyEventTemplateDetailRequest,
  CompanyEventTemplateDetailResponse,
  CompanyEventTemplateListRequest,
  CompanyEventTemplateListResponse,
} from "@/pages/onboarding/events/company-event-template.types";

export const apiCompanyEventTemplateCreate = (
  payload: CompanyEventTemplateCreateRequest,
) =>
  gatewayRequest<
    CompanyEventTemplateCreateRequest,
    CompanyEventTemplateCreateResponse
  >("com.sme.onboarding.eventTemplate.create", payload);

export const apiCompanyEventTemplateList = (
  payload: CompanyEventTemplateListRequest = {},
) =>
  gatewayRequest<
    CompanyEventTemplateListRequest,
    CompanyEventTemplateListResponse
  >("com.sme.onboarding.eventTemplate.list", payload);

export const apiCompanyEventTemplateDetail = (
  payload: CompanyEventTemplateDetailRequest,
) =>
  gatewayRequest<
    CompanyEventTemplateDetailRequest,
    CompanyEventTemplateDetailResponse
  >("com.sme.onboarding.eventTemplate.detail", payload);
