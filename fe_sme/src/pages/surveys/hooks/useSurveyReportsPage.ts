import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  apiGetSurveyAnalyticsReport,
  apiListSurveyTemplates,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type { SurveyTemplateSummary } from "@/interface/survey";

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
    startDate: "",
    endDate: "",
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

  const { data: analyticsRaw, isLoading: analyticsLoading } = useQuery({
    queryKey: [
      "survey-analytics-report",
      filters.templateId,
      filters.startDate,
      filters.endDate,
    ],
    queryFn: () => {
      const payload: {
        templateId?: string;
        startDate?: string;
        endDate?: string;
      } = {};

      if (filters.templateId) payload.templateId = filters.templateId;
      if (filters.startDate) payload.startDate = filters.startDate;
      if (filters.endDate) payload.endDate = filters.endDate;

      return apiGetSurveyAnalyticsReport(
        Object.keys(payload).length > 0 ? payload : undefined,
      );
    },
  });

  const analytics = (analyticsRaw ?? null) as SurveyAnalyticsReportVm | null;

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

  const responses = useMemo(
    () => analytics?.responseSummaries ?? [],
    [analytics],
  );

  const responsesLoading = analyticsLoading;

  const setTemplateId = (templateId?: string) => {
    setFilters((prev) => ({
      ...prev,
      templateId: templateId ?? "",
    }));
  };

  const setDateRange = (startDate?: string, endDate?: string) => {
    setFilters((prev) => ({
      ...prev,
      startDate: startDate ?? "",
      endDate: endDate ?? "",
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
    setTemplateId,
    setDateRange,
  };
};