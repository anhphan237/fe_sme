import { useMutation } from "@tanstack/react-query";
import { apiGetSurveyAiSummary } from "@/api/survey/survey.api";
import type {
  SurveyAiSummaryPayload,
  SurveyAiSummaryResponse,
} from "@/interface/survey";
import type {
  InsightItem,
  SurveyAnalyticsReportVm,
  SurveyQuestionStat,
  SurveyStageTrend,
} from "../types/survey-report.types";

type BuildSurveyAiSnapshotInput = {
  analytics?: SurveyAnalyticsReportVm | null;
  riskItems?: InsightItem[];
  strengthItems?: InsightItem[];
  questionStats?: SurveyQuestionStat[];
};

type DimensionStatLike = {
  dimensionCode?: string;
  questionCount?: number | string;
  responseCount?: number | string;
  averageScore?: number | string;
};

type StageTrendLike = {
  stage?: string;
  submittedCount?: number | string;
  averageOverall?: number | string;
};

type TimeTrendLike = {
  bucket?: string;
  submittedCount?: number | string;
  submitted?: number | string;
  averageScore?: number | string;
  score?: number | string;
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

const round2 = (value: number) => Number(value.toFixed(2));

const normalizePercent = (value: unknown): number => {
  const n = toNumber(value, 0);
  return n <= 1 ? round2(n * 100) : round2(n);
};

const normalizeDimensionCode = (value?: string | null): string => {
  const code = String(value ?? "").trim().toUpperCase();

  if (!code) return "GENERAL";
  if (code === "TOOL_ACCESS") return "TOOLS_ACCESS";

  return code;
};

const normalizeStage = (value?: string | null): string => {
  const stage = String(value ?? "").trim().toUpperCase();

  if (!stage) return "CUSTOM";
  if (stage === "DAY_7") return "D7";
  if (stage === "DAY_30") return "D30";
  if (stage === "DAY_60") return "D60";

  return stage;
};

const isQuestionLabel = (label?: string | null): boolean => {
  if (!label) return false;

  const value = label.trim();
  if (!value) return false;

  if (/^[A-Z0-9_]+$/.test(value)) {
    return false;
  }

  if (value.includes("?")) return true;
  if (value.split(/\s+/).length >= 4) return true;

  return false;
};

const isMeaningfulFeedback = (text?: string | null): boolean => {
  if (!text) return false;

  const value = text.trim();
  if (value.length < 5) return false;

  const lowered = value.toLowerCase();
  const invalidValues = new Set([
    "ok",
    "oke",
    "k",
    "kk",
    "yes",
    "no",
    "...",
    "asdf",
    "asda",
    "dfsdf",
    "sadsd",
    "dasdasd",
  ]);

  if (invalidValues.has(lowered)) return false;

  return /[a-zA-ZÀ-ỹ]/.test(value);
};

const uniqueStrings = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = item.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
};

function getTextFeedbacks(questionStats?: SurveyQuestionStat[]): string[] {
  const items = (questionStats ?? [])
    .filter((item) => String(item.questionType ?? "").toUpperCase() === "TEXT")
    .flatMap((item) => item.sampleTexts ?? [])
    .filter(isMeaningfulFeedback);

  return uniqueStrings(items).slice(0, 12);
}

function normalizeDimensionStats(
  analytics?: SurveyAnalyticsReportVm | null,
): NonNullable<SurveyAiSummaryPayload["analyticsSnapshot"]>["dimensionStats"] {
  const stats = (analytics?.dimensionStats ?? []) as DimensionStatLike[];

  return stats.map((item) => ({
    dimensionCode: normalizeDimensionCode(item.dimensionCode),
    questionCount: toNumber(item.questionCount),
    responseCount: toNumber(item.responseCount),
    averageScore: round2(toNumber(item.averageScore)),
  }));
}

function normalizeInsightItems(
  items?: InsightItem[],
): Array<{ label?: string; value?: number; subtext?: string }> {
  return (items ?? [])
    .filter((item) => item?.label && !isQuestionLabel(item.label))
    .slice(0, 5)
    .map((item) => ({
      label: normalizeDimensionCode(item.label),
      value: round2(toNumber(item.value)),
      subtext: item.subtext ?? "",
    }));
}

function normalizeStageTrends(
  analytics?: SurveyAnalyticsReportVm | null,
): NonNullable<SurveyAiSummaryPayload["analyticsSnapshot"]>["stageTrends"] {
  const trends = (analytics?.stageTrends ?? []) as Array<
    SurveyStageTrend & StageTrendLike
  >;

  return trends.map((item) => ({
    stage: normalizeStage(item.stage),
    submittedCount: toNumber(item.submittedCount),
    averageOverall: round2(toNumber(item.averageOverall)),
  }));
}

function normalizeTimeTrends(
  analytics?: SurveyAnalyticsReportVm | null,
): NonNullable<SurveyAiSummaryPayload["analyticsSnapshot"]>["timeTrends"] {
  const trends = (analytics?.timeTrends ?? []) as TimeTrendLike[];

  return trends.map((item) => ({
    bucket: String(item.bucket ?? ""),
    submittedCount: toNumber(item.submittedCount ?? item.submitted),
    averageScore: round2(toNumber(item.averageScore ?? item.score)),
  }));
}

function normalizeQuestionStats(
  questionStats?: SurveyQuestionStat[],
): NonNullable<SurveyAiSummaryPayload["analyticsSnapshot"]>["questionStats"] {
  return (questionStats ?? []).slice(0, 30).map((item) => ({
    questionId: item.questionId,
    questionText: item.questionText,
    questionType: item.questionType,
    dimensionCode: normalizeDimensionCode(item.dimensionCode),
    responseCount: toNumber(item.responseCount),
    averageScore: round2(toNumber(item.averageScore)),
    completionRate: normalizePercent(item.completionRate),
    sampleTexts: uniqueStrings(
      (item.sampleTexts ?? []).filter(isMeaningfulFeedback),
    ).slice(0, 3),
  }));
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
    responseRate: normalizePercent(analytics?.responseRate),
    overallSatisfactionScore: round2(
      toNumber(analytics?.overallSatisfactionScore),
    ),
    dimensionStats: normalizeDimensionStats(analytics),
    lowScoreDimensions: normalizeInsightItems(riskItems),
    topPositiveDimensions: normalizeInsightItems(strengthItems),
    stageTrends: normalizeStageTrends(analytics),
    timeTrends: normalizeTimeTrends(analytics),
    textFeedbacks: getTextFeedbacks(questionStats),
    questionStats: normalizeQuestionStats(questionStats),
  };
}

export function useSurveyAiSummary() {
  return useMutation<
    SurveyAiSummaryResponse,
    Error,
    {
      templateId?: string;
      startDate?: string;
      endDate?: string;
      language?: "vi" | "en";
      forceRefresh?: boolean;
    } & BuildSurveyAiSnapshotInput
  >({
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
    }) => {
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