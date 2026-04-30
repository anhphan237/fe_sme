import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  MessageSquare,
  Paperclip,
  Send,
  User as UserIcon,
} from "lucide-react";
import {
  Button,
  Divider,
  Drawer,
  Empty,
  Input,
  Progress,
  Skeleton,
  Tag,
  Tooltip,
} from "antd";
import {
  apiGetTaskDetailFull,
  apiListTaskComments,
  apiAddTaskComment,
} from "@/api/onboarding/onboarding.api";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { notify } from "@/utils/notify";
import { ConfirmCheckpointModal } from "./ConfirmCheckpointModal";
import type {
  DepartmentCheckpoint,
  TaskDetailResponse,
  CommentResponse,
} from "@/interface/onboarding";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeptTaskDrawerProps {
  open: boolean;
  taskId: string | null;
  departmentId: string | null;
  resolveUserName: (id: string | null | undefined, fallback?: string) => string;
  onClose: () => void;
  onCheckpointConfirmed: () => void;
}

type DrawerTab = "checkpoint" | "info" | "comments";

// ── Helpers ───────────────────────────────────────────────────────────────────

const isOverdue = (dueDate?: string) =>
  Boolean(dueDate && new Date(dueDate) < new Date());

const formatDate = (value?: string | null, locale?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(
    (locale ?? "vi-VN").replace("_", "-"),
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );
};

const formatDateTime = (value?: string | null, locale?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString(
    (locale ?? "vi-VN").replace("_", "-"),
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
};

const unwrapDetail = (res: unknown): TaskDetailResponse => {
  const r = res as Record<string, unknown>;
  return (r?.task ??
    r?.data ??
    r?.result ??
    r?.payload ??
    res) as TaskDetailResponse;
};

const getInitial = (name?: string | null) =>
  ((name ?? "?")[0] ?? "?").toUpperCase();

// ── Checkpoint Row ────────────────────────────────────────────────────────────

interface CheckpointRowProps {
  checkpoint: DepartmentCheckpoint;
  canConfirm: boolean;
  onConfirm: (cp: DepartmentCheckpoint) => void;
  locale: string;
  t: (key: string) => string;
}

const CheckpointRow = ({
  checkpoint: cp,
  canConfirm,
  onConfirm,
  locale,
  t,
}: CheckpointRowProps) => {
  const isConfirmed = cp.status === "CONFIRMED";

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all ${
        isConfirmed
          ? "border-green-200 bg-green-50/40"
          : canConfirm
            ? "border-purple-200 bg-white hover:border-purple-300 hover:shadow-sm"
            : "border-gray-100 bg-gray-50/60"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-3.5 py-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
            isConfirmed
              ? "border-green-200 bg-white"
              : "border-gray-200 bg-white"
          }`}
        >
          {isConfirmed ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Clock className="h-4 w-4 text-amber-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800">
            {cp.departmentName ?? cp.departmentId}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Tag
              color={isConfirmed ? "success" : "warning"}
              style={{ margin: 0, fontSize: 10, lineHeight: "18px" }}
            >
              {isConfirmed
                ? t("onboarding.approvals.dept.tab.confirmed")
                : t("onboarding.approvals.dept.drawer.checkpoint.not_confirmed")}
            </Tag>
            {cp.requireEvidence && !isConfirmed && (
              <Tag
                color="gold"
                style={{ margin: 0, fontSize: 10, lineHeight: "18px" }}
              >
                {t("onboarding.approvals.dept.badge.require_evidence")}
              </Tag>
            )}
          </div>
        </div>

        {canConfirm && (
          <Button
            size="small"
            type="primary"
            icon={<CheckCircle2 className="h-3 w-3" />}
            className="shrink-0 border-purple-600 bg-purple-600 hover:border-purple-700 hover:bg-purple-700"
            onClick={() => onConfirm(cp)}
          >
            {t("global.confirm")}
          </Button>
        )}
      </div>

      {/* Confirmed details */}
      {isConfirmed && (
        <div className="mx-3.5 mb-3 space-y-1.5 rounded-lg border border-green-100 bg-white p-3 text-xs text-gray-600">
          {cp.confirmedByName && (
            <div className="flex items-center gap-2">
              <UserIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="text-gray-400">
                {t("onboarding.approvals.dept.confirmed.confirmed_by")}:
              </span>
              <span className="font-semibold text-gray-700">
                {cp.confirmedByName}
              </span>
            </div>
          )}
          {cp.confirmedAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="text-gray-400">
                {t("onboarding.approvals.dept.confirmed.confirmed_at")}:
              </span>
              <span className="font-semibold text-gray-700">
                {formatDateTime(cp.confirmedAt, locale)}
              </span>
            </div>
          )}
          {cp.evidenceNote && (
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <div>
                <span className="text-gray-400">
                  {t("onboarding.approvals.dept.confirmed.note")}:
                </span>{" "}
                <span className="text-gray-700">{cp.evidenceNote}</span>
              </div>
            </div>
          )}
          {cp.evidenceRef && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="text-gray-400">
                {t("onboarding.approvals.dept.confirmed.ref")}:
              </span>
              <a
                href={cp.evidenceRef}
                target="_blank"
                rel="noreferrer"
                className="truncate text-blue-600 hover:underline"
              >
                {cp.evidenceRef}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Info Field ────────────────────────────────────────────────────────────────

const InfoField = ({
  label,
  icon,
  value,
  valueClass = "text-gray-800",
}: {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  valueClass?: string;
}) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
      {label}
    </p>
    <div className={`flex items-center gap-1.5 text-sm font-semibold ${valueClass}`}>
      {icon}
      {value}
    </div>
  </div>
);

// ── Main Drawer ───────────────────────────────────────────────────────────────

export function DeptTaskDrawer({
  open,
  taskId,
  departmentId,
  resolveUserName,
  onClose,
  onCheckpointConfirmed,
}: DeptTaskDrawerProps) {
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.currentUser);
  const userDeptId = currentUser?.departmentId ?? departmentId;

  const [activeTab, setActiveTab] = useState<DrawerTab>("checkpoint");
  const [confirmTarget, setConfirmTarget] =
    useState<DepartmentCheckpoint | null>(null);
  const [newComment, setNewComment] = useState("");

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: task, isLoading } = useQuery({
    queryKey: ["approval-task-detail-dept", taskId ?? ""],
    queryFn: () =>
      apiGetTaskDetailFull(taskId!, {
        includeActivityLogs: true,
        includeComments: true,
        includeAttachments: true,
      }),
    enabled: Boolean(taskId) && open,
    select: unwrapDetail,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["dept-task-comments", taskId ?? ""],
    queryFn: () => apiListTaskComments(taskId!),
    enabled: Boolean(taskId) && open && activeTab === "comments",
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const list = r?.comments ?? r?.data ?? [];
      return (Array.isArray(list) ? list : []) as CommentResponse[];
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      apiAddTaskComment({ taskId: taskId!, content }),
    onSuccess: () => {
      setNewComment("");
      void queryClient.invalidateQueries({
        queryKey: ["dept-task-comments", taskId ?? ""],
      });
      void queryClient.invalidateQueries({
        queryKey: ["approval-task-detail-dept", taskId ?? ""],
      });
      notify.success("Đã thêm bình luận");
    },
    onError: () => notify.error("Không thể thêm bình luận"),
  });

  // ── Derived ──────────────────────────────────────────────────────────────────

  const checkpoints = task?.departmentCheckpoints ?? [];
  const confirmedCount = checkpoints.filter(
    (c) => c.status === "CONFIRMED",
  ).length;
  const progressPct =
    checkpoints.length > 0
      ? Math.round((confirmedCount / checkpoints.length) * 100)
      : 0;
  const allConfirmed =
    checkpoints.length > 0 && confirmedCount === checkpoints.length;

  const assigneeName = task
    ? (task.assignedUserName ??
      resolveUserName(task.assignedUserId, task.assignedUserId))
    : undefined;
  const reporterName = task
    ? (task.reporterUserName ??
      resolveUserName(task.reporterUserId, undefined))
    : undefined;

  const overdue = task ? isOverdue(task.dueDate) : false;

  // Merge comment sources: dedicated fetch first, fallback to allLogs
  const commentEntries: CommentResponse[] =
    comments.length > 0
      ? comments
      : (task?.allLogs
          ?.filter((l) => l.type === "COMMENT")
          .map((l) => ({
            commentId: l.commentId ?? l.logId ?? "",
            taskId: taskId ?? "",
            authorId: l.createdBy ?? l.actorUserId ?? "",
            authorName: l.createdByName ?? l.actorName,
            content: l.content,
            message: l.content,
            createdAt: l.createdAt,
          })) ?? []);

  // Tab config
  const tabs: {
    key: DrawerTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      key: "checkpoint",
      label: t("onboarding.approvals.dept.drawer.tab.checkpoint") ?? "Checkpoint",
      icon: <Building2 className="h-3.5 w-3.5" />,
      count: checkpoints.filter((c) => c.status === "PENDING").length || undefined,
    },
    {
      key: "info",
      label: t("onboarding.approvals.dept.drawer.tab.info") ?? "Chi tiết",
      icon: <FileText className="h-3.5 w-3.5" />,
    },
    {
      key: "comments",
      label: t("onboarding.approvals.dept.drawer.tab.comments") ?? "Bình luận",
      icon: <MessageSquare className="h-3.5 w-3.5" />,
      count: commentEntries.length || undefined,
    },
  ];

  return (
    <>
      <Drawer
        open={open}
        width={500}
        onClose={onClose}
        styles={{ body: { padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" } }}
        title={
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-800 leading-tight">
                {task?.title ??
                  (t("onboarding.approvals.drawer.title") ??
                    "Chi tiết nhiệm vụ")}
              </p>
              {task && (
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  {task.checklistName ?? "Checkpoint phòng ban"}
                </p>
              )}
            </div>
            {overdue && (
              <Tooltip title="Nhiệm vụ này đã quá hạn">
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Quá hạn
                </span>
              </Tooltip>
            )}
          </div>
        }
      >
        {isLoading ? (
          <div className="p-5">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : !task ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <Empty description={t("onboarding.task.detail.not_found")} />
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* ── Task summary strip ────────────────────────────────────────── */}
            <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {task.dueDate && (
                  <span
                    className={`flex items-center gap-1 ${overdue ? "font-semibold text-red-500" : ""}`}
                  >
                    {overdue ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Calendar className="h-3 w-3" />
                    )}
                    {formatDate(task.dueDate, locale)}
                  </span>
                )}
                {assigneeName && (
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {assigneeName}
                  </span>
                )}
                {allConfirmed && (
                  <span className="flex items-center gap-1 font-semibold text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Tất cả đã xác nhận
                  </span>
                )}
              </div>
            </div>

            {/* ── Tab nav ───────────────────────────────────────────────────── */}
            <div className="border-b border-gray-100 px-5 pt-3 pb-0">
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 pb-2.5 pt-1.5 text-xs font-semibold transition-all ${
                      activeTab === tab.key
                        ? "border-b-purple-600 text-purple-700"
                        : "border-b-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count != null && tab.count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                          activeTab === tab.key
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab content ───────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Checkpoint tab ─────────────────────────────────────────── */}
              {activeTab === "checkpoint" && (
                <div className="space-y-4 p-5">
                  {/* Progress summary */}
                  {checkpoints.length > 0 && (
                    <div className="rounded-xl border border-purple-100 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {t("onboarding.approvals.dept.drawer.checkpoint.progress") ??
                            "Tiến độ xác nhận"}
                        </p>
                        <span
                          className={`text-sm font-bold ${
                            allConfirmed ? "text-green-600" : "text-purple-600"
                          }`}
                        >
                          {confirmedCount}/{checkpoints.length}
                        </span>
                      </div>
                      <Progress
                        percent={progressPct}
                        strokeColor={allConfirmed ? "#22c55e" : "#9333ea"}
                        trailColor="#f3e8ff"
                        size={["100%", 8]}
                        showInfo={false}
                      />
                      {allConfirmed && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Tất cả phòng ban đã xác nhận — nhiệm vụ sẽ tự hoàn thành
                        </div>
                      )}
                    </div>
                  )}

                  {/* Overdue banner */}
                  {overdue && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        {t("onboarding.task.stat.overdue") ?? "Nhiệm vụ đã quá hạn"}
                        {task.dueDate && ` — hạn ${formatDate(task.dueDate, locale)}`}
                      </span>
                    </div>
                  )}

                  {/* Checkpoint list */}
                  {checkpoints.length === 0 ? (
                    <Empty
                      imageStyle={{ height: 40 }}
                      description={t("onboarding.approvals.dept.empty.title") ?? "Không có checkpoint"}
                    />
                  ) : (
                    <div className="space-y-2">
                      {checkpoints.map((cp) => (
                        <CheckpointRow
                          key={cp.checkpointId}
                          checkpoint={cp}
                          canConfirm={
                            cp.status === "PENDING" &&
                            cp.departmentId === userDeptId
                          }
                          onConfirm={setConfirmTarget}
                          locale={locale}
                          t={t}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Info tab ───────────────────────────────────────────────── */}
              {activeTab === "info" && (
                <div className="space-y-4 p-5">
                  {/* Description */}
                  {task.description && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {t("onboarding.employee.home.task_detail.field_description") ?? "Mô tả"}
                      </p>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-sm leading-relaxed text-gray-700">
                        {String(task.description)}
                      </div>
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <InfoField
                      label={t("onboarding.employee.home.task_detail.field_due_date") ?? "Hạn hoàn thành"}
                      icon={
                        overdue ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        )
                      }
                      value={formatDate(task.dueDate, locale)}
                      valueClass={overdue ? "text-red-600" : "text-gray-800"}
                    />
                    {assigneeName && (
                      <InfoField
                        label={t("onboarding.task.field.assignee") ?? "Người thực hiện"}
                        icon={
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                            {getInitial(assigneeName)}
                          </div>
                        }
                        value={assigneeName}
                      />
                    )}
                    {reporterName && (
                      <InfoField
                        label="Người giao"
                        icon={
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                            {getInitial(reporterName)}
                          </div>
                        }
                        value={reporterName}
                      />
                    )}
                    {task.checklistName && (
                      <InfoField
                        label={t("onboarding.approvals.dept.checklist_label") ?? "Checklist"}
                        icon={<FileText className="h-3.5 w-3.5 text-gray-400" />}
                        value={task.checklistName}
                      />
                    )}
                  </div>

                  {/* Schedule info */}
                  {task.scheduledStartAt && (
                    <>
                      <Divider orientationMargin={0}>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Calendar className="h-3 w-3" />
                          Lịch hẹn
                        </span>
                      </Divider>
                      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold text-gray-800">
                            {formatDateTime(task.scheduledStartAt, locale)}
                          </span>
                          {task.scheduledEndAt && (
                            <>
                              <span className="text-gray-400">→</span>
                              <span className="font-semibold text-gray-800">
                                {formatDateTime(task.scheduledEndAt, locale)}
                              </span>
                            </>
                          )}
                        </div>
                        {task.scheduleStatus && (
                          <div className="mt-1.5 text-xs text-gray-500">
                            Trạng thái:{" "}
                            <span className="font-semibold text-blue-600">
                              {task.scheduleStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Attachments */}
                  {task.attachments && task.attachments.length > 0 && (
                    <>
                      <Divider orientationMargin={0}>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Paperclip className="h-3 w-3" />
                          {t("onboarding.employee.home.task_detail.field_attachments") ??
                            "Tệp đính kèm"}
                        </span>
                      </Divider>
                      <div className="space-y-1.5">
                        {task.attachments.map((att) => (
                          <a
                            key={att.attachmentId}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-50"
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="flex-1 truncate font-medium">
                              {att.fileName}
                            </span>
                            {att.fileSizeBytes != null && (
                              <span className="shrink-0 text-[11px] text-gray-400">
                                {(att.fileSizeBytes / 1024).toFixed(0)} KB
                              </span>
                            )}
                            <ExternalLink className="h-3 w-3 shrink-0 text-gray-300" />
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Comments tab ───────────────────────────────────────────── */}
              {activeTab === "comments" && (
                <div className="flex flex-col gap-3 p-5">
                  {/* Comment list */}
                  {commentsLoading ? (
                    <Skeleton active paragraph={{ rows: 3 }} />
                  ) : commentEntries.length === 0 ? (
                    <Empty
                      imageStyle={{ height: 48 }}
                      description={
                        t("onboarding.task.comments.empty") ?? "Chưa có bình luận"
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {commentEntries.map((c, idx) => (
                        <div
                          key={c.commentId || idx}
                          className="flex gap-2.5"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                            {getInitial(c.authorName)}
                          </div>
                          <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-700">
                                {c.authorName ??
                                  (t("onboarding.task.comments.unknown_author") ??
                                    "Ẩn danh")}
                              </span>
                              {c.createdAt && (
                                <span className="text-[11px] text-gray-400">
                                  {formatDateTime(c.createdAt, locale)}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">
                              {c.message ?? c.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment composer */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Thêm bình luận
                    </p>
                    <Input.TextArea
                      rows={2}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Nhập ghi chú hoặc bình luận..."
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
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirm checkpoint modal */}
      <ConfirmCheckpointModal
        open={Boolean(confirmTarget)}
        taskId={taskId}
        taskTitle={task?.title}
        requireEvidence={confirmTarget?.requireEvidence ?? false}
        departmentId={confirmTarget?.departmentId ?? null}
        onClose={() => setConfirmTarget(null)}
        onSuccess={() => {
          setConfirmTarget(null);
          onCheckpointConfirmed();
          void queryClient.invalidateQueries({
            queryKey: ["approval-task-detail-dept", taskId ?? ""],
          });
        }}
      />
    </>
  );
}
