import { gatewayRequest } from "../core/gateway";
import type {
  SurveyInstanceListRequest,
  SurveySatisfactionReportRequest,
  SurveyTemplateCreateRequest,
  SurveyTemplateUpdateRequest,
  SurveyTemplateGetRequest,
  SurveyTemplateGetListRequest,
  SurveyTemplateArchiveRequest,
  SurveyQuestionCreateRequest,
  SurveyQuestionGetByTemplateRequest,
  SurveyScheduleRequest,
  SurveySendRequest,
  SurveySubmitRequest,
  SurveyResponseListRequest,
  SurveyAnalyticsReportRequest,
} from "@/interface/survey";

// ── Template ────────────────────────────────────────────────

/** com.sme.survey.template.create */
export const apiCreateSurveyTemplate = (payload: SurveyTemplateCreateRequest) =>
  gatewayRequest<SurveyTemplateCreateRequest, unknown>(
    "com.sme.survey.template.create",
    payload,
  );

/** com.sme.survey.template.update */
export const apiUpdateSurveyTemplate = (payload: SurveyTemplateUpdateRequest) =>
  gatewayRequest<SurveyTemplateUpdateRequest, unknown>(
    "com.sme.survey.template.update",
    payload,
  );

/** com.sme.survey.template.list */
export const apiListSurveyTemplates = (params?: SurveyTemplateGetListRequest) =>
  gatewayRequest<SurveyTemplateGetListRequest, unknown>(
    "com.sme.survey.template.list",
    params ?? {},
  );

/** com.sme.survey.template.get */
export const apiGetSurveyTemplate = (params: SurveyTemplateGetRequest) =>
  gatewayRequest<SurveyTemplateGetRequest, unknown>(
    "com.sme.survey.template.get",
    params,
  );

/** com.sme.survey.template.archive */
export const apiArchiveSurveyTemplate = (
  params: SurveyTemplateArchiveRequest,
) =>
  gatewayRequest<SurveyTemplateArchiveRequest, unknown>(
    "com.sme.survey.template.archive",
    params,
  );

// ── Question ────────────────────────────────────────────────

/** com.sme.survey.question.create */
export const apiCreateSurveyQuestion = (payload: SurveyQuestionCreateRequest) =>
  gatewayRequest<SurveyQuestionCreateRequest, unknown>(
    "com.sme.survey.question.create",
    payload,
  );

/** com.sme.survey.question.list.bytemplate */
export const apiListSurveyQuestions = (
  params: SurveyQuestionGetByTemplateRequest,
) =>
  gatewayRequest<SurveyQuestionGetByTemplateRequest, unknown>(
    "com.sme.survey.question.list.bytemplate",
    params,
  );

// ── Instance ────────────────────────────────────────────────

/** com.sme.survey.instance.list */
export const apiGetSurveyInstances = (filters?: SurveyInstanceListRequest) =>
  gatewayRequest<SurveyInstanceListRequest, unknown>(
    "com.sme.survey.instance.list",
    filters ?? {},
  );

/** com.sme.survey.instance.schedule */
export const apiScheduleSurvey = (payload: SurveyScheduleRequest) =>
  gatewayRequest<SurveyScheduleRequest, unknown>(
    "com.sme.survey.instance.schedule",
    payload,
  );

/** com.sme.survey.instance.send */
export const apiSendSurvey = (payload: SurveySendRequest) =>
  gatewayRequest<SurveySendRequest, unknown>(
    "com.sme.survey.instance.send",
    payload,
  );

// ── Response ────────────────────────────────────────────────

/** com.sme.survey.response.submit */
export const apiSubmitSurveyResponse = (payload: SurveySubmitRequest) =>
  gatewayRequest<SurveySubmitRequest, unknown>(
    "com.sme.survey.response.submit",
    payload,
  );

/** com.sme.survey.response.list */
export const apiListSurveyResponses = (params?: SurveyResponseListRequest) =>
  gatewayRequest<SurveyResponseListRequest, unknown>(
    "com.sme.survey.response.list",
    params ?? {},
  );

// ── Reports ────────────────────────────────────────────────

/** com.sme.survey.report.satisfaction */
export const apiGetSatisfactionReport = (
  payload: SurveySatisfactionReportRequest,
) =>
  gatewayRequest<SurveySatisfactionReportRequest, unknown>(
    "com.sme.survey.report.satisfaction",
    payload,
  );

/** com.sme.survey.analytics.report */
export const apiGetSurveyAnalyticsReport = (
  params?: SurveyAnalyticsReportRequest,
) =>
  gatewayRequest<SurveyAnalyticsReportRequest, unknown>(
    "com.sme.survey.analytics.report",
    params ?? {},
  );
