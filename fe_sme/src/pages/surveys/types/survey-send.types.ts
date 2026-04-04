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
  targetRole?: "EMPLOYEE" | "MANAGER" | "BOTH";
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

export type SurveyInstanceSummary = {
  id?: string;
  surveyInstanceId?: string;
  instanceId?: string;

  templateId?: string;
  surveyTemplateId?: string;

  templateName?: string;
  surveyTemplateName?: string;

  onboardingId?: string;
  employeeId?: string;
  employeeName?: string;
  email?: string;

  responderUserId?: string;
  userId?: string;
  targetRole?: "EMPLOYEE" | "MANAGER" | "BOTH";
  receiverRole?: "EMPLOYEE" | "MANAGER";
  scheduledAt?: string | null;
  closedAt?: string | null;
  createdAt?: string | null;
  status: string;
};