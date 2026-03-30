import type {
  InsightItem,
  SurveyAnalyticsReportVm,
  SurveyDimensionStat,
  SurveyQuestionStat,
  SurveyTrendPoint,
} from "../types/survey-report.types";

export const toNumber = (value?: number | string | null) => {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
};

export const formatScore = (value?: number | string | null) => {
  const n = toNumber(value);
  return n == null ? "—" : n.toFixed(2);
};

export const formatPercent = (value?: number | string | null) => {
  const n = toNumber(value);
  return n == null ? "0%" : `${(n * 100).toFixed(0)}%`;
};

export const truncate = (value?: string | null, max = 80) => {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

export const getDimensionChartData = (
  analytics?: SurveyAnalyticsReportVm | null,
) =>
  (analytics?.dimensionStats ?? []).map((item: SurveyDimensionStat) => ({
    name: item.dimensionCode || "—",
    value: toNumber(item.averageScore) ?? 0,
    responseCount: item.responseCount ?? 0,
    questionCount: item.questionCount ?? 0,
  }));

export const getTrendChartData = (analytics?: SurveyAnalyticsReportVm | null) =>
  (analytics?.timeTrends ?? []).map((item: SurveyTrendPoint) => ({
    bucket: item.bucket,
    score: toNumber(item.averageScore) ?? 0,
    submitted: item.submittedCount ?? 0,
  }));

export const getBestDimension = (analytics?: SurveyAnalyticsReportVm | null) => {
  if (analytics?.topPositiveDimensions?.length) {
    return analytics.topPositiveDimensions[0];
  }

  const sorted = [...(analytics?.dimensionStats ?? [])]
    .filter((item) => toNumber(item.averageScore) != null)
    .sort(
      (a, b) =>
        (toNumber(b.averageScore) ?? -Infinity) -
        (toNumber(a.averageScore) ?? -Infinity),
    );

  return sorted[0];
};

export const getWorstDimension = (analytics?: SurveyAnalyticsReportVm | null) => {
  if (analytics?.lowScoreDimensions?.length) {
    return analytics.lowScoreDimensions[0];
  }

  const sorted = [...(analytics?.dimensionStats ?? [])]
    .filter((item) => toNumber(item.averageScore) != null)
    .sort(
      (a, b) =>
        (toNumber(a.averageScore) ?? Infinity) -
        (toNumber(b.averageScore) ?? Infinity),
    );

  return sorted[0];
};

export const getRiskItems = (
  analytics?: SurveyAnalyticsReportVm | null,
): InsightItem[] => {
  const lowDimensions =
    analytics?.lowScoreDimensions?.length
      ? analytics.lowScoreDimensions
      : [...(analytics?.dimensionStats ?? [])]
          .filter((item) => toNumber(item.averageScore) != null)
          .sort(
            (a, b) =>
              (toNumber(a.averageScore) ?? Infinity) -
              (toNumber(b.averageScore) ?? Infinity),
          )
          .slice(0, 3);

  const lowQuestions =
    analytics?.lowestQuestions?.length
      ? analytics.lowestQuestions
      : [...(analytics?.questionStats ?? [])]
          .filter((item) => toNumber(item.averageScore) != null)
          .sort(
            (a, b) =>
              (toNumber(a.averageScore) ?? Infinity) -
              (toNumber(b.averageScore) ?? Infinity),
          )
          .slice(0, 3);

  const dimensionItems = lowDimensions.map((item) => ({
    label: item.dimensionCode,
    value: toNumber(item.averageScore),
    subtext: `${item.responseCount ?? 0} responses`,
  }));

  const questionItems = lowQuestions.map((item) => ({
    label: item.questionText,
    value: toNumber(item.averageScore),
    subtext: item.dimensionCode || item.questionType,
  }));

  return [...dimensionItems, ...questionItems].slice(0, 5);
};

export const getStrengthItems = (
  analytics?: SurveyAnalyticsReportVm | null,
): InsightItem[] => {
  const topDimensions =
    analytics?.topPositiveDimensions?.length
      ? analytics.topPositiveDimensions
      : [...(analytics?.dimensionStats ?? [])]
          .filter((item) => toNumber(item.averageScore) != null)
          .sort(
            (a, b) =>
              (toNumber(b.averageScore) ?? -Infinity) -
              (toNumber(a.averageScore) ?? -Infinity),
          )
          .slice(0, 3);

  const topQuestions =
    analytics?.highestQuestions?.length
      ? analytics.highestQuestions
      : [...(analytics?.questionStats ?? [])]
          .filter((item) => toNumber(item.averageScore) != null)
          .sort(
            (a, b) =>
              (toNumber(b.averageScore) ?? -Infinity) -
              (toNumber(a.averageScore) ?? -Infinity),
          )
          .slice(0, 3);

  const dimensionItems = topDimensions.map((item) => ({
    label: item.dimensionCode,
    value: toNumber(item.averageScore),
    subtext: `${item.responseCount ?? 0} responses`,
  }));

  const questionItems = topQuestions.map((item) => ({
    label: item.questionText,
    value: toNumber(item.averageScore),
    subtext: item.dimensionCode || item.questionType,
  }));

  return [...dimensionItems, ...questionItems].slice(0, 5);
};

export const getQuestionTableData = (
  analytics?: SurveyAnalyticsReportVm | null,
): SurveyQuestionStat[] => analytics?.questionStats ?? [];