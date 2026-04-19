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
  FileText,
  Layers,
  Paperclip,
  ThumbsDown,
  User,
  UserCheck,
} from "lucide-react";
import { useUserStore } from "@/stores/user.store";
import {
  apiAcknowledgeTask,
  apiGetTaskDetailFull,
  apiListInstances,
  apiListTasksByAssignee,
  apiUpdateTaskStatus,
} from "@/api/onboarding/onboarding.api";
import { apiGetDocuments } from "@/api/document/document.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import { notify } from "@/utils/notify";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";
import type { TaskDetailResponse } from "@/interface/onboarding";

type DashboardDocument = {
  documentId: string;
  name: string;
  status?: string;
};

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

function docNeedsAck(status?: string) {
  const s = (status ?? "").toUpperCase();
  return !s.includes("DONE") && !s.includes("PROCESSED") && !s.includes("ACK");
}

export default function EmployeeDashboard() {
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
  const { data: allAssigneeTasks = [], isLoading: tasksLoading } = useQuery({
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

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["employee-documents"],
    queryFn: () => apiGetDocuments(),
    select: (res: unknown) =>
      extractList<DashboardDocument>(
        res as Record<string, unknown>,
        "items",
        "documents",
        "list",
      ),
  });

  const { data: taskDetail, isLoading: taskDetailLoading } = useQuery({
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
      notify.success("Đã xác nhận nhận task");
    },
    onError: () => notify.error("Thao tác thất bại"),
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

  const pendingDocs = documents.filter((d) => docNeedsAck(d.status));

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
      const key = task.checklistName ?? "Nhiệm vụ khác";
      if (!groups[key]) groups[key] = { name: key, total: 0, done: 0 };
      groups[key].total++;
      if (task.rawStatus === "DONE") groups[key].done++;
    }
    return Object.values(groups);
  }, [tasks]);

  const milestoneTimeline = useMemo(() => {
    const start = latestInstance?.startDate;
    if (!start) return [];
    const daysFromStart = dayjs().diff(dayjs(start), "day");
    return [7, 30, 60].map((milestone) => {
      const daysLeft = milestone - daysFromStart;
      return {
        milestone,
        state: daysLeft <= 0 ? ("DUE" as const) : ("FUTURE" as const),
        label: daysLeft <= 0 ? "Cần phản hồi" : `Còn ${daysLeft} ngày`,
      };
    });
  }, [latestInstance?.startDate]);

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
        notify.success("Đã chuyển lại thành chưa hoàn thành");
      } catch {
        notify.error("Thao tác thất bại");
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
        notify.success("Đã gửi duyệt cho quản lý");
      } catch {
        notify.error("Thao tác thất bại");
      }
      return;
    }

    try {
      await updateTaskStatus.mutateAsync({
        taskId: task.id,
        status: STATUS_DONE_API,
      });
      invalidateTasks();
      notify.success("Đã hoàn thành task");
    } catch {
      notify.error("Thao tác thất bại");
    }
  };

  if (instancesLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-6">
      {/* ── Row 1: Progress + Stats ─────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-stroke shadow-sm">
          <Typography.Text strong>Tiến độ onboarding</Typography.Text>
          <p className="text-xs text-muted">
            {latestInstance
              ? `${daysInOnboarding != null ? `Ngày ${daysInOnboarding} · ` : ""}${completedTasks}/${totalTasks} task hoàn thành`
              : "Chưa có onboarding"}
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
                    ? `Còn ${totalTasks - completedTasks} task cần hoàn thành`
                    : "Tất cả task đã hoàn thành! 🎉"}
                </p>
              </>
            )}
          </div>
          {latestInstance && (
            <div className="mt-4 flex items-center justify-between border-t border-stroke pt-3">
              <Typography.Text type="secondary" className="text-xs">
                Trạng thái
              </Typography.Text>
              <Tag
                color={
                  latestInstance.status === "ACTIVE"
                    ? "processing"
                    : latestInstance.status === "COMPLETED"
                      ? "success"
                      : "gold"
                }>
                {latestInstance.status}
              </Tag>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 content-start gap-3 lg:col-span-2">
          {[
            {
              label: "Tổng số task",
              value: totalTasks,
              icon: <ClipboardList className="h-4 w-4" />,
              bg: "bg-teal-50",
              text: "text-teal-600",
            },
            {
              label: "Đã hoàn thành",
              value: completedTasks,
              icon: <CheckCircle2 className="h-4 w-4" />,
              bg: "bg-emerald-50",
              text: "text-emerald-600",
            },
            {
              label: "Đang chờ",
              value: pendingList.length,
              icon: <Clock className="h-4 w-4" />,
              bg: "bg-amber-50",
              text: "text-amber-600",
            },
            {
              label: "Quá hạn",
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
              Phân loại theo trạng thái
            </Typography.Text>
            <div className="grid grid-cols-5 gap-2">
              {[
                {
                  label: "Todo",
                  value: tasksByStatus.todo,
                  cls: "bg-gray-100 text-gray-700",
                },
                {
                  label: "In Progress",
                  value: tasksByStatus.inProgress,
                  cls: "bg-blue-100 text-blue-700",
                },
                {
                  label: "Wait Ack",
                  value: tasksByStatus.waitAck,
                  cls: "bg-orange-100 text-orange-700",
                },
                {
                  label: "Chờ duyệt",
                  value: tasksByStatus.pendingApproval,
                  cls: "bg-amber-100 text-amber-700",
                },
                {
                  label: "Done",
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

      {/* ── Rejected tasks alert ─────────────────────────── */}
      {rejectedTasks.length > 0 && (
        <Card
          className="border border-red-300 bg-red-50 shadow-sm"
          styles={{ body: { padding: "12px 16px" } }}>
          <div className="mb-2 flex items-center gap-2">
            <ThumbsDown className="h-4 w-4 text-red-600" />
            <Typography.Text strong className="text-red-700">
              Task bị từ chối ({rejectedTasks.length})
            </Typography.Text>
          </div>
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
                    <p className="text-xs text-red-500">{task.checklistName}</p>
                  )}
                </div>
                <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                  <Tag color="error">Bị từ chối</Tag>
                  <Typography.Text className="text-xs text-muted">
                    Xem chi tiết
                  </Typography.Text>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Upcoming scheduled tasks ─────────────────────── */}
      {scheduledTasks.length > 0 && (
        <Card
          className="border border-sky-300 bg-sky-50 shadow-sm"
          styles={{ body: { padding: "12px 16px" } }}>
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-600" />
            <Typography.Text strong className="text-sky-700">
              Lịch sắp tới ({scheduledTasks.length})
            </Typography.Text>
          </div>
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
                  {task.dueDate && (
                    <p className="text-xs text-sky-500">
                      Hạn: {dayjs(task.dueDate).format("DD/MM/YYYY")}
                    </p>
                  )}
                </div>
                <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                  <Tag
                    color={
                      task.scheduleStatus === "CONFIRMED" ? "cyan" : "geekblue"
                    }>
                    {task.scheduleStatus === "CONFIRMED"
                      ? "Đã xác nhận"
                      : "Đề xuất"}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Row 2: Actionable urgent list + Milestone ───────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-stroke shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <Typography.Text strong>Task cần xử lý hôm nay</Typography.Text>
              <p className="text-xs text-muted">
                Ưu tiên theo hạn và mức độ khẩn cấp
              </p>
            </div>
            <Link to="/onboarding/tasks">
              <Typography.Text className="text-xs text-blue-500 hover:underline">
                Xem tất cả
              </Typography.Text>
            </Link>
          </div>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 360 }}>
            {tasksLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : !latestInstance ? (
              <Empty description="Bạn chưa có onboarding nào đang hoạt động." />
            ) : urgentTasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                Tất cả task đã hoàn thành. Xuất sắc! 🎉
              </p>
            ) : (
              urgentTasks.map((task) => {
                const overdue = isOverdue(task.dueDate);
                const isWaitAck = task.rawStatus === "WAIT_ACK";
                const isPendingApproval = task.rawStatus === "PENDING_APPROVAL";
                const ctaLabel = task.requireAck
                  ? isWaitAck
                    ? "Xác nhận hoàn thành"
                    : "Xác nhận đã nhận"
                  : task.requiresManagerApproval
                    ? "Gửi duyệt"
                    : "Hoàn thành";

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
                              {overdue ? "⚠ Quá hạn: " : "Hạn: "}
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
                              Cần tài liệu
                            </Tag>
                          )}
                          {task.requireAck && (
                            <Tag
                              color="blue"
                              className="!m-0 !px-1.5 !py-0 !text-[10px]">
                              👁 Cần xác nhận
                            </Tag>
                          )}
                          {task.requiresManagerApproval && (
                            <Tag
                              color="purple"
                              className="!m-0 !px-1.5 !py-0 !text-[10px]">
                              ✅ Cần duyệt
                            </Tag>
                          )}
                          {task.approvalStatus === "REJECTED" && (
                            <Tag
                              color="error"
                              className="!m-0 !px-1.5 !py-0 !text-[10px]">
                              Bị từ chối
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
                        Xem chi tiết
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
            message="Mẹo"
            description="Hoàn thành task đúng hạn giúp onboarding của bạn nhanh chóng hơn."
          />
        </Card>

        <Card className="border border-stroke shadow-sm">
          <Typography.Text strong className="mb-3 block">
            Milestone onboarding
          </Typography.Text>
          {milestoneTimeline.length === 0 ? (
            <p className="text-sm text-muted">Chưa có dữ liệu milestone.</p>
          ) : (
            <div className="space-y-2">
              {milestoneTimeline.map((item) => (
                <div
                  key={item.milestone}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <Typography.Text strong className="text-sm">
                    Mốc {item.milestone} ngày
                  </Typography.Text>
                  <div className="flex items-center gap-2">
                    <Typography.Text type="secondary" className="text-xs">
                      {item.label}
                    </Typography.Text>
                    <Tag color={item.state === "DUE" ? "warning" : "default"}>
                      {item.state === "DUE" ? "Cần phản hồi" : "Chưa đến hạn"}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link to="/surveys/inbox">
              <button className="w-full rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100">
                Mở survey inbox
              </button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">
            Hệ thống tự động kích hoạt milestone dựa trên ngày bắt đầu.
          </p>
        </Card>
      </div>

      {/* ── Row 3: Stage / Checklist Progress ───────────────── */}
      {stageProgress.length > 0 && (
        <Card className="border border-stroke shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-500" />
            <Typography.Text strong>Tiến độ theo giai đoạn</Typography.Text>
          </div>
          {tasksLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : (
            <div className="space-y-3">
              {stageProgress.map((stage) => {
                const pct =
                  stage.total > 0
                    ? Math.round((stage.done / stage.total) * 100)
                    : 0;
                const isDone = pct === 100;
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
                      <Typography.Text type="secondary" className="text-xs">
                        {stage.done}/{stage.total} task
                      </Typography.Text>
                    </div>
                    {!isDone && (
                      <Progress
                        percent={pct}
                        size="small"
                        strokeColor={isActive ? "#0f766e" : undefined}
                        showInfo={false}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── Row 4: Reminder stream ──────────────────────────── */}
      {(overdueList.length > 0 ||
        dueSoonList.length > 0 ||
        actionNeededTasks.length > 0) && (
        <Card className="border border-stroke shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <BellRing className="h-4 w-4 text-amber-500" />
            <Typography.Text strong>Nhắc việc (ưu tiên)</Typography.Text>
          </div>
          <div className="space-y-2">
            {overdueList.slice(0, 3).map((task) => (
              <div
                key={`overdue-${task.id}`}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 hover:bg-red-100"
                onClick={() => setSelectedTaskId(task.id)}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <Typography.Text className="text-sm">
                    {task.title}
                  </Typography.Text>
                </div>
                <Tag color="error">Quá hạn</Tag>
              </div>
            ))}
            {dueSoonList.slice(0, 3).map((task) => (
              <div
                key={`soon-${task.id}`}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100"
                onClick={() => setSelectedTaskId(task.id)}>
                <div className="flex items-center gap-2">
                  <CircleDashed className="h-4 w-4 text-amber-500" />
                  <Typography.Text className="text-sm">
                    {task.title}
                  </Typography.Text>
                </div>
                <Tag color="warning">Sắp đến hạn</Tag>
              </div>
            ))}
            {actionNeededTasks.slice(0, 3).map((task) => (
              <div
                key={`action-${task.id}`}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-sky-200 bg-sky-50 p-3 hover:bg-sky-100"
                onClick={() => setSelectedTaskId(task.id)}>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-sky-500" />
                  <Typography.Text className="text-sm">
                    {task.title}
                  </Typography.Text>
                </div>
                <Tag color="processing">
                  {task.rawStatus === "WAIT_ACK" ? "Cần xác nhận" : "Chờ duyệt"}
                </Tag>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Row 5: Documents + Contact info ─────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-stroke shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <Typography.Text strong>Tài liệu cần xác nhận</Typography.Text>
              <p className="text-xs text-muted">
                Các tài liệu bạn cần đọc và xác nhận
              </p>
            </div>
            {pendingDocs.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {pendingDocs.length} chờ xác nhận
              </span>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 240 }}>
            {docsLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} title={false} />
            ) : pendingDocs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                {documents.length === 0
                  ? "Chưa có tài liệu nào."
                  : "Tất cả tài liệu đã được xác nhận. ✅"}
              </p>
            ) : (
              pendingDocs.slice(0, 8).map((doc) => (
                <div
                  key={doc.documentId}
                  className="flex items-center gap-3 rounded-lg border border-stroke/60 bg-slate-50 px-3 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-muted" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {doc.name}
                  </p>
                  <Tag color="orange" className="shrink-0">
                    Chờ xác nhận
                  </Tag>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border border-stroke shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-teal-500" />
            <Typography.Text strong>Thông tin hỗ trợ</Typography.Text>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-stroke bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase text-muted">
                Manager
              </p>
              <p className="mt-1 text-sm font-medium">
                {latestInstance?.managerName ??
                  currentUser?.manager ??
                  currentUser?.managerUserId ??
                  "Chưa được phân công"}
              </p>
            </div>
            <div className="rounded-lg border border-stroke bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase text-muted">
                Template onboarding
              </p>
              <p className="mt-1 text-sm font-medium">
                {latestInstance?.templateName ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-stroke bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase text-muted">
                Ngày bắt đầu
              </p>
              <p className="mt-1 text-sm font-medium">
                {latestInstance?.startDate
                  ? dayjs(latestInstance.startDate).format("DD/MM/YYYY")
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Task detail drawer ──────────────────────────────── */}
      <Drawer
        title="Chi tiết task"
        width={560}
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}>
        {taskDetailLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : taskDetail ? (
          <div className="space-y-3">
            <div>
              <Typography.Text type="secondary">Tiêu đề</Typography.Text>
              <Typography.Paragraph className="!mb-0 !mt-1" strong>
                {taskDetail.title ?? "-"}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text type="secondary">Mô tả</Typography.Text>
              <Typography.Paragraph className="!mb-0 !mt-1">
                {taskDetail.description ?? "-"}
              </Typography.Paragraph>
            </div>

            {/* Rejection reason alert */}
            {taskDetail.rejectionReason && (
              <Alert
                type="error"
                showIcon
                message="Lý do từ chối"
                description={taskDetail.rejectionReason}
              />
            )}

            {/* Approval status */}
            {taskDetail.approvalStatus && (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                <Typography.Text type="secondary" className="shrink-0">
                  Phê duyệt:
                </Typography.Text>
                <Tag
                  color={
                    taskDetail.approvalStatus === "APPROVED"
                      ? "success"
                      : taskDetail.approvalStatus === "REJECTED"
                        ? "error"
                        : "warning"
                  }>
                  {taskDetail.approvalStatus}
                </Tag>
                {taskDetail.approvedBy && (
                  <Typography.Text type="secondary" className="text-xs">
                    bởi {taskDetail.approvedBy}
                  </Typography.Text>
                )}
              </div>
            )}

            {/* Status + Due */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <Typography.Text type="secondary">Trạng thái</Typography.Text>
                <div className="mt-1">
                  <Tag color={taskStatusVariant(taskDetail.status)}>
                    {taskDetail.status ?? "TODO"}
                  </Tag>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <Typography.Text type="secondary">Hạn</Typography.Text>
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
                    Lịch
                  </Typography.Text>
                  {taskDetail.scheduleStatus && (
                    <Tag
                      color={
                        taskDetail.scheduleStatus === "CONFIRMED"
                          ? "cyan"
                          : "geekblue"
                      }
                      className="!ml-auto">
                      {taskDetail.scheduleStatus}
                    </Tag>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {taskDetail.scheduledStartAt && (
                    <div>
                      <span className="text-xs text-muted">Bắt đầu: </span>
                      {dayjs(taskDetail.scheduledStartAt).format(
                        "DD/MM/YYYY HH:mm",
                      )}
                    </div>
                  )}
                  {taskDetail.scheduledEndAt && (
                    <div>
                      <span className="text-xs text-muted">Kết thúc: </span>
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
                    Cần tài liệu
                  </Tag>
                )}
                {taskDetail.requireAck && (
                  <Tag color="blue">👁 Cần xác nhận</Tag>
                )}
                {taskDetail.requiresManagerApproval && (
                  <Tag color="purple">✅ Cần duyệt quản lý</Tag>
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
                          Bình luận ({taskDetail.comments.length})
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
                                    "Ẩn danh"}
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
                          Tệp đính kèm ({taskDetail.attachments.length})
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
                          Lịch sử hoạt động ({taskDetail.activityLogs.length})
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
                                    `bởi ${
                                      (log as { performedBy?: string })
                                        .performedBy
                                    }`}
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
                      Xác nhận đã nhận
                    </Button>
                  )}

                {taskDetail.status === "WAIT_ACK" && (
                  <Tooltip
                    title={
                      taskDetail.requireDoc
                        ? "Cần đính kèm tài liệu trước khi hoàn thành"
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
                              notify.success("Đã xác nhận hoàn thành");
                            },
                            onError: () => notify.error("Thao tác thất bại"),
                          },
                        )
                      }>
                      Xác nhận hoàn thành
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
                              notify.success("Đã gửi duyệt cho quản lý");
                            },
                            onError: () => notify.error("Thao tác thất bại"),
                          },
                        )
                      }>
                      Gửi duyệt
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
                              notify.success("Đã hoàn thành task");
                            },
                            onError: () => notify.error("Thao tác thất bại"),
                          },
                        )
                      }>
                      Hoàn thành
                    </Button>
                  )}

                {taskDetail.requireDoc &&
                  taskDetail.status !== "PENDING_APPROVAL" && (
                    <div className="flex items-center gap-1.5 rounded-md border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Task này yêu cầu tài liệu. Hãy vào trang Tasks để đính
                      kèm.
                    </div>
                  )}
              </div>
            )}

            <Link to="/onboarding/tasks">
              <Button block>Mở bảng task</Button>
            </Link>
          </div>
        ) : (
          <Empty description="Không tải được chi tiết task." />
        )}
      </Drawer>
    </div>
  );
}
