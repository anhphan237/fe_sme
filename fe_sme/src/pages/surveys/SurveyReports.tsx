import SurveyReportsFilterBar from "./components/SurveyReportsFilterBar";
import SurveyReportsKpiRow from "./components/SurveyReportsKpiRow";
import SurveyDimensionChartCard from "./components/SurveyDimensionChartCard";
import SurveyTrendChartCard from "./components/SurveyTrendChartCard";
import SurveyInsightCard from "./components/SurveyInsightCard";
import SurveyQuestionStatsTable from "./components/SurveyQuestionStatsTable";
import SurveyResponsesTable from "./components/SurveyResponsesTable";
import { useSurveyReportsPage } from "./hooks/useSurveyReportsPage";
import { useLocale } from "@/i18n";
import SurveyStageTrendCard from "./components/SurveyStageTrendCard";

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

  return (
    <div className="space-y-5">
      <SurveyReportsFilterBar
        templateOptions={templateOptions}
        templateId={filters.templateId}
        onTemplateChange={setTemplateId}
      />

      <SurveyReportsKpiRow analytics={analytics} loading={analyticsLoading} />

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

      <div className="grid gap-5 xl:grid-cols-2">
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
