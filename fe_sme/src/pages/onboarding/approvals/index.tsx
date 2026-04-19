import { useMemo, useState } from "react";
import {
  useQueries,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  RefreshCw,
  Search,
  Send,
  ThumbsUp,
  Users,
  XCircle,
  Paperclip,
  Activity,
  Calendar,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Row,
  Skeleton,
  Tag,
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
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";
import type {
  TaskDetailResponse,
  CommentResponse,
} from "@/interface/onboarding";

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

// ── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}) => (
  <div className="flex items-center gap-4 rounded-lg border border-stroke bg-white p-4 shadow-sm">
    <div className={`rounded-xl p-2.5 ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-2xl font-bold text-ink">{value}</p>
    </div>
  </div>
);

// ── Task Approval Item ────────────────────────────────────────────────────────

interface TaskApprovalItemProps {
  task: OnboardingTask;
  approvingTaskId: string | null;
  rejectingTaskId: string | null;
  onApprove: (task: OnboardingTask) => void;
  onReject: (task: OnboardingTask) => void;
  onDetail: (task: OnboardingTask) => void;
}

const TaskApprovalItem = ({
  task,
  approvingTaskId,
  rejectingTaskId,
  onApprove,
  onReject,
  onDetail,
}: TaskApprovalItemProps) => {
  const { t } = useLocale();
  const overdue = isOverdue(task.dueDate);
  const isApprovingThis = approvingTaskId === task.id;
  const isRejectingThis = rejectingTaskId === task.id;
  const isBusy = isApprovingThis || isRejectingThis;

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
        overdue
          ? "border-red-100 bg-red-50/20"
          : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm"
      }`}>
      {/* Status icon */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
        <Send className="h-4 w-4 text-amber-500" />
      </div>

      {/* Task info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDetail(task)}
            className="truncate text-left text-sm font-medium leading-snug text-gray-800 hover:text-blue-600 hover:underline">
            {task.title}
          </button>
          {overdue && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
              {t("onboarding.approvals.task.overdue_badge") ?? "Quá hạn"}
            </span>
          )}
          {task.required && (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
              {t("onboarding.task.required") ?? "Bắt buộc"}
            </span>
          )}
          <Tag color="gold" style={{ margin: 0, fontSize: 10 }}>
            {t("onboarding.task.status.pending_approval") ?? "Chờ duyệt"}
          </Tag>
        </div>
        {task.description && (
          <p className="mt-1 line-clamp-1 text-xs text-gray-500">
            {task.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 ${overdue ? "font-medium text-red-500" : ""}`}>
              {overdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {t("onboarding.task.due")?.replace("{date}", task.dueDate) ??
                `Hạn: ${task.dueDate}`}
            </span>
          )}
          {task.assignedUserName && (
            <span className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              {task.assignedUserName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Send className="h-3 w-3" />
            {t("onboarding.approvals.task.submitted") ?? "Đã gửi"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <Popconfirm
          title={t("onboarding.task.action.approve") ?? "Phê duyệt"}
          description={
            t("onboarding.task.action.approve_confirm_desc") ??
            "Bạn có chắc chắn muốn phê duyệt nhiệm vụ này?"
          }
          okText={t("onboarding.task.action.approve") ?? "Phê duyệt"}
          cancelText={t("global.cancel_action") ?? "Hủy"}
          okButtonProps={{ type: "primary" }}
          onConfirm={() => onApprove(task)}>
          <Button
            size="small"
            type="primary"
            icon={<ThumbsUp className="h-3 w-3" />}
            loading={isApprovingThis}
            disabled={isBusy && !isApprovingThis}>
            {t("onboarding.task.action.approve") ?? "Duyệt"}
          </Button>
        </Popconfirm>
        <Button
          size="small"
          danger
          icon={<XCircle className="h-3 w-3" />}
          loading={isRejectingThis}
          disabled={isBusy && !isRejectingThis}
          onClick={() => onReject(task)}>
          {t("onboarding.task.action.reject") ?? "Từ chối"}
        </Button>
        <Button
          size="small"
          icon={<Eye className="h-3 w-3" />}
          onClick={() => onDetail(task)}
          className="opacity-60 transition-opacity group-hover:opacity-100">
          {t("onboarding.task.detail.view") ?? "Chi tiết"}
        </Button>
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
  onApprove: (task: OnboardingTask) => void;
  onReject: (task: OnboardingTask) => void;
  onDetail: (task: OnboardingTask) => void;
}

const EmployeeApprovalGroup = ({
  instance,
  tasks,
  approvingTaskId,
  rejectingTaskId,
  onApprove,
  onReject,
  onDetail,
}: EmployeeApprovalGroupProps) => {
  const { t } = useLocale();
  const hasOverdue = tasks.some((tk) => isOverdue(tk.dueDate));

  return (
    <Card
      className={`border-l-4 ${hasOverdue ? "border-l-red-400" : "border-l-blue-400"}`}
      styles={{ body: { padding: "16px" } }}>
      {/* Group header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {getInitial(instance.employeeName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800">
            {instance.employeeName ??
              t("onboarding.task.instance.unknown_employee") ??
              "Nhân viên"}
          </p>
          {instance.templateName && (
            <p className="truncate text-xs text-gray-400">
              <span className="font-medium text-gray-500">
                {t("onboarding.approvals.group.template") ?? "Chương trình"}:
              </span>{" "}
              {instance.templateName}
            </p>
          )}
        </div>
        <Badge
          count={tasks.length}
          color={hasOverdue ? "#ef4444" : "#3b82f6"}
          style={{ fontSize: 11 }}
        />
      </div>

      <Divider style={{ margin: "8px 0" }} />

      {/* Tasks */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskApprovalItem
            key={task.id}
            task={task}
            approvingTaskId={approvingTaskId}
            rejectingTaskId={rejectingTaskId}
            onApprove={onApprove}
            onReject={onReject}
            onDetail={onDetail}
          />
        ))}
      </div>
    </Card>
  );
};

// ── Task Detail Drawer ────────────────────────────────────────────────────────

interface ApprovalDetailDrawerProps {
  open: boolean;
  taskDetail: TaskDetailResponse | undefined;
  loading: boolean;
  comments: CommentResponse[] | undefined;
  commentsLoading: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const ApprovalDetailDrawer = ({
  open,
  taskDetail,
  loading,
  comments,
  commentsLoading,
  isApproving,
  isRejecting,
  onClose,
  onApprove,
  onReject,
}: ApprovalDetailDrawerProps) => {
  const { t } = useLocale();
  const [tab, setTab] = useState<"info" | "comments">("info");

  const tabs = [
    {
      key: "info" as const,
      label: t("onboarding.detail.task.tab.info") ?? "Chi tiết",
    },
    {
      key: "comments" as const,
      label: t("onboarding.task.comments.title") ?? "Bình luận",
    },
  ];

  return (
    <Drawer
      open={open}
      width={520}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-500" />
          <span className="flex-1 truncate">
            {taskDetail
              ? String(
                  taskDetail.title ?? t("onboarding.approvals.drawer.title"),
                )
              : (t("onboarding.approvals.drawer.title") ?? "Chi tiết nhiệm vụ")}
          </span>
        </div>
      }>
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : taskDetail ? (
        <div className="flex h-full flex-col">
          {/* Tab nav */}
          <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  tab === tb.key
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}>
                {tb.label}
              </button>
            ))}
          </div>

          {/* Info tab */}
          {tab === "info" && (
            <div className="space-y-4 overflow-y-auto pb-4">
              {/* Header */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                <div className="mb-2 flex flex-wrap items-start gap-2">
                  <Typography.Title
                    level={5}
                    className="!mb-0 flex-1 !text-gray-800">
                    {String(taskDetail.title ?? "—")}
                  </Typography.Title>
                  <Tag color="gold" style={{ margin: 0 }}>
                    {t("onboarding.task.status.pending_approval") ??
                      "Chờ duyệt"}
                  </Tag>
                </div>
                {taskDetail.overdue && (
                  <div className="mt-2 flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {t("onboarding.task.stat.overdue") ?? "Quá hạn"}
                    {taskDetail.dueInHours != null &&
                      ` — ${Math.abs(Math.round(taskDetail.dueInHours))}h`}
                  </div>
                )}
              </div>

              {/* Info grid */}
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {t(
                        "onboarding.employee.home.task_detail.field_due_date",
                      ) ?? "Hạn hoàn thành"}
                    </Typography.Text>
                    <div className="mt-0.5 flex items-center gap-1 text-sm font-medium text-gray-800">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {formatDate(taskDetail.dueDate)}
                    </div>
                  </div>
                </Col>
                {(taskDetail.assignedUserName || taskDetail.assignedUserId) && (
                  <Col span={12}>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}>
                        {t("onboarding.task.field.assignee") ??
                          "Người thực hiện"}
                      </Typography.Text>
                      <div className="mt-0.5 flex items-center gap-1 text-sm font-medium text-gray-800">
                        <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                        {taskDetail.assignedUserName ??
                          taskDetail.assignedUserId}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Description */}
              {taskDetail.description && (
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t(
                      "onboarding.employee.home.task_detail.field_description",
                    ) ?? "Mô tả"}
                  </Typography.Text>
                  <div className="mt-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
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
              <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/40 p-3">
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
                    <Send className="h-3 w-3 text-gray-400" />
                    {t("onboarding.approvals.task.submitted") ?? "Đã gửi"}:{" "}
                    <span className="font-medium text-gray-700">
                      {formatDateTime(taskDetail.updatedAt)}
                    </span>
                  </div>
                )}
                {taskDetail.approverUserId && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <UserIcon className="h-3 w-3 text-gray-400" />
                    {t("onboarding.task.field.approved_by") ?? "Phê duyệt bởi"}:{" "}
                    <span className="font-medium text-gray-700">
                      {taskDetail.approverUserId}
                    </span>
                  </div>
                )}
                {taskDetail.rejectionReason && (
                  <div className="rounded-md border border-red-100 bg-red-50 p-2 text-xs text-red-600">
                    <div className="font-medium">
                      {t("onboarding.task.rejection_reason") ?? "Lý do từ chối"}
                    </div>
                    <div className="mt-0.5 text-red-700">
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
                      {t(
                        "onboarding.employee.home.task_detail.field_attachments",
                      ) ?? "Tệp đính kèm"}
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

              {/* Action buttons */}
              <Divider orientationMargin={0} />
              <div className="flex flex-wrap gap-2">
                <Popconfirm
                  title={t("onboarding.task.action.approve") ?? "Phê duyệt"}
                  description={
                    t("onboarding.task.action.approve_confirm_desc") ??
                    "Bạn có chắc chắn muốn phê duyệt nhiệm vụ này?"
                  }
                  okText={t("onboarding.task.action.approve") ?? "Phê duyệt"}
                  cancelText={t("global.cancel_action") ?? "Hủy"}
                  okButtonProps={{ type: "primary" }}
                  onConfirm={onApprove}>
                  <Button
                    type="primary"
                    icon={<ThumbsUp className="h-3.5 w-3.5" />}
                    loading={isApproving}>
                    {t("onboarding.task.action.approve") ?? "Phê duyệt"}
                  </Button>
                </Popconfirm>
                <Button
                  danger
                  icon={<XCircle className="h-3.5 w-3.5" />}
                  loading={isRejecting}
                  onClick={onReject}>
                  {t("onboarding.task.action.reject") ?? "Từ chối"}
                </Button>
                <Button onClick={onClose}>{t("global.close") ?? "Đóng"}</Button>
              </div>
            </div>
          )}

          {/* Comments tab */}
          {tab === "comments" && (
            <div className="overflow-y-auto pb-4">
              {commentsLoading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (comments?.length ?? 0) === 0 ? (
                <Empty
                  description={
                    t("onboarding.task.comments.empty") ?? "Chưa có bình luận"
                  }
                  imageStyle={{ height: 40 }}
                />
              ) : (
                <div className="space-y-3">
                  {comments?.map((c) => (
                    <div key={c.commentId} className="flex gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {(c.authorName ?? "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-xs font-semibold text-gray-700">
                          {c.authorName ??
                            t("onboarding.task.comments.unknown_author") ??
                            "Ẩn danh"}
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
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="border-l-4 border-l-gray-200">
        <Skeleton avatar active paragraph={{ rows: 2 }} />
      </Card>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const ApprovalsPage = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.currentUser);
  const canManage = canManageOnboarding(currentUser?.roles ?? []);
  const isManager =
    (currentUser?.roles ?? []).includes("MANAGER") &&
    !(currentUser?.roles ?? []).includes("HR");

  const [search, setSearch] = useState("");
  const [overdueFirst, setOverdueFirst] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetTitle, setRejectTargetTitle] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Step 1: Fetch all ACTIVE instances ──────────────────────────────────────

  const {
    data: allInstances = [],
    isLoading: instancesLoading,
    refetch,
  } = useQuery({
    queryKey: ["approval-instances", currentUser?.id, isManager],
    queryFn: () => apiListInstances({ status: "ACTIVE" }),
    enabled: canManage,
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
  const isLoading =
    instancesLoading || (allInstances.length > 0 && tasksLoading);

  // ── Step 3: Task detail (lazy) ───────────────────────────────────────────────

  const { data: taskDetail, isLoading: taskDetailLoading } = useQuery({
    queryKey: ["approval-task-detail", selectedTaskId ?? ""],
    queryFn: () => apiGetTaskDetailFull(selectedTaskId!),
    enabled: Boolean(selectedTaskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      return (r?.task ??
        r?.data ??
        r?.result ??
        r?.payload ??
        res) as TaskDetailResponse;
    },
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
    const groups = q
      ? pendingGroups
          .map(({ instance, tasks }) => ({
            instance,
            tasks: tasks.filter(
              (tk) =>
                tk.title.toLowerCase().includes(q) ||
                (instance.employeeName ?? "").toLowerCase().includes(q),
            ),
          }))
          .filter(({ tasks }) => tasks.length > 0)
      : pendingGroups;

    if (overdueFirst) {
      return [...groups].sort((a, b) => {
        const aHasOverdue = a.tasks.some((tk) => isOverdue(tk.dueDate));
        const bHasOverdue = b.tasks.some((tk) => isOverdue(tk.dueDate));
        return Number(bHasOverdue) - Number(aHasOverdue);
      });
    }
    return groups;
  }, [pendingGroups, search, overdueFirst]);

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
    rejectMutation.mutate({
      taskId: selectedTaskId,
      reason: rejectReason.trim() || undefined,
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
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-ink">
              {t("onboarding.approvals.title") ?? "Hàng đợi Phê duyệt"}
            </h1>
            {stats.pending > 0 && (
              <span className="flex items-center justify-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {stats.pending}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {stats.employees > 0
              ? `${stats.employees} ${
                  t("onboarding.approvals.stat.employees")?.toLowerCase() ??
                  "nhân viên"
                } có ${stats.pending} task chờ duyệt`
              : (t("onboarding.approvals.subtitle") ??
                "Xem xét và phê duyệt nhiệm vụ đang chờ từ nhân viên")}
          </p>
        </div>
        <Button
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => refetch()}
          loading={isLoading}>
          {t("onboarding.approvals.refresh") ?? "Làm mới"}
        </Button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          label={t("onboarding.approvals.stat.pending") ?? "Chờ duyệt"}
          value={stats.pending}
          colorClass="bg-blue-50"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label={t("onboarding.approvals.stat.overdue") ?? "Quá hạn"}
          value={stats.overdue}
          colorClass="bg-red-50"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          label={t("onboarding.approvals.stat.employees") ?? "Nhân viên"}
          value={stats.employees}
          colorClass="bg-purple-50"
        />
        <StatCard
          icon={<Flag className="h-5 w-5 text-amber-500" />}
          label={t("onboarding.approvals.stat.required") ?? "Bắt buộc"}
          value={stats.required}
          colorClass="bg-amber-50"
        />
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder={
            t("onboarding.approvals.filter.search") ??
            "Tìm theo tên task hoặc nhân viên..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="max-w-xs"
          prefix={<Search className="h-3.5 w-3.5 text-gray-400" />}
        />
        <button
          onClick={() => setOverdueFirst((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            overdueFirst
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
          }`}>
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("onboarding.approvals.filter.overdue_first") ?? "Quá hạn trước"}
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredGroups.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12">
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
              onApprove={handleApprove}
              onReject={handleOpenReject}
              onDetail={openDetail}
            />
          ))}
        </div>
      )}

      {/* ── Task Detail Drawer ───────────────────────────────────────────────── */}
      <ApprovalDetailDrawer
        open={drawerOpen}
        taskDetail={taskDetail}
        loading={taskDetailLoading}
        comments={comments}
        commentsLoading={commentsLoading}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
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
            <XCircle className="h-4 w-4 text-red-500" />
            <span>
              {t("onboarding.task.action.reject_confirm") ?? "Xác nhận từ chối"}
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
        }}>
        <div className="py-2">
          {rejectTargetTitle && (
            <div className="mb-3 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-red-500">
                {t("onboarding.task.field.title") ?? "Nhiệm vụ"}
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-800">
                {rejectTargetTitle}
              </p>
            </div>
          )}
          <p className="mb-2 text-sm text-gray-600">
            {t("onboarding.task.action.reject_reason_label") ??
              "Lý do từ chối"}{" "}
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
