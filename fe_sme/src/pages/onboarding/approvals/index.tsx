import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useQueries,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  ThumbsUp,
  TrendingUp,
  Users,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Drawer,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Skeleton,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { canManageOnboarding } from "@/shared/rbac";
import { notify } from "@/utils/notify";
import {
  apiListInstances,
  apiListTasks,
  apiApproveTask,
  apiRejectTask,
  apiGetTaskDetailFull,
  apiListTaskComments,
  apiAddTaskComment,
} from "@/api/onboarding/onboarding.api";
import { apiGetUserById } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import { useUserNameMap } from "@/utils/resolvers/userResolver";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";
import type {
  TaskDetailResponse,
  CommentResponse,
  TaskAllLogItem,
} from "@/interface/onboarding";
import type { GetUserResponse } from "@/interface/identity";
import { AppLoading } from "@/components/page-loading";
import { DepartmentCheckpointCard } from "@/pages/onboarding/employees/detail/components/DepartmentCheckpointCard";
import { DepartmentDependentApprovals } from "./DepartmentDependentApprovals";
import { DeptDepartmentSelector } from "./components/dept/DeptDepartmentSelector";

// ── Helpers ───────────────────────────────────────────────────────────────────

const isOverdue = (dueDate?: string) =>
  Boolean(dueDate && new Date(dueDate) < new Date());

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitial = (name?: string | null) => (name ?? "?")[0].toUpperCase();

const unwrapTaskDetail = (res: unknown): TaskDetailResponse => {
  const r = res as Record<string, unknown>;
  return (r?.task ??
    r?.data ??
    r?.result ??
    r?.payload ??
    res) as TaskDetailResponse;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  label,
  value,
  colorClass,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
  borderColor: string;
}) => (
  <div
    className={`relative overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm ${borderColor}`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold leading-none text-gray-900">
          {value}
        </p>
      </div>
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-current opacity-10" />
  </div>
);

// ── Activity log helpers ──────────────────────────────────────────────────────

const getLogIcon = (log: TaskAllLogItem) => {
  if (log.type === "COMMENT")
    return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
  const action = log.action ?? "";
  if (action.includes("APPROVED") || action === "DONE")
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  if (action.includes("REJECTED"))
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  if (action.includes("STATUS") || action.includes("status"))
    return <TrendingUp className="h-3.5 w-3.5 text-purple-500" />;
  if (action.includes("ASSIGN"))
    return <UserIcon className="h-3.5 w-3.5 text-amber-500" />;
  return <Activity className="h-3.5 w-3.5 text-gray-400" />;
};

const getLogBg = (log: TaskAllLogItem) => {
  if (log.type === "COMMENT") return "bg-blue-50";
  const action = log.action ?? "";
  if (action.includes("APPROVED") || action === "DONE") return "bg-green-50";
  if (action.includes("REJECTED")) return "bg-red-50";
  return "bg-gray-50";
};

const getLogLabel = (log: TaskAllLogItem): string => {
  if (log.type === "COMMENT") return log.content ?? "";
  const action = log.action ?? "";
  const mapping: Record<string, string> = {
    APPROVED: "Đã phê duyệt",
    REJECTED: "Đã từ chối",
    STATUS_CHANGED: "Cập nhật trạng thái",
    ASSIGNED: "Phân công thực hiện",
    COMMENT_ADDED: "Thêm bình luận",
    DONE: "Hoàn thành",
    TODO: "Chuyển về chờ làm",
    PENDING_APPROVAL: "Gửi yêu cầu phê duyệt",
  };
  if (mapping[action]) {
    const detail =
      log.newValue ? ` → ${log.newValue}` : log.oldValue ? ` (trước: ${log.oldValue})` : "";
    return mapping[action] + detail;
  }
  return action || "Hoạt động";
};

// ── Task Approval Item ────────────────────────────────────────────────────────

interface TaskApprovalItemProps {
  task: OnboardingTask;
  approvingTaskId: string | null;
  rejectingTaskId: string | null;
  resolveUserName: (id: string | null | undefined, fallback?: string) => string;
  onApprove: (task: OnboardingTask) => void;
  onReject: (task: OnboardingTask) => void;
  onDetail: (task: OnboardingTask) => void;
  selected?: boolean;
  onSelect?: (taskId: string, checked: boolean) => void;
}

const TaskApprovalItem = ({
  task,
  approvingTaskId,
  rejectingTaskId,
  resolveUserName,
  onApprove,
  onReject,
  onDetail,
  selected,
  onSelect,
}: TaskApprovalItemProps) => {
  const { t } = useLocale();
  const overdue = isOverdue(task.dueDate);
  const isApprovingThis = approvingTaskId === task.id;
  const isRejectingThis = rejectingTaskId === task.id;
  const isBusy = isApprovingThis || isRejectingThis;
  const assigneeName =
    task.assignedUserName ??
    resolveUserName(task.assignedUserId, t("global.not_available") ?? "—");

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-all ${
        selected
          ? "border-blue-300 bg-blue-50/40"
          : overdue
            ? "border-red-200 bg-red-50/30"
            : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm"
      }`}
    >
      {/* Checkbox for bulk select */}
      {onSelect && (
        <Checkbox
          checked={selected}
          onChange={(e) => onSelect(task.id, e.target.checked)}
          className="mt-1 shrink-0"
        />
      )}

      {/* Status icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          overdue
            ? "border-red-200 bg-red-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        {overdue ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : (
          <Send className="h-4 w-4 text-amber-500" />
        )}
      </div>

      {/* Task info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDetail(task)}
            className="truncate text-left text-sm font-semibold leading-snug text-gray-800 hover:text-blue-600 hover:underline"
          >
            {task.title}
          </button>
          {overdue && (
            <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
              {t("onboarding.approvals.task.overdue_badge") ?? "Quá hạn"}
            </span>
          )}
          {task.required && (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              {t("onboarding.task.required") ?? "Bắt buộc"}
            </span>
          )}
          <Tag color="gold" style={{ margin: 0, fontSize: 10 }}>
            {t("onboarding.task.status.pending_approval") ?? "Chờ duyệt"}
          </Tag>
        </div>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
            {task.description}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {task.dueDate && (
            <Tooltip title={`Hạn hoàn thành: ${formatDate(task.dueDate)}`}>
              <span
                className={`flex items-center gap-1 ${overdue ? "font-semibold text-red-500" : ""}`}
              >
                {overdue ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                {formatDate(task.dueDate)}
              </span>
            </Tooltip>
          )}
          {assigneeName && (
            <span className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              {assigneeName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Send className="h-3 w-3 text-amber-400" />
            <span className="text-amber-500">{t("onboarding.approvals.task.submitted") ?? "Đã gửi"}</span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <Button
          size="small"
          icon={<Eye className="h-3 w-3" />}
          onClick={() => onDetail(task)}
          className="opacity-60 transition-opacity group-hover:opacity-100"
        >
          {t("onboarding.task.detail.view") ?? "Chi tiết"}
        </Button>
        <Button
          size="small"
          danger
          icon={<XCircle className="h-3 w-3" />}
          loading={isRejectingThis}
          disabled={isBusy && !isRejectingThis}
          onClick={() => onReject(task)}
        >
          {t("onboarding.task.action.reject") ?? "Từ chối"}
        </Button>
        <Popconfirm
          title={t("onboarding.task.action.approve") ?? "Phê duyệt"}
          description={
            t("onboarding.task.action.approve_confirm_desc") ??
            "Bạn có chắc chắn muốn phê duyệt nhiệm vụ này?"
          }
          okText={t("onboarding.task.action.approve") ?? "Phê duyệt"}
          cancelText={t("global.cancel_action") ?? "Hủy"}
          okButtonProps={{ type: "primary" }}
          onConfirm={() => onApprove(task)}
        >
          <Button
            size="small"
            type="primary"
            icon={<ThumbsUp className="h-3 w-3" />}
            loading={isApprovingThis}
            disabled={isBusy && !isApprovingThis}
          >
            {t("onboarding.task.action.approve") ?? "Duyệt"}
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
};

// ── Employee Approval Group ───────────────────────────────────────────────────

interface EmployeeApprovalGroupProps {
  instance: OnboardingInstance;
  tasks: OnboardingTask[];
  approvingTaskId: string | null;
  rejectingTaskId: string | null;
  resolveUserName: (id: string | null | undefined, fallback?: string) => string;
  onApprove: (task: OnboardingTask) => void;
  onReject: (task: OnboardingTask) => void;
  onDetail: (task: OnboardingTask) => void;
  selectedTaskIds?: Set<string>;
  onSelect?: (taskId: string, checked: boolean) => void;
}

const EmployeeApprovalGroup = ({
  instance,
  tasks,
  approvingTaskId,
  rejectingTaskId,
  resolveUserName,
  onApprove,
  onReject,
  onDetail,
  selectedTaskIds,
  onSelect,
}: EmployeeApprovalGroupProps) => {
  const { t } = useLocale();
  const hasOverdue = tasks.some((tk) => isOverdue(tk.dueDate));
  const overdueCount = tasks.filter((tk) => isOverdue(tk.dueDate)).length;
  const employeeName =
    instance.employeeName ??
    resolveUserName(
      instance.employeeUserId,
      t("onboarding.task.instance.unknown_employee") ?? "Nhân viên",
    );
  const progress = (instance as OnboardingInstance & { progress?: number })
    .progress;

  const allSelected =
    tasks.length > 0 && tasks.every((tk) => selectedTaskIds?.has(tk.id));
  const someSelected = tasks.some((tk) => selectedTaskIds?.has(tk.id));

  return (
    <Card
      className={`overflow-hidden border-l-4 shadow-sm ${hasOverdue ? "border-l-red-400" : "border-l-blue-400"}`}
      styles={{ body: { padding: 0 } }}
    >
      {/* Group header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 ${hasOverdue ? "bg-red-50/40" : "bg-blue-50/30"}`}
      >
        {onSelect && (
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={(e) => {
              tasks.forEach((tk) => onSelect?.(tk.id, e.target.checked));
            }}
            className="shrink-0"
          />
        )}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            hasOverdue
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {getInitial(instance.employeeName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-800">
            {employeeName}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {instance.templateName && (
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {instance.templateName}
              </span>
            )}
            {progress != null && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Tiến độ: {progress}%
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {overdueCount > 0 && (
            <Tooltip title={`${overdueCount} task quá hạn`}>
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {overdueCount}
              </span>
            </Tooltip>
          )}
          <Badge
            count={tasks.length}
            color={hasOverdue ? "#ef4444" : "#3b82f6"}
            style={{ fontSize: 11 }}
          />
        </div>
      </div>

      {/* Progress bar */}
      {progress != null && (
        <Progress
          percent={progress}
          showInfo={false}
          size={{ height: 4 }}
          strokeColor={hasOverdue ? "#f87171" : "#60a5fa"}
          trailColor="#f3f4f6"
          style={{ margin: 0, display: "block" }}
        />
      )}

      {/* Tasks */}
      <div className="space-y-2 p-3">
        {tasks.map((task) => (
          <TaskApprovalItem
            key={task.id}
            task={task}
            approvingTaskId={approvingTaskId}
            rejectingTaskId={rejectingTaskId}
            resolveUserName={resolveUserName}
            onApprove={onApprove}
            onReject={onReject}
            onDetail={onDetail}
            selected={selectedTaskIds?.has(task.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </Card>
  );
};

// ── Task Detail Drawer ────────────────────────────────────────────────────────

interface ApprovalDetailDrawerProps {
  open: boolean;
  taskId?: string | null;
  taskDetail: TaskDetailResponse | undefined;
  loading: boolean;
  comments: CommentResponse[] | undefined;
  commentsLoading: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  resolveUserName: (id: string | null | undefined, fallback?: string) => string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCheckpointConfirmed?: () => void;
  /** When false, hides approve/reject action buttons (used for dept-checkpoint mode) */
  showApprovalActions?: boolean;
}

const ApprovalDetailDrawer = ({
  open,
  taskId,
  taskDetail,
  loading,
  comments,
  commentsLoading,
  isApproving,
  isRejecting,
  resolveUserName,
  onClose,
  onApprove,
  onReject,
  onCheckpointConfirmed,
  showApprovalActions = true,
}: ApprovalDetailDrawerProps) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"info" | "activity" | "comments">("info");
  const [newComment, setNewComment] = useState("");

  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      apiAddTaskComment({ taskId: taskId!, content }),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({
        queryKey: ["approval-task-detail", taskId ?? ""],
      });
      queryClient.invalidateQueries({
        queryKey: ["approval-task-comments", taskId ?? ""],
      });
      notify.success("Đã thêm bình luận");
    },
    onError: () => notify.error("Không thể thêm bình luận"),
  });

  const assigneeName = taskDetail
    ? (taskDetail.assignedUserName ??
      resolveUserName(taskDetail.assignedUserId, taskDetail.assignedUserId))
    : undefined;
  const approverName = taskDetail?.approverUserId
    ? resolveUserName(taskDetail.approverUserId, taskDetail.approverUserId)
    : undefined;

  // All log entries (HISTORY + COMMENT merged)
  const allLogs: TaskAllLogItem[] = taskDetail?.allLogs ?? [];

  const tabs = [
    {
      key: "info" as const,
      label: t("onboarding.detail.task.tab.info") ?? "Chi tiết",
      icon: <Activity className="h-3.5 w-3.5" />,
    },
    {
      key: "activity" as const,
      label: "Nhật ký",
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      count: allLogs.length,
    },
    {
      key: "comments" as const,
      label: t("onboarding.task.comments.title") ?? "Bình luận",
      icon: <MessageSquare className="h-3.5 w-3.5" />,
      count: comments?.length,
    },
  ];

  return (
    <Drawer
      open={open}
      width={560}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
          </div>
          <span className="flex-1 truncate text-sm font-semibold text-gray-800">
            {taskDetail
              ? String(
                  taskDetail.title ?? t("onboarding.approvals.drawer.title"),
                )
              : (t("onboarding.approvals.drawer.title") ??
                "Chi tiết nhiệm vụ")}
          </span>
        </div>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : taskDetail ? (
        <div className="flex h-full flex-col">
          {/* Tab nav */}
          <div className="mb-4 flex gap-0.5 rounded-xl bg-gray-100 p-1">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                  tab === tb.key
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tb.icon}
                {tb.label}
                {tb.count != null && tb.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      tab === tb.key
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {tb.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Info tab ────────────────────────────────────────────────── */}
          {tab === "info" && (
            <div className="flex-1 space-y-4 overflow-y-auto pb-4">
              {/* Header banner */}
              <div
                className={`rounded-xl border p-4 ${
                  taskDetail.overdue
                    ? "border-red-100 bg-red-50/50"
                    : "border-amber-100 bg-amber-50/40"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-start gap-2">
                  <Typography.Title
                    level={5}
                    className="!mb-0 flex-1 !text-gray-800"
                  >
                    {String(taskDetail.title ?? "—")}
                  </Typography.Title>
                  <Tag color="gold" style={{ margin: 0 }}>
                    {t("onboarding.task.status.pending_approval") ??
                      "Chờ duyệt"}
                  </Tag>
                </div>
                {taskDetail.overdue && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Quá hạn
                    {taskDetail.dueInHours != null &&
                      ` — ${Math.abs(Math.round(taskDetail.dueInHours))} giờ trước`}
                  </div>
                )}
              </div>

              {/* Info grid */}
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                      {t("onboarding.employee.home.task_detail.field_due_date") ??
                        "Hạn hoàn thành"}
                    </p>
                    <div
                      className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${
                        taskDetail.overdue ? "text-red-600" : "text-gray-800"
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {formatDate(taskDetail.dueDate)}
                    </div>
                  </div>
                </Col>
                {assigneeName && (
                  <Col span={12}>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                        {t("onboarding.task.field.assignee") ?? "Người thực hiện"}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                          {(assigneeName ?? "?")[0].toUpperCase()}
                        </div>
                        {assigneeName}
                      </div>
                    </div>
                  </Col>
                )}
                {taskDetail.checklistName && (
                  <Col span={24}>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                        Checklist
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <Flag className="h-3.5 w-3.5 text-gray-400" />
                        {taskDetail.checklistName}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Description */}
              {taskDetail.description && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {t("onboarding.employee.home.task_detail.field_description") ??
                      "Mô tả"}
                  </p>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
                    {String(taskDetail.description)}
                  </div>
                </div>
              )}

              {/* Approval section */}
              <Divider orientationMargin={0}>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <ShieldCheck className="h-3 w-3" />
                  {t("onboarding.task.approval.section_title") ?? "Phê duyệt"}
                </span>
              </Divider>
              <div className="space-y-2 rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {t("onboarding.employee.home.task_detail.field_status") ??
                      "Trạng thái"}
                    :
                  </span>
                  <Tag color="gold" style={{ margin: 0 }}>
                    {t("onboarding.task.approval.status.pending") ?? "Đang chờ"}
                  </Tag>
                </div>
                {taskDetail.updatedAt && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Send className="h-3 w-3 text-amber-400" />
                    {t("onboarding.approvals.task.submitted") ?? "Đã gửi"}:{" "}
                    <span className="font-semibold text-gray-700">
                      {formatDateTime(taskDetail.updatedAt)}
                    </span>
                  </div>
                )}
                {taskDetail.approverUserId && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <UserIcon className="h-3 w-3 text-gray-400" />
                    {t("onboarding.task.field.approved_by") ??
                      "Phê duyệt bởi"}:{" "}
                    <span className="font-semibold text-gray-700">
                      {approverName}
                    </span>
                  </div>
                )}
                {taskDetail.rejectionReason && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-2.5 text-xs text-red-700">
                    <div className="flex items-center gap-1 font-semibold">
                      <XCircle className="h-3.5 w-3.5" />
                      {t("onboarding.task.rejection_reason") ?? "Lý do từ chối"}
                    </div>
                    <div className="mt-1 text-red-600">
                      {taskDetail.rejectionReason}
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments */}
              {taskDetail.attachments && taskDetail.attachments.length > 0 && (
                <>
                  <Divider orientationMargin={0}>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Paperclip className="h-3 w-3" />
                      {t("onboarding.employee.home.task_detail.field_attachments") ??
                        "Tệp đính kèm"}
                    </span>
                  </Divider>
                  <div className="space-y-1.5">
                    {taskDetail.attachments.map((att) => (
                      <a
                        key={att.attachmentId}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-50"
                      >
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

              {/* Department checkpoints */}
              {taskDetail.departmentCheckpoints &&
                taskDetail.departmentCheckpoints.length > 0 && (
                  <>
                    <Divider orientationMargin={0}>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Building2 className="h-3 w-3" />
                        Checkpoint phòng ban
                      </span>
                    </Divider>
                    <DepartmentCheckpointCard
                      taskId={taskDetail.taskId}
                      checkpoints={taskDetail.departmentCheckpoints}
                      onCheckpointConfirmed={onCheckpointConfirmed}
                    />
                  </>
                )}

              {/* Action buttons */}
              <Divider orientationMargin={0} />
              <div className="flex flex-wrap gap-2">
                {showApprovalActions && (
                  <>
                    <Popconfirm
                      title={t("onboarding.task.action.approve") ?? "Phê duyệt"}
                      description={
                        t("onboarding.task.action.approve_confirm_desc") ??
                        "Bạn có chắc chắn muốn phê duyệt nhiệm vụ này?"
                      }
                      okText={
                        t("onboarding.task.action.approve") ?? "Phê duyệt"
                      }
                      cancelText={t("global.cancel_action") ?? "Hủy"}
                      okButtonProps={{ type: "primary" }}
                      onConfirm={onApprove}
                    >
                      <Button
                        type="primary"
                        icon={<ThumbsUp className="h-3.5 w-3.5" />}
                        loading={isApproving}
                      >
                        {t("onboarding.task.action.approve") ?? "Phê duyệt"}
                      </Button>
                    </Popconfirm>
                    <Button
                      danger
                      icon={<XCircle className="h-3.5 w-3.5" />}
                      loading={isRejecting}
                      onClick={onReject}
                    >
                      {t("onboarding.task.action.reject") ?? "Từ chối"}
                    </Button>
                  </>
                )}
                <Button onClick={onClose}>{t("global.close") ?? "Đóng"}</Button>
              </div>
            </div>
          )}

          {/* ── Activity tab ────────────────────────────────────────────── */}
          {tab === "activity" && (
            <div className="flex-1 overflow-y-auto pb-4">
              {allLogs.length === 0 ? (
                <Empty
                  description="Chưa có hoạt động nào"
                  imageStyle={{ height: 40 }}
                />
              ) : (
                <div className="relative space-y-0">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[18px] top-0 h-full w-0.5 bg-gray-100" />
                  {allLogs.map((log, idx) => (
                    <div key={log.logId ?? log.commentId ?? idx} className="relative flex gap-3 pb-4">
                      {/* Timeline dot */}
                      <div
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white shadow-sm ${getLogBg(log)}`}
                      >
                        {getLogIcon(log)}
                      </div>
                      <div className="flex-1 pt-1">
                        <div
                          className={`rounded-lg border px-3 py-2 ${
                            log.type === "COMMENT"
                              ? "border-blue-100 bg-blue-50/50"
                              : "border-gray-100 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">
                              {log.actorName ?? log.createdByName ?? "Hệ thống"}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatDateTime(log.createdAt)}
                            </span>
                            {log.type === "COMMENT" && (
                              <Tag
                                color="blue"
                                style={{ margin: 0, fontSize: 10, lineHeight: "16px" }}
                              >
                                Bình luận
                              </Tag>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-600">
                            {getLogLabel(log)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Comments tab ────────────────────────────────────────────── */}
          {tab === "comments" && (
            <div className="flex flex-1 flex-col gap-3 overflow-hidden pb-2">
              {/* Comment list */}
              <div className="flex-1 overflow-y-auto">
                {commentsLoading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : (comments?.length ?? 0) === 0 ? (
                  <Empty
                    description={
                      t("onboarding.task.comments.empty") ??
                      "Chưa có bình luận"
                    }
                    imageStyle={{ height: 40 }}
                  />
                ) : (
                  <div className="space-y-3">
                    {comments?.map((c) => (
                      <div key={c.commentId} className="flex gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {(c.authorName ?? "U")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-700">
                              {c.authorName ??
                                t(
                                  "onboarding.task.comments.unknown_author",
                                ) ??
                                "Ẩn danh"}
                            </p>
                            {c.createdAt && (
                              <p className="text-[11px] text-gray-400">
                                {formatDateTime(c.createdAt)}
                              </p>
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-gray-600">
                            {c.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment composer */}
              {taskId && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Thêm ghi chú / bình luận
                  </p>
                  <Input.TextArea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Nhập bình luận..."
                    maxLength={500}
                    className="resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {newComment.length}/500
                    </span>
                    <Button
                      type="primary"
                      size="small"
                      icon={<Send className="h-3 w-3" />}
                      loading={addCommentMutation.isPending}
                      disabled={!newComment.trim()}
                      onClick={() => {
                        const trimmed = newComment.trim();
                        if (trimmed) addCommentMutation.mutate(trimmed);
                      }}
                    >
                      Gửi
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <Empty
          description={
            t("onboarding.task.detail.not_found") ?? "Không tìm thấy task"
          }
        />
      )}
    </Drawer>
  );
};

// ── Loading Skeleton ──────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="border border-gray-100 shadow-sm">
        <Skeleton avatar active paragraph={{ rows: 2 }} />
      </Card>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const ApprovalsPage = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const currentUser = useUserStore((state) => state.currentUser);
  const canManage = canManageOnboarding(currentUser?.roles ?? []);
  const isManager =
    (currentUser?.roles ?? []).includes("MANAGER") &&
    !(currentUser?.roles ?? []).includes("HR");
  const { resolveName: resolveUserName } = useUserNameMap({
    enabled: canManage,
  });

  const [search, setSearch] = useState("");
  const [overdueFirst, setOverdueFirst] = useState(false);
  const requestedTab = searchParams.get("tab");
  const [pageTab, setPageTab] = useState<"approvals" | "dept_checkpoints">(
    requestedTab === "dept_checkpoints" ? "dept_checkpoints" : "approvals",
  );
  const [approvalTab, setApprovalTab] = useState<"all" | "mine" | "team">(
    "all",
  );
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"approval" | "dept_checkpoint">(
    "approval",
  );
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetTitle, setRejectTargetTitle] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [departmentDependentTotal, setDepartmentDependentTotal] = useState(0);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  useEffect(() => {
    if (requestedTab === "dept_checkpoints") {
      setPageTab("dept_checkpoints");
      return;
    }
    if (requestedTab === "approvals") {
      setPageTab("approvals");
    }
  }, [requestedTab]);

  const { data: currentUserDetail } = useQuery({
    queryKey: ["user-detail", currentUser?.id ?? ""],
    queryFn: () => apiGetUserById(currentUser!.id),
    enabled: Boolean(currentUser?.id) && !currentUser?.departmentId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (res: unknown) =>
      ((res as { data?: GetUserResponse }).data ?? res) as GetUserResponse,
  });

  const currentUserDeptId =
    currentUser?.departmentId ?? currentUserDetail?.departmentId ?? null;

  // ── Step 1: Fetch all ACTIVE instances ──────────────────────────────────────

  const {
    data: allInstances = [],
    isLoading: instancesLoading,
    isFetching: instancesFetching,
  } = useQuery({
    queryKey: ["approval-instances", currentUser?.id, isManager],
    queryFn: () => apiListInstances({ status: "ACTIVE" }),
    enabled: canManage,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (res: unknown) => {
      const list = extractList(
        res as Record<string, unknown>,
        "instances",
        "content",
        "items",
        "list",
      ).map(mapInstance);
      if (isManager) {
        return list.filter((i) => i.managerUserId === currentUser?.id);
      }
      return list;
    },
  });

  // ── Step 2: Parallel fetch PENDING_APPROVAL tasks per instance ──────────────

  const taskQueries = useQueries({
    queries: allInstances.map((instance) => ({
      queryKey: ["approval-tasks", instance.id],
      queryFn: () => apiListTasks(instance.id, { status: "PENDING_APPROVAL" }),
      enabled: Boolean(instance.id) && canManage,
      staleTime: 0,
      refetchOnMount: "always" as const,
      refetchOnWindowFocus: true,
      select: (res: unknown) =>
        extractList(
          res as Record<string, unknown>,
          "tasks",
          "content",
          "items",
          "list",
        ).map(mapTask) as OnboardingTask[],
    })),
  });

  const tasksLoading = taskQueries.some((q) => q.isLoading);
  const tasksFetching = taskQueries.some((q) => q.isFetching);
  const isLoading =
    instancesLoading || (allInstances.length > 0 && tasksLoading);
  const isApprovalsFetching = instancesFetching || tasksFetching;

  // ── Step 3: Task detail (lazy) ───────────────────────────────────────────────

  const { data: taskDetail, isLoading: taskDetailLoading } = useQuery({
    queryKey: ["approval-task-detail", selectedTaskId ?? ""],
    queryFn: () =>
      apiGetTaskDetailFull(selectedTaskId!, {
        includeActivityLogs: true,
      }),
    enabled: Boolean(selectedTaskId),
    select: unwrapTaskDetail,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["approval-task-comments", selectedTaskId ?? ""],
    queryFn: () => apiListTaskComments(selectedTaskId!),
    enabled: Boolean(selectedTaskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const list = r?.comments ?? r?.data ?? [];
      return (Array.isArray(list) ? list : []) as CommentResponse[];
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const invalidateAfterAction = () => {
    queryClient.invalidateQueries({ queryKey: ["approval-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["approval-instances"] });
    queryClient.invalidateQueries({ queryKey: ["approval-task-detail"] });
    queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["onboarding-task-detail"] });
    queryClient.invalidateQueries({ queryKey: ["department-dependent-tasks"] });
  };

  const approveMutation = useMutation({
    mutationFn: (taskId: string) => apiApproveTask({ taskId }),
    onSuccess: () => {
      invalidateAfterAction();
      setDrawerOpen(false);
      setSelectedTaskId(null);
      notify.success(t("onboarding.task.toast.approved") ?? "Đã phê duyệt");
    },
    onError: () =>
      notify.error(t("onboarding.task.toast.failed") ?? "Thao tác thất bại"),
  });

  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const handleBulkApprove = async () => {
    if (selectedTaskIds.size === 0) return;
    setIsBulkApproving(true);
    try {
      await Promise.all(
        [...selectedTaskIds].map((taskId) => apiApproveTask({ taskId })),
      );
      invalidateAfterAction();
      setSelectedTaskIds(new Set());
      notify.success(`Đã phê duyệt ${selectedTaskIds.size} task`);
    } catch {
      notify.error(t("onboarding.task.toast.failed") ?? "Thao tác thất bại");
    } finally {
      setIsBulkApproving(false);
    }
  };

  const rejectMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      apiRejectTask({ taskId, reason }),
    onSuccess: () => {
      invalidateAfterAction();
      setRejectModalOpen(false);
      setRejectReason("");
      setRejectTargetTitle("");
      setDrawerOpen(false);
      setSelectedTaskId(null);
      notify.success(t("onboarding.task.toast.rejected") ?? "Đã từ chối");
    },
    onError: () =>
      notify.error(t("onboarding.task.toast.failed") ?? "Thao tác thất bại"),
  });

  // ── Derived data ─────────────────────────────────────────────────────────────

  const pendingGroups = useMemo(() => {
    return allInstances
      .map((instance, idx) => ({
        instance,
        tasks: (taskQueries[idx]?.data ?? []) as OnboardingTask[],
      }))
      .filter(({ tasks }) => tasks.length > 0);
  }, [allInstances, taskQueries]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const userId = currentUser?.id;

    let sourceGroups = pendingGroups;
    if (approvalTab === "mine" && userId) {
      sourceGroups = pendingGroups.filter(
        (g) =>
          g.instance.managerUserId === userId ||
          g.instance.employeeUserId === userId,
      );
    } else if (approvalTab === "team" && userId) {
      sourceGroups = pendingGroups.filter(
        (g) => g.instance.managerUserId === userId,
      );
    }

    const groups = q
      ? sourceGroups
          .map(({ instance, tasks }) => ({
            instance,
            tasks: tasks.filter(
              (tk) =>
                tk.title.toLowerCase().includes(q) ||
                (
                  instance.employeeName ??
                  resolveUserName(instance.employeeUserId, "")
                )
                  .toLowerCase()
                  .includes(q),
            ),
          }))
          .filter(({ tasks }) => tasks.length > 0)
      : sourceGroups;

    if (overdueFirst) {
      return [...groups].sort((a, b) => {
        const aHasOverdue = a.tasks.some((tk) => isOverdue(tk.dueDate));
        const bHasOverdue = b.tasks.some((tk) => isOverdue(tk.dueDate));
        return Number(bHasOverdue) - Number(aHasOverdue);
      });
    }
    return groups;
  }, [
    pendingGroups,
    search,
    overdueFirst,
    approvalTab,
    currentUser?.id,
    resolveUserName,
  ]);

  const stats = useMemo(() => {
    const allTasks = pendingGroups.flatMap((g) => g.tasks);
    return {
      pending: allTasks.length,
      overdue: allTasks.filter((tk) => isOverdue(tk.dueDate)).length,
      employees: pendingGroups.length,
      required: allTasks.filter((tk) => tk.required).length,
    };
  }, [pendingGroups]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const openDetail = (task: OnboardingTask) => {
    setSelectedTaskId(task.id);
    setDrawerMode("approval");
    setDrawerOpen(true);
  };

  const handleApprove = (task: OnboardingTask) => {
    approveMutation.mutate(task.id);
  };

  const handleOpenReject = (task: OnboardingTask) => {
    setSelectedTaskId(task.id);
    setRejectTargetTitle(task.title);
    setDrawerOpen(false);
    setRejectModalOpen(true);
  };

  const handleOpenRejectFromDrawer = () => {
    if (taskDetail) {
      setRejectTargetTitle(String(taskDetail.title ?? ""));
    }
    setDrawerOpen(false);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedTaskId) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length > 0 && trimmed.length < 10) {
      notify.error("Lý do từ chối phải có ít nhất 10 ký tự (hoặc để trống)");
      return;
    }
    rejectMutation.mutate({
      taskId: selectedTaskId,
      reason: trimmed || undefined,
    });
  };

  const approvingTaskId = approveMutation.isPending
    ? (approveMutation.variables ?? null)
    : null;
  const rejectingTaskId =
    rejectMutation.isPending && rejectMutation.variables
      ? (rejectMutation.variables.taskId ?? null)
      : null;

  // ── Access guard ─────────────────────────────────────────────────────────────

  if (!canManage) {
    return (
      <div className="flex items-center justify-center py-20">
        <Empty
          description={
            t("onboarding.approvals.access_denied") ??
            "Bạn không có quyền truy cập trang này"
          }
        />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-[520px] space-y-5">
      {pageTab === "approvals" && isApprovalsFetching && <AppLoading />}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 pt-3">
          <Tabs
            activeKey={pageTab}
            onChange={(k) => setPageTab(k as "approvals" | "dept_checkpoints")}
            className="mb-0"
            items={[
              {
                key: "approvals",
                label: (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Phê duyệt nhiệm vụ
                    {stats.pending > 0 && (
                      <Badge count={stats.pending} size="small" />
                    )}
                  </span>
                ),
              },
              ...(canManage
                ? [
                    {
                      key: "dept_checkpoints",
                      label: (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          Checkpoint phòng ban
                          {departmentDependentTotal > 0 && (
                            <Badge
                              count={departmentDependentTotal}
                              size="small"
                              color="#9333ea"
                            />
                          )}
                        </span>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        {pageTab === "approvals" && (
          <div className="space-y-4 bg-gray-50/60 p-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard
                icon={<Clock className="h-5 w-5 text-blue-600" />}
                label={t("onboarding.approvals.stat.pending") ?? "Chờ duyệt"}
                value={stats.pending}
                colorClass="bg-blue-50"
                borderColor="text-blue-500"
              />
              <StatCard
                icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                label={t("onboarding.approvals.stat.overdue") ?? "Quá hạn"}
                value={stats.overdue}
                colorClass="bg-red-50"
                borderColor="text-red-500"
              />
              <StatCard
                icon={<Users className="h-5 w-5 text-purple-600" />}
                label={t("onboarding.approvals.stat.employees") ?? "Nhân viên"}
                value={stats.employees}
                colorClass="bg-purple-50"
                borderColor="text-purple-500"
              />
              <StatCard
                icon={<Flag className="h-5 w-5 text-amber-500" />}
                label={t("onboarding.approvals.stat.required") ?? "Bắt buộc"}
                value={stats.required}
                colorClass="bg-amber-50"
                borderColor="text-amber-500"
              />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  placeholder={
                    t("onboarding.approvals.filter.search") ??
                    "Tìm theo tên task hoặc nhân viên..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                  className="w-full sm:w-80"
                  prefix={<Search className="h-3.5 w-3.5 text-gray-400" />}
                />
                <button
                  type="button"
                  onClick={() => setOverdueFirst((v) => !v)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    overdueFirst
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t("onboarding.approvals.filter.overdue_first") ??
                    "Quá hạn trước"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Filter bar (approvals tab) ───────────────────────────────────────── */}
      {pageTab === "approvals" && (
        <>
          {/* ── Bulk approve bar ───────────────────────────────────────────── */}
          {selectedTaskIds.size > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <span className="flex-1 text-sm font-semibold text-blue-700">
                Đã chọn {selectedTaskIds.size} task
              </span>
              <Button
                type="primary"
                size="small"
                icon={<ThumbsUp className="h-3 w-3" />}
                loading={isBulkApproving}
                onClick={handleBulkApprove}
              >
                Phê duyệt tất cả
              </Button>
              <Button
                size="small"
                onClick={() => setSelectedTaskIds(new Set())}
                disabled={isBulkApproving}
              >
                Bỏ chọn
              </Button>
            </div>
          )}

          {/* ── Content ─────────────────────────────────────────────────────── */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredGroups.length === 0 ? (
            <Card className="shadow-sm">
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-800">
                    {search
                      ? "Không tìm thấy kết quả"
                      : (t("onboarding.approvals.empty.title") ??
                        "Không có gì cần phê duyệt")}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {search
                      ? "Thử tìm kiếm với từ khóa khác"
                      : (t("onboarding.approvals.empty.desc") ??
                        "Nhân viên sẽ gửi yêu cầu khi hoàn thành nhiệm vụ của họ.")}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map(({ instance, tasks }) => (
                <EmployeeApprovalGroup
                  key={instance.id}
                  instance={instance}
                  tasks={tasks}
                  approvingTaskId={approvingTaskId}
                  rejectingTaskId={rejectingTaskId}
                  resolveUserName={resolveUserName}
                  onApprove={handleApprove}
                  onReject={handleOpenReject}
                  onDetail={openDetail}
                  selectedTaskIds={selectedTaskIds}
                  onSelect={(taskId, checked) => {
                    setSelectedTaskIds((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(taskId);
                      else next.delete(taskId);
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Dept Checkpoints tab ─────────────────────────────────────────────── */}
      {pageTab === "dept_checkpoints" && (
        <div className="space-y-4">
          {canManage && !currentUserDeptId && (
            <DeptDepartmentSelector
              value={selectedDeptId}
              onChange={setSelectedDeptId}
            />
          )}
          <DepartmentDependentApprovals
            departmentId={currentUserDeptId ?? selectedDeptId}
            search={search}
            onSearchChange={setSearch}
            resolveUserName={resolveUserName}
            onConfirmed={invalidateAfterAction}
            onTotalChange={setDepartmentDependentTotal}
          />
        </div>
      )}

      {/* ── Task Detail Drawer ───────────────────────────────────────────────── */}
      <ApprovalDetailDrawer
        open={drawerOpen}
        taskId={selectedTaskId}
        taskDetail={taskDetail}
        loading={taskDetailLoading}
        comments={comments}
        commentsLoading={commentsLoading}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        resolveUserName={resolveUserName}
        showApprovalActions={drawerMode === "approval"}
        onCheckpointConfirmed={invalidateAfterAction}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        onApprove={() =>
          taskDetail && approveMutation.mutate(taskDetail.taskId)
        }
        onReject={handleOpenRejectFromDrawer}
      />

      {/* ── Reject Modal ─────────────────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <span>
              {t("onboarding.task.action.reject_confirm") ??
                "Xác nhận từ chối"}
            </span>
          </div>
        }
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason("");
          setRejectTargetTitle("");
        }}
        onOk={handleConfirmReject}
        okText={t("onboarding.task.action.reject") ?? "Từ chối"}
        cancelText={t("global.cancel_action") ?? "Hủy"}
        okButtonProps={{
          danger: true,
          loading: rejectMutation.isPending,
        }}
      >
        <div className="py-2">
          {rejectTargetTitle && (
            <div className="mb-3 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500">
                {t("onboarding.task.field.title") ?? "Nhiệm vụ"}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {rejectTargetTitle}
              </p>
            </div>
          )}
          <p className="mb-2 text-sm text-gray-600">
            {t("onboarding.task.action.reject_reason_label") ?? "Lý do từ chối"}{" "}
            <span className="text-gray-400">
              ({t("global.optional") ?? "không bắt buộc"})
            </span>
          </p>
          <Input.TextArea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={
              t("onboarding.task.action.reject_reason_placeholder") ??
              "Nhập lý do từ chối..."
            }
            maxLength={500}
            showCount
          />
          <p className="mt-2 text-xs text-gray-400">
            {t("onboarding.task.reject.desc") ??
              "Lý do sẽ được gửi cho nhân viên và ghi vào nhật ký hoạt động."}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalsPage;
