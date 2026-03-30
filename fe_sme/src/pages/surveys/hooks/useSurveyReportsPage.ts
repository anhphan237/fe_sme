import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  apiGetSurveyAnalyticsReport,
  apiGetSurveyInstances,
  apiListSurveyResponses,
  apiListSurveyTemplates,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type {
  SurveyInstanceSummary,
  SurveyResponseRecord,
  SurveyTemplateSummary,
} from "@/interface/survey";

import type {
  SurveyAnalyticsReportVm,
  SurveyReportsFilterState,
} from "../types/survey-report.types";
import {
  getDimensionChartData,
  getQuestionTableData,
  getRiskItems,
  getStrengthItems,
  getTrendChartData,
} from "../utils/survey-report.utils";

export const useSurveyReportsPage = () => {
  const [filters, setFilters] = useState<SurveyReportsFilterState>({
    templateId: "",
  });

  const { data: templatesRaw, isLoading: templatesLoading } = useQuery({
    queryKey: ["survey-templates-report"],
    queryFn: () => apiListSurveyTemplates(),
  });

  const templates = extractList<SurveyTemplateSummary>(
    templatesRaw,
    "items",
    "templates",
    "list",
  );

  const templateOptions = useMemo(
    () => [
      { value: "", label: "All templates" },
      ...templates.map((tmpl) => ({
        value: tmpl.templateId,
        label: tmpl.name,
      })),
    ],
    [templates],
  );

  const { data: instancesRaw } = useQuery({
    queryKey: ["survey-instances-report"],
    queryFn: () => apiGetSurveyInstances(),
  });

  const instances = extractList<SurveyInstanceSummary>(
    instancesRaw,
    "items",
    "instances",
  );

  const instanceMap = useMemo(
    () =>
      Object.fromEntries(
        instances.map((item) => [item.instanceId, item.templateName]),
      ),
    [instances],
  );

  const { data: analyticsRaw, isLoading: analyticsLoading } = useQuery({
    queryKey: ["survey-analytics-report", filters.templateId],
    queryFn: () =>
      apiGetSurveyAnalyticsReport(
        filters.templateId ? { templateId: filters.templateId } : undefined,
      ),
  });

  const { data: responsesRaw, isLoading: responsesLoading } = useQuery({
    queryKey: ["survey-report-responses", filters.templateId],
    queryFn: () =>
      apiListSurveyResponses(
        filters.templateId ? { templateId: filters.templateId } : undefined,
      ),
  });

  const analytics = (analyticsRaw ?? null) as SurveyAnalyticsReportVm | null;

  const responses = extractList<SurveyResponseRecord>(
    responsesRaw,
    "items",
    "responses",
    "list",
  );

  const dimensionChartData = useMemo(
    () => getDimensionChartData(analytics),
    [analytics],
  );

  const trendChartData = useMemo(
    () => getTrendChartData(analytics),
    [analytics],
  );

  const riskItems = useMemo(() => getRiskItems(analytics), [analytics]);
  const strengthItems = useMemo(() => getStrengthItems(analytics), [analytics]);

  const questionTableData = useMemo(
    () => getQuestionTableData(analytics),
    [analytics],
  );

  const setTemplateId = (templateId?: string) => {
    setFilters((prev) => ({
      ...prev,
      templateId: templateId ?? "",
    }));
  };

  return {
    filters,
    analytics,
    analyticsLoading,
    responses,
    responsesLoading,
    templatesLoading,
    templateOptions,
    dimensionChartData,
    trendChartData,
    riskItems,
    strengthItems,
    questionTableData,
    instanceMap,
    setTemplateId,
  };
};