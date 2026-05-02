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
  SurveyQuestionUpdateRequest,
  SurveyQuestionDeleteRequest,
  SurveyQuestionGetByTemplateRequest,
  SurveyScheduleRequest,
  SurveySendRequest,
  SurveySubmitRequest,
  SurveyResponseListRequest,
  SurveyAnalyticsReportRequest,
  SurveyAnalyticsReport,
  ImportSurveyQuestionsRequest,
  SurveyAiSummaryPayload,
  SurveyAiSummaryResponse,
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

/** com.sme.survey.template.delete */
export const apiDeleteSurveyTemplate = (payload: { templateId: string }) =>
  gatewayRequest<typeof payload, unknown>(
    "com.sme.survey.template.delete",
    payload,
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

/** com.sme.survey.question.update */
export const apiUpdateSurveyQuestion = (payload: SurveyQuestionUpdateRequest) =>
  gatewayRequest<SurveyQuestionUpdateRequest, unknown>(
    "com.sme.survey.question.update",
    payload,
  );

/** com.sme.survey.question.delete */
export const apiDeleteSurveyQuestion = (payload: SurveyQuestionDeleteRequest) =>
  gatewayRequest<SurveyQuestionDeleteRequest, unknown>(
    "com.sme.survey.question.delete",
    payload,
  );

/** helper: convert file -> base64 */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };

    reader.onerror = () => reject(new Error("Read file failed"));
    reader.readAsDataURL(file);
  });

/** com.sme.survey.question.import */
export const apiImportSurveyQuestions = async (params: {
  templateId: string;
  mode?: "APPEND" | "REPLACE_ALL";
  file: File;
}) => {
  const fileBase64 = await fileToBase64(params.file);

  const payload: ImportSurveyQuestionsRequest = {
    templateId: params.templateId,
    mode: params.mode ?? "APPEND",
    fileName: params.file.name,
    fileBase64,
  };

  return gatewayRequest<ImportSurveyQuestionsRequest, unknown>(
    "com.sme.survey.question.import",
    payload,
  );
};

// ── Instance ────────────────────────────────────────────────

/** com.sme.survey.instance.list */
export const apiGetSurveyInstances = (filters?: SurveyInstanceListRequest) =>
  gatewayRequest<SurveyInstanceListRequest, unknown>(
    "com.sme.survey.instance.list",
    filters ?? {},
  );

/** com.sme.survey.instance.get */
export const apiGetSurveyInstance = (payload: { instanceId: string }) =>
  gatewayRequest<typeof payload, unknown>(
    "com.sme.survey.instance.get",
    payload,
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

/** com.sme.survey.response.saveDraft */
export const apiSaveSurveyDraft = (payload: {
  instanceId: string;
  answers: Array<{
    questionId: string;
    value: string | number | string[] | null;
  }>;
}) =>
  gatewayRequest<typeof payload, unknown>(
    "com.sme.survey.response.saveDraft",
    payload,
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
  gatewayRequest<SurveyAnalyticsReportRequest, SurveyAnalyticsReport>(
    "com.sme.survey.analytics.report",
    params ?? {},
  );

/** com.sme.survey.analytics.aiSummary */
export const apiGetSurveyAiSummary = (payload: SurveyAiSummaryPayload) =>
  gatewayRequest<SurveyAiSummaryPayload, SurveyAiSummaryResponse>(
    "com.sme.survey.analytics.aiSummary",
    payload,
  );

export type ManagerEvaluationTemplatePayload = {
  templateId?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  forceReplaceDefault?: boolean;
};

export const apiCreateManagerEvaluationSurveyTemplate = (
  payload: ManagerEvaluationTemplatePayload,
) =>
  gatewayRequest(
    "com.sme.survey.template.managerEvaluation.create",
    payload,
  );

export const apiUpdateManagerEvaluationSurveyTemplate = (
  payload: ManagerEvaluationTemplatePayload & { templateId: string },
) =>
  gatewayRequest(
    "com.sme.survey.template.managerEvaluation.update",
    payload,
  );