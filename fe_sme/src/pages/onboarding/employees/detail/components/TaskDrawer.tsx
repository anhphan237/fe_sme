import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import React from "react";
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
  Info,
  Maximize2,
  MessageSquare,
  Minimize2,
  Paperclip,
  Play,
  Send,
  ThumbsUp,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  Input,
  Modal,
  Progress,
  Row,
  Skeleton,
  Steps,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import type { Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
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
import { apiGetDocuments } from "@/api/document/document.api";
import type { DocumentItem } from "@/interface/document";
import { useUserNameMap } from "@/utils/resolvers/userResolver";
import { useUserStore } from "@/stores/user.store";
import { DepartmentCheckpointCard } from "./DepartmentCheckpointCard";

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
  const { resolveName } = useUserNameMap();
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

      <div className="rounded-lg border border-blue-100 bg-blue-50/30 overflow-hidden">
        {/* Header row — status */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-blue-100 bg-blue-50/60">
          <span className="text-xs font-medium text-gray-500">
            {t("onboarding.employee.home.task_detail.field_status")}
          </span>
          <Tag
            color={SCHEDULE_STATUS_COLOR[ss] ?? "default"}
            style={{ margin: 0 }}>
            {t(`onboarding.task.schedule.status.${ss}`)}
          </Tag>
        </div>

        <div className="p-3 space-y-3">
          {/* UNSCHEDULED — propose form */}
          {ss === "UNSCHEDULED" &&
            canPropose &&
            (scheduleMode === "propose" ? (
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
            ))}

          {/* PROPOSED — show times + actions */}
          {ss === "PROPOSED" && (
            <>
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
                {taskDetail.scheduleProposedBy && (
                  <Col span={24}>
                    <InfoField
                      label={t("onboarding.task.schedule.field.proposed_by")}>
                      {resolveName(taskDetail.scheduleProposedBy)}
                      {taskDetail.scheduleProposedAt &&
                        ` · ${formatDateTime(taskDetail.scheduleProposedAt)}`}
                    </InfoField>
                  </Col>
                )}
              </Row>

              <Divider style={{ margin: "4px 0" }} />

              <div className="space-y-2">
                {canManage && (
                  <Button
                    type="primary"
                    size="small"
                    block
                    loading={isConfirmingSchedule}
                    onClick={onConfirmSchedule}>
                    {t("onboarding.task.schedule.action.confirm")}
                  </Button>
                )}
                {isEmployee && !canManage && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                    {t("onboarding.task.schedule.pending_confirmation")}
                  </p>
                )}
                <div className="flex gap-1.5">
                  <Input
                    size="small"
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
                    disabled={!cancelScheduleReason.trim()}
                    loading={isCancellingSchedule}
                    onClick={onCancelSchedule}>
                    {t("onboarding.task.schedule.action.cancel")}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* CONFIRMED / RESCHEDULED — show times + actions */}
          {(ss === "CONFIRMED" || ss === "RESCHEDULED") && (
            <>
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
                {taskDetail.scheduleConfirmedBy && (
                  <Col span={24}>
                    <InfoField
                      label={t("onboarding.task.schedule.field.confirmed_by")}>
                      {resolveName(taskDetail.scheduleConfirmedBy)}
                      {taskDetail.scheduleConfirmedAt &&
                        ` · ${formatDateTime(taskDetail.scheduleConfirmedAt)}`}
                    </InfoField>
                  </Col>
                )}
                {ss === "RESCHEDULED" &&
                  taskDetail.scheduleRescheduleReason && (
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

              <Divider style={{ margin: "4px 0" }} />

              {scheduleMode === "reschedule" ? (
                <div className="space-y-2">
                  <DatePicker.RangePicker
                    showTime
                    style={{ width: "100%" }}
                    value={scheduleDates}
                    onChange={(vals) =>
                      onScheduleDatesChange(
                        vals
                          ? [vals[0] ?? null, vals[1] ?? null]
                          : [null, null],
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
                <div className="space-y-2">
                  <Button
                    size="small"
                    block
                    onClick={() => onScheduleModeChange("reschedule")}>
                    {t("onboarding.task.schedule.action.reschedule")}
                  </Button>
                  <div className="flex gap-1.5">
                    <Input
                      size="small"
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
                      disabled={!cancelScheduleReason.trim()}
                      loading={isCancellingSchedule}
                      onClick={onCancelSchedule}>
                      {t("onboarding.task.schedule.action.cancel")}
                    </Button>
                  </div>
                  {(isEmployee || canManage) && (
                    <div className="flex gap-1.5">
                      <Input
                        size="small"
                        value={noShowReason}
                        onChange={(e) => onNoShowReasonChange(e.target.value)}
                        placeholder={t(
                          "onboarding.task.schedule.field.no_show_reason",
                        )}
                      />
                      <Button
                        size="small"
                        disabled={!noShowReason.trim()}
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
            <InfoField
              label={t("onboarding.task.schedule.field.cancel_reason")}>
              {taskDetail.scheduleCancelReason}
            </InfoField>
          )}

          {/* MISSED */}
          {ss === "MISSED" && taskDetail.scheduleNoShowReason && (
            <InfoField
              label={t("onboarding.task.schedule.field.no_show_reason")}>
              {taskDetail.scheduleNoShowReason}
            </InfoField>
          )}
        </div>
      </div>
    </>
  );
};

// ── Info Tab ─────────────────────────────────────────────────────────────────

interface TaskInfoTabProps {
  taskDetail: TaskDetailResponse;
  isEmployee: boolean;
  canManage: boolean;
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
}

const TaskInfoTab = ({
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
}: TaskInfoTabProps) => {
  const { t } = useLocale();
  const { resolveName } = useUserNameMap();
  const status = taskDetail.status;

  return (
    <div className="space-y-4 pt-2">
      {/* Overdue warning */}
      {taskDetail.overdue && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {t("onboarding.task.stat.overdue")}
          {taskDetail.dueInHours != null &&
            ` — ${Math.abs(Math.round(taskDetail.dueInHours))}h`}
        </div>
      )}

      {/* Workflow steps */}
      {(() => {
        const hasIntermediateStep =
          taskDetail.requireAck || taskDetail.requiresManagerApproval;
        const stepsItems = [
          { title: t("onboarding.task.status.assigned") || "Tiếp nhận" },
          {
            title: t("onboarding.task.status.in_progress") || "Đang thực hiện",
          },
          ...(hasIntermediateStep
            ? [
                {
                  title: taskDetail.requireAck
                    ? t("onboarding.task.status.wait_ack") || "Chờ xác nhận"
                    : t("onboarding.task.status.pending_approval") ||
                      "Chờ phê duyệt",
                },
              ]
            : []),
          { title: t("onboarding.task.status.done") || "Hoàn thành" },
        ];
        const currentStep =
          status === "DONE"
            ? stepsItems.length - 1
            : status === "WAIT_ACK" || status === "PENDING_APPROVAL"
              ? 2
              : status === "IN_PROGRESS"
                ? 1
                : 0;
        return (
          <Steps
            current={currentStep}
            status={status === "DONE" ? "finish" : undefined}
            size="small"
            items={stepsItems}
            style={{ marginBottom: 4 }}
          />
        );
      })()}

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
                    resolveName(taskDetail.assignedUserId)}
                </span>
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
        {/* Reporter */}
        {(taskDetail.reporterUser?.fullName ||
          taskDetail.reporterUserName ||
          taskDetail.reporterUserId) && (
          <Col span={12}>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <InfoField label={t("onboarding.task.reporter") ?? "Người giao"}>
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                  {taskDetail.reporterUser?.fullName ??
                    taskDetail.reporterUserName ??
                    resolveName(taskDetail.reporterUserId)}
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
                    {resolveName(taskDetail.acknowledgedBy, "-")}
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
                      {resolveName(taskDetail.approvedBy)}
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
              <Alert
                type="error"
                showIcon
                className="mt-2"
                message={t("onboarding.task.rejection_reason_label")}
                description={taskDetail.rejectionReason}
              />
            )}
          </div>
        </>
      )}

      {/* Department checkpoints */}
      {taskDetail.departmentCheckpoints &&
        taskDetail.departmentCheckpoints.length > 0 && (
          <DepartmentCheckpointCard
            taskId={taskDetail.taskId}
            checkpoints={taskDetail.departmentCheckpoints}
          />
        )}
    </div>
  );
};

// ── Required Documents Tab ───────────────────────────────────────────────────

interface TaskRequiredDocsTabProps {
  taskDetail: TaskDetailResponse;
  isEmployee?: boolean;
  acknowledgedDocIds?: Set<string>;
  acknowledgingDocId?: string | null;
  onAcknowledgeDocument?: (documentId: string) => void;
  onAcknowledge?: () => void;
  isAcknowledging?: boolean;
  requireAck?: boolean;
  taskStatus?: string;
}

const TaskRequiredDocsTab = ({
  taskDetail,
  isEmployee,
  acknowledgedDocIds,
  acknowledgingDocId,
  onAcknowledgeDocument,
  onAcknowledge,
  isAcknowledging,
  requireAck,
  taskStatus,
}: TaskRequiredDocsTabProps) => {
  const { t } = useLocale();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);
  const requiredDocs = taskDetail.requiredDocuments ?? [];

  const { data: docsData } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiGetDocuments(),
    enabled: requiredDocs.length > 0,
  });
  const docById: Record<string, DocumentItem> = {};
  (docsData?.items ?? []).forEach((d) => {
    docById[d.documentId] = d;
  });

  const ackedCount = requiredDocs.filter((d) =>
    acknowledgedDocIds?.has(d.documentId),
  ).length;
  const allDocsRead =
    requiredDocs.length > 0 && ackedCount === requiredDocs.length;

  // Auto-select first unread doc when task changes
  useEffect(() => {
    if (requiredDocs.length > 0) {
      const firstUnread = requiredDocs.find(
        (d) => !acknowledgedDocIds?.has(d.documentId),
      );
      setSelectedDocId(firstUnread?.documentId ?? requiredDocs[0].documentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskDetail?.taskId]);

  if (requiredDocs.length === 0) {
    return (
      <div className="pt-2">
        <Empty
          description={
            t("onboarding.task.required_docs.empty") ?? "Không có tài liệu"
          }
          imageStyle={{ height: 40 }}
        />
      </div>
    );
  }

  const selectedDoc = requiredDocs.find((d) => d.documentId === selectedDocId);
  const selectedResolved = selectedDoc ? docById[selectedDoc.documentId] : null;
  const selectedFileUrl = selectedResolved?.fileUrl;
  const selectedIsAcked = selectedDocId
    ? (acknowledgedDocIds?.has(selectedDocId) ?? false)
    : false;
  const selectedExt = selectedFileUrl?.split(".").pop()?.toLowerCase();
  const isPdf =
    selectedExt === "pdf" ||
    selectedFileUrl?.toLowerCase().includes(".pdf") === true;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
      {/* Progress header – employee only */}
      {isEmployee && onAcknowledgeDocument && (
        <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
              <BookOpen className="h-3.5 w-3.5" />
              {t("onboarding.task.required_docs.section_title")}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                allDocsRead
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-blue-100 text-blue-600"
              }`}>
              {ackedCount}/{requiredDocs.length}
            </span>
          </div>
          <Progress
            percent={
              requiredDocs.length > 0
                ? Math.round((ackedCount / requiredDocs.length) * 100)
                : 0
            }
            size="small"
            status={allDocsRead ? "success" : "active"}
            strokeColor={allDocsRead ? "#10b981" : "#3b82f6"}
          />
          {allDocsRead ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("onboarding.task.doc.all_read_hint")}
              </div>
              {requireAck && taskStatus === "IN_PROGRESS" && onAcknowledge && (
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckSquare className="h-3.5 w-3.5" />}
                  loading={isAcknowledging}
                  onClick={onAcknowledge}
                  style={{ flexShrink: 0 }}>
                  {t("onboarding.task.doc.confirm_all_read") ??
                    "Xác nhận đã đọc tất cả"}
                </Button>
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-gray-400">
              {t("onboarding.task.doc.read_all_to_proceed")}
            </p>
          )}
        </div>
      )}

      {/* Two-panel library layout */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          overflow: "hidden",
        }}>
        {/* Left: document list */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #f0f0f0",
            overflow: "hidden",
            paddingRight: 12,
          }}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {t("onboarding.task.required_docs.list_title") ??
              "Danh sách tài liệu"}{" "}
            <span className="font-normal">({requiredDocs.length})</span>
          </p>
          <div style={{ flex: 1, overflowY: "auto" }} className="space-y-1">
            {requiredDocs.map((doc) => {
              const resolved = docById[doc.documentId];
              const isAcked = acknowledgedDocIds?.has(doc.documentId) ?? false;
              const isSelected = selectedDocId === doc.documentId;
              return (
                <button
                  key={doc.documentId}
                  className={`w-full rounded-lg border p-2.5 text-left transition-all ${
                    isSelected
                      ? "border-blue-200 bg-blue-50 shadow-sm"
                      : isAcked
                        ? "border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedDocId(doc.documentId)}>
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                        isAcked ? "bg-emerald-100" : "bg-blue-100"
                      }`}>
                      {isAcked ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium leading-snug ${
                          isSelected ? "text-blue-700" : "text-gray-800"
                        }`}>
                        {doc.title ?? resolved?.name ?? doc.documentId}
                      </p>
                      {resolved?.description && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-gray-400">
                          {resolved.description}
                        </p>
                      )}
                      {isAcked && (
                        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {t("onboarding.task.doc.acknowledged")}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: preview panel */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            paddingLeft: 16,
          }}>
          {selectedDoc ? (
            <>
              {/* Doc header + mark-read action */}
              <div className="mb-3 flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold leading-tight text-gray-800">
                    {selectedDoc.title ??
                      selectedResolved?.name ??
                      selectedDoc.documentId}
                  </h3>
                  {selectedResolved?.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                      {selectedResolved.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isPdf && selectedFileUrl && (
                    <Tooltip
                      title={
                        t("onboarding.task.doc.fullscreen") ??
                        "Xem toàn màn hình"
                      }>
                      <Button
                        size="small"
                        icon={<Maximize2 className="h-3.5 w-3.5" />}
                        onClick={() => setPdfFullscreen(true)}
                      />
                    </Tooltip>
                  )}
                  {isEmployee &&
                    onAcknowledgeDocument &&
                    (selectedIsAcked ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("onboarding.task.doc.acknowledged")}
                      </span>
                    ) : (
                      <Button
                        type="primary"
                        size="small"
                        loading={acknowledgingDocId === selectedDocId}
                        onClick={() =>
                          selectedDocId && onAcknowledgeDocument(selectedDocId)
                        }>
                        {t("onboarding.task.doc.mark_read")}
                      </Button>
                    ))}
                </div>
              </div>

              {/* Document viewer */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}>
                {!selectedFileUrl ? (
                  <div
                    className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400"
                    style={{ flex: 1 }}>
                    {t("onboarding.task.doc.no_preview") ??
                      "Không có tệp xem trước"}
                  </div>
                ) : isPdf ? (
                  <>
                    <iframe
                      key={selectedFileUrl}
                      src={selectedFileUrl}
                      title={
                        selectedDoc.title ??
                        selectedResolved?.name ??
                        selectedDoc.documentId
                      }
                      style={{
                        flex: 1,
                        width: "100%",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        display: "block",
                        minHeight: 480,
                      }}
                    />
                    <Modal
                      open={pdfFullscreen}
                      onCancel={() => setPdfFullscreen(false)}
                      footer={
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {selectedDoc.title ??
                              selectedResolved?.name ??
                              selectedDoc.documentId}
                          </span>
                          <Button onClick={() => setPdfFullscreen(false)}>
                            <Minimize2 className="mr-1.5 h-3.5 w-3.5 inline" />
                            {t("onboarding.task.doc.exit_fullscreen") ??
                              "Thu nhỏ"}
                          </Button>
                        </div>
                      }
                      width="95vw"
                      style={{ top: 16, maxWidth: 1600, padding: 0 }}
                      styles={{
                        body: {
                          padding: 0,
                          height: "calc(95vh - 110px)",
                          display: "flex",
                          flexDirection: "column",
                        },
                      }}
                      title={
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          {selectedDoc.title ??
                            selectedResolved?.name ??
                            selectedDoc.documentId}
                        </span>
                      }>
                      <iframe
                        src={selectedFileUrl}
                        title={
                          selectedDoc.title ??
                          selectedResolved?.name ??
                          selectedDoc.documentId
                        }
                        style={{
                          flex: 1,
                          width: "100%",
                          border: "none",
                          display: "block",
                          minHeight: 0,
                          height: "100%",
                        }}
                      />
                    </Modal>
                  </>
                ) : (
                  <a
                    href={selectedFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700 transition-colors hover:bg-blue-100">
                    <FileText className="h-8 w-8 shrink-0 text-blue-400" />
                    <div>
                      <p className="font-semibold">
                        {selectedDoc.title ??
                          selectedResolved?.name ??
                          selectedDoc.documentId}
                      </p>
                      <p className="mt-0.5 text-xs text-blue-500">
                        {t("onboarding.task.doc.click_to_download") ??
                          "Nhấn để tải xuống"}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            </>
          ) : (
            <div
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400"
              style={{ flex: 1 }}>
              {t("onboarding.task.doc.select_to_view") ??
                "Chọn tài liệu để xem"}
            </div>
          )}
        </div>
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

  return (
    <div className="space-y-4 pt-2">
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
  const { resolveName } = useUserNameMap();
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
          <Timeline
            items={taskDetail.activityLogs.map((log) => {
              const { label, detail } = parseActivityChange(
                log.action,
                log.oldValue,
                log.newValue,
                t,
              );
              const dotIcon =
                log.action === "STATUS_CHANGED" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                ) : log.action === "ASSIGNED" ? (
                  <UserIcon className="h-3.5 w-3.5 text-orange-500" />
                ) : (
                  <Activity className="h-3.5 w-3.5 text-gray-400" />
                );
              return {
                key: log.logId,
                dot: dotIcon,
                children: (
                  <div className="text-xs">
                    <span className="font-medium text-gray-700">{label}</span>
                    {detail && (
                      <span className="ml-1 text-gray-500">{detail}</span>
                    )}
                    {(log.actorName || log.actorUserId) && (
                      <span className="ml-1 text-gray-400">
                        · {log.actorName ?? resolveName(log.actorUserId)}
                      </span>
                    )}
                    <span className="ml-2 text-gray-400">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                ),
              };
            })}
          />
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

// ── Timeline Tab (merged allLogs) ─────────────────────────────────────────────

type TimelineFilter = "all" | "comments" | "history";

const TaskTimelineTab = ({
  taskDetail,
}: {
  taskDetail: TaskDetailResponse;
}) => {
  const { t } = useLocale();
  const { resolveName } = useUserNameMap();
  const [filter, setFilter] = useState<TimelineFilter>("all");

  const allLogs = taskDetail.allLogs ?? [];

  const filtered = allLogs.filter((item) => {
    if (filter === "comments") return item.type === "COMMENT";
    if (filter === "history") return item.type === "HISTORY";
    return true;
  });

  if (allLogs.length === 0) {
    return (
      <div className="space-y-4 pt-2">
        <Empty
          description={
            t("onboarding.task.activity.empty") ?? "Chưa có hoạt động"
          }
          imageStyle={{ height: 40 }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", "comments", "history"] as TimelineFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {t(`onboarding.task.timeline.filter.${f}`) ?? f}
          </button>
        ))}
      </div>

      <Timeline
        items={filtered.map((item, idx) => {
          if (item.type === "COMMENT") {
            return {
              key: item.commentId ?? `comment-${idx}`,
              dot: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />,
              children: (
                <div className="text-xs">
                  <span className="font-medium text-gray-700">
                    {item.createdByName ?? resolveName(item.createdBy)}
                  </span>
                  <span className="ml-1 text-gray-400">
                    {t("onboarding.comment.title") ?? "Bình luận"}
                  </span>
                  {item.parentCommentId && (
                    <span className="ml-1 rounded bg-gray-100 px-1 text-gray-400">
                      ↩ reply
                    </span>
                  )}
                  <p className="mt-0.5 text-gray-700">{item.content ?? ""}</p>
                  <span className="mt-0.5 block text-gray-400">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
              ),
            };
          }
          // HISTORY
          const { label, detail } = parseActivityChange(
            item.action ?? "",
            item.oldValue,
            item.newValue,
            t,
          );
          const dotIcon =
            item.action === "STATUS_CHANGED" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
            ) : item.action === "ASSIGNED" ? (
              <UserIcon className="h-3.5 w-3.5 text-orange-500" />
            ) : (
              <Activity className="h-3.5 w-3.5 text-gray-400" />
            );
          return {
            key: item.logId ?? `log-${idx}`,
            dot: dotIcon,
            children: (
              <div className="text-xs">
                <span className="font-medium text-gray-700">{label}</span>
                {detail && <span className="ml-1 text-gray-500">{detail}</span>}
                {(item.actorName || item.actorUserId) && (
                  <span className="ml-1 text-gray-400">
                    · {item.actorName ?? resolveName(item.actorUserId)}
                  </span>
                )}
                <span className="ml-2 text-gray-400">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            ),
          };
        })}
      />
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
  onAddComment: (parentCommentId?: string) => void;
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
  const currentUserId = useUserStore((s) => s.currentUser?.id);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string>("");

  const handleSend = () => {
    if (!commentInput.trim()) return;
    onAddComment(replyingToId ?? undefined);
    setReplyingToId(null);
    setReplyingToName("");
  };

  const handleReply = (commentId: string, displayName: string) => {
    setReplyingToId(commentId);
    setReplyingToName(displayName);
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyingToName("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 min-h-0">
        {commentsLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (comments?.length ?? 0) === 0 ? (
          <Empty
            description={t("onboarding.task.comments.empty")}
            imageStyle={{ height: 40 }}
          />
        ) : (
          <div className="space-y-3">
            {comments?.map((c) => {
              const isMine = (c.createdBy ?? c.authorId) === currentUserId;
              const displayName =
                c.createdByName ??
                c.authorName ??
                t("onboarding.task.comments.unknown_author");
              const isReply = Boolean(c.parentCommentId);
              return (
                <div
                  key={c.commentId}
                  className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""} ${isReply ? "ml-8" : ""}`}>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isMine
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                    {displayName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isReply && (
                      <p className="mb-0.5 text-[10px] text-gray-400">
                        ↩ {t("onboarding.comment.reply") ?? "Trả lời"}
                      </p>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        isMine
                          ? "ml-auto rounded-br-sm bg-blue-500"
                          : "rounded-bl-sm bg-gray-100"
                      }`}>
                      {!isMine && (
                        <p className="mb-0.5 text-xs font-semibold text-gray-600">
                          {displayName}
                        </p>
                      )}
                      <p
                        className={`text-sm ${
                          isMine ? "text-white" : "text-gray-700"
                        }`}>
                        {c.message ?? c.content ?? ""}
                      </p>
                      {c.createdAt && (
                        <p
                          className={`mt-0.5 text-[10px] ${
                            isMine ? "text-blue-100" : "text-gray-400"
                          }`}>
                          {formatDateTime(c.createdAt)}
                        </p>
                      )}
                    </div>
                    {!isMine && (
                      <button
                        onClick={() => handleReply(c.commentId, displayName)}
                        className="mt-0.5 ml-1 text-[10px] text-gray-400 hover:text-blue-500 transition-colors">
                        {t("onboarding.comment.reply") ?? "Trả lời"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Reply indicator */}
      {replyingToId && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 mb-1.5 text-xs text-blue-600">
          <span className="flex-1">
            ↩ {t("onboarding.comment.reply") ?? "Trả lời"}{" "}
            <span className="font-semibold">{replyingToName}</span>
          </span>
          <button
            onClick={handleCancelReply}
            className="text-gray-400 hover:text-gray-600">
            {t("onboarding.comment.cancel_reply") ?? "Hủy"}
          </button>
        </div>
      )}
      <div className="flex gap-2 border-t border-gray-100 pt-3 mt-2 shrink-0">
        <Input
          placeholder={
            replyingToId
              ? (t("onboarding.comment.reply.placeholder") ?? "Trả lời…")
              : t("onboarding.task.comments.placeholder")
          }
          value={commentInput}
          onChange={(e) => onCommentChange(e.target.value)}
          onPressEnter={handleSend}
          maxLength={500}
        />
        <Button
          type="primary"
          icon={<Send className="h-3.5 w-3.5" />}
          loading={isAddingComment}
          onClick={handleSend}
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
  acknowledgedDocIds?: Set<string>;
  acknowledgingDocId?: string | null;
  onAcknowledgeDocument?: (documentId: string) => void;
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
  onAddComment: (parentCommentId?: string) => void;
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
  isAssigning: _isAssigning,
  uploadingFile,
  assignableUsers: _assignableUsers,
  acknowledgedDocIds,
  acknowledgingDocId,
  onAcknowledgeDocument,
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
  onAssign: _onAssign,
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
  const requiredDocCount = taskDetail?.requiredDocuments?.length ?? 0;
  const ackedDocCount =
    requiredDocCount > 0
      ? (taskDetail?.requiredDocuments ?? []).filter((d) =>
          acknowledgedDocIds?.has(d.documentId),
        ).length
      : 0;

  const TABS: {
    key: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      key: "info",
      label: t("onboarding.detail.task.tab.info") ?? "Chi tiết",
      icon: <Info className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    ...(requiredDocCount > 0
      ? [
          {
            key: "required_docs",
            label: t("onboarding.task.tab.required_docs") ?? "Tài liệu",
            icon: <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />,
            badge: isEmployee
              ? `${ackedDocCount}/${requiredDocCount}`
              : `${requiredDocCount}`,
          },
        ]
      : []),
    {
      key: "documents",
      label: t("onboarding.task.tab.attachments") ?? "Đính kèm",
      icon: <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />,
      badge: attachmentCount > 0 ? `${attachmentCount}` : undefined,
    },
    {
      key: "activity",
      label: t("onboarding.detail.task.tab.activity") ?? "Hoạt động",
      icon: <Activity className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    ...(taskDetail?.allLogs && taskDetail.allLogs.length > 0
      ? [
          {
            key: "timeline",
            label: t("onboarding.task.timeline.title") ?? "Timeline",
            icon: <Activity className="h-3.5 w-3.5" aria-hidden="true" />,
          },
        ]
      : []),
    {
      key: "comments",
      label: t("onboarding.task.comments.title") ?? "Bình luận",
      icon: <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />,
    },
  ];

  return (
    <Drawer
      open={open}
      width={1440}
      styles={{
        body: {
          padding: 16,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="h-4 w-4 text-blue-500 shrink-0" />
          <Tooltip
            title={
              taskDetail
                ? String(taskDetail.title ?? t("onboarding.detail.task.title"))
                : undefined
            }
            placement="bottomLeft">
            <span className="flex-1 truncate min-w-0 cursor-default">
              {taskDetail
                ? String(taskDetail.title ?? t("onboarding.detail.task.title"))
                : t("onboarding.detail.task.title")}
            </span>
          </Tooltip>
          <div className="flex shrink-0 items-center gap-1">
            {taskDetail?.checklistName &&
              (() => {
                const info = getStageLabel(taskDetail.checklistName, t);
                return (
                  <Tag color={info.color} style={{ margin: 0, fontSize: 11 }}>
                    {info.label}
                  </Tag>
                );
              })()}
            <StatusBadge rawStatus={taskDetail?.status} />
          </div>
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
      }
      footer={
        taskDetail ? (
          <div className="flex items-center justify-between gap-2">
            {/* Primary/secondary actions — left side */}
            <div className="flex flex-wrap items-center gap-2">
              {isEmployee &&
                (taskDetail.status === "TODO" ||
                  taskDetail.status === "ASSIGNED") && (
                  <Button
                    icon={<Play className="h-3.5 w-3.5" />}
                    loading={isUpdatingStatus}
                    onClick={onStart}>
                    {t("onboarding.task.action.start")}
                  </Button>
                )}
              {isEmployee &&
                taskDetail.requireAck &&
                taskDetail.status === "IN_PROGRESS" && (
                  <Button
                    type="primary"
                    icon={<CheckSquare className="h-3.5 w-3.5" />}
                    loading={isAcknowledging}
                    onClick={onAcknowledge}>
                    {t("onboarding.task.action.acknowledge")}
                  </Button>
                )}
              {isEmployee && taskDetail.status === "WAIT_ACK" && (
                <Button
                  type="primary"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  loading={isUpdatingStatus}
                  onClick={onConfirmComplete}>
                  {t("onboarding.task.action.confirm_complete")}
                </Button>
              )}
              {isEmployee &&
                taskDetail.requiresManagerApproval &&
                taskDetail.status === "IN_PROGRESS" && (
                  <Button
                    type="primary"
                    icon={<Send className="h-3.5 w-3.5" />}
                    loading={isUpdatingStatus}
                    onClick={onSubmitApproval}>
                    {t("onboarding.task.action.submit_approval")}
                  </Button>
                )}
              {isEmployee &&
                !taskDetail.requireAck &&
                !taskDetail.requiresManagerApproval &&
                taskDetail.status === "IN_PROGRESS" && (
                  <Button
                    type="primary"
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    loading={isUpdatingStatus}
                    onClick={onMarkDone}>
                    {t("onboarding.employee.home.today_actions.mark_done")}
                  </Button>
                )}
              {(canApproveOrReject ?? canManage) &&
                taskDetail.status === "PENDING_APPROVAL" && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-1">
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
                  </div>
                )}
            </div>
            {/* Close — always right */}
            <Button className="shrink-0" onClick={onClose}>
              {t("global.close")}
            </Button>
          </div>
        ) : undefined
      }>
      {taskDetailLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : taskDetail ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}>
          {/* Tab navigation */}
          <div
            className="mb-3 flex gap-1 rounded-xl bg-gray-100 p-1"
            style={{ flexShrink: 0 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                aria-label={tab.label}
                aria-selected={drawerTab === tab.key}
                onClick={() => onDrawerTabChange(tab.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  drawerTab === tab.key
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:bg-white/70 hover:text-gray-700"
                }`}>
                {tab.icon}
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      drawerTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              ...(drawerTab === "required_docs"
                ? {
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }
                : { overflowY: "auto", overflowX: "hidden" }),
            }}>
            {drawerTab === "info" && (
              <TaskInfoTab
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
            )}
            {drawerTab === "required_docs" && (
              <TaskRequiredDocsTab
                taskDetail={taskDetail}
                isEmployee={isEmployee}
                acknowledgedDocIds={acknowledgedDocIds}
                acknowledgingDocId={acknowledgingDocId}
                onAcknowledgeDocument={onAcknowledgeDocument}
                onAcknowledge={onAcknowledge}
                isAcknowledging={isAcknowledging}
                requireAck={taskDetail.requireAck}
                taskStatus={taskDetail.status}
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
            {drawerTab === "timeline" && (
              <TaskTimelineTab taskDetail={taskDetail} />
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
        </div>
      ) : (
        <Empty description={t("onboarding.task.detail.not_found")} />
      )}
    </Drawer>
  );
};

// Re-export constant for use in index.tsx
export { STATUS_DONE_API };
