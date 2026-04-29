import { gatewayRequest } from "@/api/core/gateway";
import type {
  CompanyEventAttendanceConfirmRequest,
  CompanyEventAttendanceConfirmResponse,
  CompanyEventAttendanceSummaryRequest,
  CompanyEventAttendanceSummaryResponse,
  CompanyEventDetailRequest,
  CompanyEventDetailResponse,
  CompanyEventListRequest,
  CompanyEventListResponse,
  CompanyEventPublishRequest,
  CompanyEventPublishResponse,
} from "@/pages/onboarding/events/event.types";

export const apiCompanyEventPublish = (payload: CompanyEventPublishRequest) =>
  gatewayRequest<CompanyEventPublishRequest, CompanyEventPublishResponse>(
    "com.sme.onboarding.event.publish",
    payload,
  );

export const apiCompanyEventDetail = (payload: CompanyEventDetailRequest) =>
  gatewayRequest<CompanyEventDetailRequest, CompanyEventDetailResponse>(
    "com.sme.onboarding.event.detail",
    payload,
  );

export const apiCompanyEventList = (payload: CompanyEventListRequest = {}) =>
  gatewayRequest<CompanyEventListRequest, CompanyEventListResponse>(
    "com.sme.onboarding.event.list",
    payload,
  );

export const apiCompanyEventAttendanceSummary = (
  payload: CompanyEventAttendanceSummaryRequest,
) =>
  gatewayRequest<
    CompanyEventAttendanceSummaryRequest,
    CompanyEventAttendanceSummaryResponse
  >("com.sme.onboarding.event.attendance.summary", payload);
export const apiCompanyEventAttendanceConfirm = (
  payload: CompanyEventAttendanceConfirmRequest,
) =>
  gatewayRequest<
    CompanyEventAttendanceConfirmRequest,
    CompanyEventAttendanceConfirmResponse
  >("com.sme.onboarding.event.attendance.confirm", payload);