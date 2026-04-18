import { Button, Tag, Tooltip } from "antd";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  Eye,
  Loader2,
  Send,
  ThumbsUp,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { useLocale } from "@/i18n";
import {
  SCHEDULE_STATUS_COLOR,
  STATUS_TAG_COLOR,
  STATUS_DONE,
} from "../constants";
import { isTaskOverdue } from "../helpers";
import type { OnboardingTask } from "@/shared/types";

export interface TaskItemProps {
  task: OnboardingTask;
  canManage: boolean;
  isUpdating: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  onToggle: (task: OnboardingTask) => void;
  onOpenDrawer: (task: OnboardingTask) => void;
  onApprove: (task: OnboardingTask) => void;
  onReject: (task: OnboardingTask) => void;
}

const getStatusIcon = (rawStatus: string) => {
  const base = "h-5 w-5 shrink-0";
  switch (rawStatus) {
    case "DONE":
      return <CheckCircle2 className={`${base} text-emerald-500`} />;
    case "IN_PROGRESS":
      return <Loader2 className={`${base} animate-spin text-blue-500`} />;
    case "PENDING_APPROVAL":
      return <Send className={`${base} text-amber-500`} />;
    case "WAIT_ACK":
      return <CheckSquare className={`${base} text-orange-500`} />;
    default:
      return <Circle className={`${base} text-gray-300`} />;
  }
};

export const TaskItem = ({
  task,
  canManage,
  isUpdating,
  isApproving,
  isRejecting,
  onToggle,
  onOpenDrawer,
  onApprove,
  onReject,
}: TaskItemProps) => {
  const { t } = useLocale();
  const isDone = task.status === STATUS_DONE;
  const rawStatus = task.rawStatus ?? "";
  // Use the API-provided overdue flag first, fall back to local date calc
  const overdue = (task.overdue ?? isTaskOverdue(task.dueDate)) && !isDone;
  const ss = task.scheduleStatus;
  const hasSchedule = ss && ss !== "UNSCHEDULED";

  const rowBg = isDone
    ? "border-emerald-100 bg-emerald-50/30"
    : overdue
      ? "border-red-100 bg-red-50/20"
      : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm";

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${rowBg}`}>
      {/* Status icon — acts as toggle */}
      <button
        className="mt-0.5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
        onClick={() => onToggle(task)}
        disabled={isUpdating}
        aria-label={isDone ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}>
        {getStatusIcon(rawStatus)}
      </button>

      {/* Task title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-sm font-medium leading-snug ${isDone ? "text-gray-400 line-through" : "text-gray-800"}`}>
            {task.title}
          </span>
          {overdue && (
            <span className="flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
              <AlertTriangle className="h-2.5 w-2.5" />
              {t("onboarding.task.stat.overdue")}
            </span>
          )}
          {task.required && (
            <span className="rounded bg-red-50 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
              {t("onboarding.task.required") ?? "Bắt buộc"}
            </span>
          )}
        </div>

        {/* Metadata row */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {task.dueDate && (
            <span
              className={`flex items-center gap-0.5 text-xs ${overdue ? "font-medium text-red-500" : "text-gray-400"}`}>
              {overdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {task.dueDate}
            </span>
          )}
          {task.assignedUserName && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <UserIcon className="h-3 w-3" />
              {task.assignedUserName}
            </span>
          )}
          {hasSchedule && (
            <Tooltip
              title={`${t("onboarding.task.schedule.section_title")}: ${ss}`}>
              <span className="flex items-center gap-0.5 text-xs">
                <Calendar className="h-3 w-3" />
                <Tag
                  color={SCHEDULE_STATUS_COLOR[ss!] ?? "default"}
                  style={{
                    margin: 0,
                    fontSize: 10,
                    lineHeight: "16px",
                    padding: "0 4px",
                  }}>
                  {t(`onboarding.task.schedule.status.${ss}`)}
                </Tag>
              </span>
            </Tooltip>
          )}
          {task.requireAck && (
            <Tooltip
              title={t("onboarding.task.flag.require_ack") ?? "Cần xác nhận"}>
              <span className="cursor-help rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">
                ACK
              </span>
            </Tooltip>
          )}
          {task.requiresManagerApproval && (
            <Tooltip
              title={
                t("onboarding.task.flag.require_approval") ?? "Cần phê duyệt"
              }>
              <span className="cursor-help rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
                APPROVAL
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Right: status badge + action buttons */}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        <Tag
          color={STATUS_TAG_COLOR[rawStatus] ?? "default"}
          style={{ margin: 0, fontSize: 11 }}>
          {task.status ?? t("onboarding.detail.task.status.pending")}
        </Tag>

        {canManage && rawStatus === "PENDING_APPROVAL" && (
          <>
            <Button
              size="small"
              type="primary"
              icon={<ThumbsUp className="h-3 w-3" />}
              loading={isApproving}
              onClick={() => onApprove(task)}>
              {t("onboarding.task.action.approve")}
            </Button>
            <Button
              size="small"
              danger
              icon={<XCircle className="h-3 w-3" />}
              loading={isRejecting}
              onClick={() => onReject(task)}>
              {t("onboarding.task.action.reject")}
            </Button>
          </>
        )}

        <Button
          size="small"
          icon={<Eye className="h-3 w-3" />}
          onClick={() => onOpenDrawer(task)}
          className="opacity-60 transition-opacity group-hover:opacity-100">
          {t("onboarding.detail.task.detail")}
        </Button>
      </div>
    </div>
  );
};
