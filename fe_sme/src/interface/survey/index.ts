// ============================================================
// Survey Module Interfaces
// Maps to BE: modules/survey
// Operations: com.sme.survey.*
// ============================================================

import type { off } from "process";

// ---------------------------
// Template
// ---------------------------

/** com.sme.survey.template.create */
export interface SurveyTemplateCreateRequest {
  name: string;
  description?: string;
  /** Onboarding milestone stage e.g. DAY_7, DAY_30, DAY_60 */
  stage?: string;
  /** If true only managers can view results */
  managerOnly?: boolean;
}

/** com.sme.survey.template.update */
export interface SurveyTemplateUpdateRequest {
  templateId: string;
  name?: string;
  description?: string;
  stage?: string;
  managerOnly?: boolean;
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
  managerOnly: boolean;
  status: string;
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
  type?: string;
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
}

/** com.sme.survey.instance.schedule */
export interface SurveyScheduleRequest {
  templateId: string;
   onboardingId: string;
  scheduledAt?: string;
}

/** com.sme.survey.instance.send */
export interface SurveySendRequest {
  instanceId: string;
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

export interface SurveyQuestionUpdateRequest {
  questionId: string;
  templateId: string;
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

export interface SurveyQuestionDeleteRequest {
  questionId: string;
}