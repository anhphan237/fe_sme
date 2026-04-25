import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Play,
  List,
  BarChart2,
} from "lucide-react";
import {
  Button,
  Card,
  Col,
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
  Upload,
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
  apiGetTaskCommentTree,
  apiUpdateTaskStatus,
  apiAcknowledgeTask,
  apiApproveTask,
  apiRejectTask,
  apiAssignTask,
  apiProposeTaskSchedule,
  apiConfirmTaskSchedule,
  apiAddTaskAttachment,
  apiRescheduleTask,
  apiCancelTaskSchedule,
  apiMarkTaskNoShow,
} from "@/api/onboarding/onboarding.api";
import { TaskDrawer } from "@/pages/onboarding/employees/detail/components/TaskDrawer";
import { apiSearchUsers } from "@/api/identity/identity.api";
import {
  apiUploadDocumentFile,
  apiAcknowledgeDocument,
} from "@/api/document/document.api";
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
type SortMode = "default" | "due_asc";

const STAGE_PRIORITY: Record<string, number> = {
  PRE_BOARDING: 0,
  DAY_1: 1,
  DAY_7: 2,
  DAY_30: 3,
  DAY_60: 4,
};

const getStagePriority = (name: string): number => {
  const upper = name.toUpperCase().replace(/[\s-]+/g, "_");
  return STAGE_PRIORITY[upper] ?? 99;
};

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
      const raw = (record?.task ??
        record?.data ??
        record?.result ??
        record?.payload ??
        res) as TaskDetailResponse & {
        assignedUser?: { userId?: string; fullName?: string; name?: string };
      };
      // Normalize flat assignedUserId/Name from nested assignedUser when BE omits flat fields
      if (!raw.assignedUserId && raw.assignedUser?.userId) {
        raw.assignedUserId = raw.assignedUser.userId;
      }
      if (!raw.assignedUserName && raw.assignedUser) {
        raw.assignedUserName =
          raw.assignedUser.fullName ?? raw.assignedUser.name;
      }
      return raw as TaskDetailResponse;
    },
  });

const useUpdateTaskStatus = () =>
  useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

const useTaskCommentsQuery = (taskId?: string) =>
  useQuery({
    queryKey: ["onboarding-task-comment-tree", taskId ?? ""],
    queryFn: () => apiGetTaskCommentTree(taskId!),
    enabled: Boolean(taskId),
    select: (res: unknown) => {
      const record = res as Record<string, unknown>;
      // Flatten tree roots into a flat CommentResponse[] preserving parentCommentId
      const flattenNodes = (nodes: unknown[]): CommentResponse[] =>
        nodes.flatMap((node) => {
          const n = node as Record<string, unknown>;
          const comment: CommentResponse = {
            commentId: String(n.commentId ?? ""),
            taskId: taskId ?? "",
            authorId: String(n.createdBy ?? ""),
            authorName: n.createdByName as string | undefined,
            createdBy: String(n.createdBy ?? ""),
            createdByName: n.createdByName as string | undefined,
            content: String(n.content ?? ""),
            message: String(n.content ?? ""),
            createdAt: String(n.createdAt ?? ""),
            parentCommentId: n.parentCommentId as string | undefined,
          };
          const children = Array.isArray(n.children) ? n.children : [];
          return [comment, ...flattenNodes(children)];
        });
      const roots = Array.isArray(record?.roots)
        ? record.roots
        : Array.isArray((record as any)?.comments)
          ? (record as any).comments
          : [];
      return flattenNodes(roots);
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
    <li
      className="cursor-pointer transition-colors hover:bg-slate-50"
      onClick={() => onInspect(task)}>
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

          {/* Row 3: meta + quick actions */}
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

            {(task.assignedUserName ?? (canManage && task.assignedUserId)) && (
              <Tooltip title={t("onboarding.task.field.assignee")}>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <User className="h-3 w-3" />
                  {task.assignedUserName ?? task.assignedUserId}
                </span>
              </Tooltip>
            )}

            {/* Quick actions — stop propagation so clicking buttons doesn't open drawer */}
            <div
              className="ml-auto flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}>
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

// ── Stage Timeline View ────────────────────────────────────────────────────────

const TaskSuggestion = ({
  task,
  isOverdue,
  isToday,
  daysOverdue,
  daysUntilDue,
  t,
}: {
  task: OnboardingTask;
  isOverdue: boolean;
  isToday: boolean;
  daysOverdue: number;
  daysUntilDue: number | null;
  t: (key: string, vars?: Record<string, unknown>) => string;
}) => {
  const isDone = task.rawStatus === STATUS_DONE_API;
  if (isDone) return null;

  const isSoon = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 3;
  const needsDoc = task.requireDoc;
  const needsAck = task.requireAck && task.rawStatus === "IN_PROGRESS";
  const needsApproval =
    task.requiresManagerApproval && task.rawStatus === "IN_PROGRESS";

  if (
    !isOverdue &&
    !isToday &&
    !isSoon &&
    !needsDoc &&
    !needsAck &&
    !needsApproval
  )
    return null;

  const items: { icon: string; text: string; color: string }[] = [];

  if (isOverdue) {
    items.push({
      icon: "🔴",
      text: t("onboarding.task.suggestion.overdue", { days: daysOverdue }),
      color: "bg-red-50 border-red-200 text-red-700",
    });
  } else if (isToday) {
    items.push({
      icon: "⏰",
      text: t("onboarding.task.suggestion.today"),
      color: "bg-orange-50 border-orange-200 text-orange-700",
    });
  } else if (isSoon) {
    items.push({
      icon: "📌",
      text: t("onboarding.task.suggestion.soon", { days: daysUntilDue }),
      color: "bg-amber-50 border-amber-200 text-amber-700",
    });
  }

  if (needsDoc) {
    items.push({
      icon: "📎",
      text: t("onboarding.task.suggestion.needs_doc"),
      color: "bg-cyan-50 border-cyan-200 text-cyan-700",
    });
  }
  if (needsAck) {
    items.push({
      icon: "✅",
      text: t("onboarding.task.suggestion.needs_ack"),
      color: "bg-blue-50 border-blue-200 text-blue-700",
    });
  }
  if (needsApproval) {
    items.push({
      icon: "👍",
      text: t("onboarding.task.suggestion.needs_approval"),
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      {items.map((item, i) => (
        <div
          key={i}
          className={`flex items-start gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${item.color}`}>
          <span className="shrink-0 leading-tight">{item.icon}</span>
          <span className="leading-tight">{item.text}</span>
        </div>
      ))}
    </div>
  );
};

const StageTimelineView = ({
  tasks,
  currentUserId,
  canManage,
  onInspect,
}: {
  tasks: OnboardingTask[];
  currentUserId?: string;
  canManage: boolean;
  onInspect: (task: OnboardingTask) => void;
}) => {
  const { t } = useLocale();

  if (tasks.length === 0) {
    return (
      <Card>
        <div className="py-8">
          <Empty description={t("onboarding.task.timeline.empty")} />
        </div>
      </Card>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  // Group by checklist/stage and sort stages by onboarding milestone order
  const stageMap = new Map<string, OnboardingTask[]>();
  for (const task of tasks) {
    const key = task.checklistName ?? "Other";
    if (!stageMap.has(key)) stageMap.set(key, []);
    stageMap.get(key)!.push(task);
  }
  const sortedStages = Array.from(stageMap.entries()).sort(
    ([a], [b]) => getStagePriority(a) - getStagePriority(b),
  );

  return (
    <div className="space-y-4">
      {/* Stage progress pills */}
      <div className="flex flex-wrap gap-2">
        {sortedStages.map(([stageName, stageTasks]) => {
          const done = stageTasks.filter(
            (tk) => tk.rawStatus === STATUS_DONE_API,
          ).length;
          const total = stageTasks.length;
          const isComplete = done === total && total > 0;
          const hasOverdue = stageTasks.some(
            (tk) =>
              tk.dueDate &&
              tk.rawStatus !== STATUS_DONE_API &&
              new Date(tk.dueDate) < today,
          );
          const stageInfo = getStageLabel(stageName, t);
          return (
            <div
              key={stageName}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                isComplete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : hasOverdue
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : done > 0
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-500"
              }`}>
              {isComplete ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : hasOverdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : null}
              <Tag color={stageInfo.color} style={{ margin: 0, fontSize: 11 }}>
                {stageInfo.label}
              </Tag>
              <span className="opacity-70">
                {done}/{total}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline per stage */}
      {sortedStages.map(([stageName, stageTasks]) => {
        const stageInfo = getStageLabel(stageName, t);
        const done = stageTasks.filter(
          (tk) => tk.rawStatus === STATUS_DONE_API,
        ).length;
        const total = stageTasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const overdueCount = stageTasks.filter(
          (tk) =>
            tk.dueDate &&
            tk.rawStatus !== STATUS_DONE_API &&
            new Date(tk.dueDate) < today,
        ).length;

        // Sort: overdue first → then by due date asc → then undated
        const sorted = [...stageTasks].sort((a, b) => {
          const aOver =
            a.dueDate &&
            a.rawStatus !== STATUS_DONE_API &&
            new Date(a.dueDate) < today;
          const bOver =
            b.dueDate &&
            b.rawStatus !== STATUS_DONE_API &&
            new Date(b.dueDate) < today;
          if (aOver && !bOver) return -1;
          if (!aOver && bOver) return 1;
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        return (
          <Card
            key={stageName}
            size="small"
            className={overdueCount > 0 ? "border-amber-200" : ""}
            title={
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {pct === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-blue-300" />
                  )}
                  <Tag color={stageInfo.color} style={{ margin: 0 }}>
                    {stageInfo.label}
                  </Tag>
                  {overdueCount > 0 && (
                    <Tag color="error" style={{ margin: 0, fontSize: 11 }}>
                      {overdueCount} {t("onboarding.task.stat.overdue")}
                    </Tag>
                  )}
                </div>
                <span className="text-xs font-normal text-gray-400">
                  {done}/{total} · {pct}%
                </span>
              </div>
            }>
            <Timeline
              items={sorted.map((task) => {
                const isDone = task.rawStatus === STATUS_DONE_API;
                const dueMs = task.dueDate
                  ? new Date(task.dueDate).getTime()
                  : null;
                const isOverdue =
                  !isDone && dueMs !== null && dueMs < today.getTime();
                const isToday =
                  !isDone &&
                  dueMs !== null &&
                  dueMs >= today.getTime() &&
                  dueMs < tomorrow.getTime();
                const daysOverdue =
                  isOverdue && dueMs !== null
                    ? Math.floor((today.getTime() - dueMs) / 86_400_000)
                    : 0;
                const daysUntilDue =
                  !isDone && !isOverdue && !isToday && dueMs !== null
                    ? Math.ceil((dueMs - today.getTime()) / 86_400_000)
                    : null;
                const isSoon =
                  daysUntilDue !== null &&
                  daysUntilDue > 0 &&
                  daysUntilDue <= 3;

                const dotColor: string = isDone
                  ? "green"
                  : isOverdue
                    ? "red"
                    : isToday
                      ? "orange"
                      : isSoon
                        ? "orange"
                        : task.rawStatus === "IN_PROGRESS" ||
                            task.rawStatus === "ASSIGNED"
                          ? "blue"
                          : "gray";

                return {
                  color: dotColor,
                  children: (
                    <div
                      className="group -mx-2 cursor-pointer rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                      onClick={() => onInspect(task)}>
                      {/* Row 1: title + status */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                          <span
                            className={`text-sm font-medium leading-snug ${
                              isDone
                                ? "text-gray-400 line-through"
                                : isOverdue
                                  ? "text-red-700"
                                  : "text-gray-800"
                            }`}>
                            {task.title}
                          </span>
                          {isOverdue && (
                            <Tag
                              color="error"
                              style={{
                                margin: 0,
                                fontSize: 10,
                                padding: "0 4px",
                              }}>
                              {t("onboarding.task.stat.overdue")}
                            </Tag>
                          )}
                          {isToday && (
                            <Tag
                              color="warning"
                              style={{
                                margin: 0,
                                fontSize: 10,
                                padding: "0 4px",
                              }}>
                              {t("onboarding.task.timeline.today")}
                            </Tag>
                          )}
                          {isSoon && (
                            <Tag
                              color="gold"
                              style={{
                                margin: 0,
                                fontSize: 10,
                                padding: "0 4px",
                              }}>
                              {t("onboarding.task.timeline.soon", {
                                days: daysUntilDue,
                              })}
                            </Tag>
                          )}
                        </div>
                        <StatusBadge rawStatus={task.rawStatus} />
                      </div>

                      {/* Row 2: description */}
                      {task.description && !isDone && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
                          {task.description}
                        </p>
                      )}

                      {/* Row 3: meta info */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {task.dueDate ? (
                          <span
                            className={`flex items-center gap-1 text-xs ${
                              isOverdue
                                ? "font-medium text-red-500"
                                : isToday
                                  ? "font-medium text-orange-500"
                                  : isSoon
                                    ? "font-medium text-amber-600"
                                    : "text-gray-400"
                            }`}>
                            <Clock className="h-3 w-3" />
                            {t("onboarding.task.due", {
                              date: formatDate(task.dueDate),
                            })}
                            {isOverdue && daysOverdue > 0 && (
                              <span className="font-semibold">
                                &nbsp;(
                                {t("onboarding.task.timeline.days_overdue", {
                                  days: daysOverdue,
                                })}
                                )
                              </span>
                            )}
                            {daysUntilDue !== null && daysUntilDue <= 3 && (
                              <span className="font-semibold">
                                &nbsp;(
                                {t("onboarding.task.timeline.days_left", {
                                  days: daysUntilDue,
                                })}
                                )
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-300">
                            <Clock className="h-3 w-3" />
                            {t("onboarding.task.no_due_date")}
                          </span>
                        )}

                        {(task.assignedUserName ??
                          (canManage && task.assignedUserId)) && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <User className="h-3 w-3" />
                            {task.assignedUserName ?? task.assignedUserId}
                          </span>
                        )}

                        {/* Requirement flags */}
                        {!isDone && (
                          <div className="flex items-center gap-1">
                            {task.requireAck && (
                              <Tooltip
                                title={t("onboarding.task.flag.requires_ack")}>
                                <Tag
                                  color="orange"
                                  style={{
                                    margin: 0,
                                    fontSize: 10,
                                    padding: "0 4px",
                                  }}>
                                  <CheckSquare className="mr-0.5 inline h-2.5 w-2.5" />
                                  Ack
                                </Tag>
                              </Tooltip>
                            )}
                            {task.requiresManagerApproval && (
                              <Tooltip
                                title={t(
                                  "onboarding.task.flag.requires_approval",
                                )}>
                                <Tag
                                  color="gold"
                                  style={{
                                    margin: 0,
                                    fontSize: 10,
                                    padding: "0 4px",
                                  }}>
                                  <ThumbsUp className="mr-0.5 inline h-2.5 w-2.5" />
                                  {t("onboarding.task.flag.approval_short")}
                                </Tag>
                              </Tooltip>
                            )}
                            {task.requireDoc && (
                              <Tooltip
                                title={t("onboarding.task.flag.requires_doc")}>
                                <Tag
                                  color="cyan"
                                  style={{
                                    margin: 0,
                                    fontSize: 10,
                                    padding: "0 4px",
                                  }}>
                                  <Paperclip className="mr-0.5 inline h-2.5 w-2.5" />
                                  Doc
                                </Tag>
                              </Tooltip>
                            )}
                          </div>
                        )}

                        {/* Schedule status */}
                        {task.scheduleStatus &&
                          task.scheduleStatus !== "UNSCHEDULED" && (
                            <Tag
                              color={
                                SCHEDULE_STATUS_COLOR[task.scheduleStatus] ??
                                "default"
                              }
                              style={{ margin: 0, fontSize: 10 }}>
                              {t(
                                `onboarding.task.schedule.status.${task.scheduleStatus}`,
                              )}
                            </Tag>
                          )}
                      </div>

                      {/* Row 4: suggestion callout */}
                      <TaskSuggestion
                        task={task}
                        isOverdue={isOverdue}
                        isToday={isToday}
                        daysOverdue={daysOverdue}
                        daysUntilDue={daysUntilDue}
                        t={t}
                      />
                    </div>
                  ),
                };
              })}
            />
          </Card>
        );
      })}
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

  // ── View mode & sort ──────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortMode, setSortMode] = useState<SortMode>("default");

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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [acknowledgedDocIds, setAcknowledgedDocIds] = useState<Set<string>>(
    new Set(),
  );
  const [acknowledgingDocId, setAcknowledgingDocId] = useState<string | null>(
    null,
  );
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [drawerTab, setDrawerTab] = useState("info");
  const [scheduleMode, setScheduleMode] = useState<
    null | "propose" | "reschedule"
  >(null);
  const [scheduleReason, setScheduleReason] = useState("");
  const [cancelScheduleReason, setCancelScheduleReason] = useState("");
  const [noShowReason, setNoShowReason] = useState("");

  // User directory — lazy-loaded for assign dropdown (HR/Manager only)
  const { data: assignableUsers = [] } = useQuery({
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
      invalidateTasks();
      setScheduleMode(null);
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
      invalidateTasks();
      notify.success(t("onboarding.task.schedule.toast.confirmed"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const rescheduleMutation = useMutation({
    mutationFn: (payload: Parameters<typeof apiRescheduleTask>[0]) =>
      apiRescheduleTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      invalidateTimeline();
      invalidateTasks();
      setScheduleMode(null);
      setScheduleDates([null, null]);
      setScheduleReason("");
      notify.success(t("onboarding.task.toast.rescheduled"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: (payload: { taskId: string; reason?: string }) =>
      apiCancelTaskSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      invalidateTimeline();
      invalidateTasks();
      setCancelScheduleReason("");
      notify.success(t("onboarding.task.toast.schedule_cancelled"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const markNoShowMutation = useMutation({
    mutationFn: (payload: { taskId: string; reason?: string }) =>
      apiMarkTaskNoShow(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      invalidateTimeline();
      invalidateTasks();
      setNoShowReason("");
      notify.success(t("onboarding.task.toast.no_show_marked"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const { data: comments, isLoading: commentsLoading } = useTaskCommentsQuery(
    selectedTaskId ?? undefined,
  );

  const addCommentMutation = useMutation({
    mutationFn: ({
      taskId,
      content,
      parentCommentId,
    }: {
      taskId: string;
      content: string;
      parentCommentId?: string;
    }) => apiAddTaskComment({ taskId, content, parentCommentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-comment-tree", selectedTaskId],
      });
      setCommentInput("");
      notify.success(t("onboarding.task.comments.toast_added"));
    },
    onError: (err: unknown) =>
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed"))),
  });

  const handleUploadAttachment = async (file: File) => {
    if (!selectedTaskId) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploaded = await apiUploadDocumentFile(formData);
      await apiAddTaskAttachment({
        taskId: selectedTaskId,
        fileName: file.name,
        fileUrl: uploaded.fileUrl,
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      invalidateTasks();
      notify.success(t("onboarding.task.attachment.toast_added"));
    } catch {
      notify.error(t("onboarding.task.attachment.toast_failed"));
    } finally {
      setUploadingFile(false);
    }
  };

  const { data: taskDetail, isLoading: taskDetailLoading } = useTaskDetailQuery(
    selectedTaskId ?? undefined,
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const invalidateTasks = () => {
    queryClient.invalidateQueries({
      queryKey: ["onboarding-tasks-by-assignee", userId ?? ""],
    });
    queryClient.invalidateQueries({
      queryKey: ["onboarding-tasks-by-instance", onboardingId ?? ""],
    });
  };

  const invalidateTimeline = () => {
    queryClient.invalidateQueries({
      queryKey: ["onboarding-task-timeline", onboardingId ?? ""],
    });
  };

  // Reset doc ack state when switching to a different task
  useEffect(() => {
    setAcknowledgedDocIds(new Set());
    setAcknowledgingDocId(null);
  }, [selectedTaskId]);

  const handleAcknowledgeDocument = async (documentId: string) => {
    if (!documentId) return;
    setAcknowledgingDocId(documentId);
    try {
      const taskOnboardingId =
        taskDetail?.checklist?.onboardingId ?? onboardingId ?? undefined;
      await apiAcknowledgeDocument(documentId, taskOnboardingId);
      setAcknowledgedDocIds((prev) => new Set([...prev, documentId]));
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      invalidateTasks();
      notify.success(t("onboarding.task.doc.ack_toast_success"));
    } catch (err) {
      notify.error(
        extractErrorMessage(err, t("onboarding.task.doc.ack_toast_failed")),
      );
    } finally {
      setAcknowledgingDocId(null);
    }
  };

  const handleAddComment = (parentCommentId?: string) => {
    if (!selectedTaskId || !commentInput.trim()) return;
    addCommentMutation.mutate({
      taskId: selectedTaskId,
      content: commentInput.trim(),
      parentCommentId,
    });
  };

  const handleStart = async (task: OnboardingTask) => {
    try {
      await updateStatus.mutateAsync({
        taskId: task.id,
        status: "IN_PROGRESS",
      });
      invalidateTasks();
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", task.id],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", task.id],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", task.id],
      });
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

  const handleAssign = async (assigneeUserId: string) => {
    if (!selectedTaskId) return;
    try {
      await apiAssignTask(selectedTaskId, assigneeUserId);
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      invalidateTasks();
      notify.success(t("onboarding.task.toast.assigned"));
    } catch (err) {
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed")));
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

  const handleReschedule = () => {
    if (!selectedTaskId || !scheduleDates[0]) return;
    rescheduleMutation.mutate({
      taskId: selectedTaskId,
      scheduledStartAt: scheduleDates[0].toISOString(),
      scheduledEndAt: scheduleDates[1]?.toISOString(),
      reason: scheduleReason || undefined,
    });
  };

  const closeDrawer = () => {
    setSelectedTaskId(null);
    setDrawerTab("info");
    setScheduleMode(null);
    setScheduleDates([null, null]);
    setScheduleReason("");
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
    // Sort stages by onboarding milestone order
    const sorted = Array.from(map.entries()).sort(
      ([a], [b]) => getStagePriority(a) - getStagePriority(b),
    );
    // Optionally sort tasks within each stage by due date
    if (sortMode === "due_asc") {
      for (const [, stageTasks] of sorted) {
        stageTasks.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      }
    }
    return sorted;
  }, [filteredTasks, sortMode]);

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

  return (
    <div className="space-y-5">
      {/* ── Filters & Instance Selector ─────────────────────────── */}
      <Card>
        <Row gutter={[16, 12]} align="middle">
          {canManage && (
            <Col xs={24} md={7}>
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
          <Col xs={24} md={canManage ? 5 : 8}>
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
          <Col xs={24} md={canManage ? 4 : 4}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("onboarding.task.view.label")}
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
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
                className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  viewMode === "timeline"
                    ? "bg-brand/10 text-brand"
                    : "text-slate-500 hover:bg-slate-50"
                }`}>
                <BarChart2 className="h-3.5 w-3.5" />
                {t("onboarding.task.view.timeline")}
              </button>
            </div>
          </Col>
        </Row>

        {/* Sort options (list mode only) */}
        {viewMode === "list" && tasks.length > 0 && (
          <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
            <span className="text-xs text-gray-400">
              {t("onboarding.task.sort.label")}:
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  { key: "default", label: t("onboarding.task.sort.default") },
                  {
                    key: "due_asc",
                    label: t("onboarding.task.sort.due_asc"),
                  },
                ] as { key: SortMode; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortMode(key)}
                  className={`rounded-md border px-2.5 py-0.5 text-xs transition ${
                    sortMode === key
                      ? "border-blue-300 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
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

      {/* ── Instance Info Banner (HR/Manager) ───────────────────── */}
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
            <div className="ml-auto">
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
      {tasks.length > 0 && viewMode === "list" && (
        <ProgressStats tasks={tasks} />
      )}

      {/* ── Timeline View ────────────────────────────────────────── */}
      {viewMode === "timeline" && (
        <StageTimelineView
          tasks={tasks}
          currentUserId={userId}
          canManage={canManage}
          onInspect={(task) => setSelectedTaskId(task.id)}
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
      {(() => {
        const taskIndex = selectedTaskId
          ? tasks.findIndex((tk) => tk.id === selectedTaskId)
          : -1;
        return (
          <TaskDrawer
            open={Boolean(selectedTaskId)}
            taskDetail={taskDetail}
            taskDetailLoading={taskDetailLoading}
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            comments={comments}
            commentsLoading={commentsLoading}
            commentInput={commentInput}
            drawerTab={drawerTab}
            isEmployee={isEmployee}
            canManage={canManage}
            isAcknowledging={acknowledgeMutation.isPending}
            isUpdatingStatus={updateStatus.isPending}
            isApproving={approveMutation.isPending}
            isRejecting={rejectMutation.isPending}
            isAddingComment={addCommentMutation.isPending}
            isAssigning={false}
            uploadingFile={uploadingFile}
            assignableUsers={assignableUsers}
            acknowledgedDocIds={acknowledgedDocIds}
            acknowledgingDocId={acknowledgingDocId}
            onAcknowledgeDocument={handleAcknowledgeDocument}
            scheduleMode={scheduleMode}
            scheduleDates={scheduleDates}
            scheduleReason={scheduleReason}
            cancelScheduleReason={cancelScheduleReason}
            noShowReason={noShowReason}
            isProposingSchedule={scheduleProposeMutation.isPending}
            isConfirmingSchedule={scheduleConfirmMutation.isPending}
            isRescheduling={rescheduleMutation.isPending}
            isCancellingSchedule={cancelScheduleMutation.isPending}
            isMarkingNoShow={markNoShowMutation.isPending}
            onClose={closeDrawer}
            onDrawerTabChange={setDrawerTab}
            onCommentChange={setCommentInput}
            onAddComment={handleAddComment}
            onStart={async () => {
              const task = tasks.find((tk) => tk.id === selectedTaskId);
              if (task) await handleStart(task);
            }}
            onAcknowledge={() => {
              const task = tasks.find((tk) => tk.id === selectedTaskId);
              if (task) handleAcknowledge(task);
            }}
            onConfirmComplete={async () => {
              if (!taskDetail) return;
              try {
                await updateStatus.mutateAsync({
                  taskId: taskDetail.taskId,
                  status: STATUS_DONE_API,
                });
                invalidateTasks();
                closeDrawer();
                notify.success(t("onboarding.task.toast.done"));
              } catch (err) {
                notify.error(
                  extractErrorMessage(err, t("onboarding.task.toast.failed")),
                );
              }
            }}
            onSubmitApproval={async () => {
              if (!taskDetail) return;
              try {
                await updateStatus.mutateAsync({
                  taskId: taskDetail.taskId,
                  status: "PENDING_APPROVAL",
                });
                invalidateTasks();
                closeDrawer();
                notify.success(t("onboarding.task.toast.submitted_approval"));
              } catch (err) {
                notify.error(
                  extractErrorMessage(err, t("onboarding.task.toast.failed")),
                );
              }
            }}
            onMarkDone={async () => {
              const task = tasks.find((tk) => tk.id === selectedTaskId);
              if (task) await handleMarkDone(task);
              closeDrawer();
            }}
            onApprove={() =>
              taskDetail && approveMutation.mutate(taskDetail.taskId)
            }
            onReject={() => setRejectModalOpen(true)}
            onAssign={handleAssign}
            onUploadAttachment={handleUploadAttachment}
            onNavigatePrev={() => {
              if (taskIndex > 0) {
                setSelectedTaskId(tasks[taskIndex - 1].id);
                setDrawerTab("info");
                setScheduleMode(null);
                setScheduleDates([null, null]);
              }
            }}
            onNavigateNext={() => {
              if (taskIndex >= 0 && taskIndex < tasks.length - 1) {
                setSelectedTaskId(tasks[taskIndex + 1].id);
                setDrawerTab("info");
                setScheduleMode(null);
                setScheduleDates([null, null]);
              }
            }}
            onScheduleModeChange={setScheduleMode}
            onScheduleDatesChange={setScheduleDates}
            onScheduleReasonChange={setScheduleReason}
            onCancelScheduleReasonChange={setCancelScheduleReason}
            onNoShowReasonChange={setNoShowReason}
            onProposeSchedule={handleProposeSchedule}
            onConfirmSchedule={() =>
              selectedTaskId && scheduleConfirmMutation.mutate(selectedTaskId)
            }
            onReschedule={handleReschedule}
            onCancelSchedule={() =>
              selectedTaskId &&
              cancelScheduleMutation.mutate({
                taskId: selectedTaskId,
                reason: cancelScheduleReason || undefined,
              })
            }
            onMarkNoShow={() =>
              selectedTaskId &&
              markNoShowMutation.mutate({
                taskId: selectedTaskId,
                reason: noShowReason || undefined,
              })
            }
          />
        );
      })()}

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
