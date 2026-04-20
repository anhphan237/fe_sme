import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Drawer,
  Empty,
  Progress,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import {
  AlertCircle,
  AlertTriangle,
  BellRing,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Clock,
  Layers,
  Paperclip,
  ThumbsDown,
  User,
  UserCheck,
} from "lucide-react";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { AppLoading } from "@/components/page-loading";
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

const STATUS_DONE_API = "DONE";

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return dayjs(dueDate).isBefore(dayjs(), "day");
}

function taskStatusVariant(
  rawStatus?: string,
): "success" | "processing" | "warning" | "error" {
  switch (rawStatus) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "processing";
    case "PENDING_APPROVAL":
    case "WAIT_ACK":
      return "warning";
    default:
      return "warning";
  }
}


export default function EmployeeDashboard() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.currentUser);
  const employeeId = currentUser?.employeeId ?? currentUser?.id ?? undefined;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: instances = [], isLoading: instancesLoading } = useQuery({
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

  const latestInstance = useMemo(() => {
    if (!instances.length) return null;
    const rank: Record<string, number> = {
      ACTIVE: 0,
      DRAFT: 1,
      PENDING: 1,
      COMPLETED: 2,
      CANCELLED: 3,
    };
    return [...instances].sort((a, b) => {
      const rd = (rank[a.status] ?? 99) - (rank[b.status] ?? 99);
      if (rd !== 0) return rd;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    })[0];
  }, [instances]);

  // Employee tasks — ALWAYS via listByAssignee (current operator = logged-in employee)
  const { data: allAssigneeTasks = [], isLoading: tasksLoading, isFetching: tasksFetching } = useQuery({
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

  // Focus statistics on the active instance when available; otherwise show all
  const tasks = useMemo(() => {
    if (!latestInstance?.id) return allAssigneeTasks;
    return allAssigneeTasks.filter(
      (t) => !t.onboardingId || t.onboardingId === latestInstance.id,
    );
  }, [allAssigneeTasks, latestInstance?.id]);


  const { data: taskDetail, isLoading: taskDetailLoading, isFetching: taskDetailFetching } = useQuery({
    queryKey: ["employee-task-detail", selectedTaskId ?? ""],
    queryFn: () =>
      apiGetTaskDetailFull(selectedTaskId!, {
        includeComments: true,
        includeAttachments: true,
        includeActivityLogs: true,
      }),
    enabled: Boolean(selectedTaskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const raw = r?.task ?? r?.data ?? r?.result ?? r?.payload ?? res;
      if (!raw || typeof raw !== "object") return null;
      return raw as TaskDetailResponse;
    },
  });

  // ── Mutations ───────────────────────────────────────────────

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

  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (taskId: string) => apiAcknowledgeTask({ taskId }),
    onSuccess: () => {
      invalidateTasks();
      notify.success(t("dashboard.employee.notify.ack_success"));
    },
    onError: () => notify.error(t("dashboard.employee.notify.error")),
  });

  // ── Derived stats ────────────────────────────────────────────

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.rawStatus === "DONE").length;
  const pendingList = tasks.filter((t) => t.rawStatus !== "DONE");
  const overdueList = pendingList.filter((t) => isOverdue(t.dueDate));
  const dueSoonList = pendingList.filter((t) => {
    if (!t.dueDate) return false;
    const ms = dayjs(t.dueDate).diff(dayjs(), "millisecond");
    return ms >= 0 && ms <= 3 * 24 * 60 * 60 * 1000;
  });

  // Rejected tasks: tasks where approvalStatus === "REJECTED"
  const rejectedTasks = useMemo(
    () => allAssigneeTasks.filter((t) => t.approvalStatus === "REJECTED"),
    [allAssigneeTasks],
  );

  // Upcoming scheduled tasks: scheduleStatus PROPOSED or CONFIRMED
  const scheduledTasks = useMemo(
    () =>
      allAssigneeTasks.filter(
        (t) =>
          t.scheduleStatus === "PROPOSED" || t.scheduleStatus === "CONFIRMED",
      ),
    [allAssigneeTasks],
  );

  // Use latestInstance.progress from BE when available, fallback to manual calc
  const completionPct = useMemo(() => {
    if (latestInstance && (latestInstance.progress ?? 0) > 0)
      return latestInstance.progress;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [latestInstance, totalTasks, completedTasks]);


  const daysInOnboarding = latestInstance?.startDate
    ? dayjs().diff(dayjs(latestInstance.startDate), "day") + 1
    : null;

  const tasksByStatus = useMemo(
    () => ({
      todo: tasks.filter(
        (t) => !t.rawStatus || ["TODO", "ASSIGNED"].includes(t.rawStatus),
      ).length,
      inProgress: tasks.filter((t) => t.rawStatus === "IN_PROGRESS").length,
      waitAck: tasks.filter((t) => t.rawStatus === "WAIT_ACK").length,
      pendingApproval: tasks.filter((t) => t.rawStatus === "PENDING_APPROVAL")
        .length,
      done: completedTasks,
    }),
    [tasks, completedTasks],
  );

  const stageProgress = useMemo(() => {
    const groups: Record<
      string,
      { name: string; total: number; done: number }
    > = {};
    for (const task of tasks) {
      const key = task.checklistName ?? t("dashboard.employee.other_tasks");
      if (!groups[key]) groups[key] = { name: key, total: 0, done: 0 };
      groups[key].total++;
      if (task.rawStatus === "DONE") groups[key].done++;
    }
    return Object.values(groups);
  }, [tasks]);

  // Timeline: simple start → estimated completion
  const timelineData = useMemo(() => {
    if (!latestInstance?.startDate) return null;
    const startDate = latestInstance.startDate;
    let estimatedEndDate: string | null = null;
    if (totalTasks > 0 && completedTasks > 0 && daysInOnboarding) {
      const estimatedTotal = Math.round(
        daysInOnboarding * (totalTasks / completedTasks),
      );
      estimatedEndDate = dayjs(startDate)
        .add(estimatedTotal, "day")
        .format("DD/MM/YYYY");
    }
    return { startDate, estimatedEndDate };
  }, [latestInstance?.startDate, totalTasks, completedTasks, daysInOnboarding]);

  const urgentTasks = useMemo(() => {
    const score = (t: OnboardingTask) => {
      if (!t.dueDate) return 999999999;
      const due = new Date(t.dueDate).getTime();
      return (due < Date.now() ? -1000000000 : 0) + due;
    };
    return [...pendingList].sort((a, b) => score(a) - score(b)).slice(0, 8);
  }, [pendingList]);

  const actionNeededTasks = useMemo(
    () =>
      pendingList.filter(
        (t) => t.rawStatus === "WAIT_ACK" || t.rawStatus === "PENDING_APPROVAL",
      ),
    [pendingList],
  );

  // ── Handlers ────────────────────────────────────────────────

  const handleToggleTask = async (task: OnboardingTask) => {
    const isDone = task.rawStatus === "DONE";
    if (isDone) {
      try {
        await updateTaskStatus.mutateAsync({ taskId: task.id, status: "TODO" });
        invalidateTasks();
        notify.success(t("dashboard.employee.notify.undo_done_success"));
      } catch {
        notify.error(t("dashboard.employee.notify.error"));
      }
      return;
    }

    if (task.requireAck && task.rawStatus !== "WAIT_ACK") {
      try {
        await acknowledgeMutation.mutateAsync(task.id);
      } catch {
        // handled by mutation onError
      }
      return;
    }

    if (task.requiresManagerApproval) {
      try {
        await updateTaskStatus.mutateAsync({
          taskId: task.id,
          status: "PENDING_APPROVAL",
        });
        invalidateTasks();
        notify.success(t("dashboard.employee.notify.approval_sent"));
      } catch {
        notify.error(t("dashboard.employee.notify.error"));
      }
      return;
    }

    try {
      await updateTaskStatus.mutateAsync({
        taskId: task.id,
        status: STATUS_DONE_API,
      });
      invalidateTasks();
      notify.success(t("dashboard.employee.notify.done_success"));
    } catch {
      notify.error(t("dashboard.employee.notify.error"));
    }
  };

  const isMutating =
    updateTaskStatus.isPending || acknowledgeMutation.isPending;

  if (instancesLoading) {
    return (
      <div className="relative min-h-screen p-6">
        <AppLoading />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="relative space-y-4 p-6">
      {(isMutating || (tasksFetching && !tasksLoading)) && <AppLoading />}
      {/* ── Row 1: Progress + Stats ─────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-stroke shadow-sm">
          <Typography.Text strong>
            {t("dashboard.employee.section.progress")}
          </Typography.Text>
          <p className="text-xs text-muted">
            {latestInstance
              ? t("dashboard.employee.progress_label", {
                  day: daysInOnboarding ?? 0,
                  completed: completedTasks,
                  total: totalTasks,
                })
              : t("dashboard.employee.no_active_onboarding")}
          </p>
          <div className="mt-4 flex flex-col items-center">
            {tasksLoading ? (
              <Skeleton.Avatar active size={120} />
            ) : (
              <>
                <Progress
                  type="circle"
                  percent={completionPct}
                  size={120}
                  strokeColor="#0f766e"
                  format={(pct) => (
                    <span className="text-lg font-bold">{pct}%</span>
                  )}
                />
                <p className="mt-3 text-center text-sm text-muted">
                  {completionPct < 100
                    ? t("dashboard.employee.tasks_remaining", {
                        count: totalTasks - completedTasks,
                      })
                    : t("dashboard.employee.all_done")}
                </p>
              </>
            )}
          </div>
          {latestInstance && (
            <div className="mt-4 flex items-center justify-between border-t border-stroke pt-3">
              <Typography.Text type="secondary" className="text-xs">
                {t("dashboard.employee.status_label")}
              </Typography.Text>
              <Tag
                color={
                  latestInstance.status === "ACTIVE"
                    ? "processing"
                    : latestInstance.status === "COMPLETED"
                      ? "success"
                      : "gold"
                }>
                {t(`onboarding.status.${latestInstance.status.toLowerCase()}`)}
              </Tag>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 content-start gap-3 lg:col-span-2">
          {[
            {
              label: t("dashboard.employee.stat.total_tasks"),
              value: totalTasks,
              icon: <ClipboardList className="h-4 w-4" />,
              bg: "bg-teal-50",
              text: "text-teal-600",
            },
            {
              label: t("dashboard.employee.stat.completed"),
              value: completedTasks,
              icon: <CheckCircle2 className="h-4 w-4" />,
              bg: "bg-emerald-50",
              text: "text-emerald-600",
            },
            {
              label: t("dashboard.employee.stat.pending"),
              value: pendingList.length,
              icon: <Clock className="h-4 w-4" />,
              bg: "bg-amber-50",
              text: "text-amber-600",
            },
            {
              label: t("dashboard.employee.stat.overdue"),
              value: overdueList.length,
              icon: <AlertCircle className="h-4 w-4" />,
              bg: "bg-red-50",
              text: "text-red-600",
            },
          ].map((s) => (
            <Card
              key={s.label}
              size="small"
              className="border border-stroke shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${s.bg} ${s.text}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}

          <Card
            size="small"
            className="col-span-2 border border-stroke shadow-sm">
            <Typography.Text type="secondary" className="mb-2 block text-xs">
              {t("dashboard.employee.status_breakdown")}
            </Typography.Text>
            <div className="grid grid-cols-5 gap-2">
              {[
                {
                  label: t("dashboard.employee.tag.todo"),
                  value: tasksByStatus.todo,
                  cls: "bg-gray-100 text-gray-700",
                },
                {
                  label: t("dashboard.employee.tag.in_progress"),
                  value: tasksByStatus.inProgress,
                  cls: "bg-blue-100 text-blue-700",
                },
                {
                  label: t("dashboard.employee.tag.wait_ack"),
                  value: tasksByStatus.waitAck,
                  cls: "bg-orange-100 text-orange-700",
                },
                {
                  label: t("dashboard.employee.tag.pending_approval"),
                  value: tasksByStatus.pendingApproval,
                  cls: "bg-amber-100 text-amber-700",
                },
                {
                  label: t("dashboard.employee.tag.done"),
                  value: tasksByStatus.done,
                  cls: "bg-emerald-100 text-emerald-700",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-lg p-2 text-center ${s.cls}`}>
                  <p className="text-lg font-bold tabular-nums">{s.value}</p>
                  <p className="text-[10px] leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Rejected tasks + Scheduled tasks (always visible) ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          className={`border shadow-sm ${rejectedTasks.length > 0 ? "border-red-300 bg-red-50" : "border-stroke"}`}
          styles={{ body: { padding: "12px 16px" } }}>
          <div className="mb-2 flex items-center gap-2">
            <ThumbsDown
              className={`h-4 w-4 ${rejectedTasks.length > 0 ? "text-red-600" : "text-muted"}`}
            />
            <Typography.Text
              strong
              className={rejectedTasks.length > 0 ? "text-red-700" : undefined}>
              {t("dashboard.employee.section.rejected", {
                count: rejectedTasks.length,
              })}
            </Typography.Text>
            {rejectedTasks.length > 0 && (
              <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {rejectedTasks.length}
              </span>
            )}
          </div>
          {tasksLoading ? (
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          ) : rejectedTasks.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-xs text-muted">
                  {t("dashboard.employee.no_rejected_tasks")}
                </span>
              }
            />
          ) : (
            <div className="space-y-2">
              {rejectedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex cursor-pointer items-start justify-between rounded-lg border border-red-200 bg-white px-3 py-2 hover:bg-red-50"
                  onClick={() => setSelectedTaskId(task.id)}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-red-800">
                      {task.title}
                    </p>
                    {task.checklistName && (
                      <p className="text-xs text-red-500">
                        {task.checklistName}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-muted">
                        {t("dashboard.employee.due_prefix")}
                        {dayjs(task.dueDate).format("DD/MM/YYYY")}
                      </p>
                    )}
                  </div>
                  <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                    <Tag color="error">
                      {t("dashboard.employee.tag.rejected")}
                    </Tag>
                    <Typography.Text className="text-xs text-blue-500 hover:underline">
                      {t("dashboard.employee.action.view_detail")}
                    </Typography.Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          className={`border shadow-sm ${scheduledTasks.length > 0 ? "border-sky-300 bg-sky-50" : "border-stroke"}`}
          styles={{ body: { padding: "12px 16px" } }}>
          <div className="mb-2 flex items-center gap-2">
            <Calendar
              className={`h-4 w-4 ${scheduledTasks.length > 0 ? "text-sky-600" : "text-muted"}`}
            />
            <Typography.Text
              strong
              className={
                scheduledTasks.length > 0 ? "text-sky-700" : undefined
              }>
              {t("dashboard.employee.section.scheduled", {
                count: scheduledTasks.length,
              })}
            </Typography.Text>
            {scheduledTasks.length > 0 && (
              <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                {scheduledTasks.length}
              </span>
            )}
          </div>
          {tasksLoading ? (
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          ) : scheduledTasks.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-xs text-muted">
                  {t("dashboard.employee.no_scheduled_tasks")}
                </span>
              }
            />
          ) : (
            <div className="space-y-2">
              {scheduledTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex cursor-pointer items-start justify-between rounded-lg border border-sky-200 bg-white px-3 py-2 hover:bg-sky-50"
                  onClick={() => setSelectedTaskId(task.id)}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-sky-800">
                      {task.title}
                    </p>
                    {task.checklistName && (
                      <p className="text-xs text-sky-500">
                        {task.checklistName}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-muted">
                        {t("dashboard.employee.due_prefix")}
                        {dayjs(task.dueDate).format("DD/MM/YYYY")}
                      </p>
                    )}
                  </div>
                  <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                    <Tag
                      color={
                        task.scheduleStatus === "CONFIRMED"
                          ? "cyan"
                          : "geekblue"
                      }>
                      {t(
                        `onboarding.task.schedule.status.${task.scheduleStatus?.toLowerCase() ?? ""}`,
                      )}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 2: Actionable urgent list + Timeline ───────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-stroke shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <Typography.Text strong>
                {t("dashboard.employee.section.urgent")}
              </Typography.Text>
              <p className="text-xs text-muted">
                {t("dashboard.employee.section.urgent_subtitle")}
              </p>
            </div>
            <Link to="/onboarding/tasks">
              <Typography.Text className="text-xs text-blue-500 hover:underline">
                {t("dashboard.employee.action.view_all")}
              </Typography.Text>
            </Link>
          </div>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 360 }}>
            {tasksLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : !latestInstance ? (
              <Empty
                description={t("dashboard.employee.no_onboarding_active")}
              />
            ) : urgentTasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                {t("dashboard.employee.all_tasks_done")}
              </p>
            ) : (
              urgentTasks.map((task) => {
                const overdue = isOverdue(task.dueDate);
                const isWaitAck = task.rawStatus === "WAIT_ACK";
                const isPendingApproval = task.rawStatus === "PENDING_APPROVAL";
                const ctaLabel = task.requireAck
                  ? isWaitAck
                    ? t("dashboard.employee.action.confirm_done")
                    : t("dashboard.employee.action.confirm_received")
                  : task.requiresManagerApproval
                    ? t("dashboard.employee.action.send_approval")
                    : t("dashboard.employee.action.mark_done");

                return (
                  <div
                    key={task.id}
                    className={`rounded-lg border px-3 py-2.5 transition-colors ${
                      overdue
                        ? "border-red-200 bg-red-50/40"
                        : isWaitAck
                          ? "border-orange-200 bg-orange-50/40"
                          : isPendingApproval
                            ? "border-amber-200 bg-amber-50/40"
                            : "border-stroke/60 bg-slate-50"
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {task.title ?? "Không có tiêu đề"}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {task.dueDate && (
                            <span
                              className={`text-xs ${overdue ? "font-semibold text-red-500" : "text-muted"}`}>
                              {overdue
                                ? t("dashboard.employee.overdue_prefix")
                                : t("dashboard.employee.due_prefix")}
                              {dayjs(task.dueDate).format("DD/MM/YYYY")}
                            </span>
                          )}
                          {task.checklistName && (
                            <span className="text-xs text-muted">
                              · {task.checklistName}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {task.requireDoc && (
                            <Tag
                              color="orange"
                              className="!m-0 !px-1.5 !py-0 !text-[10px]">
                              <Paperclip className="mr-0.5 inline h-2.5 w-2.5" />
                              {t("dashboard.employee.require_doc")}
                            </Tag>
                          )}
                          {task.requireAck && (
                            <Tag
                              color="blue"
                              className="!m-0 !px-1.5 !py-0 !text-[10px]">
                              👁 {t("dashboard.employee.require_ack")}
                            </Tag>
                          )}
                          {task.requiresManagerApproval && (
                            <Tag
                              color="purple"
                              className="!m-0 !px-1.5 !py-0 !text-[10px]">
                              {t("dashboard.employee.tag.pending_approval")}
                            </Tag>
                          )}
                          {task.approvalStatus === "REJECTED" && (
                            <Tag
                              color="error"
                              className="!m-0 !px-1.5 !py-0 !text-[10px]">
                              {t("dashboard.employee.tag.rejected")}
                            </Tag>
                          )}
                        </div>
                      </div>
                      <Badge
                        status={taskStatusVariant(task.rawStatus)}
                        text={
                          <span className="whitespace-nowrap text-xs text-muted">
                            {task.status}
                          </span>
                        }
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="small"
                        type="primary"
                        loading={
                          updateTaskStatus.isPending ||
                          acknowledgeMutation.isPending
                        }
                        disabled={isPendingApproval}
                        onClick={() => handleToggleTask(task)}>
                        {ctaLabel}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setSelectedTaskId(task.id)}>
                        {t("dashboard.employee.action.view_detail")}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Alert
            className="!mt-3"
            type="info"
            showIcon
            icon={<UserCheck className="h-4 w-4" />}
            message={t("dashboard.employee.tip_title")}
            description={t("dashboard.employee.tip_text")}
          />
        </Card>

        {/* ── Timeline progress widget ─────────────────────── */}
        <Card className="border border-stroke shadow-sm">
          <Typography.Text strong className="mb-3 block">
            {t("dashboard.employee.section.timeline")}
          </Typography.Text>
          {!timelineData ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-sm text-muted">
                  {t("dashboard.employee.no_onboarding_active")}
                </span>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-semibold text-teal-700">
                    {t("dashboard.employee.timeline.start")}
                  </span>
                  <span>
                    {dayjs(timelineData.startDate).format("DD/MM/YYYY")}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-semibold text-teal-700">
                    {t("dashboard.employee.timeline.estimated_end")}
                  </span>
                  <span>{timelineData.estimatedEndDate ?? "—"}</span>
                </div>
              </div>
              <Progress
                percent={completionPct}
                strokeColor="#0f766e"
                trailColor="#e5e7eb"
                showInfo={false}
              />
              <div className="flex items-center justify-between text-xs">
                {daysInOnboarding != null && (
                  <Typography.Text type="secondary">
                    {t("dashboard.employee.timeline.days_elapsed", {
                      day: daysInOnboarding,
                    })}
                  </Typography.Text>
                )}
                {timelineData.estimatedEndDate && daysInOnboarding != null && (
                  <Typography.Text type="secondary">
                    {t("dashboard.employee.timeline.estimated_remaining", {
                      days: Math.max(
                        0,
                        dayjs(timelineData.estimatedEndDate, "DD/MM/YYYY").diff(
                          dayjs(),
                          "day",
                        ),
                      ),
                    })}
                  </Typography.Text>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-stroke pt-3 text-xs">
                <div>
                  <span className="font-semibold uppercase text-muted">
                    {t("dashboard.employee.stat.completed")}
                  </span>
                  <p className="mt-0.5 text-base font-bold text-emerald-600">
                    {completedTasks}/{totalTasks}
                  </p>
                </div>
                <div>
                  <span className="font-semibold uppercase text-muted">
                    {t("dashboard.employee.stat.overdue")}
                  </span>
                  <p
                    className={`mt-0.5 text-base font-bold ${
                      overdueList.length > 0 ? "text-red-600" : "text-muted"
                    }`}>
                    {overdueList.length}
                  </p>
                </div>
                <div>
                  <span className="font-semibold uppercase text-muted">
                    {t("dashboard.employee.tag.wait_ack")}
                  </span>
                  <p className="mt-0.5 text-base font-bold text-amber-600">
                    {tasksByStatus.waitAck}
                  </p>
                </div>
                <div>
                  <span className="font-semibold uppercase text-muted">
                    {t("dashboard.employee.tag.pending_approval")}
                  </span>
                  <p className="mt-0.5 text-base font-bold text-violet-600">
                    {tasksByStatus.pendingApproval}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 3: Stage / Checklist Progress (always visible) ── */}
      <Card className="border border-stroke shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-500" />
          <Typography.Text strong>
            {t("dashboard.employee.section.stage_progress")}
          </Typography.Text>
          {stageProgress.length > 0 && (
            <span className="ml-auto text-xs text-muted">
              {
                stageProgress.filter((s) => s.done === s.total && s.total > 0)
                  .length
              }
              /{stageProgress.length} hoàn thành
            </span>
          )}
        </div>
        {tasksLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : stageProgress.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-xs text-muted">
                {t("dashboard.employee.no_stage_progress")}
              </span>
            }
          />
        ) : (
          <div className="space-y-3">
            {stageProgress.map((stage) => {
              const pct =
                stage.total > 0
                  ? Math.round((stage.done / stage.total) * 100)
                  : 0;
              const isDone = pct === 100 && stage.total > 0;
              const isActive = !isDone && stage.done > 0;
              return (
                <div
                  key={stage.name}
                  className={`rounded-xl border px-4 py-3 ${
                    isDone
                      ? "border-emerald-200 bg-emerald-50"
                      : isActive
                        ? "border-teal-200 bg-teal-50"
                        : "border-gray-200 bg-slate-50"
                  }`}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : isActive ? (
                        <Clock className="h-4 w-4 text-teal-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                      )}
                      <Typography.Text
                        strong
                        className={`text-sm ${
                          isDone
                            ? "text-emerald-700"
                            : isActive
                              ? "text-teal-700"
                              : "text-muted"
                        }`}>
                        {stage.name}
                      </Typography.Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Typography.Text type="secondary" className="text-xs">
                        {stage.done}/{stage.total} task
                      </Typography.Text>
                      {isDone && (
                        <Tag color="success" className="!m-0 !text-xs">
                          Xong
                        </Tag>
                      )}
                    </div>
                  </div>
                  <Progress
                    percent={pct}
                    size="small"
                    strokeColor={
                      isDone ? "#10b981" : isActive ? "#0f766e" : undefined
                    }
                    showInfo={isDone}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Row 4: Reminder stream (always visible) ─────────── */}
      <Card className="border border-stroke shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <BellRing className="h-4 w-4 text-amber-500" />
          <Typography.Text strong>
            {t("dashboard.employee.section.reminders")}
          </Typography.Text>
          {(overdueList.length > 0 ||
            dueSoonList.length > 0 ||
            actionNeededTasks.length > 0) && (
            <div className="ml-auto flex gap-1.5">
              {overdueList.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {overdueList.length} {t("dashboard.employee.tag.overdue")}
                </span>
              )}
              {dueSoonList.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {dueSoonList.length} {t("dashboard.employee.tag.due_soon")}
                </span>
              )}
              {actionNeededTasks.length > 0 && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  {actionNeededTasks.length} cần xử lý
                </span>
              )}
            </div>
          )}
        </div>
        {tasksLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} title={false} />
        ) : overdueList.length === 0 &&
          dueSoonList.length === 0 &&
          actionNeededTasks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-xs text-muted">
                {t("dashboard.employee.no_reminders")}
              </span>
            }
          />
        ) : (
          <div className="space-y-2">
            {overdueList.map((task) => (
              <div
                key={`overdue-${task.id}`}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 hover:bg-red-100"
                onClick={() => setSelectedTaskId(task.id)}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    {task.checklistName && (
                      <p className="text-xs text-muted">{task.checklistName}</p>
                    )}
                  </div>
                </div>
                <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                  <Tag color="error">{t("dashboard.employee.tag.overdue")}</Tag>
                  {task.dueDate && (
                    <span className="text-[10px] text-red-500">
                      {dayjs(task.dueDate).format("DD/MM/YYYY")}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {dueSoonList.map((task) => (
              <div
                key={`soon-${task.id}`}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100"
                onClick={() => setSelectedTaskId(task.id)}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <CircleDashed className="h-4 w-4 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    {task.checklistName && (
                      <p className="text-xs text-muted">{task.checklistName}</p>
                    )}
                  </div>
                </div>
                <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                  <Tag color="warning">
                    {t("dashboard.employee.tag.due_soon")}
                  </Tag>
                  {task.dueDate && (
                    <span className="text-[10px] text-amber-600">
                      {dayjs(task.dueDate).format("DD/MM/YYYY")}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {actionNeededTasks.map((task) => (
              <div
                key={`action-${task.id}`}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-sky-200 bg-sky-50 p-3 hover:bg-sky-100"
                onClick={() => setSelectedTaskId(task.id)}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <CalendarClock className="h-4 w-4 shrink-0 text-sky-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    {task.checklistName && (
                      <p className="text-xs text-muted">{task.checklistName}</p>
                    )}
                  </div>
                </div>
                <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                  <Tag color="processing">
                    {task.rawStatus === "WAIT_ACK"
                      ? t("dashboard.employee.tag.wait_ack")
                      : t("dashboard.employee.tag.pending_approval")}
                  </Tag>
                  {task.dueDate && (
                    <span className="text-[10px] text-sky-600">
                      {dayjs(task.dueDate).format("DD/MM/YYYY")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Row 5: Contact info ─────────────────────────────── */}
        <Card className="border border-stroke shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-teal-500" />
            <Typography.Text strong>
              {t("dashboard.employee.section.support")}
            </Typography.Text>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-stroke bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase text-muted">
                {t("dashboard.employee.support.manager_label")}
              </p>
              <p className="mt-1 text-sm font-medium">
                {latestInstance?.managerName ??
                  currentUser?.manager ??
                  currentUser?.managerUserId ??
                  t("dashboard.employee.unassigned")}
              </p>
            </div>
            <div className="rounded-lg border border-stroke bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase text-muted">
                {t("dashboard.employee.support.template_label")}
              </p>
              <p className="mt-1 text-sm font-medium">
                {latestInstance?.templateName ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-stroke bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase text-muted">
                {t("dashboard.employee.support.start_date_label")}
              </p>
              <p className="mt-1 text-sm font-medium">
                {latestInstance?.startDate
                  ? dayjs(latestInstance.startDate).format("DD/MM/YYYY")
                  : "—"}
              </p>
            </div>
            {daysInOnboarding != null && (
              <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase text-teal-600">
                  Ngày đang onboarding
                </p>
                <p className="mt-1 text-sm font-medium text-teal-700">
                  Ngày thứ {daysInOnboarding}
                </p>
              </div>
            )}
            {latestInstance && (
              <div className="rounded-lg border border-stroke bg-slate-50 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase text-muted">
                  Trạng thái
                </p>
                <div className="mt-1">
                  <Tag
                    color={
                      latestInstance.status === "ACTIVE"
                        ? "processing"
                        : latestInstance.status === "COMPLETED"
                          ? "success"
                          : "gold"
                    }>
                    {t(
                      `onboarding.status.${latestInstance.status.toLowerCase()}`,
                    )}
                  </Tag>
                </div>
              </div>
            )}
          </div>
        </Card>

      {/* ── Task detail drawer ──────────────────────────────── */}
      <Drawer
        title={t("dashboard.employee.drawer.title")}
        width={560}
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}>
        {taskDetailLoading || taskDetailFetching ? (
          <div className="relative min-h-48">
            <AppLoading />
          </div>
        ) : taskDetail ? (
          <div className="space-y-3">
            <div>
              <Typography.Text type="secondary">
                {t("dashboard.employee.drawer.title_label")}
              </Typography.Text>
              <Typography.Paragraph className="!mb-0 !mt-1" strong>
                {taskDetail.title ?? "-"}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text type="secondary">
                {t("dashboard.employee.drawer.description_label")}
              </Typography.Text>
              <Typography.Paragraph className="!mb-0 !mt-1">
                {taskDetail.description ?? "-"}
              </Typography.Paragraph>
            </div>

            {/* Rejection reason alert */}
            {taskDetail.rejectionReason && (
              <Alert
                type="error"
                showIcon
                message={t("dashboard.employee.drawer.rejection_reason")}
                description={taskDetail.rejectionReason}
              />
            )}

            {/* Approval status */}
            {taskDetail.approvalStatus && (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                <Typography.Text type="secondary" className="shrink-0">
                  {t("dashboard.employee.drawer.approval_label")}:
                </Typography.Text>
                <Tag
                  color={
                    taskDetail.approvalStatus === "APPROVED"
                      ? "success"
                      : taskDetail.approvalStatus === "REJECTED"
                        ? "error"
                        : "warning"
                  }>
                  {t(
                    `onboarding.task.approval.status.${taskDetail.approvalStatus.toLowerCase()}`,
                  )}
                </Tag>
                {taskDetail.approvedBy && (
                  <Typography.Text type="secondary" className="text-xs">
                    {t("dashboard.employee.drawer.approved_by", {
                      name: taskDetail.approvedBy,
                    })}
                  </Typography.Text>
                )}
              </div>
            )}

            {/* Status + Due */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <Typography.Text type="secondary">
                  {t("dashboard.employee.drawer.status_label")}
                </Typography.Text>
                <div className="mt-1">
                  <Tag color={taskStatusVariant(taskDetail.status)}>
                    {taskDetail.status ?? "TODO"}
                  </Tag>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <Typography.Text type="secondary">
                  {t("dashboard.employee.drawer.due_label")}
                </Typography.Text>
                <div className="mt-1 text-sm">
                  {taskDetail.dueDate
                    ? dayjs(taskDetail.dueDate).format("DD/MM/YYYY")
                    : "—"}
                </div>
              </div>
            </div>

            {/* Schedule info */}
            {(taskDetail.scheduleStatus ||
              taskDetail.scheduledStartAt ||
              taskDetail.scheduledEndAt) && (
              <div className="rounded-lg border border-sky-100 bg-sky-50 p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-sky-500" />
                  <Typography.Text strong className="text-sky-700">
                    {t("dashboard.employee.drawer.schedule_label")}
                  </Typography.Text>
                  {taskDetail.scheduleStatus && (
                    <Tag
                      color={
                        taskDetail.scheduleStatus === "CONFIRMED"
                          ? "cyan"
                          : "geekblue"
                      }
                      className="!ml-auto">
                      {t(
                        `onboarding.task.schedule.status.${taskDetail.scheduleStatus.toLowerCase()}`,
                      )}
                    </Tag>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {taskDetail.scheduledStartAt && (
                    <div>
                      <span className="text-xs text-muted">
                        {t("dashboard.employee.drawer.schedule_start")}
                      </span>
                      {dayjs(taskDetail.scheduledStartAt).format(
                        "DD/MM/YYYY HH:mm",
                      )}
                    </div>
                  )}
                  {taskDetail.scheduledEndAt && (
                    <div>
                      <span className="text-xs text-muted">
                        {t("dashboard.employee.drawer.schedule_end")}
                      </span>
                      {dayjs(taskDetail.scheduledEndAt).format(
                        "DD/MM/YYYY HH:mm",
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requirements badges */}
            {(taskDetail.requireDoc ||
              taskDetail.requireAck ||
              taskDetail.requiresManagerApproval) && (
              <div className="flex flex-wrap gap-2">
                {taskDetail.requireDoc && (
                  <Tag color="orange">
                    <Paperclip className="mr-1 inline h-3 w-3" />
                    {t("dashboard.employee.require_doc")}
                  </Tag>
                )}
                {taskDetail.requireAck && (
                  <Tag color="blue">
                    👁 {t("dashboard.employee.require_ack")}
                  </Tag>
                )}
                {taskDetail.requiresManagerApproval && (
                  <Tag color="purple">
                    {t("dashboard.employee.require_manager_approval")}
                  </Tag>
                )}
              </div>
            )}

            {/* Inline comments */}
            {Array.isArray(taskDetail.comments) &&
              taskDetail.comments.length > 0 && (
                <Collapse
                  size="small"
                  items={[
                    {
                      key: "comments",
                      label: (
                        <span className="flex items-center gap-1.5 text-sm">
                          <BellRing className="h-3.5 w-3.5" />
                          {t("dashboard.employee.drawer.comments_count", {
                            count: taskDetail.comments.length,
                          })}
                        </span>
                      ),
                      children: (
                        <div className="max-h-52 space-y-2 overflow-y-auto">
                          {taskDetail.comments.map((c) => (
                            <div
                              key={
                                (c as { commentId?: string }).commentId ??
                                Math.random()
                              }
                              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                              <div className="flex items-center justify-between">
                                <Typography.Text strong className="text-xs">
                                  {(c as { authorName?: string }).authorName ??
                                    t("dashboard.employee.anonymous")}
                                </Typography.Text>
                                <Typography.Text
                                  type="secondary"
                                  className="text-[10px]">
                                  {(c as { createdAt?: string }).createdAt
                                    ? dayjs(
                                        (c as { createdAt?: string }).createdAt,
                                      ).format("DD/MM HH:mm")
                                    : ""}
                                </Typography.Text>
                              </div>
                              <p className="mt-1 text-xs">
                                {(c as { content?: string; message?: string })
                                  .content ??
                                  (c as { content?: string; message?: string })
                                    .message}
                              </p>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                />
              )}

            {/* Attachments */}
            {Array.isArray(taskDetail.attachments) &&
              taskDetail.attachments.length > 0 && (
                <Collapse
                  size="small"
                  items={[
                    {
                      key: "attachments",
                      label: (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Paperclip className="h-3.5 w-3.5" />
                          {t("dashboard.employee.drawer.attachments_count", {
                            count: taskDetail.attachments.length,
                          })}
                        </span>
                      ),
                      children: (
                        <div className="space-y-1.5">
                          {taskDetail.attachments.map((att) => (
                            <div
                              key={
                                (att as { attachmentId?: string })
                                  .attachmentId ?? Math.random()
                              }
                              className="flex items-center gap-2 rounded border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm">
                              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted" />
                              <span className="min-w-0 flex-1 truncate">
                                {(att as { fileName?: string; name?: string })
                                  .fileName ??
                                  (att as { fileName?: string; name?: string })
                                    .name ??
                                  "Tệp không tên"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                />
              )}

            {/* Activity log */}
            {Array.isArray(taskDetail.activityLogs) &&
              taskDetail.activityLogs.length > 0 && (
                <Collapse
                  size="small"
                  items={[
                    {
                      key: "activity",
                      label: (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5" />
                          {t("dashboard.employee.drawer.activity_count", {
                            count: taskDetail.activityLogs.length,
                          })}
                        </span>
                      ),
                      children: (
                        <div className="max-h-52 space-y-1.5 overflow-y-auto">
                          {taskDetail.activityLogs.map((log) => (
                            <div
                              key={
                                (log as { logId?: string }).logId ??
                                Math.random()
                              }
                              className="flex items-start gap-2 text-xs">
                              <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                              <div>
                                <span className="font-medium">
                                  {(log as { action?: string }).action ??
                                    ""}{" "}
                                </span>
                                <span className="text-muted">
                                  {(log as { performedBy?: string })
                                    .performedBy &&
                                    t("dashboard.employee.drawer.approved_by", {
                                      name: (log as { performedBy?: string })
                                        .performedBy!,
                                    })}
                                </span>
                                {(log as { createdAt?: string }).createdAt && (
                                  <span className="ml-2 text-[10px] text-muted">
                                    ·{" "}
                                    {dayjs(
                                      (log as { createdAt?: string }).createdAt,
                                    ).format("DD/MM HH:mm")}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                />
              )}

            {taskDetail.status !== "DONE" && (
              <div className="space-y-2 pt-2">
                {taskDetail.requireAck &&
                  ["TODO", "IN_PROGRESS", "ASSIGNED"].includes(
                    taskDetail.status ?? "",
                  ) && (
                    <Button
                      type="primary"
                      block
                      loading={acknowledgeMutation.isPending}
                      onClick={() =>
                        acknowledgeMutation.mutate(taskDetail.taskId!)
                      }>
                      {t("dashboard.employee.action.confirm_received")}
                    </Button>
                  )}

                {taskDetail.status === "WAIT_ACK" && (
                  <Tooltip
                    title={
                      taskDetail.requireDoc
                        ? t("dashboard.employee.drawer.doc_required_tooltip")
                        : undefined
                    }>
                    <Button
                      type="primary"
                      block
                      loading={updateTaskStatus.isPending}
                      disabled={Boolean(taskDetail.requireDoc)}
                      onClick={() =>
                        updateTaskStatus.mutate(
                          { taskId: taskDetail.taskId!, status: "DONE" },
                          {
                            onSuccess: () => {
                              invalidateTasks();
                              notify.success(
                                t(
                                  "dashboard.employee.notify.confirm_done_success",
                                ),
                              );
                            },
                            onError: () =>
                              notify.error(
                                t("dashboard.employee.notify.error"),
                              ),
                          },
                        )
                      }>
                      {t("dashboard.employee.action.confirm_done")}
                    </Button>
                  </Tooltip>
                )}

                {!taskDetail.requireAck &&
                  taskDetail.requiresManagerApproval &&
                  ["TODO", "IN_PROGRESS", "ASSIGNED"].includes(
                    taskDetail.status ?? "",
                  ) && (
                    <Button
                      block
                      loading={updateTaskStatus.isPending}
                      onClick={() =>
                        updateTaskStatus.mutate(
                          {
                            taskId: taskDetail.taskId!,
                            status: "PENDING_APPROVAL",
                          },
                          {
                            onSuccess: () => {
                              invalidateTasks();
                              notify.success(
                                t("dashboard.employee.notify.approval_sent"),
                              );
                            },
                            onError: () =>
                              notify.error(
                                t("dashboard.employee.notify.error"),
                              ),
                          },
                        )
                      }>
                      {t("dashboard.employee.action.send_approval")}
                    </Button>
                  )}

                {!taskDetail.requireAck &&
                  !taskDetail.requiresManagerApproval &&
                  !taskDetail.requireDoc &&
                  taskDetail.status !== "WAIT_ACK" &&
                  taskDetail.status !== "PENDING_APPROVAL" && (
                    <Button
                      type="primary"
                      block
                      loading={updateTaskStatus.isPending}
                      onClick={() =>
                        updateTaskStatus.mutate(
                          { taskId: taskDetail.taskId!, status: "DONE" },
                          {
                            onSuccess: () => {
                              invalidateTasks();
                              notify.success(
                                t("dashboard.employee.notify.done_success"),
                              );
                            },
                            onError: () =>
                              notify.error(
                                t("dashboard.employee.notify.error"),
                              ),
                          },
                        )
                      }>
                      {t("dashboard.employee.action.mark_done")}
                    </Button>
                  )}

                {taskDetail.requireDoc &&
                  taskDetail.status !== "PENDING_APPROVAL" && (
                    <div className="flex items-center gap-1.5 rounded-md border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {t("dashboard.employee.drawer.doc_required_notice")}
                    </div>
                  )}
              </div>
            )}

            <Link to="/onboarding/tasks">
              <Button block>{t("dashboard.employee.action.view_board")}</Button>
            </Link>
          </div>
        ) : (
          <Empty description={t("dashboard.employee.drawer.no_task_detail")} />
        )}
      </Drawer>
    </div>
  );
}
