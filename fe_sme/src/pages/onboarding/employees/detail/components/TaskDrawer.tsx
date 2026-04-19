import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileUp,
  Paperclip,
  Play,
  Send,
  ThumbsUp,
  User as UserIcon,
  Users,
  XCircle,
} from "lucide-react";
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  Input,
  Row,
  Select,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import type { Dayjs } from "dayjs";
import { useLocale } from "@/i18n";
import {
  APPROVAL_STATUS_COLOR,
  SCHEDULE_STATUS_COLOR,
  STATUS_DONE_API,
  STATUS_TAG_COLOR,
} from "../constants";
import { formatDate, formatDateTime, getStageLabel } from "../helpers";
import type {
  TaskDetailResponse,
  CommentResponse,
} from "@/interface/onboarding";
import type { UserListItem } from "@/interface/identity";
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

// ── Schedule Section ──────────────────────────────────────────────────────────

interface ScheduleSectionProps {
  taskDetail: TaskDetailResponse;
  isEmployee: boolean;
  canManage: boolean;
  scheduleMode: null | "propose" | "reschedule";
  scheduleDates: [Dayjs | null, Dayjs | null];
  scheduleReason: string;
  cancelScheduleReason: string;
  noShowReason: string;
  isProposingSchedule: boolean;
  isConfirmingSchedule: boolean;
  isRescheduling: boolean;
  isCancellingSchedule: boolean;
  isMarkingNoShow: boolean;
  onScheduleModeChange: (mode: null | "propose" | "reschedule") => void;
  onScheduleDatesChange: (dates: [Dayjs | null, Dayjs | null]) => void;
  onScheduleReasonChange: (v: string) => void;
  onCancelScheduleReasonChange: (v: string) => void;
  onNoShowReasonChange: (v: string) => void;
  onProposeSchedule: () => void;
  onConfirmSchedule: () => void;
  onReschedule: () => void;
  onCancelSchedule: () => void;
  onMarkNoShow: () => void;
}

const ScheduleSection = ({
  taskDetail,
  isEmployee,
  canManage,
  scheduleMode,
  scheduleDates,
  scheduleReason,
  cancelScheduleReason,
  noShowReason,
  isProposingSchedule,
  isConfirmingSchedule,
  isRescheduling,
  isCancellingSchedule,
  isMarkingNoShow,
  onScheduleModeChange,
  onScheduleDatesChange,
  onScheduleReasonChange,
  onCancelScheduleReasonChange,
  onNoShowReasonChange,
  onProposeSchedule,
  onConfirmSchedule,
  onReschedule,
  onCancelSchedule,
  onMarkNoShow,
}: ScheduleSectionProps) => {
  const { t } = useLocale();
  const ss = taskDetail.scheduleStatus ?? "UNSCHEDULED";
  const canPropose = isEmployee || canManage;

  return (
    <>
      <Divider orientationMargin={0}>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar className="h-3 w-3" />
          {t("onboarding.task.schedule.section_title")}
        </span>
      </Divider>

      <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-3 space-y-3">
        {/* Status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">
            {t("onboarding.employee.home.task_detail.field_status")}:
          </span>
          <Tag
            color={SCHEDULE_STATUS_COLOR[ss] ?? "default"}
            style={{ margin: 0 }}>
            {t(`onboarding.task.schedule.status.${ss}`)}
          </Tag>
        </div>

        {/* UNSCHEDULED — propose form */}
        {ss === "UNSCHEDULED" && canPropose && (
          <>
            {scheduleMode === "propose" ? (
              <div className="space-y-2">
                <DatePicker.RangePicker
                  showTime
                  style={{ width: "100%" }}
                  value={scheduleDates}
                  onChange={(vals) =>
                    onScheduleDatesChange(
                      vals ? [vals[0] ?? null, vals[1] ?? null] : [null, null],
                    )
                  }
                />
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    size="small"
                    loading={isProposingSchedule}
                    disabled={!scheduleDates[0] || !scheduleDates[1]}
                    onClick={onProposeSchedule}>
                    {t("onboarding.task.schedule.action.propose")}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => onScheduleModeChange(null)}>
                    {t("global.cancel_action")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="small"
                icon={<Calendar className="h-3.5 w-3.5" />}
                onClick={() => onScheduleModeChange("propose")}>
                {t("onboarding.task.schedule.action.propose")}
              </Button>
            )}
          </>
        )}

        {/* PROPOSED — show times, confirm/cancel */}
        {ss === "PROPOSED" && (
          <>
            <Row gutter={[12, 8]}>
              {taskDetail.scheduledStartAt && (
                <Col span={12}>
                  <InfoField label={t("onboarding.task.schedule.field.start")}>
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
              {taskDetail.scheduleProposedBy && (
                <Col span={24}>
                  <InfoField
                    label={t("onboarding.task.schedule.field.proposed_by")}>
                    {taskDetail.scheduleProposedBy}
                    {taskDetail.scheduleProposedAt &&
                      ` · ${formatDateTime(taskDetail.scheduleProposedAt)}`}
                  </InfoField>
                </Col>
              )}
            </Row>
            <div className="flex flex-wrap gap-2">
              {canManage && (
                <Button
                  type="primary"
                  size="small"
                  loading={isConfirmingSchedule}
                  onClick={onConfirmSchedule}>
                  {t("onboarding.task.schedule.action.confirm")}
                </Button>
              )}
              {/* Cancel with reason */}
              <div className="flex gap-1">
                <Input
                  size="small"
                  style={{ width: 140 }}
                  value={cancelScheduleReason}
                  onChange={(e) => onCancelScheduleReasonChange(e.target.value)}
                  placeholder={t(
                    "onboarding.task.schedule.field.cancel_reason",
                  )}
                />
                <Button
                  size="small"
                  danger
                  loading={isCancellingSchedule}
                  onClick={onCancelSchedule}>
                  {t("onboarding.task.schedule.action.cancel")}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* CONFIRMED — show times, reschedule / cancel / no-show */}
        {(ss === "CONFIRMED" || ss === "RESCHEDULED") && (
          <>
            <Row gutter={[12, 8]}>
              {taskDetail.scheduledStartAt && (
                <Col span={12}>
                  <InfoField label={t("onboarding.task.schedule.field.start")}>
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
              {taskDetail.scheduleConfirmedBy && (
                <Col span={24}>
                  <InfoField
                    label={t("onboarding.task.schedule.field.confirmed_by")}>
                    {taskDetail.scheduleConfirmedBy}
                    {taskDetail.scheduleConfirmedAt &&
                      ` · ${formatDateTime(taskDetail.scheduleConfirmedAt)}`}
                  </InfoField>
                </Col>
              )}
              {ss === "RESCHEDULED" && taskDetail.scheduleRescheduleReason && (
                <Col span={24}>
                  <InfoField
                    label={t(
                      "onboarding.task.schedule.field.reschedule_reason",
                    )}>
                    {taskDetail.scheduleRescheduleReason}
                  </InfoField>
                </Col>
              )}
            </Row>

            {/* Reschedule mode */}
            {scheduleMode === "reschedule" ? (
              <div className="space-y-2">
                <DatePicker.RangePicker
                  showTime
                  style={{ width: "100%" }}
                  value={scheduleDates}
                  onChange={(vals) =>
                    onScheduleDatesChange(
                      vals ? [vals[0] ?? null, vals[1] ?? null] : [null, null],
                    )
                  }
                />
                <Input
                  size="small"
                  value={scheduleReason}
                  onChange={(e) => onScheduleReasonChange(e.target.value)}
                  placeholder={t(
                    "onboarding.task.schedule.field.reschedule_reason",
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    size="small"
                    loading={isRescheduling}
                    disabled={!scheduleDates[0] || !scheduleDates[1]}
                    onClick={onReschedule}>
                    {t("onboarding.task.schedule.action.reschedule")}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => onScheduleModeChange(null)}>
                    {t("global.cancel_action")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="small"
                  onClick={() => onScheduleModeChange("reschedule")}>
                  {t("onboarding.task.schedule.action.reschedule")}
                </Button>
                {/* Cancel */}
                <div className="flex gap-1">
                  <Input
                    size="small"
                    style={{ width: 140 }}
                    value={cancelScheduleReason}
                    onChange={(e) =>
                      onCancelScheduleReasonChange(e.target.value)
                    }
                    placeholder={t(
                      "onboarding.task.schedule.field.cancel_reason",
                    )}
                  />
                  <Button
                    size="small"
                    danger
                    loading={isCancellingSchedule}
                    onClick={onCancelSchedule}>
                    {t("onboarding.task.schedule.action.cancel")}
                  </Button>
                </div>
                {/* No-show (manager only) */}
                {canManage && (
                  <div className="flex gap-1">
                    <Input
                      size="small"
                      style={{ width: 140 }}
                      value={noShowReason}
                      onChange={(e) => onNoShowReasonChange(e.target.value)}
                      placeholder={t(
                        "onboarding.task.schedule.field.no_show_reason",
                      )}
                    />
                    <Button
                      size="small"
                      loading={isMarkingNoShow}
                      onClick={onMarkNoShow}>
                      {t("onboarding.task.schedule.action.no_show")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* CANCELLED */}
        {ss === "CANCELLED" && taskDetail.scheduleCancelReason && (
          <InfoField label={t("onboarding.task.schedule.field.cancel_reason")}>
            {taskDetail.scheduleCancelReason}
          </InfoField>
        )}

        {/* MISSED */}
        {ss === "MISSED" && taskDetail.scheduleNoShowReason && (
          <InfoField label={t("onboarding.task.schedule.field.no_show_reason")}>
            {taskDetail.scheduleNoShowReason}
          </InfoField>
        )}
      </div>
    </>
  );
};

// ── Info Tab ─────────────────────────────────────────────────────────────────

interface TaskInfoTabProps {
  taskDetail: TaskDetailResponse;
  isEmployee: boolean;
  canManage: boolean;
  /** Pre-computed approve/reject permission. Falls back to canManage when not provided. */
  canApproveOrReject?: boolean;
  assignableUsers: UserListItem[];
  isAcknowledging: boolean;
  isUpdating: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isAssigning: boolean;
  // Schedule
  scheduleMode: null | "propose" | "reschedule";
  scheduleDates: [Dayjs | null, Dayjs | null];
  scheduleReason: string;
  cancelScheduleReason: string;
  noShowReason: string;
  isProposingSchedule: boolean;
  isConfirmingSchedule: boolean;
  isRescheduling: boolean;
  isCancellingSchedule: boolean;
  isMarkingNoShow: boolean;
  onScheduleModeChange: (mode: null | "propose" | "reschedule") => void;
  onScheduleDatesChange: (dates: [Dayjs | null, Dayjs | null]) => void;
  onScheduleReasonChange: (v: string) => void;
  onCancelScheduleReasonChange: (v: string) => void;
  onNoShowReasonChange: (v: string) => void;
  onProposeSchedule: () => void;
  onConfirmSchedule: () => void;
  onReschedule: () => void;
  onCancelSchedule: () => void;
  onMarkNoShow: () => void;
  // Actions
  onStart: () => void;
  onAcknowledge: () => void;
  onConfirmComplete: () => void;
  onSubmitApproval: () => void;
  onMarkDone: () => void;
  onApprove: () => void;
  onReject: () => void;
  onAssign: (userId: string) => void;
  onClose: () => void;
}

const TaskInfoTab = ({
  taskDetail,
  isEmployee,
  canManage,
  canApproveOrReject,
  assignableUsers,
  isAcknowledging,
  isUpdating,
  isApproving,
  isRejecting,
  isAssigning,
  scheduleMode,
  scheduleDates,
  scheduleReason,
  cancelScheduleReason,
  noShowReason,
  isProposingSchedule,
  isConfirmingSchedule,
  isRescheduling,
  isCancellingSchedule,
  isMarkingNoShow,
  onScheduleModeChange,
  onScheduleDatesChange,
  onScheduleReasonChange,
  onCancelScheduleReasonChange,
  onNoShowReasonChange,
  onProposeSchedule,
  onConfirmSchedule,
  onReschedule,
  onCancelSchedule,
  onMarkNoShow,
  onStart,
  onAcknowledge,
  onConfirmComplete,
  onSubmitApproval,
  onMarkDone,
  onApprove,
  onReject,
  onAssign,
  onClose,
}: TaskInfoTabProps) => {
  const { t } = useLocale();
  const status = taskDetail.status;
  const ss = taskDetail.scheduleStatus ?? "UNSCHEDULED";

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
              label={t("onboarding.employee.home.task_detail.field_due_date")}>
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
        {/* Assignee — prefer nested object, fall back to flat fields */}
        {(taskDetail.assignedUser?.fullName ||
          taskDetail.assignedUserName ||
          taskDetail.assignedUserId) && (
          <Col span={12}>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <InfoField label={t("onboarding.task.field.assignee")}>
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                  {taskDetail.assignedUser?.fullName ??
                    taskDetail.assignedUserName ??
                    taskDetail.assignedUserId}
                </span>
                {taskDetail.assignedUser?.email && (
                  <span className="mt-0.5 block text-xs text-gray-400">
                    {taskDetail.assignedUser.email}
                  </span>
                )}
              </InfoField>
            </div>
          </Col>
        )}
        {/* Department */}
        {taskDetail.assignedDepartment && (
          <Col span={12}>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <InfoField
                label={t("onboarding.task.field.department") ?? "Phòng ban"}>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  {taskDetail.assignedDepartment.name ??
                    taskDetail.assignedDepartment.departmentId}
                </span>
              </InfoField>
            </div>
          </Col>
        )}
        {taskDetail.createdAt && (
          <Col
            span={
              taskDetail.assignedUser?.fullName ||
              taskDetail.assignedUserName ||
              taskDetail.assignedUserId
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

      {/* Required documents */}
      {taskDetail.requiredDocuments &&
        taskDetail.requiredDocuments.length > 0 && (
          <>
            <Divider orientationMargin={0}>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <BookOpen className="h-3 w-3" />
                {t("onboarding.task.required_docs.section_title") ??
                  "Tài liệu yêu cầu"}
              </span>
            </Divider>
            <div className="space-y-1.5">
              {taskDetail.requiredDocuments.map((doc) => (
                <div
                  key={doc.documentId}
                  className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-sm">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="flex-1 text-gray-700">
                    {doc.title ?? doc.documentId}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

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

      {/* Schedule section */}
      <ScheduleSection
        taskDetail={taskDetail}
        isEmployee={isEmployee}
        canManage={canManage}
        scheduleMode={scheduleMode}
        scheduleDates={scheduleDates}
        scheduleReason={scheduleReason}
        cancelScheduleReason={cancelScheduleReason}
        noShowReason={noShowReason}
        isProposingSchedule={isProposingSchedule}
        isConfirmingSchedule={isConfirmingSchedule}
        isRescheduling={isRescheduling}
        isCancellingSchedule={isCancellingSchedule}
        isMarkingNoShow={isMarkingNoShow}
        onScheduleModeChange={onScheduleModeChange}
        onScheduleDatesChange={onScheduleDatesChange}
        onScheduleReasonChange={onScheduleReasonChange}
        onCancelScheduleReasonChange={onCancelScheduleReasonChange}
        onNoShowReasonChange={onNoShowReasonChange}
        onProposeSchedule={onProposeSchedule}
        onConfirmSchedule={onConfirmSchedule}
        onReschedule={onReschedule}
        onCancelSchedule={onCancelSchedule}
        onMarkNoShow={onMarkNoShow}
      />

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

      {/* Action buttons */}
      <Divider orientationMargin={0}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t("onboarding.task.detail.title")}
        </Typography.Text>
      </Divider>
      <div className="flex flex-wrap gap-2">
        {isEmployee && (status === "TODO" || status === "ASSIGNED") && (
          <Button
            icon={<Play className="h-3.5 w-3.5" />}
            loading={isUpdating}
            onClick={onStart}>
            {t("onboarding.task.action.start")}
          </Button>
        )}
        {isEmployee &&
          taskDetail.requireAck &&
          status === "IN_PROGRESS" && (
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
          status === "IN_PROGRESS" && (
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
          status === "IN_PROGRESS" && (
            <Button
              type="primary"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              loading={isUpdating}
              onClick={onMarkDone}>
              {t("onboarding.employee.home.today_actions.mark_done")}
            </Button>
          )}
        {(canApproveOrReject ?? canManage) && status === "PENDING_APPROVAL" && (
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

// ── Documents Tab ─────────────────────────────────────────────────────────────

interface TaskDocumentsTabProps {
  taskDetail: TaskDetailResponse;
  uploadingFile: boolean;
  onUploadAttachment: (file: File) => void;
}

const TaskDocumentsTab = ({
  taskDetail,
  uploadingFile,
  onUploadAttachment,
}: TaskDocumentsTabProps) => {
  const { t } = useLocale();
  const attachments = taskDetail.attachments ?? [];
  const requiredDocs = taskDetail.requiredDocuments ?? [];

  return (
    <div className="space-y-4 pt-2">
      {/* Required documents list */}
      {requiredDocs.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
            <BookOpen className="h-3.5 w-3.5" />
            {t("onboarding.task.required_docs.section_title") ??
              "Tài liệu yêu cầu"}
            <span className="ml-1 rounded-full bg-blue-100 px-1.5 text-blue-600">
              {requiredDocs.length}
            </span>
          </div>
          <div className="space-y-1">
            {requiredDocs.map((doc) => (
              <div
                key={doc.documentId}
                className="flex items-center gap-2 text-sm text-gray-700">
                <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                {doc.title ?? doc.documentId}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload area */}
      <Upload.Dragger
        multiple={false}
        showUploadList={false}
        beforeUpload={(file) => {
          onUploadAttachment(file);
          return false;
        }}
        disabled={uploadingFile}
        style={{ borderRadius: 12 }}>
        <div className="flex flex-col items-center gap-2 py-4">
          <FileUp className="h-8 w-8 text-blue-400" />
          <p className="text-sm font-medium text-gray-700">
            {t("onboarding.task.attachment.upload_title")}
          </p>
          <p className="text-xs text-gray-400">
            {t("onboarding.task.attachment.upload_desc")}
          </p>
          {uploadingFile && (
            <span className="text-xs text-blue-500">
              {t("onboarding.task.attachment.uploading")}
            </span>
          )}
        </div>
      </Upload.Dragger>

      {/* requireDoc warning */}
      {taskDetail.requireDoc && attachments.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t("onboarding.task.attachment.require_doc_warning")}
        </div>
      )}

      {/* Attachment list */}
      {attachments.length === 0 ? (
        <Empty
          description={t("onboarding.task.attachment.empty")}
          imageStyle={{ height: 40 }}
        />
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Paperclip className="h-3.5 w-3.5" />
            {t("onboarding.employee.home.task_detail.field_attachments")}
            <span className="ml-1 rounded-full bg-gray-100 px-1.5 text-gray-500">
              {attachments.length}
            </span>
          </div>
          {attachments.map((att) => (
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
      )}
    </div>
  );
};

// ── Activity Tab ──────────────────────────────────────────────────────────────

function parseActivityChange(
  action: string,
  oldJson: string | undefined,
  newJson: string | undefined,
  t: (key: string) => string,
): { label: string; detail: string | null } {
  const parseJson = (s?: string) => {
    try {
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  };

  const old = parseJson(oldJson);
  const next = parseJson(newJson);

  const statusLabel = (s?: string | null): string => {
    if (!s) return "";
    const key = `onboarding.task.status.${s.toLowerCase()}`;
    const tr = t(key);
    return tr.startsWith("onboarding.task.status.") ? s : tr;
  };

  const approvalLabel = (s?: string | null): string | null => {
    if (!s || s === "NONE") return null;
    const key = `onboarding.task.approval.status.${s.toLowerCase()}`;
    const tr = t(key);
    return tr.startsWith("onboarding.task.approval.status.") ? s : tr;
  };

  switch (action) {
    case "STATUS_CHANGED": {
      const parts: string[] = [];
      if (old?.status !== next?.status) {
        parts.push(
          `${statusLabel(old?.status)} → ${statusLabel(next?.status)}`,
        );
      }
      if (old?.approvalStatus !== next?.approvalStatus) {
        const aLabel = approvalLabel(next?.approvalStatus);
        if (aLabel) parts.push(aLabel);
      }
      return {
        label:
          t("onboarding.task.activity.action.status_changed") ||
          "Status changed",
        detail: parts.join(" · ") || null,
      };
    }
    case "ASSIGNED": {
      const wasAssigned = !!old?.assignedUserId;
      const isAssigned = !!next?.assignedUserId;
      let detail: string | null = null;
      if (!wasAssigned && isAssigned)
        detail = `${statusLabel("TODO")} → ${statusLabel("ASSIGNED")}`;
      else if (wasAssigned && !isAssigned) detail = "Unassigned";
      else if (wasAssigned && isAssigned) detail = "Reassigned";
      return {
        label: t("onboarding.task.activity.action.assigned") || "Assigned",
        detail,
      };
    }
    default: {
      const label = action
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase());
      return { label, detail: null };
    }
  }
}

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
            {taskDetail.activityLogs.map((log) => {
              const { label, detail } = parseActivityChange(
                log.action,
                log.oldValue,
                log.newValue,
                t,
              );
              return (
                <div
                  key={log.logId}
                  className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-700">{label}</span>
                    {detail && (
                      <span className="ml-1 text-gray-500">{detail}</span>
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
              );
            })}
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
                  {c.authorName ?? t("onboarding.task.comments.unknown_author")}
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
  /** Pre-computed approve/reject permission (isHr || isLineManager). Falls back to canManage. */
  canApproveOrReject?: boolean;
  isAcknowledging: boolean;
  isUpdatingStatus: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isAddingComment: boolean;
  isAssigning: boolean;
  uploadingFile: boolean;
  assignableUsers: UserListItem[];
  // Schedule
  scheduleMode: null | "propose" | "reschedule";
  scheduleDates: [Dayjs | null, Dayjs | null];
  scheduleReason: string;
  cancelScheduleReason: string;
  noShowReason: string;
  isProposingSchedule: boolean;
  isConfirmingSchedule: boolean;
  isRescheduling: boolean;
  isCancellingSchedule: boolean;
  isMarkingNoShow: boolean;
  onScheduleModeChange: (mode: null | "propose" | "reschedule") => void;
  onScheduleDatesChange: (dates: [Dayjs | null, Dayjs | null]) => void;
  onScheduleReasonChange: (v: string) => void;
  onCancelScheduleReasonChange: (v: string) => void;
  onNoShowReasonChange: (v: string) => void;
  onProposeSchedule: () => void;
  onConfirmSchedule: () => void;
  onReschedule: () => void;
  onCancelSchedule: () => void;
  onMarkNoShow: () => void;
  // Actions
  onClose: () => void;
  onDrawerTabChange: (tab: string) => void;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
  onStart: () => void;
  onAcknowledge: () => void;
  onConfirmComplete: () => void;
  onSubmitApproval: () => void;
  onMarkDone: () => void;
  onApprove: () => void;
  onReject: () => void;
  onAssign: (userId: string) => void;
  onUploadAttachment: (file: File) => void;
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
  canApproveOrReject,
  isAcknowledging,
  isUpdatingStatus,
  isApproving,
  isRejecting,
  isAddingComment,
  isAssigning,
  uploadingFile,
  assignableUsers,
  scheduleMode,
  scheduleDates,
  scheduleReason,
  cancelScheduleReason,
  noShowReason,
  isProposingSchedule,
  isConfirmingSchedule,
  isRescheduling,
  isCancellingSchedule,
  isMarkingNoShow,
  onScheduleModeChange,
  onScheduleDatesChange,
  onScheduleReasonChange,
  onCancelScheduleReasonChange,
  onNoShowReasonChange,
  onProposeSchedule,
  onConfirmSchedule,
  onReschedule,
  onCancelSchedule,
  onMarkNoShow,
  onClose,
  onDrawerTabChange,
  onCommentChange,
  onAddComment,
  onStart,
  onAcknowledge,
  onConfirmComplete,
  onSubmitApproval,
  onMarkDone,
  onApprove,
  onReject,
  onAssign,
  onUploadAttachment,
  onNavigatePrev,
  onNavigateNext,
}: TaskDrawerProps) => {
  const { t } = useLocale();
  const taskIndex = selectedTaskId
    ? tasks.findIndex((tk) => tk.id === selectedTaskId)
    : -1;
  const hasPrev = taskIndex > 0;
  const hasNext = taskIndex >= 0 && taskIndex < tasks.length - 1;

  const attachmentCount = taskDetail?.attachments?.length ?? 0;

  const TABS = [
    {
      key: "info",
      label: t("onboarding.detail.task.tab.info") ?? "Chi tiết",
    },
    {
      key: "documents",
      label:
        attachmentCount > 0
          ? `${t("onboarding.task.tab.documents") ?? "Tài liệu"} (${attachmentCount})`
          : (t("onboarding.task.tab.documents") ?? "Tài liệu"),
    },
    {
      key: "activity",
      label: t("onboarding.detail.task.tab.activity") ?? "Hoạt động",
    },
    {
      key: "comments",
      label: t("onboarding.task.comments.title") ?? "Bình luận",
    },
  ];

  return (
    <Drawer
      open={open}
      width={680}
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
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onDrawerTabChange(tab.key)}
                className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-all ${
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
              canApproveOrReject={canApproveOrReject}
              assignableUsers={assignableUsers}
              isAcknowledging={isAcknowledging}
              isUpdating={isUpdatingStatus}
              isApproving={isApproving}
              isRejecting={isRejecting}
              isAssigning={isAssigning}
              scheduleMode={scheduleMode}
              scheduleDates={scheduleDates}
              scheduleReason={scheduleReason}
              cancelScheduleReason={cancelScheduleReason}
              noShowReason={noShowReason}
              isProposingSchedule={isProposingSchedule}
              isConfirmingSchedule={isConfirmingSchedule}
              isRescheduling={isRescheduling}
              isCancellingSchedule={isCancellingSchedule}
              isMarkingNoShow={isMarkingNoShow}
              onScheduleModeChange={onScheduleModeChange}
              onScheduleDatesChange={onScheduleDatesChange}
              onScheduleReasonChange={onScheduleReasonChange}
              onCancelScheduleReasonChange={onCancelScheduleReasonChange}
              onNoShowReasonChange={onNoShowReasonChange}
              onProposeSchedule={onProposeSchedule}
              onConfirmSchedule={onConfirmSchedule}
              onReschedule={onReschedule}
              onCancelSchedule={onCancelSchedule}
              onMarkNoShow={onMarkNoShow}
              onStart={onStart}
              onAcknowledge={onAcknowledge}
              onConfirmComplete={onConfirmComplete}
              onSubmitApproval={onSubmitApproval}
              onMarkDone={onMarkDone}
              onApprove={onApprove}
              onReject={onReject}
              onAssign={onAssign}
              onClose={onClose}
            />
          )}
          {drawerTab === "documents" && (
            <TaskDocumentsTab
              taskDetail={taskDetail}
              uploadingFile={uploadingFile}
              onUploadAttachment={onUploadAttachment}
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
