import { useQuery, useMutation } from "@tanstack/react-query";
import {
  apiGetInstance,
  apiGetTemplate,
  apiActivateInstance,
  apiCancelInstance,
  apiCompleteInstance,
} from "@/api/onboarding/onboarding.api";
import { apiGetUserById } from "@/api/identity/identity.api";
import { mapInstance, mapTemplate } from "@/utils/mappers/onboarding";
import { mapUserDetail } from "@/utils/mappers/identity";
import type { GetUserResponse } from "@/interface/identity";

export const useInstanceQuery = (instanceId?: string) =>
  useQuery({
    queryKey: ["instance", instanceId],
    queryFn: () => apiGetInstance(instanceId!),
    enabled: Boolean(instanceId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const raw = r?.instance ?? r?.data ?? r?.result ?? r?.payload ?? res;
      return mapInstance(
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
      );
    },
  });

export const useUserDetailQuery = (userId?: string) =>
  useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res: unknown) => mapUserDetail(res as GetUserResponse),
  });

export const useActivateInstance = () =>
  useMutation({
    mutationFn: (instanceId: string) => apiActivateInstance(instanceId),
  });

export const useCancelInstance = () =>
  useMutation({
    mutationFn: (instanceId: string) => apiCancelInstance(instanceId),
  });

export const useCompleteInstance = () =>
  useMutation({
    mutationFn: (instanceId: string) => apiCompleteInstance(instanceId),
  });

export const useTemplateDetailQuery = (templateId?: string) =>
  useQuery({
    queryKey: ["template-detail", templateId ?? ""],
    queryFn: () => apiGetTemplate(templateId!),
    enabled: Boolean(templateId),
    select: (res: unknown) => mapTemplate(res as Record<string, unknown>),
  });
