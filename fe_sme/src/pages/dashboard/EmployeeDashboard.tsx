import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Progress,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Clock,
  FileText,
  Layers,
  Paperclip,
  RefreshCcw,
  ThumbsDown,
  UserCheck,
} from "lucide-react";

import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import {
  apiAcknowledgeTask,
  apiGetTaskDetailFull,
  apiListInstances,
  apiListTasksByAssignee,
  apiUpdateTaskStatus,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import { notify } from "@/utils/notify";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";
import type { TaskDetailResponse } from "@/interface/onboarding";
import { AppRouters } from "@/constants/router";

const STATUS_DONE_API = "DONE";
const STATUS_IN_PROGRESS_API = "IN_PROGRESS";

type Tone = "teal" | "emerald" | "amber" | "rose" | "indigo" | "slate" | "sky";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function getAnyString(obj: unknown, keys: string[]): string | undefined {
  const record = toRecord(obj);

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return undefined;
}

function getAnyNumber(obj: unknown, keys: string[], fallback = 0): number {
  const record = toRecord(obj);

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function normalizePercent(value: unknown, fallback = 0): number {
  const raw = Number(value);
  const safe = Number.isFinite(raw) ? raw : fallback;
  const pct = safe > 0 && safe <= 1 ? safe * 100 : safe;

  return Math.max(0, Math.min(100, Math.round(pct)));
}

function upper(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return dayjs(dueDate).isBefore(dayjs(), "day");
}

function isDueSoon(dueDate?: string) {
  if (!dueDate) return false;

  const due = dayjs(dueDate);

  return (
    due.isSame(dayjs(), "day") ||
    (due.isAfter(dayjs(), "day") && due.diff(dayjs(), "day") <= 3)
  );
}

function getCurrentEmployeeId(user: unknown) {
  return getAnyString(user, [
    "employeeId",
    "userId",
    "id",
    "operatorId",
    "accountId",
  ]);
}

function getCurrentUserName(user: unknown) {
  return getAnyString(user, ["fullName", "name", "username", "email"]);
}

function getInstanceId(instance: OnboardingInstance) {
  return getAnyString(instance, ["id", "instanceId", "onboardingId"]);
}

function getInstanceStatus(instance?: OnboardingInstance | null) {
  return getAnyString(instance, ["status"]) ?? "—";
}

function getInstanceProgress(instance?: OnboardingInstance | null) {
  if (!instance) return 0;
  return normalizePercent(
    getAnyNumber(instance, ["progress", "progressPercent"], 0),
  );
}

function getInstanceStartDate(instance?: OnboardingInstance | null) {
  return getAnyString(instance, ["startDate", "startedAt", "createdAt"]);
}

function getInstanceManagerName(instance?: OnboardingInstance | null) {
  return getAnyString(instance, ["managerName", "managerFullName"]);
}

function getTaskId(task: OnboardingTask) {
  return (
    getAnyString(task, ["id", "taskId", "taskInstanceId"]) ??
    `${getTaskTitle(task)}-${getTaskDueDate(task) ?? "no-due"}`
  );
}

function getTaskTitle(task: OnboardingTask) {
  return getAnyString(task, ["title", "taskName", "name"]) ?? "—";
}

function getTaskDescription(task: OnboardingTask) {
  return getAnyString(task, ["description", "note", "content"]);
}

function getTaskStatus(task: OnboardingTask) {
  return getAnyString(task, ["rawStatus", "status", "taskStatus"]) ?? "PENDING";
}

function getTaskApprovalStatus(task: OnboardingTask) {
  return getAnyString(task, ["approvalStatus"]);
}

function getTaskScheduleStatus(task: OnboardingTask) {
  return getAnyString(task, ["scheduleStatus"]);
}

function getTaskDueDate(task: OnboardingTask) {
  return getAnyString(task, ["dueDate", "deadline", "scheduledEndAt"]);
}

function getTaskOnboardingId(task: OnboardingTask) {
  return getAnyString(task, [
    "onboardingId",
    "instanceId",
    "onboardingInstanceId",
  ]);
}

function isTaskDone(task: OnboardingTask) {
  const status = upper(getTaskStatus(task));
  return status === "DONE" || status === "COMPLETED";
}

function isTaskInProgress(task: OnboardingTask) {
  return upper(getTaskStatus(task)) === "IN_PROGRESS";
}

function isTaskWaitingAck(task: OnboardingTask) {
  const status = upper(getTaskStatus(task));
  return status === "WAIT_ACK" || status === "WAITING_ACK";
}

function isTaskPendingApproval(task: OnboardingTask) {
  return upper(getTaskStatus(task)) === "PENDING_APPROVAL";
}

function isTaskRejected(task: OnboardingTask) {
  return upper(getTaskApprovalStatus(task)) === "REJECTED";
}

function isTaskOverdue(task: OnboardingTask) {
  if (isTaskDone(task)) return false;
  return isOverdue(getTaskDueDate(task));
}

function isTaskDueSoon(task: OnboardingTask) {
  if (isTaskDone(task)) return false;
  return isDueSoon(getTaskDueDate(task));
}

function taskStatusColor(task: OnboardingTask) {
  if (isTaskDone(task)) return "green";
  if (isTaskRejected(task)) return "red";
  if (isTaskOverdue(task)) return "red";
  if (isTaskDueSoon(task)) return "gold";
  if (isTaskInProgress(task)) return "blue";
  if (isTaskPendingApproval(task)) return "purple";
  if (isTaskWaitingAck(task)) return "orange";

  return "default";
}

function instanceStatusColor(status?: string) {
  switch (upper(status)) {
    case "ACTIVE":
      return "blue";
    case "COMPLETED":
      return "green";
    case "CANCELLED":
    case "CANCELED":
      return "red";
    case "OVERDUE":
    case "RISK":
      return "volcano";
    case "DRAFT":
    default:
      return "default";
  }
}

function taskStatusLabel(status?: string) {
  switch (upper(status)) {
    case "DONE":
    case "COMPLETED":
      return "Completed";
    case "IN_PROGRESS":
      return "In progress";
    case "PENDING_APPROVAL":
      return "Pending approval";
    case "WAIT_ACK":
    case "WAITING_ACK":
      return "Waiting acknowledgment";
    case "TODO":
    case "ASSIGNED":
      return "Assigned";
    case "PENDING":
      return "Pending";
    default:
      return status || "Pending";
  }
}

function useEmployeeInstancesQuery(employeeId?: string) {
  return useQuery({
    queryKey: ["employee-instances", employeeId ?? ""],
    queryFn: () => apiListInstances({ employeeId }),
    enabled: Boolean(employeeId),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });
}

function useEmployeeTasksQuery(employeeId?: string) {
  return useQuery({
    queryKey: ["employee-tasks-by-assignee", employeeId ?? ""],
    queryFn: () =>
      apiListTasksByAssignee({
        size: 100,
        sortBy: "due_date",
        sortOrder: "ASC",
      }),
    enabled: Boolean(employeeId),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "tasks",
        "content",
        "items",
        "list",
      ).map(mapTask) as OnboardingTask[],
  });
}

function useTaskDetailQuery(taskId?: string | null) {
  return useQuery({
    queryKey: ["employee-task-detail", taskId ?? ""],
    queryFn: () =>
      apiGetTaskDetailFull(taskId!, {
        includeComments: true,
        includeAttachments: true,
        includeActivityLogs: true,
      }),
    enabled: Boolean(taskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const raw = r?.task ?? r?.data ?? r?.result ?? r?.payload ?? res;
      if (!raw || typeof raw !== "object") return null;
      return raw as TaskDetailResponse;
    },
  });
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  tone: Tone;
}) {
  const toneClass: Record<Tone, string> = {
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    indigo: "bg-indigo-50 text-indigo-700",
    slate: "bg-slate-50 text-slate-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <Card
      size="small"
      className="overflow-hidden border border-stroke bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${toneClass[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

function ActionItem({
  icon,
  title,
  value,
  tone,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  tone: "red" | "amber" | "blue" | "green" | "slate";
}) {
  const toneClass = {
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  }[tone];

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-3 py-3 ${toneClass}`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-white/70 p-2">{icon}</div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <span className="text-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-800">
        {value || "—"}
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.currentUser);

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const formatMsg = (
    key: string,
    fallback: string,
    params: Record<string, string | number>,
  ) => {
    let text = tr(key, fallback);

    Object.entries(params).forEach(([k, v]) => {
      text = text.replaceAll(`{${k}}`, String(v));
    });

    return text;
  };

  const employeeId = getCurrentEmployeeId(currentUser);
  const employeeName = getCurrentUserName(currentUser) ?? "Employee";

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: instances = [], isLoading: instancesLoading } =
    useEmployeeInstancesQuery(employeeId);

  const {
    data: allAssigneeTasks = [],
    isLoading: tasksLoading,
    isFetching: tasksFetching,
  } = useEmployeeTasksQuery(employeeId);

  const {
    data: taskDetail,
    isLoading: taskDetailLoading,
    isFetching: taskDetailFetching,
  } = useTaskDetailQuery(selectedTaskId);

  const latestInstance = useMemo(() => {
    if (!instances.length) return null;

    const rank: Record<string, number> = {
      ACTIVE: 0,
      DRAFT: 1,
      PENDING: 1,
      COMPLETED: 2,
      CANCELLED: 3,
      CANCELED: 3,
    };

    return [...instances].sort((a, b) => {
      const aStatus = upper(a.status);
      const bStatus = upper(b.status);

      const rd = (rank[aStatus] ?? 99) - (rank[bStatus] ?? 99);
      if (rd !== 0) return rd;

      return (
        dayjs(getInstanceStartDate(b)).valueOf() -
        dayjs(getInstanceStartDate(a)).valueOf()
      );
    })[0];
  }, [instances]);

  const tasks = useMemo(() => {
    const latestId = getInstanceId(
      latestInstance ?? ({} as OnboardingInstance),
    );

    if (!latestId) return allAssigneeTasks;

    return allAssigneeTasks.filter((task) => {
      const taskOnboardingId = getTaskOnboardingId(task);
      return !taskOnboardingId || taskOnboardingId === latestId;
    });
  }, [allAssigneeTasks, latestInstance]);

  const invalidateTasks = () => {
    queryClient.invalidateQueries({
      queryKey: ["employee-tasks-by-assignee", employeeId ?? ""],
    });

    queryClient.invalidateQueries({
      queryKey: ["employee-instances", employeeId ?? ""],
    });

    if (selectedTaskId) {
      queryClient.invalidateQueries({
        queryKey: ["employee-task-detail", selectedTaskId],
      });
    }
  };

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
    onSuccess: () => {
      invalidateTasks();
      notify.success(
        tr(
          "dashboard.employee.notify.update_success",
          "Cập nhật task thành công",
        ),
      );
    },
    onError: () => {
      notify.error(tr("dashboard.employee.notify.error", "Có lỗi xảy ra"));
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (taskId: string) => apiAcknowledgeTask({ taskId }),
    onSuccess: () => {
      invalidateTasks();
      notify.success(
        tr("dashboard.employee.notify.ack_success", "Đã xác nhận task"),
      );
    },
    onError: () => {
      notify.error(tr("dashboard.employee.notify.error", "Có lỗi xảy ra"));
    },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(isTaskDone).length;
  const pendingTasks = tasks.filter((task) => !isTaskDone(task));
  const overdueTasks = pendingTasks.filter(isTaskOverdue);
  const dueSoonTasks = pendingTasks.filter(isTaskDueSoon);
  const rejectedTasks = allAssigneeTasks.filter(isTaskRejected);
  const scheduledTasks = allAssigneeTasks.filter((task) => {
    const status = upper(getTaskScheduleStatus(task));
    return status === "PROPOSED" || status === "CONFIRMED";
  });

  const completionPct = useMemo(() => {
    const instanceProgress = getInstanceProgress(latestInstance);

    if (instanceProgress > 0) return instanceProgress;

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [latestInstance, totalTasks, completedTasks]);

  const daysInOnboarding = latestInstance
    ? dayjs().diff(dayjs(getInstanceStartDate(latestInstance)), "day") + 1
    : null;

  const tasksByStatus = useMemo(
    () => ({
      todo: tasks.filter((task) => {
        const status = upper(getTaskStatus(task));
        return (
          !status ||
          status === "TODO" ||
          status === "ASSIGNED" ||
          status === "PENDING"
        );
      }).length,
      inProgress: tasks.filter(isTaskInProgress).length,
      waitAck: tasks.filter(isTaskWaitingAck).length,
      pendingApproval: tasks.filter(isTaskPendingApproval).length,
      done: completedTasks,
    }),
    [tasks, completedTasks],
  );

  const priorityTasks = useMemo(() => {
    const map = new Map<string, OnboardingTask>();

    [
      ...overdueTasks,
      ...dueSoonTasks,
      ...rejectedTasks,
      ...pendingTasks,
    ].forEach((task) => {
      map.set(getTaskId(task), task);
    });

    return Array.from(map.values()).slice(0, 8);
  }, [overdueTasks, dueSoonTasks, rejectedTasks, pendingTasks]);

  const upcomingTasks = useMemo(
    () =>
      pendingTasks
        .filter((task) => getTaskDueDate(task))
        .sort((a, b) =>
          String(getTaskDueDate(a)).localeCompare(String(getTaskDueDate(b))),
        )
        .slice(0, 6),
    [pendingTasks],
  );

  const kpis = [
    {
      label: tr("dashboard.employee.kpi.progress", "Tiến độ onboarding"),
      value: `${completionPct}%`,
      sub: latestInstance
        ? `${getInstanceStatus(latestInstance)} • ${totalTasks} task`
        : tr("dashboard.employee.kpi.no_onboarding", "Chưa có onboarding"),
      icon: <Layers className="h-4 w-4" />,
      tone: "teal" as const,
    },
    {
      label: tr("dashboard.employee.kpi.completed_tasks", "Task đã hoàn thành"),
      value: `${completedTasks}/${totalTasks}`,
      sub: tr(
        "dashboard.employee.kpi.current_onboarding",
        "Trong onboarding hiện tại",
      ),
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: "emerald" as const,
    },
    {
      label: tr("dashboard.employee.kpi.pending_tasks", "Task cần xử lý"),
      value: String(pendingTasks.length),
      sub: tr("dashboard.employee.kpi.pending_desc", "Chưa hoàn thành"),
      icon: <ClipboardList className="h-4 w-4" />,
      tone: "amber" as const,
    },
    {
      label: tr("dashboard.employee.kpi.overdue", "Quá hạn"),
      value: String(overdueTasks.length),
      sub: tr("dashboard.employee.kpi.overdue_desc", "Cần xử lý ngay"),
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: overdueTasks.length > 0 ? ("rose" as const) : ("slate" as const),
    },
    {
      label: tr("dashboard.employee.kpi.days", "Ngày onboarding"),
      value: daysInOnboarding ? String(daysInOnboarding) : "—",
      sub: latestInstance?.startDate
        ? dayjs(getInstanceStartDate(latestInstance)).format("DD/MM/YYYY")
        : tr("dashboard.employee.kpi.no_start_date", "Chưa có ngày bắt đầu"),
      icon: <Calendar className="h-4 w-4" />,
      tone: "indigo" as const,
    },
  ];

  const taskColumns = [
    {
      title: tr("dashboard.employee.table.task", "Task"),
      key: "task",
      render: (record: OnboardingTask) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setSelectedTaskId(getTaskId(record))}
            className="max-w-full truncate text-left font-medium text-blue-600 hover:underline"
          >
            {getTaskTitle(record)}
          </button>
          {getTaskDescription(record) && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted">
              {getTaskDescription(record)}
            </p>
          )}
          {getTaskDueDate(record) && (
            <p className="mt-1 text-xs text-muted">
              {tr("dashboard.employee.table.due_date", "Hạn")}:{" "}
              {dayjs(getTaskDueDate(record)).format("DD/MM/YYYY")}
            </p>
          )}
        </div>
      ),
    },
    {
      title: tr("dashboard.employee.table.status", "Trạng thái"),
      key: "status",
      width: 160,
      render: (record: OnboardingTask) => (
        <Tag color={taskStatusColor(record)}>
          {taskStatusLabel(getTaskStatus(record))}
        </Tag>
      ),
    },
    {
      title: tr("dashboard.employee.table.action", "Hành động"),
      key: "action",
      width: 190,
      render: (record: OnboardingTask) => {
        const taskId = getTaskId(record);

        if (isTaskDone(record)) {
          return (
            <Tag color="green">
              {tr("dashboard.employee.action.completed", "Đã hoàn thành")}
            </Tag>
          );
        }

        if (isTaskWaitingAck(record)) {
          return (
            <Button
              size="small"
              type="primary"
              loading={acknowledgeMutation.isPending}
              onClick={() => acknowledgeMutation.mutate(taskId)}
            >
              {tr("dashboard.employee.action.ack", "Xác nhận")}
            </Button>
          );
        }

        return (
          <div className="flex flex-wrap gap-2">
            {!isTaskInProgress(record) && (
              <Button
                size="small"
                loading={updateTaskStatusMutation.isPending}
                onClick={() =>
                  updateTaskStatusMutation.mutate({
                    taskId,
                    status: STATUS_IN_PROGRESS_API,
                  })
                }
              >
                {tr("dashboard.employee.action.start", "Bắt đầu")}
              </Button>
            )}

            <Button
              size="small"
              type="primary"
              loading={updateTaskStatusMutation.isPending}
              onClick={() =>
                updateTaskStatusMutation.mutate({
                  taskId,
                  status: STATUS_DONE_API,
                })
              }
            >
              {tr("dashboard.employee.action.done", "Hoàn tất")}
            </Button>
          </div>
        );
      },
    },
  ];

  const detailRecord = toRecord(taskDetail);
  const detailTitle =
    getAnyString(detailRecord, ["title", "taskName", "name"]) ??
    tr("dashboard.employee.detail.title", "Chi tiết task");
  const detailDescription = getAnyString(detailRecord, [
    "description",
    "note",
    "content",
  ]);
  const detailStatus = getAnyString(detailRecord, [
    "status",
    "rawStatus",
    "taskStatus",
  ]);
  const detailDueDate = getAnyString(detailRecord, ["dueDate", "deadline"]);
  const detailAttachments = Array.isArray(detailRecord.attachments)
    ? detailRecord.attachments
    : [];
  const detailComments = Array.isArray(detailRecord.comments)
    ? detailRecord.comments
    : [];
  const detailLogs = Array.isArray(detailRecord.activityLogs)
    ? detailRecord.activityLogs
    : [];

  const isLoading = instancesLoading || tasksLoading;

  if (!employeeId) {
    return (
      <Alert
        type="warning"
        showIcon
        message={tr(
          "dashboard.employee.no_user",
          "Không xác định được nhân viên hiện tại",
        )}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink">
          {tr("dashboard.employee.title", "Dashboard nhân viên")}
        </h1>
        <p className="text-sm text-muted">
          {formatMsg(
            "dashboard.employee.subtitle",
            "Xin chào, {name}! Đây là tiến độ onboarding và task của bạn.",
            { name: employeeName },
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Card key={`employee-kpi-sk-${i}`}>
              <Skeleton active paragraph={{ rows: 2 }} title={false} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-stroke bg-white shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                {tr(
                  "dashboard.employee.section.current_onboarding",
                  "Onboarding hiện tại",
                )}
              </h2>
              <p className="text-sm text-muted">
                {tr(
                  "dashboard.employee.section.current_onboarding_desc",
                  "Theo dõi tiến độ onboarding và người quản lý phụ trách.",
                )}
              </p>
            </div>

            <Button
              icon={<RefreshCcw className="h-4 w-4" />}
              onClick={invalidateTasks}
            >
              {tr("global.refresh", "Refresh")}
            </Button>
          </div>

          {!latestInstance ? (
            <Empty
              description={tr(
                "dashboard.employee.empty.no_onboarding",
                "Bạn chưa có onboarding nào.",
              )}
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-stroke bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag color={instanceStatusColor(latestInstance.status)}>
                        {getInstanceStatus(latestInstance)}
                      </Tag>
                      {getInstanceManagerName(latestInstance) && (
                        <Tag color="blue">
                          {tr("dashboard.employee.manager", "Quản lý")}:{" "}
                          {getInstanceManagerName(latestInstance)}
                        </Tag>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-muted">
                      {tr("dashboard.employee.start_date", "Ngày bắt đầu")}:{" "}
                      <span className="font-medium text-ink">
                        {getInstanceStartDate(latestInstance)
                          ? dayjs(getInstanceStartDate(latestInstance)).format(
                              "DD/MM/YYYY",
                            )
                          : "—"}
                      </span>
                    </p>
                  </div>

                  <Link
                    to={`${AppRouters.ONBOARDING_EMPLOYEES}/${getInstanceId(latestInstance)}`}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  >
                    {tr("dashboard.employee.view_detail", "Xem chi tiết")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      {tr("dashboard.employee.progress", "Tiến độ")}
                    </span>
                    <span className="text-sm font-bold text-ink">
                      {completionPct}%
                    </span>
                  </div>
                  <Progress percent={completionPct} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-5">
                <ActionItem
                  icon={<CircleDashed className="h-4 w-4" />}
                  title={tr("dashboard.employee.status.todo", "Chưa làm")}
                  value={tasksByStatus.todo}
                  tone="slate"
                />
                <ActionItem
                  icon={<Clock className="h-4 w-4" />}
                  title={tr(
                    "dashboard.employee.status.in_progress",
                    "Đang làm",
                  )}
                  value={tasksByStatus.inProgress}
                  tone="blue"
                />
                <ActionItem
                  icon={<BellRing className="h-4 w-4" />}
                  title={tr(
                    "dashboard.employee.status.wait_ack",
                    "Chờ xác nhận",
                  )}
                  value={tasksByStatus.waitAck}
                  tone="amber"
                />
                <ActionItem
                  icon={<UserCheck className="h-4 w-4" />}
                  title={tr(
                    "dashboard.employee.status.pending_approval",
                    "Chờ duyệt",
                  )}
                  value={tasksByStatus.pendingApproval}
                  tone="amber"
                />
                <ActionItem
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  title={tr("dashboard.employee.status.done", "Hoàn tất")}
                  value={tasksByStatus.done}
                  tone="green"
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="border border-amber-200 bg-amber-50/30 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-base font-semibold text-ink">
              {tr("dashboard.employee.section.action_center", "Việc cần xử lý")}
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            {tr(
              "dashboard.employee.section.action_center_desc",
              "Ưu tiên task quá hạn, sắp đến hạn hoặc bị từ chối.",
            )}
          </p>

          <div className="mt-4 space-y-3">
            <ActionItem
              icon={<AlertTriangle className="h-4 w-4" />}
              title={tr(
                "dashboard.employee.action_center.overdue",
                "Task quá hạn",
              )}
              value={overdueTasks.length}
              tone={overdueTasks.length > 0 ? "red" : "slate"}
            />
            <ActionItem
              icon={<CalendarClock className="h-4 w-4" />}
              title={tr(
                "dashboard.employee.action_center.due_soon",
                "Sắp đến hạn",
              )}
              value={dueSoonTasks.length}
              tone={dueSoonTasks.length > 0 ? "amber" : "slate"}
            />
            <ActionItem
              icon={<ThumbsDown className="h-4 w-4" />}
              title={tr(
                "dashboard.employee.action_center.rejected",
                "Bị từ chối",
              )}
              value={rejectedTasks.length}
              tone={rejectedTasks.length > 0 ? "red" : "slate"}
            />
            <ActionItem
              icon={<CalendarClock className="h-4 w-4" />}
              title={tr(
                "dashboard.employee.action_center.scheduled",
                "Task có lịch",
              )}
              value={scheduledTasks.length}
              tone={scheduledTasks.length > 0 ? "blue" : "slate"}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr("dashboard.employee.section.priority_tasks", "Task ưu tiên")}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.employee.section.priority_tasks_desc",
              "Các task cần hoàn thành sớm hoặc đang có vấn đề.",
            )}
          </p>

          <div className="mt-4">
            {tasksLoading || tasksFetching ? (
              <Skeleton active paragraph={{ rows: 6 }} title={false} />
            ) : priorityTasks.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.employee.empty.no_priority",
                  "Không có task cần ưu tiên.",
                )}
              />
            ) : (
              <Table
                dataSource={priorityTasks}
                columns={taskColumns}
                rowKey={(record) => getTaskId(record)}
                pagination={false}
                scroll={{ x: 760 }}
              />
            )}
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr(
              "dashboard.employee.section.upcoming_tasks",
              "Lịch task sắp tới",
            )}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.employee.section.upcoming_tasks_desc",
              "Các task có hạn xử lý gần nhất.",
            )}
          </p>

          <div className="mt-4 space-y-2">
            {tasksLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : upcomingTasks.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.employee.empty.no_upcoming",
                  "Không có task sắp tới.",
                )}
              />
            ) : (
              upcomingTasks.map((task) => (
                <button
                  key={getTaskId(task)}
                  type="button"
                  onClick={() => setSelectedTaskId(getTaskId(task))}
                  className="w-full rounded-xl border border-stroke bg-white px-3 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {getTaskTitle(task)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {getTaskDueDate(task)
                          ? dayjs(getTaskDueDate(task)).format("DD/MM/YYYY")
                          : "—"}
                      </p>
                    </div>
                    <Tag color={taskStatusColor(task)}>
                      {taskStatusLabel(getTaskStatus(task))}
                    </Tag>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <Drawer
        title={detailTitle}
        width={620}
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
      >
        {taskDetailLoading || taskDetailFetching ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !taskDetail ? (
          <Empty
            description={tr(
              "dashboard.employee.empty.no_task_detail",
              "Không có dữ liệu chi tiết task.",
            )}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-stroke bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Tag
                  color={taskStatusColor(
                    taskDetail as unknown as OnboardingTask,
                  )}
                >
                  {taskStatusLabel(detailStatus)}
                </Tag>
                {detailDueDate && isOverdue(detailDueDate) && (
                  <Tag color="red">
                    {tr("dashboard.employee.reason.overdue", "Quá hạn")}
                  </Tag>
                )}
              </div>

              {detailDescription && (
                <Typography.Paragraph className="mt-4 text-sm text-slate-700">
                  {detailDescription}
                </Typography.Paragraph>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailRow
                  label={tr("dashboard.employee.detail.due_date", "Hạn xử lý")}
                  value={
                    detailDueDate
                      ? dayjs(detailDueDate).format("DD/MM/YYYY")
                      : "—"
                  }
                />
                <DetailRow
                  label={tr("dashboard.employee.detail.status", "Trạng thái")}
                  value={taskStatusLabel(detailStatus)}
                />
              </div>
            </div>

            {detailAttachments.length > 0 && (
              <Card size="small">
                <div className="mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  <p className="font-semibold text-ink">
                    {tr(
                      "dashboard.employee.detail.attachments",
                      "Tệp đính kèm",
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  {detailAttachments.map((item: unknown, index: number) => {
                    const file = toRecord(item);
                    const name =
                      getAnyString(file, [
                        "fileName",
                        "name",
                        "originalName",
                      ]) ?? `Attachment ${index + 1}`;

                    return (
                      <div
                        key={`${name}-${index}`}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-700">{name}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {detailComments.length > 0 && (
              <Card size="small">
                <p className="mb-3 font-semibold text-ink">
                  {tr("dashboard.employee.detail.comments", "Bình luận")}
                </p>

                <div className="space-y-3">
                  {detailComments.map((item: unknown, index: number) => {
                    const comment = toRecord(item);
                    const content =
                      getAnyString(comment, ["content", "message", "text"]) ??
                      "—";
                    const createdAt = getAnyString(comment, [
                      "createdAt",
                      "time",
                    ]);

                    return (
                      <div
                        key={`${content}-${index}`}
                        className="rounded-xl bg-slate-50 px-3 py-2"
                      >
                        <p className="text-sm text-slate-700">{content}</p>
                        {createdAt && (
                          <p className="mt-1 text-xs text-slate-400">
                            {dayjs(createdAt).format("DD/MM/YYYY HH:mm")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {detailLogs.length > 0 && (
              <Card size="small">
                <p className="mb-3 font-semibold text-ink">
                  {tr(
                    "dashboard.employee.detail.activity",
                    "Lịch sử hoạt động",
                  )}
                </p>

                <div className="space-y-2">
                  {detailLogs.map((item: unknown, index: number) => {
                    const log = toRecord(item);
                    const action =
                      getAnyString(log, ["action", "message", "description"]) ??
                      "—";
                    const createdAt = getAnyString(log, ["createdAt", "time"]);

                    return (
                      <div
                        key={`${action}-${index}`}
                        className="rounded-xl bg-slate-50 px-3 py-2"
                      >
                        <p className="text-sm text-slate-700">{action}</p>
                        {createdAt && (
                          <p className="mt-1 text-xs text-slate-400">
                            {dayjs(createdAt).format("DD/MM/YYYY HH:mm")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <div className="sticky bottom-0 -mx-6 border-t border-stroke bg-white px-6 py-4">
              <div className="flex flex-wrap justify-end gap-2">
                <Button onClick={() => setSelectedTaskId(null)}>
                  {tr("global.close", "Đóng")}
                </Button>

                {selectedTaskId && (
                  <Button
                    type="primary"
                    loading={updateTaskStatusMutation.isPending}
                    onClick={() =>
                      updateTaskStatusMutation.mutate({
                        taskId: selectedTaskId,
                        status: STATUS_DONE_API,
                      })
                    }
                  >
                    {tr("dashboard.employee.action.done", "Hoàn tất")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
