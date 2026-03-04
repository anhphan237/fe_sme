import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  apiListTasks,
  apiUpdateTaskStatus,
  apiListInstances,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapTask, mapInstance } from "@/utils/mappers/onboarding";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/i18n";
import type { OnboardingTask, OnboardingInstance } from "@/shared/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_DONE = "Done";
const STATUS_DONE_API = "DONE";

// ── Hooks ─────────────────────────────────────────────────────────────────────

const useInstancesQuery = (
  filters?: { employeeId?: string; status?: string },
  enabled = true,
) =>
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
    select: (res: any) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
  });

const useTasksQuery = (onboardingId?: string) =>
  useQuery({
    queryKey: ["onboarding-tasks-by-instance", onboardingId ?? ""],
    queryFn: () => apiListTasks(onboardingId!),
    enabled: Boolean(onboardingId),
    select: (res: any) =>
      extractList(res, "content", "tasks", "items", "list").map(
        mapTask,
      ) as OnboardingTask[],
  });

const useUpdateTaskStatus = () =>
  useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

// ── Components ────────────────────────────────────────────────────────────────

function ProgressSummary({
  completed,
  total,
  t,
}: {
  completed: number;
  total: number;
  t: (k: string, v?: Record<string, any>) => string;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {t("onboarding.task.progress", { completed, total })}
        </p>
        <span className="text-sm font-semibold">{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#0071e3] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}

function TaskItem({
  task,
  isUpdating,
  onChange,
  t,
}: {
  task: OnboardingTask;
  isUpdating: boolean;
  onChange: (task: OnboardingTask) => void;
  t: (k: string, v?: Record<string, any>) => string;
}) {
  const isDone = task.status === STATUS_DONE;
  return (
    <li className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50">
      <label className="flex flex-1 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => onChange(task)}
          disabled={isUpdating}
          className="h-5 w-5 rounded border-stroke text-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
        />
        <span className={isDone ? "text-muted line-through" : "font-medium"}>
          {task.title}
        </span>
      </label>
      {task.dueDate && (
        <span className="text-sm text-muted">
          {t("onboarding.task.due", { date: task.dueDate })}
        </span>
      )}
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function Tasks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLocale();
  const currentUser = useAppStore((s) => s.currentUser);
  const userId = currentUser?.id;
  const isEmployee = Boolean(
    currentUser?.roles?.includes("EMPLOYEE") &&
    !currentUser?.roles?.some((r: string) => r === "HR" || r === "MANAGER"),
  );

  const { data: instances = [] } = useInstancesQuery(
    isEmployee && userId ? { employeeId: userId, status: "ACTIVE" } : undefined,
  );
  const myInstances = instances.filter((i) => i.employeeId === userId);
  const onboardingId = myInstances[0]?.id;

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTasksQuery(onboardingId);
  const updateStatus = useUpdateTaskStatus();

  const completedCount = tasks.filter((t) => t.status === STATUS_DONE).length;
  const totalCount = tasks.length;

  const handleToggleTask = async (task: OnboardingTask) => {
    const isDone = task.status === STATUS_DONE;
    const nextStatus = isDone ? "PENDING" : STATUS_DONE_API;
    try {
      await updateStatus.mutateAsync({ taskId: task.id, status: nextStatus });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
      toast(
        isDone
          ? t("onboarding.task.toast.undone")
          : t("onboarding.task.toast.done"),
      );
    } catch {
      toast(t("onboarding.task.toast.failed"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("onboarding.task.title")}
        subtitle={t("onboarding.task.subtitle")}
      />

      {totalCount > 0 && (
        <ProgressSummary completed={completedCount} total={totalCount} t={t} />
      )}

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-muted">
            {error instanceof Error ? error.message : "Something went wrong."}
            <button
              className="ml-1 font-semibold text-foreground"
              onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : tasks.length > 0 ? (
          <ul className="divide-y divide-stroke">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isUpdating={updateStatus.isPending}
                onChange={handleToggleTask}
                t={t}
              />
            ))}
          </ul>
        ) : (
          <div className="p-6">
            <EmptyState
              title={t("onboarding.task.empty.title")}
              description={
                myInstances.length > 0
                  ? t("onboarding.task.empty.desc_has_instance")
                  : t("onboarding.task.empty.desc_no_instance")
              }
              actionLabel={
                myInstances.length > 0
                  ? t("onboarding.task.empty.action")
                  : undefined
              }
              onAction={() =>
                myInstances.length > 0
                  ? navigate(`/onboarding/employees/${myInstances[0].id}`)
                  : navigate("/onboarding/employees")
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export default Tasks;
