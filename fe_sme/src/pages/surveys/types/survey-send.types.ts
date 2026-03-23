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

  onboardingId?: string;
  employeeId?: string;
  employeeName?: string;
  email?: string;
  managerName?: string;
  startDate?: string | null;

  scheduledAt?: string | null;
  closedAt?: string | null;
  status: string;
  createdAt?: string | null;
  employeeUserId?: string;
  responderUserId?: string;
  userId?: string;

  instanceId?: string;

};

export type SurveyInstanceListResult = {
  items: SurveyInstanceItem[];
  totalCount: number;
};

export type SurveyTemplateOption = {
  value: string;
  label: string;
};