import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  User,
  Calendar,
  Paperclip,
  CheckSquare,
  ThumbsUp,
  XCircle,
  Activity,
} from "lucide-react";
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Segmented,
  Select,
  Skeleton,
  Tag,
  Tooltip,
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

type StatusFilter = "all" | "pending" | "done" | "pending_approval" | "overdue";

const STATUS_TAG_COLOR: Record<string, string> = {
  TODO: "default",
  IN_PROGRESS: "processing",
  ASSIGNED: "geekblue",
  WAIT_ACK: "orange",
  PENDING_APPROVAL: "gold",
  DONE: "success",
};

const STAGE_TAG_COLOR: Record<string, string> = {
  PRE_BOARDING: "purple",
  DAY_1: "blue",
  DAY_7: "cyan",
  DAY_30: "lime",
  DAY_60: "green",
};

const APPROVAL_STATUS_COLOR: Record<string, string> = {
  NONE: "default",
  PENDING: "gold",
  APPROVED: "success",
  REJECTED: "error",
};

const SCHEDULE_STATUS_COLOR: Record<string, string> = {
  UNSCHEDULED: "default",
  PROPOSED: "processing",
  CONFIRMED: "success",
  RESCHEDULED: "orange",
  CANCELLED: "error",
  MISSED: "volcano",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStageLabel = (
  name: string,
  t: (key: string) => string,
): { label: string; color: string } => {
  const upper = name.toUpperCase().replace(/\s+/g, "_");
  const label = t(`onboarding.task.stage.${upper}`);
  // If translation returns the key back (key not found), use name as-is
  const validLabel = label.startsWith("onboarding.task.stage.") ? name : label;
  return {
    label: validLabel,
    color: STAGE_TAG_COLOR[upper] ?? "default",
  };
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

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

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatusBadge = ({
  rawStatus,
}: {
  rawStatus: string | undefined;
}) => {
  const { t } = useLocale();
  if (!rawStatus) return null;
  const color = STATUS_TAG_COLOR[rawStatus] ?? "default";
  const labelKey = `onboarding.task.status.${rawStatus.toLowerCase()}`;
  const label = t(labelKey);
  return (
    <Tag color={color} style={{ margin: 0 }}>
      {label.startsWith("onboarding.task.status.") ? rawStatus : label}
    </Tag>
  );
};

const ProgressStats = ({
  tasks,
}: {
  tasks: OnboardingTask[];
}) => {
  const { t } = useLocale();
  const total = tasks.length;
  const done = tasks.filter((tk) => tk.rawStatus === STATUS_DONE_API).length;
  const inProgress = tasks.filter(
    (tk) =>
      tk.rawStatus === "IN_PROGRESS" || tk.rawStatus === "ASSIGNED",
  ).length;
  const overdue = tasks.filter(
    (tk) =>
      tk.dueDate &&
      tk.rawStatus !== STATUS_DONE_API &&
      new Date(tk.dueDate) < new Date(),
  ).length;
  const pendingApproval = tasks.filter(
    (tk) => tk.rawStatus === "PENDING_APPROVAL",
  ).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const stats = [
    { label: t("onboarding.task.stat.total"), value: total, color: "text-gray-700" },
    { label: t("onboarding.task.stat.done"), value: done, color: "text-emerald-600" },
    { label: t("onboarding.task.stat.in_progress"), value: inProgress, color: "text-blue-600" },
    { label: t("onboarding.task.stat.overdue"), value: overdue, color: "text-amber-600" },
    { label: t("onboarding.task.stat.pending_approval"), value: pendingApproval, color: "text-yellow-600" },
  ];

  return (
    <Card>
      <Row gutter={[8, 8]} align="middle" className="mb-3">
        {stats.map((s) => (
          <Col key={s.label} flex="1" className="min-w-0">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="truncate text-xs text-gray-500">{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>
      <div className="flex items-center gap-3">
        <Progress
          percent={pct}
          showInfo
          strokeColor={{ from: "#108ee9", to: "#87d068" }}
          className="flex-1"
        />
        <span className="shrink-0 text-xs text-gray-500">
          {t("onboarding.task.progress", { completed: done, total })}
        </span>
      </div>
    </Card>
  );
};

const TaskItem = ({
  task,
  isUpdating,
  onChange,
  onInspect,
  onApprove,
  onReject,
  canManage,
}: {
  task: OnboardingTask;
  isUpdating: boolean;
  onChange: (task: OnboardingTask) => void;
  onInspect: (task: OnboardingTask) => void;
  onApprove?: (task: OnboardingTask) => void;
  onReject?: (task: OnboardingTask) => void;
  canManage: boolean;
}) => {
  const { t } = useLocale();
  const isDone = task.status === STATUS_DONE;
  const isOverdue =
    task.dueDate && !isDone && new Date(task.dueDate) < new Date();
  const isPendingApproval = task.rawStatus === "PENDING_APPROVAL";

  return (
    <li className="transition-colors hover:bg-slate-50">
      <div className="flex flex-col gap-0 px-4 py-3 sm:flex-row sm:items-start sm:gap-3">
        {/* Checkbox */}
        <div className="mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={isDone}
            onChange={() => onChange(task)}
            disabled={isUpdating}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          {/* Row 1: title + flags + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                isDone
                  ? "text-sm text-gray-400 line-through"
                  : "text-sm font-medium text-gray-800"
              }>
              {task.title}
            </span>

            {/* Flags */}
            {task.requireAck && !isDone && (
              <Tooltip title={t("onboarding.task.flag.requires_ack")}>
                <Tag
                  color="orange"
                  style={{ margin: 0, fontSize: 10, padding: "0 4px" }}>
                  <CheckSquare className="mr-0.5 inline h-2.5 w-2.5" />
                  Ack
                </Tag>
              </Tooltip>
            )}
            {task.requiresManagerApproval && !isDone && (
              <Tooltip title={t("onboarding.task.flag.requires_approval")}>
                <Tag
                  color="gold"
                  style={{ margin: 0, fontSize: 10, padding: "0 4px" }}>
                  <ThumbsUp className="mr-0.5 inline h-2.5 w-2.5" />
                  Duyệt
                </Tag>
              </Tooltip>
            )}

            {/* Status badge */}
            {task.rawStatus && (
              <StatusBadge rawStatus={task.rawStatus} />
            )}

            {/* Overdue */}
            {isOverdue && (
              <Tag
                color="error"
                style={{ margin: 0, fontSize: 10, padding: "0 4px" }}>
                {t("onboarding.task.stat.overdue")}
              </Tag>
            )}
          </div>

          {/* Row 2: description preview */}
          {task.description && !isDone && (
            <p className="line-clamp-1 text-xs text-gray-400">
              {task.description}
            </p>
          )}

          {/* Row 3: meta (due date + assignee) + action */}
          <div className="flex flex-wrap items-center gap-3">
            {task.dueDate ? (
              <span
                className={`flex items-center gap-1 text-xs ${
                  isOverdue ? "font-medium text-amber-600" : "text-gray-400"
                }`}>
                <Clock className="h-3 w-3" />
                {t("onboarding.task.due", { date: formatDate(task.dueDate) })}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-300">
                <Clock className="h-3 w-3" />
                {t("onboarding.task.no_due_date")}
              </span>
            )}

            {canManage && task.assignedUserId && (
              <Tooltip title={t("onboarding.task.field.assignee")}>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <User className="h-3 w-3" />
                  {task.assignedUserId}
                </span>
              </Tooltip>
            )}

            <div className="ml-auto flex items-center gap-2">
              {/* HR inline approve/reject for PENDING_APPROVAL tasks */}
              {canManage && isPendingApproval && onApprove && onReject && (
                <>
                  <Popconfirm
                    title={t("onboarding.task.action.approve")}
                    description={t("onboarding.task.action.approve_confirm_desc")}
                    okText={t("onboarding.task.action.approve")}
                    cancelText={t("global.close")}
                    onConfirm={() => onApprove(task)}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<ThumbsUp className="h-3 w-3" />}>
                      {t("onboarding.task.action.approve")}
                    </Button>
                  </Popconfirm>
                  <Button
                    size="small"
                    danger
                    icon={<XCircle className="h-3 w-3" />}
                    onClick={() => onReject(task)}>
                    {t("onboarding.task.action.reject")}
                  </Button>
                </>
              )}
              <Button size="small" onClick={() => onInspect(task)}>
                {t("onboarding.task.detail.view")}
              </Button>
            </div>
          </div>
        </div>
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
  onApprove,
  onReject,
  canManage,
}: {
  title: string;
  tasks: OnboardingTask[];
  isUpdating: boolean;
  onToggle: (task: OnboardingTask) => void;
  onInspect: (task: OnboardingTask) => void;
  onApprove?: (task: OnboardingTask) => void;
  onReject?: (task: OnboardingTask) => void;
  canManage: boolean;
}) => {
  const { t } = useLocale();
  const done = tasks.filter((tk) => tk.status === STATUS_DONE).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;
  const stageInfo = getStageLabel(title, t);

  return (
    <Card className="overflow-hidden" styles={{ body: { padding: 0 } }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          {allDone ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <div className="h-4 w-4 shrink-0 rounded-full border-2 border-blue-300" />
          )}
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          <Tag color={stageInfo.color} style={{ margin: 0, fontSize: 11 }}>
            {stageInfo.label}
          </Tag>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {done}/{total}
          </span>
          <div className="w-20">
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
            onApprove={onApprove}
            onReject={onReject}
            canManage={canManage}
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
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
          <Skeleton.Input active size="small" style={{ width: 140 }} />
          <Skeleton.Input active size="small" style={{ width: 100 }} />
        </div>
        <div className="divide-y divide-gray-100">
          {[0, 1, 2].map((j) => (
            <div key={j} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton.Avatar active size="small" shape="square" />
              <Skeleton.Input active size="small" style={{ flex: 1 }} />
              <Skeleton.Button active size="small" />
            </div>
          ))}
        </div>
      </Card>
    ))}
  </div>
);

// ── Detail Drawer Sections ─────────────────────────────────────────────────────

const InfoField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div>
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      {label}
    </Typography.Text>
    <div className="mt-0.5 text-sm font-medium text-gray-800">{children}</div>
  </div>
);

// ── Page ───────────────────────────────────────────────────────────────────────

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
    return allInstances;
  }, [allInstances, isManager, isEmployee, userId]);

  // ── Selected instance ─────────────────────────────────────────────────────

  const [selectedInstanceId, setSelectedInstanceId] = useState<
    string | undefined
  >();
  const onboardingId = isEmployee
    ? instances[0]?.id
    : (selectedInstanceId ?? instances[0]?.id);

  // ── Tasks loading ─────────────────────────────────────────────────────────

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchKeyword = task.title
        .toLowerCase()
        .includes(keyword.trim().toLowerCase());
      if (!matchKeyword) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "done") return task.status === STATUS_DONE;
      if (statusFilter === "pending_approval")
        return task.rawStatus === "PENDING_APPROVAL";
      if (statusFilter === "overdue")
        return (
          Boolean(task.dueDate) &&
          task.rawStatus !== STATUS_DONE_API &&
          new Date(task.dueDate!) < new Date()
        );
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
      try {
        await updateStatus.mutateAsync({ taskId: task.id, status: "TODO" });
        queryClient.invalidateQueries({ queryKey: taskQueryKey });
        notify.success(t("onboarding.task.toast.undone"));
      } catch {
        notify.error(t("onboarding.task.toast.failed"));
      }
      return;
    }

    if (
      isEmployee &&
      task.requireAck &&
      task.rawStatus !== "WAIT_ACK" &&
      task.rawStatus !== "DONE"
    ) {
      acknowledgeMutation.mutate(task.id);
      return;
    }

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

  const instanceSelectOptions = instances.map((inst) => {
    const progressLabel = inst.progress > 0 ? ` · ${inst.progress}%` : "";
    const managerLabel = inst.managerName ? ` · ${inst.managerName}` : "";
    const displayName =
      inst.employeeName ??
      inst.employeeId ??
      t("onboarding.task.instance.unknown_employee");
    return {
      label: `${displayName} — ${inst.status}${progressLabel}${managerLabel}`,
      value: inst.id,
    };
  });

  const selectedInstance = useMemo(
    () => instances.find((i) => i.id === onboardingId),
    [instances, onboardingId],
  );

  const handleInlineApprove = (task: OnboardingTask) => {
    approveMutation.mutate(task.id);
  };

  const handleInlineReject = (task: OnboardingTask) => {
    setSelectedTaskId(task.id);
    setRejectModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* ── Filters & Instance Selector ─────────────────────────── */}
      <Card>
        <Row gutter={[16, 12]} align="middle">
          {canManage && (
            <Col xs={24} md={8}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
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
              <p className="mt-1 text-xs text-gray-400">
                {isHr
                  ? t("onboarding.task.instance.hr_hint", {
                      total: instances.length,
                    })
                  : isManager
                    ? t("onboarding.task.instance.manager_hint", {
                        total: instances.length,
                      })
                    : null}
              </p>
            </Col>
          )}
          <Col xs={24} md={canManage ? 8 : 12}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
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
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                ...(canManage
                  ? [
                      {
                        label: t("onboarding.task.quickview.filter_pending_approval"),
                        value: "pending_approval",
                      },
                      {
                        label: t("onboarding.task.quickview.filter_overdue"),
                        value: "overdue",
                      },
                    ]
                  : []),
              ]}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("onboarding.task.quickview.result", {
                visible: filteredTasks.length,
                total: tasks.length,
              })}
            </p>
          </Col>
        </Row>
      </Card>

      {/* ── Instance Info Banner (HR/Manager) ──────────────────────── */}
      {canManage && selectedInstance && (
        <Card size="small" className="border-blue-100 bg-blue-50/30">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <User className="h-4 w-4 text-blue-400" />
              {selectedInstance.employeeName ??
                selectedInstance.employeeId ??
                t("onboarding.task.instance.unknown_employee")}
              {selectedInstance.templateName && (
                <span className="ml-1 text-xs font-normal text-gray-400">
                  · {selectedInstance.templateName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(selectedInstance.startDate)}
            </div>
            {selectedInstance.managerName && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <User className="h-3.5 w-3.5" />
                {selectedInstance.managerName}
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Progress
                percent={selectedInstance.progress}
                size="small"
                style={{ width: 120, marginBottom: 0 }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* ── Progress Stats ──────────────────────────────────────── */}
      {tasks.length > 0 && <ProgressStats tasks={tasks} />}

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
              onApprove={canManage ? handleInlineApprove : undefined}
              onReject={canManage ? handleInlineReject : undefined}
              canManage={canManage}
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
        title={
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span>{t("onboarding.task.detail.title")}</span>
          </div>
        }
        width={canManage ? 720 : 600}
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}>
        {taskDetailLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : taskDetail ? (
          <div className="space-y-5">
            {/* ── Employee context (HR/Manager view) ───────────────── */}
            {canManage && selectedInstance && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-xs text-gray-500">
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  {selectedInstance.employeeName ?? selectedInstance.employeeId ?? "-"}
                </span>
                {selectedInstance.managerName && (
                  <span>Manager: {selectedInstance.managerName}</span>
                )}
                <span>
                  <Progress
                    percent={selectedInstance.progress}
                    size="small"
                    style={{ width: 100, marginBottom: 0 }}
                  />
                </span>
              </div>
            )}

            {/* ── Header: Title + Stage ─────────────────────────── */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="mb-2 flex flex-wrap items-start gap-2">
                <Typography.Title
                  level={5}
                  className="!mb-0 flex-1 !text-gray-800">
                  {String(taskDetail.title ?? "-")}
                </Typography.Title>
                <StatusBadge rawStatus={taskDetail.status} />
              </div>
              {taskDetail.checklistName && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">{t("onboarding.task.field.checklist")}:</span>
                  {(() => {
                    const info = getStageLabel(taskDetail.checklistName, t);
                    return (
                      <Tag color={info.color} style={{ margin: 0, fontSize: 11 }}>
                        {info.label}
                      </Tag>
                    );
                  })()}
                </div>
              )}
              {taskDetail.overdue && (
                <div className="mt-2 flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {t("onboarding.task.stat.overdue")}
                  {taskDetail.dueInHours != null &&
                    ` — ${Math.abs(Math.round(taskDetail.dueInHours))}h`}
                </div>
              )}
            </div>

            {/* ── Info Grid ───────────────────────────────────────── */}
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <InfoField label={t("onboarding.employee.home.task_detail.field_due_date")}>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {formatDate(taskDetail.dueDate)}
                    </span>
                  </InfoField>
                </div>
              </Col>
              <Col span={12}>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <InfoField label={t("onboarding.task.field.completed_at")}>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />
                      {formatDate(taskDetail.completedAt)}
                    </span>
                  </InfoField>
                </div>
              </Col>
              {taskDetail.assignedUserName || taskDetail.assignedUserId ? (
                <Col span={12}>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <InfoField label={t("onboarding.task.field.assignee")}>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {taskDetail.assignedUserName ?? taskDetail.assignedUserId}
                      </span>
                    </InfoField>
                  </div>
                </Col>
              ) : null}
              {taskDetail.createdAt ? (
                <Col span={taskDetail.assignedUserName || taskDetail.assignedUserId ? 12 : 24}>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <InfoField label={t("onboarding.task.field.created_at")}>
                      {formatDateTime(taskDetail.createdAt)}
                    </InfoField>
                  </div>
                </Col>
              ) : null}
            </Row>

            {/* ── Description ─────────────────────────────────────── */}
            {taskDetail.description && (
              <div>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12 }}>
                  {t("onboarding.employee.home.task_detail.field_description")}
                </Typography.Text>
                <div className="mt-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                  {String(taskDetail.description)}
                </div>
              </div>
            )}

            {/* ── Acknowledgment Section ──────────────────────────── */}
            {taskDetail.requireAck && (
              <>
                <Divider orientationMargin={0}>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <CheckSquare className="h-3 w-3" />
                    {t("onboarding.task.ack.section_title")}
                  </span>
                </Divider>
                <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
                  {taskDetail.acknowledgedAt ? (
                    <Row gutter={[12, 8]}>
                      <Col span={12}>
                        <InfoField label={t("onboarding.task.field.acknowledged_by")}>
                          {taskDetail.acknowledgedBy ?? "-"}
                        </InfoField>
                      </Col>
                      <Col span={12}>
                        <InfoField label={t("onboarding.task.field.acknowledged_at")}>
                          {formatDateTime(taskDetail.acknowledgedAt)}
                        </InfoField>
                      </Col>
                    </Row>
                  ) : (
                    <span className="text-sm text-orange-600">
                      {t("onboarding.task.ack.not_yet")}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* ── Approval Section ────────────────────────────────── */}
            {taskDetail.requiresManagerApproval && (
              <>
                <Divider orientationMargin={0}>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <ThumbsUp className="h-3 w-3" />
                    {t("onboarding.task.approval.section_title")}
                  </span>
                </Divider>
                <div
                  className={`rounded-lg border p-3 ${
                    taskDetail.approvalStatus === "REJECTED"
                      ? "border-red-100 bg-red-50/40"
                      : taskDetail.approvalStatus === "APPROVED"
                        ? "border-emerald-100 bg-emerald-50/40"
                        : "border-yellow-100 bg-yellow-50/40"
                  }`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {t("onboarding.employee.home.task_detail.field_status")}:
                    </span>
                    <Tag
                      color={
                        APPROVAL_STATUS_COLOR[
                          taskDetail.approvalStatus ?? "NONE"
                        ] ?? "default"
                      }
                      style={{ margin: 0 }}>
                      {t(
                        `onboarding.task.approval.status.${(taskDetail.approvalStatus ?? "NONE").toLowerCase()}`,
                      )}
                    </Tag>
                  </div>
                  {(taskDetail.approvedBy || taskDetail.approvedAt) && (
                    <Row gutter={[12, 8]}>
                      {taskDetail.approvedBy && (
                        <Col span={12}>
                          <InfoField label={t("onboarding.task.field.approved_by")}>
                            {taskDetail.approvedBy}
                          </InfoField>
                        </Col>
                      )}
                      {taskDetail.approvedAt && (
                        <Col span={12}>
                          <InfoField label={t("onboarding.task.field.approved_at")}>
                            {formatDateTime(taskDetail.approvedAt)}
                          </InfoField>
                        </Col>
                      )}
                    </Row>
                  )}
                  {taskDetail.rejectionReason && (
                    <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2">
                      <Typography.Text type="danger" style={{ fontSize: 12 }}>
                        <XCircle className="mr-1 inline h-3 w-3" />
                        <span className="font-medium">
                          {t("onboarding.task.rejection_reason_label")}:
                        </span>{" "}
                        {taskDetail.rejectionReason}
                      </Typography.Text>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Schedule Section ────────────────────────────────── */}
            {taskDetail.scheduleStatus &&
              taskDetail.scheduleStatus !== "UNSCHEDULED" && (
                <>
                  <Divider orientationMargin={0}>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {t("onboarding.task.schedule.section_title")}
                    </span>
                  </Divider>
                  <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {t("onboarding.employee.home.task_detail.field_status")}:
                      </span>
                      <Tag
                        color={
                          SCHEDULE_STATUS_COLOR[taskDetail.scheduleStatus] ??
                          "default"
                        }
                        style={{ margin: 0 }}>
                        {t(
                          `onboarding.task.schedule.status.${taskDetail.scheduleStatus}`,
                        )}
                      </Tag>
                    </div>
                    <Row gutter={[12, 8]}>
                      {taskDetail.scheduledStartAt && (
                        <Col span={12}>
                          <InfoField
                            label={t("onboarding.task.schedule.field.start")}>
                            {formatDateTime(taskDetail.scheduledStartAt)}
                          </InfoField>
                        </Col>
                      )}
                      {taskDetail.scheduledEndAt && (
                        <Col span={12}>
                          <InfoField
                            label={t("onboarding.task.schedule.field.end")}>
                            {formatDateTime(taskDetail.scheduledEndAt)}
                          </InfoField>
                        </Col>
                      )}
                    </Row>
                  </div>
                </>
              )}

            {/* ── Role-aware action buttons ─────────────────────── */}
            <Divider orientationMargin={0}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t("onboarding.task.detail.title")}
              </Typography.Text>
            </Divider>

            <div className="flex flex-wrap gap-2">
              {/* Employee: Acknowledge */}
              {isEmployee &&
                taskDetail.requireAck &&
                (taskDetail.status === "TODO" ||
                  taskDetail.status === "IN_PROGRESS") && (
                  <Button
                    type="primary"
                    icon={<CheckSquare className="h-3.5 w-3.5" />}
                    loading={acknowledgeMutation.isPending}
                    onClick={() =>
                      acknowledgeMutation.mutate(taskDetail.taskId)
                    }>
                    {t("onboarding.task.action.acknowledge")}
                  </Button>
                )}

              {/* Employee: Confirm Complete (WAIT_ACK) */}
              {isEmployee && taskDetail.status === "WAIT_ACK" && (
                <Button
                  type="primary"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
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

              {/* Employee: Submit for Approval */}
              {isEmployee &&
                taskDetail.requiresManagerApproval &&
                (taskDetail.status === "TODO" ||
                  taskDetail.status === "IN_PROGRESS") && (
                  <Button
                    type="primary"
                    icon={<Send className="h-3.5 w-3.5" />}
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

              {/* Employee: Normal done */}
              {isEmployee &&
                !taskDetail.requireAck &&
                !taskDetail.requiresManagerApproval &&
                (taskDetail.status === "TODO" ||
                  taskDetail.status === "IN_PROGRESS") && (
                  <Button
                    type="primary"
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    loading={updateStatus.isPending}
                    onClick={async () => {
                      const task = tasks.find((tk) => tk.id === selectedTaskId);
                      if (task) await handleToggleTask(task);
                      setSelectedTaskId(null);
                    }}>
                    {t("onboarding.employee.home.today_actions.mark_done")}
                  </Button>
                )}

              {/* Manager/HR: Approve */}
              {canManage && taskDetail.status === "PENDING_APPROVAL" && (
                <Button
                  type="primary"
                  icon={<ThumbsUp className="h-3.5 w-3.5" />}
                  loading={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(taskDetail.taskId)}>
                  {t("onboarding.task.action.approve")}
                </Button>
              )}

              {/* Manager/HR: Reject */}
              {canManage && taskDetail.status === "PENDING_APPROVAL" && (
                <Button
                  danger
                  icon={<XCircle className="h-3.5 w-3.5" />}
                  loading={rejectMutation.isPending}
                  onClick={() => setRejectModalOpen(true)}>
                  {t("onboarding.task.action.reject")}
                </Button>
              )}

              <Button onClick={() => setSelectedTaskId(null)}>
                {t("global.close")}
              </Button>
            </div>

            {/* ── Activity Logs ──────────────────────────────────── */}
            {taskDetail.activityLogs && taskDetail.activityLogs.length > 0 && (
              <>
                <Divider orientationMargin={0}>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Activity className="h-3 w-3" />
                    {t("onboarding.task.activity.section_title")}
                  </span>
                </Divider>
                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {taskDetail.activityLogs.map((log) => (
                    <div
                      key={log.logId}
                      className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs">
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-700">
                          {log.action}
                        </span>
                        {log.newValue && (
                          <span className="ml-1 text-gray-500">
                            → {log.newValue}
                          </span>
                        )}
                        {log.actorName && (
                          <span className="ml-1 text-gray-400">
                            · {log.actorName}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-gray-400">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Attachments placeholder ─────────────────────────── */}
            {taskDetail.attachments && taskDetail.attachments.length > 0 && (
              <>
                <Divider orientationMargin={0}>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Paperclip className="h-3 w-3" />
                    {t("onboarding.employee.home.task_detail.field_attachments")}
                  </span>
                </Divider>
                <div className="space-y-1.5">
                  {taskDetail.attachments.map((att) => (
                    <a
                      key={att.attachmentId}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-50">
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{att.fileName}</span>
                      {att.fileSizeBytes && (
                        <span className="shrink-0 text-xs text-gray-400">
                          {(att.fileSizeBytes / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </>
            )}

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
                          {formatDateTime(c.createdAt)}
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
