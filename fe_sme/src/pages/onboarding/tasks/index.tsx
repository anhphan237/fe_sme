import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Send } from "lucide-react";
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Input,
  Modal,
  Progress,
  Row,
  Segmented,
  Select,
  Skeleton,
  Tag,
  Typography,
} from "antd";

import { notify } from "@/utils/notify";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import { isOnboardingEmployee, canManageOnboarding } from "@/shared/rbac";
import {
  apiAddTaskComment,
  apiGetTaskDetailFull,
  apiListInstances,
  apiListTasks,
  apiListTaskComments,
  apiUpdateTaskStatus,
  apiAcknowledgeTask,
  apiApproveTask,
  apiRejectTask,
} from "@/api/onboarding/onboarding.api";
import type {
  CommentResponse,
  TaskDetailResponse,
} from "@/interface/onboarding";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_DONE = "Done";
const STATUS_DONE_API = "DONE";

type StatusFilter = "all" | "pending" | "done";

// ── Hooks ─────────────────────────────────────────────────────────────────────

// All roles use task.listByOnboarding (PUBLIC — accessible to EMPLOYEE, HR, MANAGER, IT).
// task.listByAssignee is restricted to IT/HR/MANAGER and therefore cannot be used for employees.
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
    queryFn: () => apiGetTaskDetailFull(taskId!),
    enabled: Boolean(taskId),
    select: (res: unknown) => {
      const record = res as Record<string, unknown>;
      return (record?.task ??
        record?.data ??
        record?.result ??
        record?.payload ??
        res) as TaskDetailResponse;
    },
  });

const useUpdateTaskStatus = () =>
  useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

const useTaskCommentsQuery = (taskId?: string) =>
  useQuery({
    queryKey: ["onboarding-task-comments", taskId ?? ""],
    queryFn: () => apiListTaskComments(taskId!),
    enabled: Boolean(taskId),
    select: (res: unknown) => {
      const record = res as Record<string, unknown>;
      const list = record?.comments ?? record?.data ?? [];
      return (Array.isArray(list) ? list : []) as CommentResponse[];
    },
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
          {t("onboarding.task.detail.view")}
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

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

const Tasks = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const userId = currentUser?.id;
  const roles = currentUser?.roles ?? [];
  const isEmployee = isOnboardingEmployee(roles);
  const isManager = roles.includes("MANAGER") && !roles.includes("HR");
  const isHr = roles.includes("HR");
  const canManage = canManageOnboarding(roles);

  // ── Instance loading ──────────────────────────────────────────────────────

  const { data: allInstances = [], isLoading: loadingInstances } = useQuery({
    queryKey: [
      "onboarding-instances-tasks",
      userId ?? "",
      canManage ? "all" : "employee",
    ],
    queryFn: () =>
      canManage
        ? apiListInstances({ status: "ACTIVE" })
        : apiListInstances({ employeeId: userId, status: "ACTIVE" }),
    enabled: Boolean(userId),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

  const instances = useMemo(() => {
    if (isManager) {
      return allInstances.filter((i) => i.managerUserId === userId);
    }
    if (isEmployee) {
      return allInstances.filter(
        (i) => i.employeeUserId === userId || i.employeeId === userId,
      );
    }
    return allInstances; // HR sees all
  }, [allInstances, isManager, isEmployee, userId]);

  // ── Selected instance ─────────────────────────────────────────────────────
  // Employees auto-select; managers/HR get a dropdown.

  const [selectedInstanceId, setSelectedInstanceId] = useState<
    string | undefined
  >();
  const onboardingId = isEmployee
    ? instances[0]?.id
    : (selectedInstanceId ?? instances[0]?.id);

  // ── Tasks loading ─────────────────────────────────────────────────────────
  // task.listByOnboarding is a PUBLIC operation — accessible to all roles including EMPLOYEE.
  // For employees, onboardingId comes from their own instance (auto-selected).
  // For HR/Manager, onboardingId comes from the dropdown.

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
  const [commentInput, setCommentInput] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const acknowledgeMutation = useMutation({
    mutationFn: (taskId: string) => apiAcknowledgeTask({ taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance", onboardingId ?? ""],
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      notify.success(t("onboarding.task.toast.acknowledged"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const approveMutation = useMutation({
    mutationFn: (taskId: string) => apiApproveTask({ taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      setSelectedTaskId(null);
      notify.success(t("onboarding.task.toast.approved"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      apiRejectTask({ taskId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      setSelectedTaskId(null);
      setRejectModalOpen(false);
      setRejectReason("");
      notify.success(t("onboarding.task.toast.rejected"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const { data: comments, isLoading: commentsLoading } = useTaskCommentsQuery(
    selectedTaskId ?? undefined,
  );

  const addCommentMutation = useMutation({
    mutationFn: ({ taskId, message }: { taskId: string; message: string }) =>
      apiAddTaskComment(taskId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-comments", selectedTaskId],
      });
      setCommentInput("");
      notify.success(t("onboarding.task.comments.toast_added"));
    },
    onError: () => {
      notify.error(t("onboarding.task.toast.failed"));
    },
  });

  const handleAddComment = () => {
    if (!selectedTaskId || !commentInput.trim()) return;
    addCommentMutation.mutate({
      taskId: selectedTaskId,
      message: commentInput.trim(),
    });
  };

  const { data: taskDetail, isLoading: taskDetailLoading } = useTaskDetailQuery(
    selectedTaskId ?? undefined,
  );

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
    const taskQueryKey = ["onboarding-tasks-by-instance", onboardingId ?? ""];

    if (isDone) {
      // Uncheck: revert to TODO (Manager/HR only or simple task)
      try {
        await updateStatus.mutateAsync({ taskId: task.id, status: "TODO" });
        queryClient.invalidateQueries({ queryKey: taskQueryKey });
        notify.success(t("onboarding.task.toast.undone"));
      } catch {
        notify.error(t("onboarding.task.toast.failed"));
      }
      return;
    }

    // For employees: requireAck tasks must be acknowledged first (→ WAIT_ACK)
    if (
      isEmployee &&
      task.requireAck &&
      task.rawStatus !== "WAIT_ACK" &&
      task.rawStatus !== "DONE"
    ) {
      acknowledgeMutation.mutate(task.id);
      return;
    }

    // For employees: respect requiresManagerApproval
    if (isEmployee && task.requiresManagerApproval) {
      try {
        await updateStatus.mutateAsync({
          taskId: task.id,
          status: "PENDING_APPROVAL",
        });
        queryClient.invalidateQueries({ queryKey: taskQueryKey });
        notify.success(t("onboarding.task.toast.submitted_approval"));
      } catch {
        notify.error(t("onboarding.task.toast.failed"));
      }
      return;
    }

    // Normal toggle
    try {
      await updateStatus.mutateAsync({
        taskId: task.id,
        status: STATUS_DONE_API,
      });
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
      notify.success(t("onboarding.task.toast.done"));
    } catch {
      notify.error(t("onboarding.task.toast.failed"));
    }
  };

  const instanceSelectOptions = instances.map((inst) => ({
    label: `#${inst.id.slice(-8)} — ${inst.employeeId ?? t("onboarding.task.instance.unknown_employee")} (${inst.status})`,
    value: inst.id,
  }));

  return (
    <div className="space-y-6">
      {/* ── Filters & Instance Selector ─────────────────────────────── */}
      <Card>
        <Row gutter={[16, 12]} align="middle">
          {canManage && (
            <Col xs={24} md={8}>
              <p className="mb-1 text-sm font-semibold text-gray-700">
                {t("onboarding.task.instance.select_label")}
              </p>
              {loadingInstances ? (
                <Skeleton.Input active block />
              ) : (
                <Select
                  style={{ width: "100%" }}
                  placeholder={t("onboarding.task.instance.select_placeholder")}
                  options={instanceSelectOptions}
                  value={onboardingId}
                  onChange={(v) => setSelectedInstanceId(v)}
                  showSearch
                  filterOption={(input, option) =>
                    ((option?.label as string) ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              )}
              {isHr && (
                <p className="mt-1 text-xs text-gray-400">
                  {t("onboarding.task.instance.hr_hint", {
                    total: instances.length,
                  })}
                </p>
              )}
              {isManager && (
                <p className="mt-1 text-xs text-gray-400">
                  {t("onboarding.task.instance.manager_hint", {
                    total: instances.length,
                  })}
                </p>
              )}
            </Col>
          )}
          <Col xs={24} md={canManage ? 8 : 12}>
            <p className="mb-1 text-sm font-semibold text-gray-700">
              {t("onboarding.task.quickview.search_placeholder")}
            </p>
            <Input
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("onboarding.task.quickview.search_placeholder")}
            />
          </Col>
          <Col xs={24} md={canManage ? 8 : 12}>
            <p className="mb-1 text-sm font-semibold text-gray-700">
              {t("onboarding.task.quickview.title")}
            </p>
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
            <p className="mt-1 text-xs text-gray-500">
              {t("onboarding.task.quickview.result", {
                visible: filteredTasks.length,
                total: totalCount,
              })}
            </p>
          </Col>
        </Row>
      </Card>

      {/* ── Progress summary ─────────────────────────────────── */}
      {totalCount > 0 && (
        <ProgressSummary completed={completedCount} total={totalCount} />
      )}

      {/* ── Task list ─────────────────────────────────────────── */}
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
                onboardingId
                  ? t("onboarding.task.empty.desc_has_instance")
                  : t("onboarding.task.empty.desc_no_instance")
              }>
              {isEmployee ? (
                <Button onClick={() => navigate("/onboarding/my-journey")}>
                  {t("onboarding.task.empty.title")}
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => navigate("/onboarding/employees")}>
                  {t("onboarding.task.empty.action")}
                </Button>
              )}
            </Empty>
          </div>
        </Card>
      )}

      {/* ── Task Detail Drawer ─────────────────────────────────── */}
      <Drawer
        title={t("onboarding.task.detail.title")}
        width={560}
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}>
        {taskDetailLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : taskDetail ? (
          <div className="space-y-4">
            <div>
              <Typography.Text type="secondary">
                {t("onboarding.employee.home.task_detail.field_title")}
              </Typography.Text>
              <Typography.Paragraph className="!mb-0 !mt-1" strong>
                {String(taskDetail.title ?? "-")}
              </Typography.Paragraph>
            </div>

            {!!taskDetail.description && (
              <div>
                <Typography.Text type="secondary">
                  {t("onboarding.employee.home.task_detail.field_description")}
                </Typography.Text>
                <Typography.Paragraph className="!mb-0 !mt-1">
                  {String(taskDetail.description)}
                </Typography.Paragraph>
              </div>
            )}

            <Row gutter={[12, 12]}>
              <Col span={12}>
                <div className="rounded-lg border border-gray-200 p-3">
                  <Typography.Text type="secondary">
                    {t("onboarding.employee.home.task_detail.field_status")}
                  </Typography.Text>
                  <div className="mt-1">
                    <Tag
                      color={
                        taskDetail.status === STATUS_DONE_API
                          ? "success"
                          : taskDetail.status === "PENDING_APPROVAL"
                            ? "warning"
                            : taskDetail.status === "WAIT_ACK"
                              ? "orange"
                              : "processing"
                      }>
                      {taskDetail.status === "PENDING_APPROVAL"
                        ? t("onboarding.task.status.pending_approval")
                        : taskDetail.status === "WAIT_ACK"
                          ? t("onboarding.task.status.wait_ack")
                          : taskDetail.status === "DONE"
                            ? t("onboarding.task.status.done")
                            : taskDetail.status === "IN_PROGRESS"
                              ? t("onboarding.task.status.in_progress")
                              : taskDetail.status === "TODO"
                                ? t("onboarding.task.status.todo")
                                : String(taskDetail.status ?? "-")}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="rounded-lg border border-gray-200 p-3">
                  <Typography.Text type="secondary">
                    {t("onboarding.employee.home.task_detail.field_due_date")}
                  </Typography.Text>
                  <div className="mt-1">
                    {formatDate(String(taskDetail.dueDate ?? ""))}
                  </div>
                </div>
              </Col>
            </Row>

            {/* ── Rejection reason if rejected ─────────────────── */}
            {taskDetail.rejectionReason && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <Typography.Text type="danger">
                  {t("onboarding.task.rejection_reason", {
                    reason: taskDetail.rejectionReason,
                  })}
                </Typography.Text>
              </div>
            )}

            {/* ── Role-aware action buttons ─────────────────────── */}
            <Divider orientationMargin={0}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t("onboarding.task.detail.title")}
              </Typography.Text>
            </Divider>

            <div className="flex flex-wrap gap-2">
              {/* Employee: Acknowledge (requireAck=true, status TODO or IN_PROGRESS) */}
              {isEmployee &&
                taskDetail.requireAck &&
                (taskDetail.status === "TODO" ||
                  taskDetail.status === "IN_PROGRESS") && (
                  <Button
                    type="primary"
                    loading={acknowledgeMutation.isPending}
                    onClick={() =>
                      acknowledgeMutation.mutate(taskDetail.taskId)
                    }>
                    {t("onboarding.task.action.acknowledge")}
                  </Button>
                )}

              {/* Employee: Confirm Complete after WAIT_ACK */}
              {isEmployee && taskDetail.status === "WAIT_ACK" && (
                <Button
                  type="primary"
                  loading={updateStatus.isPending}
                  onClick={async () => {
                    try {
                      await updateStatus.mutateAsync({
                        taskId: taskDetail.taskId,
                        status: STATUS_DONE_API,
                      });
                      queryClient.invalidateQueries({
                        queryKey: [
                          "onboarding-tasks-by-instance",
                          onboardingId ?? "",
                        ],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["onboarding-task-detail", selectedTaskId],
                      });
                      setSelectedTaskId(null);
                      notify.success(t("onboarding.task.toast.done"));
                    } catch {
                      notify.error(t("onboarding.task.toast.failed"));
                    }
                  }}>
                  {t("onboarding.task.action.confirm_complete")}
                </Button>
              )}

              {/* Employee: Submit for Approval (requiresManagerApproval=true, status TODO or IN_PROGRESS) */}
              {isEmployee &&
                taskDetail.requiresManagerApproval &&
                (taskDetail.status === "TODO" ||
                  taskDetail.status === "IN_PROGRESS") && (
                  <Button
                    type="primary"
                    loading={updateStatus.isPending}
                    onClick={async () => {
                      try {
                        await updateStatus.mutateAsync({
                          taskId: taskDetail.taskId,
                          status: "PENDING_APPROVAL",
                        });
                        queryClient.invalidateQueries({
                          queryKey: [
                            "onboarding-tasks-by-instance",
                            onboardingId ?? "",
                          ],
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["onboarding-task-detail", selectedTaskId],
                        });
                        setSelectedTaskId(null);
                        notify.success(
                          t("onboarding.task.toast.submitted_approval"),
                        );
                      } catch {
                        notify.error(t("onboarding.task.toast.failed"));
                      }
                    }}>
                    {t("onboarding.task.action.submit_approval")}
                  </Button>
                )}

              {/* Employee: Normal done (no requireAck, no requiresManagerApproval, status TODO or IN_PROGRESS) */}
              {isEmployee &&
                !taskDetail.requireAck &&
                !taskDetail.requiresManagerApproval &&
                (taskDetail.status === "TODO" ||
                  taskDetail.status === "IN_PROGRESS") && (
                  <Button
                    type="primary"
                    loading={updateStatus.isPending}
                    onClick={async () => {
                      const task = tasks.find((t) => t.id === selectedTaskId);
                      if (task) await handleToggleTask(task);
                      setSelectedTaskId(null);
                    }}>
                    {t("onboarding.employee.home.today_actions.mark_done")}
                  </Button>
                )}

              {/* Manager/HR: Approve (status PENDING_APPROVAL) */}
              {canManage && taskDetail.status === "PENDING_APPROVAL" && (
                <Button
                  type="primary"
                  loading={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(taskDetail.taskId)}>
                  {t("onboarding.task.action.approve")}
                </Button>
              )}

              {/* Manager/HR: Reject (status PENDING_APPROVAL) */}
              {canManage && taskDetail.status === "PENDING_APPROVAL" && (
                <Button
                  danger
                  loading={rejectMutation.isPending}
                  onClick={() => setRejectModalOpen(true)}>
                  {t("onboarding.task.action.reject")}
                </Button>
              )}

              <Button onClick={() => setSelectedTaskId(null)}>
                {t("global.close")}
              </Button>
            </div>

            {/* ── Comments ─────────────────────────────────── */}
            <Divider orientationMargin={0}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t("onboarding.task.comments.title")}
              </Typography.Text>
            </Divider>

            {commentsLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (comments?.length ?? 0) === 0 ? (
              <Empty
                description={t("onboarding.task.comments.empty")}
                imageStyle={{ height: 40 }}
              />
            ) : (
              <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                {comments?.map((c) => (
                  <div key={c.commentId} className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {(c.authorName ?? "U")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-xs font-semibold text-gray-700">
                        {c.authorName ??
                          t("onboarding.task.comments.unknown_author")}
                      </p>
                      <p className="text-sm text-gray-600">{c.message}</p>
                      {c.createdAt && (
                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatDate(c.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Input
                placeholder={t("onboarding.task.comments.placeholder")}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onPressEnter={handleAddComment}
                maxLength={500}
              />
              <Button
                type="primary"
                icon={<Send className="h-3.5 w-3.5" />}
                loading={addCommentMutation.isPending}
                onClick={handleAddComment}
                disabled={!commentInput.trim()}>
                {t("onboarding.task.comments.send")}
              </Button>
            </div>
          </div>
        ) : (
          <Empty description={t("onboarding.task.detail.not_found")} />
        )}
      </Drawer>

      {/* ── Reject Reason Modal ──────────────────────────────────── */}
      <Modal
        title={t("onboarding.task.action.reject")}
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason("");
        }}
        onOk={() => {
          if (selectedTaskId) {
            rejectMutation.mutate({
              taskId: selectedTaskId,
              reason: rejectReason.trim() || undefined,
            });
          }
        }}
        okText={t("onboarding.task.action.reject_confirm")}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        cancelText={t("global.close")}>
        <div className="mt-3">
          <Typography.Text>
            {t("onboarding.task.action.reject_reason_label")}
          </Typography.Text>
          <Input.TextArea
            className="mt-2"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("onboarding.task.action.reject_reason_placeholder")}
            maxLength={500}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
