import { extractList } from "@/api/core/types";
import type { SurveyTemplateSummary } from "@/interface/survey";
import type {
  SurveyInstanceItem,
  SurveyInstanceListResult,
  SurveyTemplateOption,
} from "../types/survey-send.types";

type RawSurveyInstanceListResponse = {
  items?: SurveyInstanceItem[];
  totalCount?: number;
};

export const mapSurveyInstanceListResponse = (
  res: unknown,
): SurveyInstanceListResult => {
  const response = res as RawSurveyInstanceListResponse;

  return {
    items: extractList<SurveyInstanceItem>(response, "items") ?? [],
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
  { value: "PENDING", label: "Pending" },
  { value: "SENT", label: "Sent" },
  { value: "COMPLETED", label: "Completed" },
  { value: "EXPIRED", label: "Expired" },
];