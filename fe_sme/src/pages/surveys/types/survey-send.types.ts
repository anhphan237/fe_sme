export type SurveySendFilter = {
  templateId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
};

export type SurveyInstanceItem = {
  id: string;
  templateId: string;
  templateName: string;
  scheduledAt?: string | null;
  status: string;
  createdAt?: string | null;
};

export type SurveyInstanceListResult = {
  items: SurveyInstanceItem[];
  totalCount: number;
};

export type SurveyTemplateOption = {
  value: string;
  label: string;
};