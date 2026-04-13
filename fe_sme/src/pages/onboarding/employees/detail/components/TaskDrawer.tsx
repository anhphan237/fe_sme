import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Send,
  ThumbsUp,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import {
  Button,
  Col,
  Divider,
  Drawer,
  Empty,
  Input,
  Row,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useLocale } from "@/i18n";
import {
  APPROVAL_STATUS_COLOR,
  SCHEDULE_STATUS_COLOR,
  STATUS_DONE_API,
  STATUS_TAG_COLOR,
} from "../constants";
import { formatDate, formatDateTime, getStageLabel } from "../helpers";
import type { TaskDetailResponse, CommentResponse } from "@/interface/onboarding";
import type { OnboardingTask } from "@/shared/types";

// ── Shared sub-components ─────────────────────────────────────────────────────

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

// ── Info Tab ─────────────────────────────────────────────────────────────────

interface TaskInfoTabProps {
  taskDetail: TaskDetailResponse;
  isEmployee: boolean;
  canManage: boolean;
  isAcknowledging: boolean;
  isUpdating: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  onAcknowledge: () => void;
  onConfirmComplete: () => void;
  onSubmitApproval: () => void;
  onMarkDone: () => void;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

const TaskInfoTab = ({
  taskDetail,
  isEmployee,
  canManage,
  isAcknowledging,
  isUpdating,
  isApproving,
  isRejecting,
  onAcknowledge,
  onConfirmComplete,
  onSubmitApproval,
  onMarkDone,
  onApprove,
  onReject,
  onClose,
}: TaskInfoTabProps) => {
  const { t } = useLocale();
  const status = taskDetail.status;

  return (
    <div className="space-y-5 pt-2">
      {/* Header block */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <div className="mb-2 flex flex-wrap items-start gap-2">
          <Typography.Title level={5} className="!mb-0 flex-1 !text-gray-800">
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

      {/* Info grid */}
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
                  <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                  {taskDetail.assignedUserName ?? taskDetail.assignedUserId}
                </span>
              </InfoField>
            </div>
          </Col>
        )}
        {taskDetail.createdAt && (
          <Col
            span={
              taskDetail.assignedUserName || taskDetail.assignedUserId ? 12 : 24
            }>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <InfoField label={t("onboarding.task.field.created_at")}>
                {formatDateTime(taskDetail.createdAt)}
              </InfoField>
            </div>
          </Col>
        )}
      </Row>

      {/* Description */}
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

      {/* Acknowledgment */}
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

      {/* Approval */}
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
                  APPROVAL_STATUS_COLOR[taskDetail.approvalStatus ?? "NONE"] ??
                  "default"
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

      {/* Schedule */}
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
                    SCHEDULE_STATUS_COLOR[taskDetail.scheduleStatus] ?? "default"
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
                    <InfoField label={t("onboarding.task.schedule.field.end")}>
                      {formatDateTime(taskDetail.scheduledEndAt)}
                    </InfoField>
                  </Col>
                )}
              </Row>
            </div>
          </>
        )}

      {/* Action buttons */}
      <Divider orientationMargin={0}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t("onboarding.task.detail.title")}
        </Typography.Text>
      </Divider>
      <div className="flex flex-wrap gap-2">
        {isEmployee &&
          taskDetail.requireAck &&
          (status === "TODO" || status === "IN_PROGRESS") && (
            <Button
              type="primary"
              icon={<CheckSquare className="h-3.5 w-3.5" />}
              loading={isAcknowledging}
              onClick={onAcknowledge}>
              {t("onboarding.task.action.acknowledge")}
            </Button>
          )}
        {isEmployee && status === "WAIT_ACK" && (
          <Button
            type="primary"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            loading={isUpdating}
            onClick={onConfirmComplete}>
            {t("onboarding.task.action.confirm_complete")}
          </Button>
        )}
        {isEmployee &&
          taskDetail.requiresManagerApproval &&
          (status === "TODO" || status === "IN_PROGRESS") && (
            <Button
              type="primary"
              icon={<Send className="h-3.5 w-3.5" />}
              loading={isUpdating}
              onClick={onSubmitApproval}>
              {t("onboarding.task.action.submit_approval")}
            </Button>
          )}
        {isEmployee &&
          !taskDetail.requireAck &&
          !taskDetail.requiresManagerApproval &&
          (status === "TODO" || status === "IN_PROGRESS") && (
            <Button
              type="primary"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              loading={isUpdating}
              onClick={onMarkDone}>
              {t("onboarding.employee.home.today_actions.mark_done")}
            </Button>
          )}
        {canManage && status === "PENDING_APPROVAL" && (
          <>
            <Button
              type="primary"
              icon={<ThumbsUp className="h-3.5 w-3.5" />}
              loading={isApproving}
              onClick={onApprove}>
              {t("onboarding.task.action.approve")}
            </Button>
            <Button
              danger
              icon={<XCircle className="h-3.5 w-3.5" />}
              loading={isRejecting}
              onClick={onReject}>
              {t("onboarding.task.action.reject")}
            </Button>
          </>
        )}
        <Button onClick={onClose}>{t("global.close")}</Button>
      </div>
    </div>
  );
};

// ── Activity Tab ──────────────────────────────────────────────────────────────

const TaskActivityTab = ({
  taskDetail,
}: {
  taskDetail: TaskDetailResponse;
}) => {
  const { t } = useLocale();
  return (
    <div className="space-y-4 pt-2">
      {taskDetail.activityLogs && taskDetail.activityLogs.length > 0 ? (
        <>
          <Divider orientationMargin={0}>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Activity className="h-3 w-3" />
              {t("onboarding.task.activity.section_title")}
            </span>
          </Divider>
          <div className="space-y-1.5">
            {taskDetail.activityLogs.map((log) => (
              <div
                key={log.logId}
                className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                <div className="flex-1">
                  <span className="font-medium text-gray-700">{log.action}</span>
                  {log.newValue && (
                    <span className="ml-1 text-gray-500">→ {log.newValue}</span>
                  )}
                  {log.actorName && (
                    <span className="ml-1 text-gray-400">· {log.actorName}</span>
                  )}
                </div>
                <span className="shrink-0 text-gray-400">
                  {formatDate(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Empty
          description={
            t("onboarding.task.activity.empty") ?? "Chưa có hoạt động"
          }
          imageStyle={{ height: 40 }}
        />
      )}

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
    </div>
  );
};

// ── Comments Tab ──────────────────────────────────────────────────────────────

interface TaskCommentsTabProps {
  comments: CommentResponse[] | undefined;
  commentsLoading: boolean;
  commentInput: string;
  isAddingComment: boolean;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
}

const TaskCommentsTab = ({
  comments,
  commentsLoading,
  commentInput,
  isAddingComment,
  onCommentChange,
  onAddComment,
}: TaskCommentsTabProps) => {
  const { t } = useLocale();
  return (
    <div className="space-y-4 pt-2">
      {commentsLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (comments?.length ?? 0) === 0 ? (
        <Empty
          description={t("onboarding.task.comments.empty")}
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
      <div className="flex gap-2">
        <Input
          placeholder={t("onboarding.task.comments.placeholder")}
          value={commentInput}
          onChange={(e) => onCommentChange(e.target.value)}
          onPressEnter={onAddComment}
          maxLength={500}
        />
        <Button
          type="primary"
          icon={<Send className="h-3.5 w-3.5" />}
          loading={isAddingComment}
          onClick={onAddComment}
          disabled={!commentInput.trim()}>
          {t("onboarding.task.comments.send")}
        </Button>
      </div>
    </div>
  );
};

// ── Main Drawer Component ─────────────────────────────────────────────────────

export interface TaskDrawerProps {
  open: boolean;
  taskDetail: TaskDetailResponse | undefined;
  taskDetailLoading: boolean;
  tasks: OnboardingTask[];
  selectedTaskId: string | null;
  comments: CommentResponse[] | undefined;
  commentsLoading: boolean;
  commentInput: string;
  drawerTab: string;
  isEmployee: boolean;
  canManage: boolean;
  isAcknowledging: boolean;
  isUpdatingStatus: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isAddingComment: boolean;
  onClose: () => void;
  onDrawerTabChange: (tab: string) => void;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
  onAcknowledge: () => void;
  onConfirmComplete: () => void;
  onSubmitApproval: () => void;
  onMarkDone: () => void;
  onApprove: () => void;
  onReject: () => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
}

export const TaskDrawer = ({
  open,
  taskDetail,
  taskDetailLoading,
  tasks,
  selectedTaskId,
  comments,
  commentsLoading,
  commentInput,
  drawerTab,
  isEmployee,
  canManage,
  isAcknowledging,
  isUpdatingStatus,
  isApproving,
  isRejecting,
  isAddingComment,
  onClose,
  onDrawerTabChange,
  onCommentChange,
  onAddComment,
  onAcknowledge,
  onConfirmComplete,
  onSubmitApproval,
  onMarkDone,
  onApprove,
  onReject,
  onNavigatePrev,
  onNavigateNext,
}: TaskDrawerProps) => {
  const { t } = useLocale();
  const taskIndex = selectedTaskId
    ? tasks.findIndex((tk) => tk.id === selectedTaskId)
    : -1;
  const hasPrev = taskIndex > 0;
  const hasNext = taskIndex >= 0 && taskIndex < tasks.length - 1;

  return (
    <Drawer
      open={open}
      width={640}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          <span className="flex-1 truncate">
            {taskDetail
              ? String(taskDetail.title ?? t("onboarding.detail.task.title"))
              : t("onboarding.detail.task.title")}
          </span>
        </div>
      }
      extra={
        tasks.length > 1 && (
          <div className="flex items-center gap-1">
            <Tooltip title={t("global.prev") ?? "Trước"}>
              <Button
                size="small"
                icon={<ChevronLeft className="h-3.5 w-3.5" />}
                disabled={!hasPrev}
                onClick={onNavigatePrev}
              />
            </Tooltip>
            <span className="min-w-[40px] text-center text-xs text-gray-400">
              {taskIndex >= 0 ? `${taskIndex + 1}/${tasks.length}` : ""}
            </span>
            <Tooltip title={t("global.next") ?? "Sau"}>
              <Button
                size="small"
                icon={<ChevronRight className="h-3.5 w-3.5" />}
                disabled={!hasNext}
                onClick={onNavigateNext}
              />
            </Tooltip>
          </div>
        )
      }>
      {taskDetailLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : taskDetail ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}>
          {/* Tab navigation */}
          <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
            {[
              {
                key: "info",
                label: t("onboarding.detail.task.tab.info") ?? "Chi tiết",
              },
              {
                key: "activity",
                label:
                  t("onboarding.detail.task.tab.activity") ?? "Hoạt động",
              },
              {
                key: "comments",
                label: t("onboarding.task.comments.title") ?? "Bình luận",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => onDrawerTabChange(tab.key)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  drawerTab === tab.key
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {drawerTab === "info" && (
            <TaskInfoTab
              taskDetail={taskDetail}
              isEmployee={isEmployee}
              canManage={canManage}
              isAcknowledging={isAcknowledging}
              isUpdating={isUpdatingStatus}
              isApproving={isApproving}
              isRejecting={isRejecting}
              onAcknowledge={onAcknowledge}
              onConfirmComplete={onConfirmComplete}
              onSubmitApproval={onSubmitApproval}
              onMarkDone={onMarkDone}
              onApprove={onApprove}
              onReject={onReject}
              onClose={onClose}
            />
          )}
          {drawerTab === "activity" && (
            <TaskActivityTab taskDetail={taskDetail} />
          )}
          {drawerTab === "comments" && (
            <TaskCommentsTab
              comments={comments}
              commentsLoading={commentsLoading}
              commentInput={commentInput}
              isAddingComment={isAddingComment}
              onCommentChange={onCommentChange}
              onAddComment={onAddComment}
            />
          )}
        </div>
      ) : (
        <Empty description={t("onboarding.task.detail.not_found")} />
      )}
    </Drawer>
  );
};

// Re-export constant for use in index.tsx
export { STATUS_DONE_API };
