/**
 * Shared hooks & constants for the Onboarding › Employees feature.
 * Used by: employees/index, employees/detail/index, tasks/index.
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  apiListInstances,
  apiListTasks,
  apiUpdateTaskStatus,
} from "@/api/onboarding/onboarding.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import { mapUser } from "@/utils/mappers/identity";
import type { OnboardingInstance, OnboardingTask, User } from "@/shared/types";

// ── Constants ──────────────────────────────────────────────────────────────────

/** UI display value for a completed task */
export const STATUS_DONE = "Done";
/** API value sent when marking a task complete */
export const STATUS_DONE_API = "DONE";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InstancesFilter {
  employeeId?: string;
  status?: string;
}

// ── Instance Hooks ─────────────────────────────────────────────────────────────

export const useInstancesQuery = (filters?: InstancesFilter, enabled = true) =>
  useQuery({
    queryKey: [
      "instances",
      filters?.employeeId ?? "",
      filters?.status ?? "ACTIVE",
    ],
    queryFn: () =>
      apiListInstances({
        employeeId: filters?.employeeId,
        status: filters?.status ?? "ACTIVE",
      }),
    enabled,
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

// ── Task Hooks ─────────────────────────────────────────────────────────────────

export const useTasksQuery = (onboardingId?: string) =>
  useQuery({
    queryKey: ["onboarding-tasks-by-instance", onboardingId ?? ""],
    queryFn: () => apiListTasks(onboardingId!),
    enabled: Boolean(onboardingId),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "tasks",
        "content",
        "items",
        "list",
      ).map(mapTask) as OnboardingTask[],
  });

export const useUpdateTaskStatus = () =>
  useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

// ── User Hooks ──────────────────────────────────────────────────────────────────

export const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: unknown) =>
      extractList(res as Record<string, unknown>, "users", "items").map((u) =>
        mapUser(u as Record<string, unknown>),
      ) as User[],
  });
