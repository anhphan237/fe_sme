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
  Play,
  UserPlus,
  List,
  BarChart2,
  CalendarClock,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  Card,
  Col,
  DatePicker,
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
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import type { Dayjs } from "dayjs";

import { notify } from "@/utils/notify";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import { isOnboardingEmployee, canManageOnboarding } from "@/shared/rbac";
import {
  apiAddTaskComment,
  apiGetTaskDetailFull,
  apiListInstances,
  apiListTasks,
  apiListTasksByAssignee,
  apiListTaskComments,
  apiUpdateTaskStatus,
  apiAcknowledgeTask,
  apiApproveTask,
  apiRejectTask,
  apiAssignTask,
  apiGetTaskTimeline,
  apiProposeTaskSchedule,
  apiConfirmTaskSchedule,
  apiAddTaskAttachment,
} from "@/api/onboarding/onboarding.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import type {
  CommentResponse,
  TaskDetailResponse,
} from "@/interface/onboarding";
import type { UserListItem } from "@/interface/identity";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_DONE = "Done";
const STATUS_DONE_API = "DONE";

type StatusFilter =
  | "all"
  | "pending"
  | "done"
  | "pending_approval"
  | "overdue"
  | "mine";
type ViewMode = "list" | "timeline";

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;
  const r = err as { message?: unknown; errorMessage?: unknown };
  if (typeof r.message === "string") return r.message;
  if (typeof r.errorMessage === "string") return r.errorMessage;
  return fallback;
};

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
    queryFn: () => apiGetTaskDetailFull(taskId!, { includeActivityLogs: true }),
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

const useTaskTimelineQuery = (onboardingId?: string) =>
  useQuery({
    queryKey: ["onboarding-task-timeline", onboardingId ?? ""],
    queryFn: () =>
      apiGetTaskTimeline({ onboardingId: onboardingId!, includeDone: true }),
    enabled: Boolean(onboardingId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      return (r?.assignees ?? r?.data ?? []) as Array<{
        assigneeUserId: string;
        assigneeUserName?: string;
        taskCount: number;
        tasks: Array<{
          taskId: string;
          checklistName?: string;
          title?: string;
          status?: string;
          dueDate?: string;
          scheduledStartAt?: string;
          scheduleStatus?: string;
        }>;
      }>;
    },
  });

/** Employee-specific: loads only tasks assigned to the current user (listByAssignee) */
const useMyAssignedTasksQuery = (enabled: boolean, userId?: string) =>
  useQuery({
    queryKey: ["onboarding-tasks-by-assignee", userId ?? ""],
    queryFn: () => apiListTasksByAssignee({ size: 200 }),
    enabled: enabled && Boolean(userId),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "tasks",
        "content",
        "items",
        "list",
      ).map(mapTask) as OnboardingTask[],
  });

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatusBadge = ({ rawStatus }: { rawStatus: string | undefined }) => {
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

const ProgressStats = ({ tasks }: { tasks: OnboardingTask[] }) => {
  const { t } = useLocale();
  const total = tasks.length;
  const done = tasks.filter((tk) => tk.rawStatus === STATUS_DONE_API).length;
  const inProgress = tasks.filter(
    (tk) => tk.rawStatus === "IN_PROGRESS" || tk.rawStatus === "ASSIGNED",
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
    {
      label: t("onboarding.task.stat.total"),
      value: total,
      color: "text-gray-700",
    },
    {
      label: t("onboarding.task.stat.done"),
      value: done,
      color: "text-emerald-600",
    },
    {
      label: t("onboarding.task.stat.in_progress"),
      value: inProgress,
      color: "text-blue-600",
    },
    {
      label: t("onboarding.task.stat.overdue"),
      value: overdue,
      color: "text-amber-600",
    },
    {
      label: t("onboarding.task.stat.pending_approval"),
      value: pendingApproval,
      color: "text-yellow-600",
    },
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

// ── TaskAction: contextual primary action button ───────────────────────────────

const TaskAction = ({
  task,
  canAct,
  canManage,
  isUpdating,
  onStart,
  onAcknowledge,
  onSubmitApproval,
  onMarkDone,
  onApprove,
  onReject,
}: {
  task: OnboardingTask;
  /** Current user can act on this task: is assignee OR has HR/MANAGER role */
  canAct: boolean;
  canManage: boolean;
  isUpdating: boolean;
  onStart: () => void;
  onAcknowledge: () => void;
  onSubmitApproval: () => void;
  onMarkDone: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) => {
  const { t } = useLocale();
  const status = task.rawStatus;
  const isDone = status === STATUS_DONE_API;

  if (isDone) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("onboarding.task.action.done_label")}
      </span>
    );
  }

  if (status === "PENDING_APPROVAL") {
    if (canManage && onApprove && onReject) {
      return (
        <div className="flex items-center gap-1.5">
          <Popconfirm
            title={t("onboarding.task.action.approve")}
            description={t("onboarding.task.action.approve_confirm_desc")}
            okText={t("onboarding.task.action.approve")}
            cancelText={t("global.close")}
            onConfirm={onApprove}>
            <Button
              size="small"
              type="primary"
              loading={isUpdating}
              icon={<ThumbsUp className="h-3 w-3" />}>
              {t("onboarding.task.action.approve")}
            </Button>
          </Popconfirm>
          <Button
            size="small"
            danger
            icon={<XCircle className="h-3 w-3" />}
            onClick={onReject}>
            {t("onboarding.task.action.reject")}
          </Button>
        </div>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-amber-600">
        <Clock className="h-3 w-3" />
        {t("onboarding.task.status.pending_approval")}
      </span>
    );
  }

  if (!canAct) return null;

  if (status === "TODO" || status === "ASSIGNED") {
    return (
      <Button
        size="small"
        type="default"
        loading={isUpdating}
        icon={<Play className="h-3 w-3" />}
        onClick={onStart}>
        {t("onboarding.task.action.start")}
      </Button>
    );
  }

  if (status === "IN_PROGRESS") {
    if (task.requireAck) {
      return (
        <Button
          size="small"
          type="primary"
          loading={isUpdating}
          icon={<CheckSquare className="h-3 w-3" />}
          onClick={onAcknowledge}>
          {t("onboarding.task.action.acknowledge")}
        </Button>
      );
    }
    if (task.requiresManagerApproval) {
      const docRequired = task.requireDoc && !canManage;
      return (
        <Tooltip
          title={
            docRequired ? t("onboarding.task.prereq.needs_doc") : undefined
          }>
          <Button
            size="small"
            type="primary"
            loading={isUpdating}
            disabled={docRequired}
            icon={<Send className="h-3 w-3" />}
            onClick={onSubmitApproval}>
            {t("onboarding.task.action.submit_approval")}
          </Button>
        </Tooltip>
      );
    }
    const docRequired = task.requireDoc && !canManage;
    return (
      <Tooltip
        title={docRequired ? t("onboarding.task.prereq.needs_doc") : undefined}>
        <Button
          size="small"
          type="primary"
          loading={isUpdating}
          disabled={docRequired}
          icon={<CheckCircle2 className="h-3 w-3" />}
          onClick={onMarkDone}>
          {t("onboarding.employee.home.today_actions.mark_done")}
        </Button>
      </Tooltip>
    );
  }

  if (status === "WAIT_ACK") {
    const docRequired = task.requireDoc && !canManage;
    return (
      <Tooltip
        title={docRequired ? t("onboarding.task.prereq.needs_doc") : undefined}>
        <Button
          size="small"
          type="primary"
          loading={isUpdating}
          disabled={docRequired}
          icon={<CheckCircle2 className="h-3 w-3" />}
          onClick={onMarkDone}>
          {t("onboarding.task.action.confirm_complete")}
        </Button>
      </Tooltip>
    );
  }

  return null;
};

// ── TaskItem ───────────────────────────────────────────────────────────────────

const TaskItem = ({
  task,
  currentUserId,
  canManage,
  isUpdating,
  onStart,
  onAcknowledge,
  onSubmitApproval,
  onMarkDone,
  onInspect,
  onApprove,
  onReject,
}: {
  task: OnboardingTask;
  currentUserId?: string;
  canManage: boolean;
  isUpdating: boolean;
  onStart: (task: OnboardingTask) => void;
  onAcknowledge: (task: OnboardingTask) => void;
  onSubmitApproval: (task: OnboardingTask) => void;
  onMarkDone: (task: OnboardingTask) => void;
  onInspect: (task: OnboardingTask) => void;
  onApprove?: (task: OnboardingTask) => void;
  onReject?: (task: OnboardingTask) => void;
}) => {
  const { t } = useLocale();
  const isDone = task.status === STATUS_DONE;
  const isOverdue =
    task.dueDate && !isDone && new Date(task.dueDate) < new Date();
  const isAssignee =
    Boolean(currentUserId) && task.assignedUserId === currentUserId;
  // HR/MANAGER bypass assignee constraint on BE; employees & IT-only must be assignee.
  const canAct = canManage || isAssignee;

  return (
    <li className="transition-colors hover:bg-slate-50">
      <div className="flex flex-col gap-0 px-4 py-3 sm:flex-row sm:items-start sm:gap-3">
        {/* Status indicator dot */}
        <div className="mt-1.5 shrink-0">
          {isDone ? (
            <div className="h-3.5 w-3.5 rounded-full bg-emerald-400" />
          ) : task.rawStatus === "PENDING_APPROVAL" ? (
            <div className="h-3.5 w-3.5 rounded-full bg-amber-400" />
          ) : task.rawStatus === "IN_PROGRESS" ||
            task.rawStatus === "ASSIGNED" ? (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 bg-blue-100" />
          ) : (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300" />
          )}
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
                  {t("onboarding.task.flag.approval_short")}
                </Tag>
              </Tooltip>
            )}
            {task.requireDoc && !isDone && (
              <Tooltip title={t("onboarding.task.flag.requires_doc")}>
                <Tag
                  color="cyan"
                  style={{ margin: 0, fontSize: 10, padding: "0 4px" }}>
                  <Paperclip className="mr-0.5 inline h-2.5 w-2.5" />
                  Doc
                </Tag>
              </Tooltip>
            )}

            {task.rawStatus && <StatusBadge rawStatus={task.rawStatus} />}

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

          {/* Row 3: meta + actions */}
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
              <TaskAction
                task={task}
                canAct={canAct}
                canManage={canManage}
                isUpdating={isUpdating}
                onStart={() => onStart(task)}
                onAcknowledge={() => onAcknowledge(task)}
                onSubmitApproval={() => onSubmitApproval(task)}
                onMarkDone={() => onMarkDone(task)}
                onApprove={onApprove ? () => onApprove(task) : undefined}
                onReject={onReject ? () => onReject(task) : undefined}
              />
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
  currentUserId,
  canManage,
  onStart,
  onAcknowledge,
  onSubmitApproval,
  onMarkDone,
  onInspect,
  onApprove,
  onReject,
}: {
  title: string;
  tasks: OnboardingTask[];
  isUpdating: boolean;
  currentUserId?: string;
  canManage: boolean;
  onStart: (task: OnboardingTask) => void;
  onAcknowledge: (task: OnboardingTask) => void;
  onSubmitApproval: (task: OnboardingTask) => void;
  onMarkDone: (task: OnboardingTask) => void;
  onInspect: (task: OnboardingTask) => void;
  onApprove?: (task: OnboardingTask) => void;
  onReject?: (task: OnboardingTask) => void;
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
            currentUserId={currentUserId}
            canManage={canManage}
            isUpdating={isUpdating}
            onStart={onStart}
            onAcknowledge={onAcknowledge}
            onSubmitApproval={onSubmitApproval}
            onMarkDone={onMarkDone}
            onInspect={onInspect}
            onApprove={canManage ? onApprove : undefined}
            onReject={canManage ? onReject : undefined}
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
              <Skeleton.Avatar active size="small" shape="circle" />
              <Skeleton.Input active size="small" style={{ flex: 1 }} />
              <Skeleton.Button active size="small" />
            </div>
          ))}
        </div>
      </Card>
    ))}
  </div>
);

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

// ── Timeline View ──────────────────────────────────────────────────────────────

const TimelineView = ({
  onboardingId,
  onInspect,
}: {
  onboardingId: string;
  onInspect: (taskId: string) => void;
}) => {
  const { t } = useLocale();
  const { data: groups = [], isLoading } = useTaskTimelineQuery(onboardingId);

  if (isLoading) return <LoadingState />;

  if (groups.length === 0) {
    return (
      <Card>
        <div className="py-8">
          <Empty description={t("onboarding.task.timeline.empty")} />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card
          key={group.assigneeUserId}
          size="small"
          title={
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {(group.assigneeUserName ??
                  group.assigneeUserId)[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {group.assigneeUserName ?? group.assigneeUserId}
              </span>
              <Tag color="blue" style={{ margin: 0 }}>
                {group.taskCount} {t("onboarding.task.timeline.tasks_count")}
              </Tag>
            </div>
          }>
          <Timeline
            items={group.tasks.map((task) => ({
              color:
                task.status === "DONE"
                  ? "green"
                  : task.status === "PENDING_APPROVAL"
                    ? "orange"
                    : task.status === "IN_PROGRESS"
                      ? "blue"
                      : "gray",
              children: (
                <div
                  className="flex cursor-pointer items-start justify-between gap-2 rounded-lg p-2 transition hover:bg-slate-50"
                  onClick={() => onInspect(task.taskId)}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {task.title}
                    </p>
                    {task.checklistName && (
                      <p className="text-xs text-gray-400">
                        {task.checklistName}
                      </p>
                    )}
                    {task.scheduledStartAt && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-blue-500">
                        <CalendarClock className="h-3 w-3" />
                        {formatDateTime(task.scheduledStartAt)}
                        {task.scheduleStatus && (
                          <Tag
                            color={
                              SCHEDULE_STATUS_COLOR[task.scheduleStatus] ??
                              "default"
                            }
                            style={{ margin: 0, fontSize: 10 }}>
                            {task.scheduleStatus}
                          </Tag>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {task.status && (
                      <Tag
                        color={STATUS_TAG_COLOR[task.status] ?? "default"}
                        style={{ margin: 0, fontSize: 11 }}>
                        {task.status}
                      </Tag>
                    )}
                    {task.dueDate && (
                      <span className="text-[11px] text-gray-400">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ),
            }))}
          />
        </Card>
      ))}
    </div>
  );
};

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

  // ── View mode ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("list");

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
    if (isManager)
      return allInstances.filter((i) => i.managerUserId === userId);
    if (isEmployee)
      return allInstances.filter(
        (i) => i.employeeUserId === userId || i.employeeId === userId,
      );
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
  // Employee: listByAssignee (only their own tasks, no instance context needed)
  // HR/Manager: listByOnboarding (all tasks for the selected instance)
  const myAssignedTasks = useMyAssignedTasksQuery(isEmployee, userId);
  const instanceTasks = useTasksQuery(!isEmployee ? onboardingId : undefined);

  const tasks = isEmployee
    ? (myAssignedTasks.data ?? [])
    : (instanceTasks.data ?? []);
  const isLoading = isEmployee
    ? myAssignedTasks.isLoading
    : instanceTasks.isLoading;
  const isError = isEmployee ? myAssignedTasks.isError : instanceTasks.isError;
  const error = isEmployee ? myAssignedTasks.error : instanceTasks.error;
  const refetch = isEmployee ? myAssignedTasks.refetch : instanceTasks.refetch;

  const updateStatus = useUpdateTaskStatus();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [attFileUrl, setAttFileUrl] = useState("");
  const [attFileName, setAttFileName] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // ── Assign task state ─────────────────────────────────────────────────────
  const [assignUserId, setAssignUserId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // User directory — lazy-loaded for assign dropdown (HR/Manager only)
  const { data: assignableUsers = [], isLoading: assignUsersLoading } =
    useQuery({
      queryKey: ["onboarding-task-assignable-users"],
      queryFn: () => apiSearchUsers({ status: "ACTIVE" }),
      enabled: canManage && Boolean(selectedTaskId),
      select: (res: unknown) =>
        extractList(
          res as Record<string, unknown>,
          "users",
          "items",
          "list",
        ) as UserListItem[],
    });

  // ── Schedule propose state ─────────────────────────────────────────────────
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleDates, setScheduleDates] = useState<
    [Dayjs | null, Dayjs | null]
  >([null, null]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const acknowledgeMutation = useMutation({
    mutationFn: (taskId: string) => apiAcknowledgeTask({ taskId }),
    onSuccess: () => {
      invalidateTasks();
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      notify.success(t("onboarding.task.toast.acknowledged"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const approveMutation = useMutation({
    mutationFn: (taskId: string) => apiApproveTask({ taskId }),
    onSuccess: () => {
      invalidateTasks();
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      setSelectedTaskId(null);
      notify.success(t("onboarding.task.toast.approved"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      apiRejectTask({ taskId, reason }),
    onSuccess: () => {
      invalidateTasks();
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      setSelectedTaskId(null);
      setRejectModalOpen(false);
      setRejectReason("");
      notify.success(t("onboarding.task.toast.rejected"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const scheduleProposeMutation = useMutation({
    mutationFn: ({
      taskId,
      startAt,
      endAt,
    }: {
      taskId: string;
      startAt: string;
      endAt: string;
    }) =>
      apiProposeTaskSchedule({
        taskId,
        scheduledStartAt: startAt,
        scheduledEndAt: endAt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-timeline", onboardingId ?? ""],
      });
      setScheduleModalOpen(false);
      setScheduleDates([null, null]);
      notify.success(t("onboarding.task.schedule.toast.proposed"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const scheduleConfirmMutation = useMutation({
    mutationFn: (taskId: string) => apiConfirmTaskSchedule({ taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-timeline", onboardingId ?? ""],
      });
      notify.success(t("onboarding.task.schedule.toast.confirmed"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
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
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const addAttachmentMutation = useMutation({
    mutationFn: ({
      taskId,
      fileUrl,
      fileName,
    }: {
      taskId: string;
      fileUrl: string;
      fileName: string;
    }) => apiAddTaskAttachment({ taskId, fileUrl, fileName }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      setAttFileUrl("");
      setAttFileName("");
      notify.success(t("onboarding.task.attachment.toast_added"));
    },
    onError: () => notify.error(t("onboarding.task.attachment.toast_failed")),
  });

  const { data: taskDetail, isLoading: taskDetailLoading } = useTaskDetailQuery(
    selectedTaskId ?? undefined,
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const invalidateTasks = () => {
    // Invalidate both keys — only the active one will refetch
    queryClient.invalidateQueries({
      queryKey: ["onboarding-tasks-by-assignee", userId ?? ""],
    });
    queryClient.invalidateQueries({
      queryKey: ["onboarding-tasks-by-instance", onboardingId ?? ""],
    });
  };

  const handleAddComment = () => {
    if (!selectedTaskId || !commentInput.trim()) return;
    addCommentMutation.mutate({
      taskId: selectedTaskId,
      message: commentInput.trim(),
    });
  };

  const handleStart = async (task: OnboardingTask) => {
    try {
      await updateStatus.mutateAsync({
        taskId: task.id,
        status: "IN_PROGRESS",
      });
      invalidateTasks();
      notify.success(t("onboarding.task.toast.started"));
    } catch (err) {
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed")));
    }
  };

  const handleAcknowledge = (task: OnboardingTask) => {
    acknowledgeMutation.mutate(task.id);
  };

  const handleSubmitApproval = async (task: OnboardingTask) => {
    try {
      await updateStatus.mutateAsync({
        taskId: task.id,
        status: "PENDING_APPROVAL",
      });
      invalidateTasks();
      notify.success(t("onboarding.task.toast.submitted_approval"));
    } catch (err) {
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed")));
    }
  };

  const handleMarkDone = async (task: OnboardingTask) => {
    try {
      await updateStatus.mutateAsync({
        taskId: task.id,
        status: STATUS_DONE_API,
      });
      invalidateTasks();
      notify.success(t("onboarding.task.toast.done"));
    } catch (err) {
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed")));
    }
  };

  const handleInlineApprove = (task: OnboardingTask) => {
    approveMutation.mutate(task.id);
  };

  const handleInlineReject = (task: OnboardingTask) => {
    setSelectedTaskId(task.id);
    setRejectModalOpen(true);
  };

  const handleAssignTask = async () => {
    if (!selectedTaskId || !assignUserId.trim()) return;
    setAssignLoading(true);
    try {
      await apiAssignTask(selectedTaskId, assignUserId.trim());
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      invalidateTasks();
      setAssignUserId("");
      notify.success(t("onboarding.task.toast.assigned"));
    } catch (err) {
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed")));
    } finally {
      setAssignLoading(false);
    }
  };

  const handleProposeSchedule = () => {
    if (!selectedTaskId || !scheduleDates[0] || !scheduleDates[1]) return;
    scheduleProposeMutation.mutate({
      taskId: selectedTaskId,
      startAt: scheduleDates[0].toISOString(),
      endAt: scheduleDates[1].toISOString(),
    });
  };

  // ── Filtered tasks ────────────────────────────────────────────────────────

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
      if (statusFilter === "mine")
        return Boolean(userId) && task.assignedUserId === userId;
      return task.status !== STATUS_DONE;
    });
  }, [tasks, keyword, statusFilter, userId]);

  const myAssignedCount = useMemo(
    () =>
      userId
        ? tasks.filter(
            (t) =>
              t.assignedUserId === userId && t.rawStatus !== STATUS_DONE_API,
          ).length
        : 0,
    [tasks, userId],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, OnboardingTask[]>();
    for (const task of filteredTasks) {
      const key = task.checklistName ?? "Other";
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return Array.from(map.entries());
  }, [filteredTasks]);

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

  const roleLabel = isHr
    ? t("onboarding.task.role.hr")
    : isManager
      ? t("onboarding.task.role.manager")
      : isEmployee
        ? t("onboarding.task.role.employee")
        : t("onboarding.task.role.other");

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
                  onChange={(v) => {
                    setSelectedInstanceId(v);
                    setViewMode("list");
                  }}
                  showSearch
                  filterOption={(input, option) =>
                    ((option?.label as string) ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              )}
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
              disabled={viewMode === "timeline"}
            />
          </Col>
          <Col xs={24} md={canManage ? 8 : 12}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("onboarding.task.quickview.title")}
            </p>
            <Segmented
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              disabled={viewMode === "timeline"}
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
                // Show pending_approval & overdue for both managers and employees
                ...(canManage || isEmployee
                  ? [
                      {
                        label: t(
                          "onboarding.task.quickview.filter_pending_approval",
                        ),
                        value: "pending_approval",
                      },
                      {
                        label: t("onboarding.task.quickview.filter_overdue"),
                        value: "overdue",
                      },
                    ]
                  : []),
                // "mine" only makes sense for managers watching multiple assignees
                ...(canManage
                  ? [
                      {
                        label: (
                          <span className="flex items-center gap-1">
                            {t("onboarding.task.quickview.filter_mine")}
                            {myAssignedCount > 0 && (
                              <span className="rounded-full bg-blue-100 px-1.5 text-[10px] font-semibold text-blue-700">
                                {myAssignedCount}
                              </span>
                            )}
                          </span>
                        ),
                        value: "mine",
                      },
                    ]
                  : []),
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* ── Employee Progress Banner ────────────────────────── */}
      {isEmployee && selectedInstance && (
        <Card size="small" className="border-emerald-100 bg-emerald-50/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Typography.Text strong className="text-sm text-gray-700">
                {t("onboarding.task.header.employee_title")}
              </Typography.Text>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(selectedInstance.startDate)}
                </span>
                {selectedInstance.templateName && (
                  <span>· {selectedInstance.templateName}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-400">
                  {t("onboarding.employee.home.overview.progress")}
                </div>
                <div className="text-lg font-bold text-emerald-600">
                  {selectedInstance.progress}%
                </div>
              </div>
              <Progress
                type="circle"
                percent={selectedInstance.progress}
                size={52}
                strokeColor="#10b981"
              />
            </div>
          </div>
        </Card>
      )}

      {/* ── Instance Info Banner + View Mode (HR/Manager) ───────── */}
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
            <div className="ml-auto flex items-center gap-3">
              <Progress
                percent={selectedInstance.progress}
                size="small"
                style={{ width: 120, marginBottom: 0 }}
              />
              {onboardingId && (
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                      viewMode === "list"
                        ? "bg-brand/10 text-brand"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}>
                    <List className="h-3.5 w-3.5" />
                    {t("onboarding.task.view.list")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("timeline")}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                      viewMode === "timeline"
                        ? "bg-brand/10 text-brand"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}>
                    <BarChart2 className="h-3.5 w-3.5" />
                    {t("onboarding.task.view.timeline")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Progress Stats ──────────────────────────────────────── */}
      {tasks.length > 0 && viewMode === "list" && (
        <ProgressStats tasks={tasks} />
      )}

      {/* ── Timeline View ────────────────────────────────────────── */}
      {viewMode === "timeline" && onboardingId && (
        <TimelineView
          onboardingId={onboardingId}
          onInspect={(taskId) => setSelectedTaskId(taskId)}
        />
      )}

      {/* ── List View ────────────────────────────────────────────── */}
      {viewMode === "list" &&
        (isLoading ? (
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
                isUpdating={
                  updateStatus.isPending || acknowledgeMutation.isPending
                }
                currentUserId={userId}
                canManage={canManage}
                onStart={handleStart}
                onAcknowledge={handleAcknowledge}
                onSubmitApproval={handleSubmitApproval}
                onMarkDone={handleMarkDone}
                onInspect={(task) => setSelectedTaskId(task.id)}
                onApprove={canManage ? handleInlineApprove : undefined}
                onReject={canManage ? handleInlineReject : undefined}
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
                  <Button onClick={() => navigate("/dashboard/employee")}>
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
        ))}

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
                  {selectedInstance.employeeName ??
                    selectedInstance.employeeId ??
                    "-"}
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
                  <span className="text-xs text-gray-500">
                    {t("onboarding.task.field.checklist")}:
                  </span>
                  {(() => {
                    const info = getStageLabel(taskDetail.checklistName, t);
                    return (
                      <Tag
                        color={info.color}
                        style={{ margin: 0, fontSize: 11 }}>
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
                  <InfoField
                    label={t(
                      "onboarding.employee.home.task_detail.field_due_date",
                    )}>
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
              {(taskDetail.assignedUserName || taskDetail.assignedUserId) && (
                <Col span={12}>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <InfoField label={t("onboarding.task.field.assignee")}>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {taskDetail.assignedUserName ??
                          taskDetail.assignedUserId}
                      </span>
                    </InfoField>
                  </div>
                </Col>
              )}
              {taskDetail.createdAt && (
                <Col
                  span={
                    taskDetail.assignedUserName || taskDetail.assignedUserId
                      ? 12
                      : 24
                  }>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <InfoField label={t("onboarding.task.field.created_at")}>
                      {formatDateTime(taskDetail.createdAt)}
                    </InfoField>
                  </div>
                </Col>
              )}
            </Row>

            {/* ── Description ─────────────────────────────────────── */}
            {taskDetail.description && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t("onboarding.employee.home.task_detail.field_description")}
                </Typography.Text>
                <div className="mt-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                  {String(taskDetail.description)}
                </div>
              </div>
            )}

            {/* ── Attachments upload (assignee / HR / Manager only) ── */}
            {(taskDetail.assignedUserId === userId || canManage) &&
              taskDetail.status !== "DONE" && (
                <>
                  <Divider orientationMargin={0}>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Paperclip className="h-3 w-3" />
                      {t("onboarding.task.attachment.section_title")}
                    </span>
                  </Divider>
                  <div className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50/40 p-3">
                    <Input
                      size="small"
                      placeholder={t(
                        "onboarding.task.attachment.name_placeholder",
                      )}
                      value={attFileName}
                      onChange={(e) => setAttFileName(e.target.value)}
                      prefix={<Paperclip className="h-3 w-3 text-gray-400" />}
                    />
                    <Input
                      size="small"
                      placeholder={t(
                        "onboarding.task.attachment.url_placeholder",
                      )}
                      value={attFileUrl}
                      onChange={(e) => setAttFileUrl(e.target.value)}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<Paperclip className="h-3 w-3" />}
                      loading={addAttachmentMutation.isPending}
                      disabled={!attFileName.trim() || !attFileUrl.trim()}
                      onClick={() => {
                        if (!selectedTaskId) return;
                        addAttachmentMutation.mutate({
                          taskId: selectedTaskId,
                          fileName: attFileName.trim(),
                          fileUrl: attFileUrl.trim(),
                        });
                      }}>
                      {t("onboarding.task.attachment.add_action")}
                    </Button>
                    {taskDetail.requireDoc && (
                      <p className="!mb-0 text-xs text-cyan-600">
                        {t("onboarding.task.attachment.required_hint")}
                      </p>
                    )}
                  </div>
                </>
              )}

            {/* ── Assign Task (HR/Manager only) ────────────────────── */}
            {canManage && (
              <>
                <Divider orientationMargin={0}>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <UserPlus className="h-3 w-3" />
                    {t("onboarding.task.assign.section_title")}
                  </span>
                </Divider>
                <div className="flex gap-2">
                  <Select
                    style={{ flex: 1 }}
                    size="small"
                    placeholder={t(
                      "onboarding.task.assign.user_select_placeholder",
                    )}
                    value={assignUserId || undefined}
                    onChange={(v) => setAssignUserId(v)}
                    showSearch
                    loading={assignUsersLoading}
                    filterOption={(input, option) =>
                      ((option?.label as string) ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={assignableUsers.map((u) => ({
                      label: `${u.fullName || u.email} · ${(u.roles ?? []).join("/") || "USER"}`,
                      value: u.userId,
                    }))}
                  />
                  <Button
                    size="small"
                    type="primary"
                    loading={assignLoading}
                    icon={<UserPlus className="h-3 w-3" />}
                    onClick={handleAssignTask}
                    disabled={!assignUserId.trim()}>
                    {t("onboarding.task.assign.action")}
                  </Button>
                </div>
              </>
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
                        <InfoField
                          label={t("onboarding.task.field.acknowledged_by")}>
                          {taskDetail.acknowledgedBy ?? "-"}
                        </InfoField>
                      </Col>
                      <Col span={12}>
                        <InfoField
                          label={t("onboarding.task.field.acknowledged_at")}>
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
                          <InfoField
                            label={t("onboarding.task.field.approved_by")}>
                            {taskDetail.approvedBy}
                          </InfoField>
                        </Col>
                      )}
                      {taskDetail.approvedAt && (
                        <Col span={12}>
                          <InfoField
                            label={t("onboarding.task.field.approved_at")}>
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
            <>
              <Divider orientationMargin={0}>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <CalendarClock className="h-3 w-3" />
                  {t("onboarding.task.schedule.section_title")}
                </span>
              </Divider>
              {taskDetail.scheduleStatus &&
              taskDetail.scheduleStatus !== "UNSCHEDULED" ? (
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
                  {/* Confirm button (HR/Manager) when status is PROPOSED */}
                  {canManage && taskDetail.scheduleStatus === "PROPOSED" && (
                    <div className="mt-3">
                      <Button
                        size="small"
                        type="primary"
                        loading={scheduleConfirmMutation.isPending}
                        icon={<CheckCircle2 className="h-3 w-3" />}
                        onClick={() =>
                          scheduleConfirmMutation.mutate(taskDetail.taskId)
                        }>
                        {t("onboarding.task.schedule.action.confirm")}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/40 p-3">
                  <p className="mb-2 text-xs text-gray-400">
                    {t("onboarding.task.schedule.not_scheduled")}
                  </p>
                  <Button
                    size="small"
                    icon={<CalendarClock className="h-3 w-3" />}
                    onClick={() => setScheduleModalOpen(true)}>
                    {t("onboarding.task.schedule.action.propose")}
                  </Button>
                </div>
              )}
            </>

            {/* ── Role-aware action buttons ─────────────────────── */}
            <Divider orientationMargin={0}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t("onboarding.task.detail.title")}
              </Typography.Text>
            </Divider>

            {(() => {
              const isDetailAssignee =
                Boolean(userId) && taskDetail.assignedUserId === userId;
              const canActOnDetail = canManage || isDetailAssignee;
              const hasAttachment = (taskDetail.attachments?.length ?? 0) > 0;
              const scheduleNeededUnmet = Boolean(
                taskDetail.scheduleStatus &&
                taskDetail.scheduleStatus !== "UNSCHEDULED" &&
                taskDetail.scheduleStatus !== "CONFIRMED" &&
                taskDetail.scheduleStatus !== "CANCELLED",
              );
              const docRequiredUnmet = Boolean(
                taskDetail.requireDoc && !hasAttachment,
              );
              const ackRequiredUnmet = Boolean(
                taskDetail.requireAck && !taskDetail.acknowledgedAt,
              );
              const blockMarkDone =
                docRequiredUnmet || ackRequiredUnmet || scheduleNeededUnmet;
              const blockSubmitApproval = docRequiredUnmet;
              const prerequisiteHint = blockMarkDone
                ? docRequiredUnmet
                  ? t("onboarding.task.prereq.needs_doc")
                  : ackRequiredUnmet
                    ? t("onboarding.task.prereq.needs_ack")
                    : t("onboarding.task.prereq.needs_schedule")
                : null;
              return (
                <>
                  {prerequisiteHint && canActOnDetail && (
                    <div className="mb-1 flex items-center gap-1.5 rounded-md border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {prerequisiteHint}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {/* Assignee: Acknowledge */}
                    {canActOnDetail &&
                      taskDetail.requireAck &&
                      !taskDetail.acknowledgedAt &&
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

                    {/* Assignee: Start task */}
                    {canActOnDetail &&
                      (taskDetail.status === "TODO" ||
                        taskDetail.status === "ASSIGNED") && (
                        <Button
                          icon={<Play className="h-3.5 w-3.5" />}
                          loading={updateStatus.isPending}
                          onClick={async () => {
                            try {
                              await updateStatus.mutateAsync({
                                taskId: taskDetail.taskId,
                                status: "IN_PROGRESS",
                              });
                              invalidateTasks();
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "onboarding-task-detail",
                                  selectedTaskId,
                                ],
                              });
                              notify.success(
                                t("onboarding.task.toast.started"),
                              );
                            } catch (err) {
                              notify.error(
                                extractErrorMessage(
                                  err,
                                  t("onboarding.task.toast.failed"),
                                ),
                              );
                            }
                          }}>
                          {t("onboarding.task.action.start")}
                        </Button>
                      )}

                    {/* Assignee: Confirm Complete (WAIT_ACK) */}
                    {canActOnDetail && taskDetail.status === "WAIT_ACK" && (
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
                            invalidateTasks();
                            queryClient.invalidateQueries({
                              queryKey: [
                                "onboarding-task-detail",
                                selectedTaskId,
                              ],
                            });
                            setSelectedTaskId(null);
                            notify.success(t("onboarding.task.toast.done"));
                          } catch (err) {
                            notify.error(
                              extractErrorMessage(
                                err,
                                t("onboarding.task.toast.failed"),
                              ),
                            );
                          }
                        }}>
                        {t("onboarding.task.action.confirm_complete")}
                      </Button>
                    )}

                    {/* Assignee: Submit for Approval */}
                    {canActOnDetail &&
                      taskDetail.requiresManagerApproval &&
                      taskDetail.status === "IN_PROGRESS" && (
                        <Button
                          type="primary"
                          icon={<Send className="h-3.5 w-3.5" />}
                          loading={updateStatus.isPending}
                          disabled={blockSubmitApproval}
                          onClick={async () => {
                            try {
                              await updateStatus.mutateAsync({
                                taskId: taskDetail.taskId,
                                status: "PENDING_APPROVAL",
                              });
                              invalidateTasks();
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "onboarding-task-detail",
                                  selectedTaskId,
                                ],
                              });
                              setSelectedTaskId(null);
                              notify.success(
                                t("onboarding.task.toast.submitted_approval"),
                              );
                            } catch (err) {
                              notify.error(
                                extractErrorMessage(
                                  err,
                                  t("onboarding.task.toast.failed"),
                                ),
                              );
                            }
                          }}>
                          {t("onboarding.task.action.submit_approval")}
                        </Button>
                      )}

                    {/* Assignee: Normal done */}
                    {canActOnDetail &&
                      !taskDetail.requireAck &&
                      !taskDetail.requiresManagerApproval &&
                      taskDetail.status === "IN_PROGRESS" && (
                        <Button
                          type="primary"
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          loading={updateStatus.isPending}
                          disabled={blockMarkDone}
                          onClick={async () => {
                            try {
                              await updateStatus.mutateAsync({
                                taskId: taskDetail.taskId,
                                status: STATUS_DONE_API,
                              });
                              invalidateTasks();
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "onboarding-task-detail",
                                  selectedTaskId,
                                ],
                              });
                              setSelectedTaskId(null);
                              notify.success(t("onboarding.task.toast.done"));
                            } catch (err) {
                              notify.error(
                                extractErrorMessage(
                                  err,
                                  t("onboarding.task.toast.failed"),
                                ),
                              );
                            }
                          }}>
                          {t(
                            "onboarding.employee.home.today_actions.mark_done",
                          )}
                        </Button>
                      )}

                    {/* Manager/HR: Approve */}
                    {canManage && taskDetail.status === "PENDING_APPROVAL" && (
                      <Button
                        type="primary"
                        icon={<ThumbsUp className="h-3.5 w-3.5" />}
                        loading={approveMutation.isPending}
                        onClick={() =>
                          approveMutation.mutate(taskDetail.taskId)
                        }>
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
                </>
              );
            })()}

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

            {/* ── Attachments ─────────────────────────────────────── */}
            {taskDetail.attachments && taskDetail.attachments.length > 0 && (
              <>
                <Divider orientationMargin={0}>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Paperclip className="h-3 w-3" />
                    {t(
                      "onboarding.employee.home.task_detail.field_attachments",
                    )}
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

            {/* ── Comments ─────────────────────────────────────────── */}
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

      {/* ── Schedule Propose Modal ───────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-blue-500" />
            <span>{t("onboarding.task.schedule.action.propose")}</span>
          </div>
        }
        open={scheduleModalOpen}
        onCancel={() => {
          setScheduleModalOpen(false);
          setScheduleDates([null, null]);
        }}
        onOk={handleProposeSchedule}
        okText={t("onboarding.task.schedule.action.propose")}
        okButtonProps={{
          loading: scheduleProposeMutation.isPending,
          disabled: !scheduleDates[0] || !scheduleDates[1],
        }}
        cancelText={t("global.close")}>
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-500">
            {t("onboarding.task.schedule.propose_hint")}
          </p>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">
              {t("onboarding.task.schedule.field.start")}
            </p>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              value={scheduleDates[0]}
              onChange={(d) => setScheduleDates([d, scheduleDates[1]])}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">
              {t("onboarding.task.schedule.field.end")}
            </p>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              value={scheduleDates[1]}
              onChange={(d) => setScheduleDates([scheduleDates[0], d])}
              disabledDate={(d) =>
                scheduleDates[0]
                  ? d.isBefore(scheduleDates[0], "minute")
                  : false
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
