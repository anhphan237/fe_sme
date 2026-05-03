import { Tabs } from "antd";

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
import { useEffect, useMemo, useRef, useState } from "react";
import ManagerEvaluationReportTab from "./components/ManagerEvaluationReportTab";
import SurveyEmployeeInsightCard from "./components/SurveyEmployeeInsightCard";

type TemplateOption = {
  value?: string;
  label?: string;
  id?: string;
  templateId?: string;
  surveyTemplateId?: string;
  name?: string;
  stage?: string;
  stageCode?: string;
  targetRole?: string;
  target_role?: string;
  purpose?: string;
  raw?: Record<string, unknown>;
  [key: string]: unknown;
};

type SurveyReportFilters = {
  templateId?: string;
  startDate?: string;
  endDate?: string;
};

type SurveyReportTab = "ONBOARDING_FEEDBACK" | "MANAGER_EVALUATION";

const REFRESH_COOLDOWN_MS = 20_000;

const tr = (t: (key: string) => string, key: string, fallback: string) => {
  const value = t(key);
  return value === key ? fallback : value;
};

const getText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const getTemplateValue = (template: TemplateOption): string =>
  getText(template.value) ||
  getText(template.templateId) ||
  getText(template.surveyTemplateId) ||
  getText(template.id);

const getTemplateLabel = (template: TemplateOption): string =>
  getText(template.label) || getText(template.name) || "—";

const getTemplateStage = (template: TemplateOption): string => {
  const raw = template.raw ?? {};
  return (
    getText(template.stage) ||
    getText(template.stageCode) ||
    getText(raw.stage) ||
    getText(raw.stageCode)
  ).toUpperCase();
};

const getTemplateTargetRole = (template: TemplateOption): string => {
  const raw = template.raw ?? {};
  return (
    getText(template.targetRole) ||
    getText(template.target_role) ||
    getText(raw.targetRole) ||
    getText(raw.target_role)
  ).toUpperCase();
};

const getTemplatePurpose = (template: TemplateOption): string => {
  const raw = template.raw ?? {};
  return (
    getText(template.purpose) ||
    getText(raw.purpose) ||
    "ONBOARDING_FEEDBACK"
  ).toUpperCase();
};

const isManagerEvaluationTemplate = (template: TemplateOption): boolean => {
  const purpose = getTemplatePurpose(template);
  const stage = getTemplateStage(template);
  const targetRole = getTemplateTargetRole(template);

  return (
    purpose === "MANAGER_EVALUATION" ||
    (stage === "COMPLETED" && targetRole === "MANAGER")
  );
};

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

  const [activeTab, setActiveTab] = useState<SurveyReportTab>(
    "ONBOARDING_FEEDBACK",
  );
  const [refreshBlocked, setRefreshBlocked] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onboardingTemplateOptions = useMemo(
    () =>
      ((templateOptions ?? []) as TemplateOption[])
        .filter((template) => !isManagerEvaluationTemplate(template))
        .map((template) => ({
          ...template,
          value: getTemplateValue(template),
          label: getTemplateLabel(template),
        }))
        .filter((template) => Boolean(template.value)),
    [templateOptions],
  );

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "ONBOARDING_FEEDBACK") return;

    const currentTemplateId = reportFilters.templateId;
    if (!currentTemplateId) return;

    const stillValid = onboardingTemplateOptions.some(
      (template) => getTemplateValue(template) === currentTemplateId,
    );

    if (!stillValid) setTemplateId(undefined);
  }, [
    activeTab,
    onboardingTemplateOptions,
    reportFilters.templateId,
    setTemplateId,
  ]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as SurveyReportTab);
    setTemplateId(undefined);
    aiSummaryMutation.reset?.();
  };

  const basePayload = {
    templateId: reportFilters.templateId || undefined,
    startDate: reportFilters.startDate || undefined,
    endDate: reportFilters.endDate || undefined,
    surveyPurpose: "ONBOARDING_FEEDBACK",
    purpose: "ONBOARDING_FEEDBACK",
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

    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

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
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {tr(t, "survey.reports.title", "Báo cáo khảo sát")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {tr(
            t,
            "survey.reports.subtitle",
            "Theo dõi khảo sát onboarding và đánh giá sau onboarding trong cùng một nơi.",
          )}
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: "ONBOARDING_FEEDBACK",
            label: tr(
              t,
              "survey.reports.tab.onboardingFeedback",
              "Khảo sát onboarding",
            ),
            children: (
              <div className="space-y-5">
                <SurveyReportsFilterBar
                  templateOptions={onboardingTemplateOptions}
                  templateId={filters.templateId}
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  onTemplateChange={setTemplateId}
                  onDateRangeChange={setDateRange}
                />

                <SurveyReportsKpiRow
                  analytics={analytics}
                  loading={analyticsLoading}
                />

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
                <SurveyEmployeeInsightCard
                  analytics={analytics}
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
                    title={tr(
                      t,
                      "survey.reports.top_risks",
                      "Điểm cần cải thiện",
                    )}
                    items={riskItems}
                    tone="danger"
                  />

                  <SurveyInsightCard
                    title={tr(t, "survey.reports.top_strengths", "Điểm mạnh")}
                    items={strengthItems}
                    tone="success"
                  />

                  <SurveyTextFeedbackCard
                    questionStats={questionTableData}
                    loading={analyticsLoading}
                  />
                </div>

                {/* <SurveyQuestionStatsTable
                  data={questionTableData}
                  loading={analyticsLoading}
                /> */}

                {/* <SurveyResponsesTable
                  responses={responses}
                  loading={responsesLoading}
                /> */}
              </div>
            ),
          },
          {
            key: "MANAGER_EVALUATION",
            label: tr(
              t,
              "survey.reports.tab.managerEvaluation",
              "Đánh giá sau onboarding",
            ),
            children: <ManagerEvaluationReportTab />,
          },
        ]}
      />
    </div>
  );
};

export default SurveyReports;
