import { useQuery, useMutation } from "@tanstack/react-query";
import {
  apiListTemplates,
  apiUpdateTemplate,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapTemplate } from "@/utils/mappers/onboarding";
import type { OnboardingTemplate } from "@/shared/types";

export type StatusFilter = "ACTIVE" | "INACTIVE" | "";

export const STATUS_TAB_VALUES: StatusFilter[] = ["ACTIVE", "INACTIVE", ""];

export const STATUS_TAB_KEYS = [
  "onboarding.template.filter.active",
  "onboarding.template.filter.inactive",
  "onboarding.template.filter.all",
] as const;

export const useTemplatesQuery = (status: StatusFilter) =>
  useQuery({
    queryKey: ["templates", status],
    queryFn: () => apiListTemplates(status),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
        "list",
      ).map(mapTemplate) as OnboardingTemplate[],
  });

export const useDeactivateTemplate = () =>
  useMutation({
    mutationFn: (payload: {
      templateId: string;
      status: "ACTIVE" | "INACTIVE";
    }) => apiUpdateTemplate(payload),
  });
