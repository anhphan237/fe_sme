import { extractList } from "@/api/core/types";
import type { SurveyTemplateSummary } from "@/interface/survey";
import type {
  SurveyInstanceListResult,
  SurveyTemplateOption,
} from "../types/survey-send.types";

type RawSurveyInstance = {
  id?: string;
  surveyInstanceId?: string;

  templateId?: string;
  surveyTemplateId?: string;

  templateName?: string;
  surveyTemplateName?: string;

  onboardingId?: string;
  instanceId?: string;

  employeeId?: string;
  employeeName?: string;
  email?: string;
  managerName?: string;

  responderUserId?: string;
  userId?: string;
  employeeUserId?: string;

  startDate?: string | null;
  scheduledAt?: string | null;
  closedAt?: string | null;
  status?: string;
  createdAt?: string | null;
};

export const mapSurveyInstanceListResponse = (
  res: unknown,
): SurveyInstanceListResult => {
  const response = res as { items?: RawSurveyInstance[]; totalCount?: number };
  const rawItems = extractList<RawSurveyInstance>(response, "items") ?? [];

  return {
    items: rawItems.map((item) => ({
      id: item.id || item.surveyInstanceId || "",
      templateId: item.templateId || item.surveyTemplateId || "",
      templateName: item.templateName || item.surveyTemplateName || "",

      onboardingId: item.onboardingId || item.instanceId,
      instanceId: item.instanceId || item.onboardingId,

      employeeId: item.employeeId,
      employeeName: item.employeeName,
      email: item.email,
      managerName: item.managerName,

      responderUserId:
        item.responderUserId || item.userId || item.employeeUserId,
      userId: item.userId || item.responderUserId || item.employeeUserId,

      startDate: item.startDate,
      scheduledAt: item.scheduledAt,
      closedAt: item.closedAt,

      status: item.status || "",
      createdAt: item.createdAt,
    })),
    totalCount: response?.totalCount ?? 0,
  };
};

export const mapTemplateOptions = (
  templates: SurveyTemplateSummary[],
): SurveyTemplateOption[] =>
  templates.map((item) => ({
    value: item.templateId,
    label: item.name,
  }));

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
};

export const getSurveySendStatusOptions = () => [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PENDING", label: "Pending" },
  { value: "SENT", label: "Sent" },
  { value: "COMPLETED", label: "Completed" },
  { value: "EXPIRED", label: "Expired" },
];