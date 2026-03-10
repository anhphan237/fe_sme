import { useQuery, useMutation } from "@tanstack/react-query";
import {
  apiGetTemplate,
  apiCreateTemplate,
  apiUpdateTemplate,
} from "@/api/onboarding/onboarding.api";
import { mapTemplate } from "@/utils/mappers/onboarding";
import type { SaveTemplatePayload } from "./types";

export const useTemplateQuery = (id?: string) =>
  useQuery({
    queryKey: ["template", id],
    queryFn: () => apiGetTemplate(id!),
    enabled: Boolean(id) && id !== "new",
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const raw = r?.template ?? r?.data ?? r?.result ?? r?.payload ?? res;
      return mapTemplate(
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
      );
    },
  });

export const useSaveTemplate = () =>
  useMutation({
    mutationFn: (payload: SaveTemplatePayload) => {
      const id = payload.templateId ?? payload.id;
      return !id || id === "new"
        ? apiCreateTemplate(payload)
        : apiUpdateTemplate({ templateId: id, ...payload });
    },
  });
