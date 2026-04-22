import { useMutation } from "@tanstack/react-query";
import { apiGetSurveyAiSummary } from "@/api/survey/survey.api";
import type {
  InsightItem,
  SurveyAnalyticsReportVm,
  SurveyQuestionStat,
} from "../types/survey-report.types";
import type { SurveyAiSummaryPayload } from "@/interface/survey";

type BuildSurveyAiSnapshotInput = {
  analytics?: SurveyAnalyticsReportVm | null;
  riskItems?: InsightItem[];
  strengthItems?: InsightItem[];
  questionStats?: SurveyQuestionStat[];
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (value == null) return fallback;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

function getTextFeedbacks(questionStats?: SurveyQuestionStat[]) {
  return (questionStats ?? [])
    .filter((item) => String(item.questionType ?? "").toUpperCase() === "TEXT")
    .flatMap((item) => item.sampleTexts ?? [])
    .filter(Boolean)
    .slice(0, 12);
}

function buildAnalyticsSnapshot({
  analytics,
  riskItems,
  strengthItems,
  questionStats,
}: BuildSurveyAiSnapshotInput): SurveyAiSummaryPayload["analyticsSnapshot"] {
  return {
    sentCount: toNumber(analytics?.sentCount),
    submittedCount: toNumber(analytics?.submittedCount),
    responseRate: toNumber(analytics?.responseRate),
    overallSatisfactionScore: toNumber(analytics?.overallSatisfactionScore),

    dimensionStats: analytics?.dimensionStats ?? [],
    lowScoreDimensions: riskItems ?? [],
    topPositiveDimensions: strengthItems ?? [],
    stageTrends: analytics?.stageTrends ?? [],
    timeTrends: analytics?.timeTrends ?? [],

    textFeedbacks: getTextFeedbacks(questionStats),

    questionStats: (questionStats ?? []).slice(0, 30).map((item) => ({
      questionId: item.questionId,
      questionText: item.questionText,
      questionType: item.questionType,
      dimensionCode: item.dimensionCode,
      responseCount: toNumber(item.responseCount),
      averageScore: toNumber(item.averageScore),
      completionRate: toNumber(item.completionRate),
      sampleTexts: item.sampleTexts?.slice(0, 3) ?? [],
    })),
  };
}

export function useSurveyAiSummary() {
  return useMutation({
    mutationFn: async ({
      templateId,
      startDate,
      endDate,
      language = "vi",
      forceRefresh = false,
      analytics,
      riskItems,
      strengthItems,
      questionStats,
    }: {
      templateId?: string;
      startDate?: string;
      endDate?: string;
      language?: "vi" | "en";
      forceRefresh?: boolean;
    } & BuildSurveyAiSnapshotInput) => {
      const payload: SurveyAiSummaryPayload = {
        templateId,
        startDate,
        endDate,
        language,
        forceRefresh,
        analyticsSnapshot: buildAnalyticsSnapshot({
          analytics,
          riskItems,
          strengthItems,
          questionStats,
        }),
      };

      return apiGetSurveyAiSummary(payload);
    },
  });
}