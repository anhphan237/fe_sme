import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button, Card, Empty, Progress, Skeleton } from "antd";

import { notify } from "@/utils/notify";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import { isOnboardingEmployee } from "@/shared/rbac";
import {
  apiListInstances,
  apiListTasks,
  apiUpdateTaskStatus,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_DONE = "Done";
const STATUS_DONE_API = "DONE";

// ── Hooks ─────────────────────────────────────────────────────────────────────

interface InstancesFilter {
  employeeId?: string;
  status?: string;
}

const useInstancesQuery = (filters?: InstancesFilter, enabled = true) =>
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

const useTasksQuery = (onboardingId?: string) =>
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

const useUpdateTaskStatus = () =>
  useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

// ── Components ─────────────────────────────────────────────────────────────────

const ProgressSummary = ({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) => {
  const { t } = useLocale();
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {t("onboarding.task.progress", { completed, total })}
        </p>
        <span className="text-sm font-semibold text-gray-800">{pct}%</span>
      </div>
      <Progress percent={pct} showInfo={false} />
    </Card>
  );
};

const TaskItem = ({
  task,
  isUpdating,
  onChange,
}: {
  task: OnboardingTask;
  isUpdating: boolean;
  onChange: (task: OnboardingTask) => void;
}) => {
  const { t } = useLocale();
  const isDone = task.status === STATUS_DONE;
  const isOverdue =
    task.dueDate && !isDone && new Date(task.dueDate) < new Date();

  return (
    <li className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50">
      <label className="flex flex-1 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => onChange(task)}
          disabled={isUpdating}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
        />
        <span
          className={
            isDone
              ? "text-sm text-gray-400 line-through"
              : "text-sm font-medium text-gray-800"
          }>
          {task.title}
        </span>
      </label>
      {task.dueDate && (
        <span
          className={`flex items-center gap-1 text-xs ${
            isOverdue ? "font-medium text-amber-600" : "text-gray-400"
          }`}>
          <Clock className="h-3 w-3" />
          {t("onboarding.task.due", { date: task.dueDate })}
        </span>
      )}
    </li>
  );
};

const StageSection = ({
  title,
  tasks,
  isUpdating,
  onToggle,
}: {
  title: string;
  tasks: OnboardingTask[];
  isUpdating: boolean;
  onToggle: (task: OnboardingTask) => void;
}) => {
  const done = tasks.filter((t) => t.status === STATUS_DONE).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;

  return (
    <Card className="overflow-hidden" styles={{ body: { padding: 0 } }}>
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-3">
        <div className="flex items-center gap-2">
          {allDone ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-blue-300" />
          )}
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {done}/{total}
          </span>
          <div className="w-24">
            <Progress percent={pct} size="small" showInfo={false} />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-gray-600">
            {pct}%
          </span>
        </div>
      </div>
      <ul className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isUpdating={isUpdating}
            onChange={onToggle}
          />
        ))}
      </ul>
    </Card>
  );
};

const LoadingState = () => (
  <div className="space-y-4">
    {[0, 1].map((i) => (
      <Card
        key={i}
        className="overflow-hidden"
        styles={{ body: { padding: 0 } }}>
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-3">
          <Skeleton.Input active size="small" style={{ width: 140 }} />
          <Skeleton.Input active size="small" style={{ width: 100 }} />
        </div>
        <div className="divide-y divide-gray-100">
          {[0, 1, 2].map((j) => (
            <div key={j} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton.Avatar active size="small" shape="square" />
              <Skeleton.Input active size="small" style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      </Card>
    ))}
  </div>
);

// ── Page ───────────────────────────────────────────────────────────────────────

const Tasks = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const userId = currentUser?.id;
  const isEmployee = isOnboardingEmployee(currentUser?.roles ?? []);

  const { data: instances = [] } = useInstancesQuery(
    isEmployee && userId ? { employeeId: userId, status: "ACTIVE" } : undefined,
    Boolean(isEmployee && userId),
  );
  const myInstances = instances.filter(
    (i) => i.employeeUserId === userId || i.employeeId === userId,
  );
  const onboardingId = myInstances[0]?.id;

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTasksQuery(onboardingId);
  const updateStatus = useUpdateTaskStatus();

  const completedCount = tasks.filter(
    (task) => task.status === STATUS_DONE,
  ).length;
  const totalCount = tasks.length;

  const grouped = useMemo(() => {
    const map = new Map<string, OnboardingTask[]>();
    for (const task of tasks) {
      const key = task.checklistName ?? "Other";
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return Array.from(map.entries());
  }, [tasks]);

  const handleToggleTask = async (task: OnboardingTask) => {
    const isDone = task.status === STATUS_DONE;
    const nextStatus = isDone ? "TODO" : STATUS_DONE_API;
    try {
      await updateStatus.mutateAsync({ taskId: task.id, status: nextStatus });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
      notify.success(
        isDone
          ? t("onboarding.task.toast.undone")
          : t("onboarding.task.toast.done"),
      );
    } catch {
      notify.error(t("onboarding.task.toast.failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          {t("onboarding.task.title")}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {t("onboarding.task.subtitle")}
        </p>
      </div>

      {totalCount > 0 && (
        <ProgressSummary completed={completedCount} total={totalCount} />
      )}

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              {error instanceof Error
                ? error.message
                : t("onboarding.task.error.something_wrong")}
            </p>
            <Button onClick={() => refetch()}>
              {t("onboarding.task.error.retry")}
            </Button>
          </div>
        </Card>
      ) : grouped.length > 0 ? (
        <div className="space-y-4">
          {grouped.map(([stageName, stageTasks]) => (
            <StageSection
              key={stageName}
              title={stageName}
              tasks={stageTasks}
              isUpdating={updateStatus.isPending}
              onToggle={handleToggleTask}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="py-8">
            <Empty
              description={
                myInstances.length > 0
                  ? t("onboarding.task.empty.desc_has_instance")
                  : t("onboarding.task.empty.desc_no_instance")
              }>
              <Button
                type={myInstances.length > 0 ? "primary" : "default"}
                onClick={() =>
                  myInstances.length > 0
                    ? navigate(`/onboarding/employees/${myInstances[0].id}`)
                    : navigate("/onboarding/employees")
                }>
                {myInstances.length > 0
                  ? t("onboarding.task.empty.action")
                  : t("onboarding.task.empty.title")}
              </Button>
            </Empty>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Tasks;
