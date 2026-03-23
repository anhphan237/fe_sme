import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Progress,
  Segmented,
  Skeleton,
  Tag,
  Typography,
} from "antd";

import { notify } from "@/utils/notify";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import { isOnboardingEmployee } from "@/shared/rbac";
import {
  apiGetTaskDetail,
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

type StatusFilter = "all" | "pending" | "done";

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

const useTaskDetailQuery = (taskId?: string) =>
  useQuery({
    queryKey: ["onboarding-task-detail", taskId ?? ""],
    queryFn: () => apiGetTaskDetail(taskId!),
    enabled: Boolean(taskId),
    select: (res: unknown) => {
      const record = res as Record<string, unknown>;
      return (record?.task ??
        record?.data ??
        record?.result ??
        record?.payload ??
        res) as Record<string, unknown>;
    },
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
  onInspect,
}: {
  task: OnboardingTask;
  isUpdating: boolean;
  onChange: (task: OnboardingTask) => void;
  onInspect: (task: OnboardingTask) => void;
}) => {
  const { t } = useLocale();
  const isDone = task.status === STATUS_DONE;
  const isOverdue =
    task.dueDate && !isDone && new Date(task.dueDate) < new Date();

  return (
    <li className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4">
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

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        {task.dueDate ? (
          <span
            className={`flex items-center gap-1 text-xs ${
              isOverdue ? "font-medium text-amber-600" : "text-gray-400"
            }`}>
            <Clock className="h-3 w-3" />
            {t("onboarding.task.due", { date: task.dueDate })}
          </span>
        ) : (
          <span className="text-xs text-gray-400">
            {t("onboarding.task.no_due_date")}
          </span>
        )}

        <Button size="small" onClick={() => onInspect(task)}>
          {t("onboarding.task.api.inspect")}
        </Button>
      </div>
    </li>
  );
};

const StageSection = ({
  title,
  tasks,
  isUpdating,
  onToggle,
  onInspect,
}: {
  title: string;
  tasks: OnboardingTask[];
  isUpdating: boolean;
  onToggle: (task: OnboardingTask) => void;
  onInspect: (task: OnboardingTask) => void;
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
            onInspect={onInspect}
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
  const location = useLocation();
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [keyword, setKeyword] = useState("");

  const {
    data: taskDetail,
    isLoading: taskDetailLoading,
    isError: taskDetailError,
  } = useTaskDetailQuery(selectedTaskId ?? undefined);

  const completedCount = tasks.filter(
    (task) => task.status === STATUS_DONE,
  ).length;
  const totalCount = tasks.length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchKeyword = task.title
        .toLowerCase()
        .includes(keyword.trim().toLowerCase());

      if (!matchKeyword) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "done") return task.status === STATUS_DONE;
      return task.status !== STATUS_DONE;
    });
  }, [tasks, keyword, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, OnboardingTask[]>();
    for (const task of filteredTasks) {
      const key = task.checklistName ?? "Other";
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return Array.from(map.entries());
  }, [filteredTasks]);

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

  const apiCapabilities = [
    {
      key: "listByOnboarding",
      operation: "com.sme.onboarding.task.listByOnboarding",
      ready: Boolean(onboardingId) && !isError,
      note: onboardingId
        ? t("onboarding.task.api.ready")
        : t("onboarding.task.api.missing_instance"),
    },
    {
      key: "detail",
      operation: "com.sme.onboarding.task.detail",
      ready: Boolean(selectedTaskId),
      note: selectedTaskId
        ? t("onboarding.task.api.selected_task")
        : t("onboarding.task.api.select_task_to_check"),
    },
    {
      key: "updateStatus",
      operation: "com.sme.onboarding.task.updateStatus",
      ready: true,
      note: t("onboarding.task.api.update_ready"),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-semibold text-gray-800">
              {t("onboarding.task.quickview.title")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                allowClear
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("onboarding.task.quickview.search_placeholder")}
              />
              <Segmented
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                options={[
                  {
                    label: t("onboarding.task.quickview.filter_all"),
                    value: "all",
                  },
                  {
                    label: t("onboarding.task.quickview.filter_pending"),
                    value: "pending",
                  },
                  {
                    label: t("onboarding.task.quickview.filter_done"),
                    value: "done",
                  },
                ]}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t("onboarding.task.quickview.result", {
                visible: filteredTasks.length,
                total: totalCount,
              })}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-800">
              {t("onboarding.task.api.title")}
            </p>
            <div className="space-y-2">
              {apiCapabilities.map((api) => (
                <div
                  key={api.key}
                  className="rounded-md border border-gray-100 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <code className="text-[11px] text-slate-600">
                      {api.operation}
                    </code>
                    <Tag color={api.ready ? "success" : "default"}>
                      {api.ready
                        ? t("onboarding.task.api.available")
                        : t("onboarding.task.api.waiting")}
                    </Tag>
                  </div>
                  <p className="text-xs text-gray-500">{api.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

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
              onInspect={(task) => setSelectedTaskId(task.id)}
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
                    ? navigate(
                        location.pathname.startsWith("/onboarding/hr")
                          ? "/onboarding/hr/tasks"
                          : "/onboarding/manager/tasks",
                      )
                    : navigate("/onboarding/employee")
                }>
                {myInstances.length > 0
                  ? t("onboarding.task.empty.action")
                  : t("onboarding.task.empty.title")}
              </Button>
            </Empty>
          </div>
        </Card>
      )}

      <Drawer
        title={t("onboarding.task.api.drawer_title")}
        width={620}
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}>
        {taskDetailLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : taskDetailError ? (
          <Empty description={t("onboarding.task.api.detail_error")} />
        ) : taskDetail ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <Typography.Text type="secondary">
                {t("onboarding.task.api.operation")}
              </Typography.Text>
              <div className="mt-1">
                <code>com.sme.onboarding.task.detail</code>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <Typography.Text type="secondary">
                {t("onboarding.task.api.response_preview")}
              </Typography.Text>
              <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-50 p-3 text-xs">
                {JSON.stringify(taskDetail, null, 2)}
              </pre>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              {t("onboarding.task.api.execution_hint")}
            </div>
          </div>
        ) : (
          <Empty description={t("onboarding.task.api.select_task_to_check")} />
        )}
      </Drawer>
    </div>
  );
};

export default Tasks;
