import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/i18n";
import { isOnboardingEmployee } from "@/shared/rbac";
import {
  STATUS_DONE,
  STATUS_DONE_API,
  useInstancesQuery,
  useTasksQuery,
  useUpdateTaskStatus,
} from "../employees/hooks";
import type { OnboardingTask } from "@/shared/types";

// ── Components ────────────────────────────────────────────────────────────────

function ProgressSummary({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const { t } = useLocale();
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {t("onboarding.task.progress", { completed, total })}
        </p>
        <span className="text-sm font-semibold">{pct}%</span>
      </div>
      <Progress value={pct} />
    </Card>
  );
}

function TaskItem({
  task,
  isUpdating,
  onChange,
}: {
  task: OnboardingTask;
  isUpdating: boolean;
  onChange: (task: OnboardingTask) => void;
}) {
  const { t } = useLocale();
  const isDone = task.status === STATUS_DONE;
  return (
    <li className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50">
      <label className="flex flex-1 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => onChange(task)}
          disabled={isUpdating}
          className="h-5 w-5 rounded border-stroke text-brand focus:ring-2 focus:ring-brand/20"
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
        <ProgressSummary completed={completedCount} total={totalCount} />
      )}

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-medium text-ink">
              {error instanceof Error
                ? error.message
                : t("onboarding.task.error.something_wrong")}
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              {t("onboarding.task.error.retry")}
            </Button>
          </div>
        ) : tasks.length > 0 ? (
          <ul className="divide-y divide-stroke">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isUpdating={updateStatus.isPending}
                onChange={handleToggleTask}
              />
            ))}
          </ul>
        ) : (
          <div className="p-12">
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
