// ============================================================
// Survey Module Interfaces
// Maps to BE: modules/survey
// Operations: com.sme.survey.*
// ============================================================

// ---------------------------
// Template
// ---------------------------

/** com.sme.survey.template.create */
export interface SurveyTemplateCreateRequest {
  name: string;
  description?: string;
  stage?: string;
  targetRole: "EMPLOYEE" | "MANAGER" | "BOTH";
}

/** com.sme.survey.template.update */
export interface SurveyTemplateUpdateRequest {
  templateId: string;
  name?: string;
  description?: string;
  stage?: string;
  targetRole?: "EMPLOYEE" | "MANAGER" | "BOTH";
}

/** com.sme.survey.template.get */
export interface SurveyTemplateGetRequest {
  templateId: string;
}

/** com.sme.survey.template.list */
export interface SurveyTemplateGetListRequest {
  stage?: string;
  status?: string;
}

/** com.sme.survey.template.archive */
export interface SurveyTemplateArchiveRequest {
  templateId: string;
}

/** Survey template summary */
export interface SurveyTemplateSummary {
  templateId: string;
  name: string;
  description: string | null;
  stage: string | null;
  targetRole: "EMPLOYEE" | "MANAGER" | "BOTH";
  status: string;
  isDefault: boolean;
}

// ---------------------------
// Question
// ---------------------------

/** com.sme.survey.question.create */
export interface SurveyQuestionCreateRequest {
  templateId: string;
  content: string;
  type: "RATING" | "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  required: boolean;
  sortOrder?: number;
  dimensionCode?: string;
  measurable?: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
}

/** com.sme.survey.question.update */
export interface SurveyQuestionUpdateRequest {
  questionId: string;
  text?: string;
  type?: "RATING" | "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  options?: string[];
  required?: boolean;
  order?: number;
}

/** com.sme.survey.question.delete */
export interface SurveyQuestionDeleteRequest {
  questionId: string;
}

/** com.sme.survey.question.getByTemplate */
export interface SurveyQuestionGetByTemplateRequest {
  templateId: string;
}

/** Survey question */
export interface SurveyQuestion {
  questionId: string;
  templateId: string;
  text: string;
  type: string;
  options: string[] | null;
  required: boolean;
  order: number;
  scaleMin?: number | null;
  scaleMax?: number | null;
  content?: string;
}

// ---------------------------
// Instance
// ---------------------------

/** com.sme.survey.instance.list */
export interface SurveyInstanceListRequest {
  templateId?: string;
  status?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  offset?: number;
  limit?: number;

  responderUserId?: string;
  targetRole?: "EMPLOYEE" | "MANAGER" | "BOTH";
}

/** com.sme.survey.instance.schedule */
export interface SurveyScheduleRequest {
  templateId: string;
  onboardingId: string;
  scheduledAt?: string;
  responderUserId: string;
  targetRole?: "EMPLOYEE" | "MANAGER" | "BOTH";
}

/** com.sme.survey.instance.send */
export interface SurveySendRequest {
  surveyInstanceId?: string;
  templateId?: string;
  onboardingId?: string;

  responderUserId?: string;
  targetRole?: "EMPLOYEE" | "MANAGER" | "BOTH";
}

/** Survey instance summary */
export interface SurveyInstanceSummary {
  id: string;
  instanceId: string;
  templateId: string;
  templateName: string;
  employeeId: string;
  status: "PENDING" | "SENT" | "COMPLETED" | "EXPIRED";
  scheduledAt: string | null;
  completedAt: string | null;
  employeeName?: string;
  email?: string;
  managerName?: string;
  responderUserId?: string;
  userId?: string;
  targetRole?: "EMPLOYEE" | "MANAGER" | "BOTH";
  receiverRole?: "EMPLOYEE" | "MANAGER";
}

// ---------------------------
// Response (submission)
// ---------------------------

/** Single answer in a survey response */
export interface SurveyAnswer {
  questionId: string;
  value: string | number | string[];
}

/** com.sme.survey.response.submit */
export interface SurveySubmitRequest {
  surveyInstanceId: string;
  answers: SurveyAnswer[];
}

/** com.sme.survey.response.list */
export interface SurveyResponseListRequest {
  instanceId?: string;
  templateId?: string;
}

/** Single survey response record */
export interface SurveyResponseRecord {
  responseId: string;
  instanceId: string;
  employeeId: string;
  submittedAt: string;
  answers: SurveyAnswer[];
}

// ---------------------------
// Satisfaction Report
// ---------------------------

/** com.sme.survey.report.satisfaction */
export interface SurveySatisfactionReportRequest {
  templateId?: string;
  startDate?: string;
  endDate?: string;
}

// ---------------------------
// Analytics
// ---------------------------

/** com.sme.survey.analytics.report */
export interface SurveyAnalyticsReportRequest {
  templateId?: string;
  startDate?: string;
  endDate?: string;
}

/** com.sme.survey.analytics.report → response data */
export interface SurveyAnalyticsReport {
  totalSurveys: number;
  completionRate: number;
  averageScore: number;
  byQuestion: {
    questionId: string;
    text: string;
    averageRating: number;
    responseCount: number;
  }[];
  [key: string]: unknown;
}

export interface SurveySatisfactionReport {
  totalResponses: number;
  averageRating: number;
  distribution: Record<string, number>;
  byQuestion: {
    questionId: string;
    text: string;
    averageRating: number;
  }[];
}

// ============================================================

/** com.sme.survey.question.update (full payload) */
export interface SurveyQuestionFullUpdateRequest {
  content: string;
  type: "RATING" | "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  required: boolean;
  sortOrder: number;
  dimensionCode?: string;
  measurable?: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
}

export interface ImportSurveyQuestionsRequest {
  templateId: string;
  mode?: "APPEND" | "REPLACE_ALL";
  fileName: string;
  fileBase64: string;
}

export interface ImportSurveyQuestionError {
  row: number;
  field: string;
  message: string;
}

export interface ImportSurveyQuestionsResponse {
  success: boolean;
  message?: string;
  templateId?: string;
  mode?: string;
  totalRows?: number;
  successRows?: number;
  failedRows?: number;
  errors?: ImportSurveyQuestionError[];
}
export type SurveyAiSummaryPayload = {
  templateId?: string;
  startDate?: string;
  endDate?: string;
  language?: "vi" | "en";
  forceRefresh?: boolean;
  analyticsSnapshot: {
    sentCount?: number;
    submittedCount?: number;
    responseRate?: number;
    overallSatisfactionScore?: number;

    dimensionStats?: Array<{
      dimensionCode?: string;
      questionCount?: number;
      responseCount?: number;
      averageScore?: number;
    }>;

    lowScoreDimensions?: Array<{
      label?: string;
      value?: number;
      subtext?: string;
    }>;

    topPositiveDimensions?: Array<{
      label?: string;
      value?: number;
      subtext?: string;
    }>;

    stageTrends?: Array<{
      stage?: string;
      submittedCount?: number;
      averageOverall?: number;
    }>;

    timeTrends?: Array<{
      bucket?: string;
      submittedCount?: number;
      averageScore?: number;
    }>;

    questionStats?: Array<{
      questionId?: string;
      questionText?: string;
      questionType?: string;
      dimensionCode?: string;
      responseCount?: number;
      averageScore?: number;
      completionRate?: number;
      sampleTexts?: string[];
    }>;

    textFeedbacks?: string[];
  };
};

export type SurveyAiSummaryResponse = {
  healthLevel?: "GOOD" | "STABLE" | "WARNING" | string;
  summary?: string;
  keyFindings?: string[];
  recommendedActions?: string[];
  riskExplanation?: string;
  positiveSignal?: string;
  fromCache?: boolean;
  generatedAt?: string;
  source?: "AI" | "CACHE" | "FALLBACK" | string;
  aiAvailable?: boolean;
  errorMessage?: string;
};
export type ManagerEvaluationReportRequest = {
  startDate?: string;
  endDate?: string;
  templateId?: string;
  managerUserId?: string;
  keyword?: string;
  status?: string;
  fitLevel?: string;
};

export type ManagerEvaluationDimensionScore = {
  dimensionCode: string;
  dimensionName?: string | null;
  score?: number | null;
};

export type ManagerEvaluationTextFeedback = {
  question?: string | null;
  answer?: string | null;
};

export type ManagerEvaluationEmployeeRow = {
  surveyInstanceId: string;
  surveyResponseId?: string | null;
  onboardingId?: string | null;
  employeeUserId?: string | null;
  employeeName?: string | null;
  employeeEmail?: string | null;
  jobTitle?: string | null;
  departmentName?: string | null;
  managerUserId?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
  status?: string | null;
  averageScore?: number | null;
  fitLevel?: string | null;
  fitLabel?: string | null;
  recommendation?: string | null;
  recommendationLabel?: string | null;
  sentAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  dimensionScores?: ManagerEvaluationDimensionScore[];
  textFeedbacks?: ManagerEvaluationTextFeedback[];
};

export type ManagerEvaluationReportSummary = {
  totalEmployees: number;
  sentCount: number;
  submittedCount: number;
  pendingCount: number;
  responseRate: number;
  averageScore: number;
  fitCount: number;
  needFollowUpCount: number;
  notFitCount: number;
  notEvaluatedCount: number;
};

export type ManagerEvaluationReportResponse = {
  summary: ManagerEvaluationReportSummary;
  employees: ManagerEvaluationEmployeeRow[];
};