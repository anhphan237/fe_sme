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
  } = useSurveyReportsPage();

  const aiSummaryMutation = useSurveyAiSummary();

  const reportFilters = filters as {
    templateId?: string;
    startDate?: string;
    endDate?: string;
  };

  const generateAiSummary = (forceRefresh = false) => {
    aiSummaryMutation.mutate({
      templateId: reportFilters.templateId || undefined,
      startDate: reportFilters.startDate,
      endDate: reportFilters.endDate,
      language: "vi",
      forceRefresh,
      analytics,
      riskItems,
      strengthItems,
      questionStats: questionTableData,
    });
  };

  return (
    <div className="space-y-5">
      <SurveyReportsFilterBar
        templateOptions={templateOptions}
        templateId={filters.templateId}
        onTemplateChange={setTemplateId}
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
        onGenerateAi={() => generateAiSummary(false)}
        onRefreshAi={() => generateAiSummary(false)}
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

      <SurveyResponsesTable responses={responses} loading={responsesLoading} />
    </div>
  );
};

export default SurveyReports;
