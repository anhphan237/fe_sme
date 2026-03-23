import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  apiGetSurveyInstances,
  apiListSurveyTemplates,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";

import type { SurveyTemplateSummary } from "@/interface/survey";
import type {
  SurveySendFilter,
  SurveyInstanceItem,
} from "../types/survey-send.types";

import {
  mapSurveyInstanceListResponse,
  mapTemplateOptions,
} from "../utils/survey-send.utils";

export const useSurveySendPage = () => {
  const [filters, setFilters] = useState<SurveySendFilter>({
    templateId: undefined,
    status: undefined,
    startDate: undefined,
    endDate: undefined,
    page: 1,
    pageSize: 10,
  });

  const { data: templatesRaw } = useQuery({
    queryKey: ["survey-templates-for-send-filter"],
    queryFn: () => apiListSurveyTemplates(),
  });

  const templates = extractList<SurveyTemplateSummary>(
    templatesRaw,
    "items",
    "templates",
  );

  const templateOptions = useMemo(
    () => mapTemplateOptions(templates),
    [templates],
  );

  const { data, isLoading } = useQuery({
    queryKey: [
      "survey-instances",
      filters.templateId,
      filters.status,
      filters.startDate,
      filters.endDate,
      filters.page,
      filters.pageSize,
    ],
    queryFn: () =>
      apiGetSurveyInstances({
        templateId: filters.templateId,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        offset: (filters.page - 1) * filters.pageSize,
        limit: filters.pageSize,
      }),
    select: mapSurveyInstanceListResponse,
  });

  const rows: SurveyInstanceItem[] = useMemo(() => {
    return (data?.items ?? []).map((item) => ({
      ...item,
      employeeName: item.employeeName || "Chưa có thông tin",
      email: item.email || "—",
    }));
  }, [data]);

  const totalCount = data?.totalCount ?? 0;

  const setTemplateId = (value?: string) => {
    setFilters((prev) => ({ ...prev, templateId: value, page: 1 }));
  };

  const setStatus = (value?: string) => {
    setFilters((prev) => ({ ...prev, status: value, page: 1 }));
  };

  const setDateRange = (startDate?: string, endDate?: string) => {
    setFilters((prev) => ({ ...prev, startDate, endDate, page: 1 }));
  };

  const setPagination = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, page, pageSize }));
  };

  const clearFilters = () => {
    setFilters({
      templateId: undefined,
      status: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 1,
      pageSize: 10,
    });
  };

  return {
    filters,
    rows,
    totalCount,
    isLoading,
    templateOptions,
    setTemplateId,
    setStatus,
    setDateRange,
    setPagination,
    clearFilters,
  };
};