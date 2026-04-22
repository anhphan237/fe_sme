import type {
  InsightItem,
  SurveyAnalyticsReportVm,
  SurveyQuestionStat,
  SurveyStageTrend,
} from "./survey-report.types";

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
    dimensionStats?: unknown[];
    lowScoreDimensions?: unknown[];
    topPositiveDimensions?: unknown[];
    stageTrends?: SurveyStageTrend[];
    timeTrends?: unknown[];
    questionStats?: Array<Partial<SurveyQuestionStat>>;
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
};

export type BuildSurveyAiSnapshotInput = {
  analytics?: SurveyAnalyticsReportVm | null;
  riskItems?: InsightItem[];
  strengthItems?: InsightItem[];
  questionStats?: SurveyQuestionStat[];
};