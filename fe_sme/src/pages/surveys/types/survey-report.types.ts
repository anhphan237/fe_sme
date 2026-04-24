export type SurveyDimensionStat = {
  dimensionCode: string;
  questionCount?: number;
  responseCount?: number;
  averageScore?: number | string | null;
};

export type SurveyQuestionStat = {
  questionId: string;
  questionText: string;
  questionType: string;
  dimensionCode?: string | null;
  responseCount?: number;
  averageScore?: number | string | null;
  choiceDistribution?: Record<string, number> | null;
  textAnswerCount?: number | null;
  completionRate?: number | string | null;
  sampleTexts?: string[] | null;
};

export type SurveyTrendPoint = {
  bucket: string;
  submittedCount?: number;
  averageScore?: number | string | null;
};

export type SurveyStageTrend = {
  stage: string;
  submittedCount?: number;
  averageOverall?: number | string | null;
};

export type SurveyResponseSummary = {
  surveyResponseId?: string;
  surveyInstanceId?: string;
  templateName?: string;
  employeeName?: string;
  overallScore?: number | string | null;
  submittedAt?: string | null;
};

export type SurveyAnalyticsReportVm = {
  sentCount?: number | null;
  submittedCount?: number | null;
  responseRate?: number | string | null;
  overallSatisfactionScore?: number | string | null;

  dimensionStats?: SurveyDimensionStat[];
  questionStats?: SurveyQuestionStat[];

  lowScoreDimensions?: SurveyDimensionStat[];
  topPositiveDimensions?: SurveyDimensionStat[];

  lowestQuestions?: SurveyQuestionStat[];
  highestQuestions?: SurveyQuestionStat[];

  timeTrends?: SurveyTrendPoint[];
  stageTrends?: SurveyStageTrend[];

  textResponseCount?: number | null;
  ratingQuestionCount?: number | null;
  textQuestionCount?: number | null;
  choiceQuestionCount?: number | null;

  responseSummaries?: SurveyResponseSummary[];
};

export type InsightItem = {
  label: string;
  value?: number | string | null;
  subtext?: string;
};

export type SurveyReportsFilterState = {
  templateId: string;
  startDate: string;
  endDate: string;
};