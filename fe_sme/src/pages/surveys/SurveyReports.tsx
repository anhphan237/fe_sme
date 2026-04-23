import { useEffect, useRef, useState } from "react";
import SurveyReportsFilterBar from "./components/SurveyReportsFilterBar";
import SurveyReportsKpiRow from "./components/SurveyReportsKpiRow";
import SurveyDimensionChartCard from "./components/SurveyDimensionChartCard";
import SurveyTrendChartCard from "./components/SurveyTrendChartCard";
import SurveyInsightCard from "./components/SurveyInsightCard";
import SurveyQuestionStatsTable from "./components/SurveyQuestionStatsTable";
import SurveyResponsesTable from "./components/SurveyResponsesTable";
import SurveyStageTrendCard from "./components/SurveyStageTrendCard";
import SurveyRecommendationCard from "./components/SurveyRecommendationCard";
import SurveyTextFeedbackCard from "./components/SurveyTextFeedbackCard";
import SurveyExecutiveSummaryCard from "./components/SurveyExecutiveSummaryCard";
import { useSurveyReportsPage } from "./hooks/useSurveyReportsPage";
import { useSurveyAiSummary } from "./hooks/useSurveyAiSummary";
import { useLocale } from "@/i18n";

type SurveyReportFilters = {
  templateId?: string;
  startDate?: string;
  endDate?: string;
};

const REFRESH_COOLDOWN_MS = 20_000;

const SurveyReports = () => {
  const { t } = useLocale();

  const {
    filters,
    analytics,
    analyticsLoading,
    responses,
    responsesLoading,
    templateOptions,
    dimensionChartData,
    trendChartData,
    riskItems,
    strengthItems,
    questionTableData,
    setTemplateId,
    setDateRange,
  } = useSurveyReportsPage();

  const aiSummaryMutation = useSurveyAiSummary();
  const reportFilters = filters as SurveyReportFilters;

  const [refreshBlocked, setRefreshBlocked] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const basePayload = {
    templateId: reportFilters.templateId || undefined,
    startDate: reportFilters.startDate || undefined,
    endDate: reportFilters.endDate || undefined,
    language: "vi" as const,
    analytics,
    riskItems,
    strengthItems,
    questionStats: questionTableData,
  };

  const generateAiSummary = () => {
    aiSummaryMutation.mutate({
      ...basePayload,
      forceRefresh: false,
    });
  };

  const refreshAiSummary = () => {
    if (refreshBlocked) return;

    setRefreshBlocked(true);

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      setRefreshBlocked(false);
      refreshTimeoutRef.current = null;
    }, REFRESH_COOLDOWN_MS);

    aiSummaryMutation.mutate({
      ...basePayload,
      forceRefresh: true,
    });
  };

  return (
    <div className="space-y-5">
      <SurveyReportsFilterBar
        templateOptions={templateOptions}
        templateId={filters.templateId}
        startDate={filters.startDate}
        endDate={filters.endDate}
        onTemplateChange={setTemplateId}
        onDateRangeChange={setDateRange}
      />

      <SurveyReportsKpiRow analytics={analytics} loading={analyticsLoading} />

      <SurveyExecutiveSummaryCard
        analytics={analytics}
        riskItems={riskItems}
        strengthItems={strengthItems}
        questionStats={questionTableData}
        stageTrends={analytics?.stageTrends ?? []}
        loading={analyticsLoading}
        aiSummary={aiSummaryMutation.data ?? null}
        aiLoading={aiSummaryMutation.isPending}
        onGenerateAi={generateAiSummary}
        onRefreshAi={refreshAiSummary}
        refreshBlocked={refreshBlocked}
      />

      <SurveyRecommendationCard
        analytics={analytics}
        riskItems={riskItems}
        strengthItems={strengthItems}
        stageTrends={analytics?.stageTrends ?? []}
        loading={analyticsLoading}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <SurveyDimensionChartCard
          data={dimensionChartData}
          loading={analyticsLoading}
        />

        <SurveyTrendChartCard
          data={trendChartData}
          loading={analyticsLoading}
        />
      </div>

      <SurveyStageTrendCard
        data={analytics?.stageTrends ?? []}
        loading={analyticsLoading}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <SurveyInsightCard
          title={t("survey.reports.top_risks")}
          items={riskItems}
          tone="danger"
        />

        <SurveyInsightCard
          title={t("survey.reports.top_strengths")}
          items={strengthItems}
          tone="success"
        />

        <SurveyTextFeedbackCard
          questionStats={questionTableData}
          loading={analyticsLoading}
        />
      </div>

      <SurveyQuestionStatsTable
        data={questionTableData}
        loading={analyticsLoading}
      />

      <SurveyResponsesTable
        responses={responses}
        loading={responsesLoading}
      />
    </div>
  );
};

export default SurveyReports;