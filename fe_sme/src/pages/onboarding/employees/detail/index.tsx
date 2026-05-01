import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  Modal,
  Progress,
  Skeleton,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  FileText,
  HourglassIcon,
  Loader2,
  MapPin,
  PlayCircle,
  Send,
  ShieldCheck,
  User2,
  Users2,
  XCircle,
} from "lucide-react";
import BaseModal from "@core/components/Modal/BaseModal";
import { notify } from "@/utils/notify";
import { isOnboardingEmployee, canManageOnboarding } from "@/shared/rbac";
import { useUserStore } from "@/stores/user.store";
import { useGlobalStore } from "@/stores/global.store";
import { useLocale } from "@/i18n";
import {
  apiGetInstance,
  apiGetTemplate,
  apiActivateInstance,
  apiCancelInstance,
  apiCompleteInstance,
  apiListTasks,
  apiGetTaskTimeline,
  apiUpdateTaskStatus,
  apiGetTaskDetailFull,
  apiListTaskComments,
  apiAcknowledgeTask,
  apiApproveTask,
  apiRejectTask,
  apiAddTaskComment,
  apiAssignTask,
  apiAddTaskAttachment,
  apiProposeTaskSchedule,
  apiConfirmTaskSchedule,
  apiRescheduleTask,
  apiCancelTaskSchedule,
  apiMarkTaskNoShow,
} from "@/api/onboarding/onboarding.api";
import { apiGetUserById, apiSearchUsers } from "@/api/identity/identity.api";
import { apiUploadDocumentFile } from "@/api/document/document.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask, mapTemplate } from "@/utils/mappers/onboarding";
import { mapUserDetail } from "@/utils/mappers/identity";
import type { GetUserResponse, UserListItem } from "@/interface/identity";
import type {
  CommentResponse,
  TaskDetailResponse,
  TaskScheduleProposeRequest,
  TaskScheduleRescheduleRequest,
  TaskAttachmentAddRequest,
} from "@/interface/onboarding";
import type { Dayjs } from "dayjs";
import { TaskListPanel } from "./components/TaskListPanel";
import { TaskDrawer } from "./components/TaskDrawer";
import { STATUS_DONE, STATUS_DONE_API, STATUS_TAG_COLOR } from "./constants";
import { formatDate } from "./helpers";
import type { OnboardingTask } from "@/shared/types";
import { AppLoading } from "@/components/page-loading";

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  ) {
    const msg = (err as { message: string }).message.trim();
    if (msg) return msg;
  }
  return fallback;
};

const normalizeRequiredDocuments = (
  detail: Record<string, unknown>,
  fallbackTask?: OnboardingTask,
): Array<{ documentId: string; title?: string }> => {
  const source =
    detail.requiredDocuments ??
    detail.requiredDocumentIds ??
    detail.requiredDocs ??
    fallbackTask?.requiredDocumentIds ??
    [];

  const list = Array.isArray(source) ? source : [];
  return list
    .map((item) => {
      if (typeof item === "string") {
        const id = item.trim();
        return id ? { documentId: id } : null;
      }

      if (item && typeof item === "object") {
        const raw = item as Record<string, unknown>;
        const documentId = String(
          raw.documentId ?? raw.id ?? raw.document_id ?? "",
        ).trim();
        if (!documentId) return null;

        const title =
          typeof raw.title === "string" && raw.title.trim()
            ? raw.title.trim()
            : typeof raw.name === "string" && raw.name.trim()
              ? raw.name.trim()
              : undefined;

        return { documentId, title };
      }

      return null;
    })
    .filter((doc): doc is { documentId: string; title?: string } =>
      Boolean(doc?.documentId),
    );
};

type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

type TimelineTask = {
  taskId: string;
  title: string;
  status?: string;
  dueDate?: string;
  checklistName?: string;
  scheduleStatus?: string;
  overdue?: boolean;
};

type AssigneeTimeline = {
  assigneeUserId: string | null;
  assigneeUserName: string;
  taskCount: number;
  doneCount: number;
  overdueCount: number;
  tasks: TimelineTask[];
};

const unwrapObject = (res: unknown): Record<string, unknown> => {
  if (!res || typeof res !== "object") return {};
  const obj = res as Record<string, unknown>;
  const candidate =
    obj.data ?? obj.result ?? obj.payload ?? obj.item ?? obj.timeline ?? res;
  return candidate && typeof candidate === "object"
    ? (candidate as Record<string, unknown>)
    : {};
};

const getInitials = (name?: string | null): string => {
  const clean = (name ?? "").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getTaskStatusLabel = (status: string | undefined, t: TranslateFn) => {
  const raw = (status || "TODO").toUpperCase();
  const key = `onboarding.task.status.${raw.toLowerCase()}`;
  const label = t(key);
  return label === key
    ? t("onboarding.task.status.unknown", { status: raw.replace(/_/g, " ") })
    : label;
};

const toTimelineTask = (raw: unknown): TimelineTask | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const taskId = String(item.taskId ?? item.id ?? "").trim();
  if (!taskId) return null;
  return {
    taskId,
    title: String(item.title ?? item.name ?? ""),
    status:
      typeof item.status === "string" ? item.status.toUpperCase() : undefined,
    dueDate:
      typeof item.dueDate === "string"
        ? item.dueDate
        : item.dueDate
          ? String(item.dueDate)
          : undefined,
    checklistName:
      typeof item.checklistName === "string" ? item.checklistName : undefined,
    scheduleStatus:
      typeof item.scheduleStatus === "string" ? item.scheduleStatus : undefined,
    overdue: Boolean(item.overdue),
  };
};

const mapTimelineResponse = (res: unknown): AssigneeTimeline[] => {
  const data = unwrapObject(res);
  const assignees = Array.isArray(data.assignees) ? data.assignees : [];
  return assignees.map((entry) => {
    const row =
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>)
        : {};
    const taskItems = (Array.isArray(row.tasks) ? row.tasks : [])
      .map(toTimelineTask)
      .filter((task): task is TimelineTask => Boolean(task));
    const assigneeUserId =
      typeof row.assigneeUserId === "string" && row.assigneeUserId.trim()
        ? row.assigneeUserId
        : null;
    const assigneeUserName =
      typeof row.assigneeUserName === "string" && row.assigneeUserName.trim()
        ? row.assigneeUserName
        : "";
    return {
      assigneeUserId,
      assigneeUserName,
      taskCount:
        typeof row.taskCount === "number" ? row.taskCount : taskItems.length,
      doneCount: taskItems.filter((task) => task.status === "DONE").length,
      overdueCount: taskItems.filter(
        (task) => task.overdue && task.status !== "DONE",
      ).length,
      tasks: taskItems,
    };
  });
};

const buildFallbackAssigneeTimeline = (
  tasks: OnboardingTask[],
): AssigneeTimeline[] => {
  const groups = new Map<string, AssigneeTimeline>();
  tasks.forEach((task) => {
    const key = task.assignedUserId || "__unassigned__";
    const current =
      groups.get(key) ??
      ({
        assigneeUserId: task.assignedUserId ?? null,
        assigneeUserName: task.assignedUserName || "",
        taskCount: 0,
        doneCount: 0,
        overdueCount: 0,
        tasks: [],
      } satisfies AssigneeTimeline);
    const status = task.rawStatus ?? "TODO";
    current.taskCount += 1;
    if (status === "DONE") current.doneCount += 1;
    if (task.overdue && status !== "DONE") current.overdueCount += 1;
    current.tasks.push({
      taskId: task.id,
      title: task.title,
      status,
      dueDate: task.dueDate,
      checklistName: task.checklistName,
      scheduleStatus: task.scheduleStatus,
      overdue: task.overdue,
    });
    groups.set(key, current);
  });
  return Array.from(groups.values()).sort((a, b) => b.taskCount - a.taskCount);
};

const ProfileField = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: ReactNode;
  icon: ReactNode;
}) => (
  <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3">
    <div className="mt-0.5 text-slate-400">{icon}</div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-1 truncate text-sm font-medium text-slate-900">
        {value || "—"}
      </div>
    </div>
  </div>
);

const EmployeeProfilePanel = ({
  employeeDetail,
  managerDisplayName,
  t,
}: {
  employeeDetail?: {
    phone?: string | null;
    employeeCode?: string | null;
    jobTitle?: string | null;
    startDate?: string | null;
    workLocation?: string | null;
  };
  managerDisplayName: string;
  t: TranslateFn;
}) => (
  <Card className="h-full">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-slate-950">
          {t("onboarding.detail.profile.title")}
        </h2>
        <p className="mt-1 truncate text-sm text-slate-500">
          {t("onboarding.detail.profile.subtitle")}
        </p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <User2 className="h-5 w-5" />
      </div>
    </div>
    <Divider className="my-4" />
    <div className="grid gap-3">
      <ProfileField
        label={t("employee.code")}
        value={employeeDetail?.employeeCode}
        icon={<FileText className="h-4 w-4" />}
      />
      <ProfileField
        label={t("onboarding.detail.info.employee_title")}
        value={employeeDetail?.jobTitle}
        icon={<Briefcase className="h-4 w-4" />}
      />
      <ProfileField
        label={t("onboarding.detail.info.manager")}
        value={managerDisplayName}
        icon={<User2 className="h-4 w-4" />}
      />
      <ProfileField
        label={t("onboarding.detail.info.start_date")}
        value={formatDate(employeeDetail?.startDate)}
        icon={<CalendarDays className="h-4 w-4" />}
      />
      <ProfileField
        label={t("onboarding.detail.info.work_location")}
        value={employeeDetail?.workLocation}
        icon={<MapPin className="h-4 w-4" />}
      />
      <ProfileField
        label={t("employee.mobile_phone")}
        value={employeeDetail?.phone}
        icon={<Users2 className="h-4 w-4" />}
      />
    </div>
  </Card>
);

const CompactTaskRow = ({
  task,
  t,
  onOpen,
}: {
  task: OnboardingTask | TimelineTask;
  t: TranslateFn;
  onOpen: (taskId: string) => void;
}) => {
  const taskId = "id" in task ? task.id : task.taskId;
  const status = "rawStatus" in task ? task.rawStatus : task.status;
  const rawStatus = (status ?? "TODO").toUpperCase();
  const isDone = rawStatus === "DONE";
  const overdue = Boolean(task.overdue) && !isDone;

  return (
    <button
      type="button"
      onClick={() => onOpen(taskId)}
      className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50/40">
      <span
        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
          isDone
            ? "bg-emerald-500"
            : overdue
              ? "bg-red-500"
              : rawStatus === "PENDING_APPROVAL"
                ? "bg-amber-500"
                : "bg-blue-500"
        }`}
      />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-sm font-medium text-slate-900">
          {task.title || t("onboarding.detail.task.untitled")}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{getTaskStatusLabel(rawStatus, t)}</span>
          {task.dueDate && <span>{formatDate(task.dueDate)}</span>}
          {overdue && (
            <span className="font-semibold text-red-600">
              {t("onboarding.detail.action_queue.overdue")}
            </span>
          )}
        </span>
      </span>
    </button>
  );
};

const ActionQueuePanel = ({
  overdueTasks,
  pendingApprovalTasks,
  scheduleIssueTasks,
  nextDueTask,
  t,
  onOpenTask,
}: {
  overdueTasks: OnboardingTask[];
  pendingApprovalTasks: OnboardingTask[];
  scheduleIssueTasks: OnboardingTask[];
  nextDueTask?: OnboardingTask;
  t: TranslateFn;
  onOpenTask: (taskId: string) => void;
}) => {
  const visiblePendingApprovalTasks = pendingApprovalTasks.filter(
    (task) =>
      !overdueTasks.some((overdueTask) => overdueTask.id === task.id),
  );
  const visibleScheduleIssueTasks = scheduleIssueTasks.filter(
    (task) =>
      !overdueTasks.some((overdueTask) => overdueTask.id === task.id) &&
      !visiblePendingApprovalTasks.some(
        (approvalTask) => approvalTask.id === task.id,
      ),
  );
  const hasActions =
    overdueTasks.length > 0 ||
    visiblePendingApprovalTasks.length > 0 ||
    visibleScheduleIssueTasks.length > 0 ||
    nextDueTask;

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {t("onboarding.detail.action_queue.title")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("onboarding.detail.action_queue.subtitle")}
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
      </div>

      {!hasActions ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-700">
          {t("onboarding.detail.action_queue.empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {overdueTasks.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-red-600">
                <span>{t("onboarding.detail.action_queue.overdue")}</span>
                <span>{overdueTasks.length}</span>
              </div>
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map((task) => (
                  <CompactTaskRow
                    key={task.id}
                    task={task}
                    t={t}
                    onOpen={onOpenTask}
                  />
                ))}
              </div>
            </section>
          )}

          {visiblePendingApprovalTasks.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-amber-600">
                <span>{t("onboarding.detail.action_queue.pending_approval")}</span>
                <span>{visiblePendingApprovalTasks.length}</span>
              </div>
              <div className="space-y-2">
                {visiblePendingApprovalTasks.slice(0, 3).map((task) => (
                  <CompactTaskRow
                    key={task.id}
                    task={task}
                    t={t}
                    onOpen={onOpenTask}
                  />
                ))}
              </div>
            </section>
          )}

          {visibleScheduleIssueTasks.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-orange-600">
                <span>{t("onboarding.detail.action_queue.schedule_issue")}</span>
                <span>{visibleScheduleIssueTasks.length}</span>
              </div>
              <div className="space-y-2">
                {visibleScheduleIssueTasks.slice(0, 3).map((task) => (
                  <CompactTaskRow
                    key={task.id}
                    task={task}
                    t={t}
                    onOpen={onOpenTask}
                  />
                ))}
              </div>
            </section>
          )}

          {nextDueTask && (
            <section>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                {t("onboarding.detail.action_queue.next_due")}
              </div>
              <CompactTaskRow task={nextDueTask} t={t} onOpen={onOpenTask} />
            </section>
          )}
        </div>
      )}
    </Card>
  );
};

const AssigneeTimelinePanel = ({
  assignees,
  isLoading,
  t,
}: {
  assignees: AssigneeTimeline[];
  isLoading: boolean;
  t: TranslateFn;
}) => (
  <Card className="h-full">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-950">
          {t("onboarding.detail.assignee.title")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {t("onboarding.detail.assignee.subtitle")}
        </p>
      </div>
      <Users2 className="h-5 w-5 shrink-0 text-blue-600" />
    </div>

    {isLoading ? (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <Skeleton.Input key={item} active block style={{ height: 72 }} />
        ))}
      </div>
    ) : assignees.length === 0 ? (
      <Empty
        description={t("onboarding.detail.assignee.empty")}
        imageStyle={{ height: 48 }}
      />
    ) : (
      <div className="space-y-3">
        {assignees.map((assignee) => {
          const assigneeName =
            assignee.assigneeUserName ||
            t("onboarding.detail.assignee.unassigned");
          const percent =
            assignee.taskCount > 0
              ? Math.round((assignee.doneCount / assignee.taskCount) * 100)
              : 0;
          return (
            <div
              key={assignee.assigneeUserId ?? assigneeName}
              className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <Avatar className="bg-slate-100 font-semibold text-slate-700">
                  {getInitials(assigneeName)}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {assigneeName}
                    </p>
                    <span className="text-xs text-slate-500">
                      {assignee.doneCount}/{assignee.taskCount}
                    </span>
                  </div>
                  <Progress
                    className="mt-2"
                    percent={percent}
                    size="small"
                    showInfo={false}
                    strokeColor={percent === 100 ? "#10b981" : "#2563eb"}
                  />
                </div>
              </div>

              {assignee.overdueCount > 0 && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  {t("onboarding.detail.assignee.overdue_count", {
                    count: assignee.overdueCount,
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </Card>
);

// ── Activity Feed ─────────────────────────────────────────────────────────────

const ACTIVITY_STATUS_ICON: Record<string, ReactNode> = {
  DONE: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  IN_PROGRESS: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  PENDING_APPROVAL: <HourglassIcon className="h-4 w-4 text-amber-500" />,
  WAIT_ACK: <CheckSquare className="h-4 w-4 text-orange-500" />,
  ASSIGNED: <Send className="h-4 w-4 text-indigo-400" />,
};

const ActivityFeed = ({
  tasks,
  t,
}: {
  tasks: OnboardingTask[];
  t: (key: string, params?: Record<string, unknown>) => string;
}) => {
  // Group by checklistName / stage
  const groups = useMemo(() => {
    const map = new Map<string, OnboardingTask[]>();
    for (const task of tasks) {
      const key = task.checklistName ?? "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return Array.from(map.entries());
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-muted">
          {t("onboarding.detail.activity.empty")}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-5 text-base font-semibold text-gray-800">
        {t("onboarding.detail.activity.title")}
      </h3>
      <div className="space-y-6">
        {groups.map(([group, groupTasks]) => {
          const doneCount = groupTasks.filter(
            (tk) => tk.rawStatus === "DONE",
          ).length;
          return (
            <div key={group}>
              {/* Stage header */}
              <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {group}
                </span>
                <span className="ml-auto rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                  {doneCount}/{groupTasks.length}
                </span>
              </div>

              {/* Tasks in stage */}
              <div className="space-y-2 pl-1">
                {groupTasks.map((task, idx) => {
                  const raw = task.rawStatus ?? "TODO";
                  const isDone = raw === "DONE";
                  const icon = ACTIVITY_STATUS_ICON[raw] ?? (
                    <Circle className="h-4 w-4 text-gray-300" />
                  );
                  const isLast = idx === groupTasks.length - 1;

                  return (
                    <div key={task.id} className="flex gap-3">
                      {/* Connector + icon */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                            isDone
                              ? "border-emerald-200 bg-emerald-50"
                              : raw === "IN_PROGRESS"
                                ? "border-blue-200 bg-blue-50"
                                : raw === "PENDING_APPROVAL" ||
                                    raw === "WAIT_ACK"
                                  ? "border-amber-200 bg-amber-50"
                                  : "border-gray-100 bg-gray-50"
                          }`}>
                          {icon}
                        </div>
                        {!isLast && (
                          <div
                            className={`mt-0.5 w-0.5 flex-1 min-h-[1rem] ${
                              isDone ? "bg-emerald-100" : "bg-gray-100"
                            }`}
                          />
                        )}
                      </div>

                      {/* Task content */}
                      <div className="mb-1 flex min-w-0 flex-1 items-start justify-between gap-2 pb-1">
                        <div className="min-w-0">
                          <span
                            className={`text-sm leading-snug ${
                              isDone
                                ? "font-normal text-gray-400 line-through"
                                : "font-medium text-gray-800"
                            }`}>
                            {task.title || t("onboarding.detail.task.untitled")}
                          </span>
                          {task.dueDate && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              {task.dueDate}
                            </p>
                          )}
                        </div>
                        <Tag
                          color={STATUS_TAG_COLOR[raw] ?? "default"}
                          style={{ margin: 0, fontSize: 11, flexShrink: 0 }}>
                          {t(`onboarding.task.status.${raw.toLowerCase()}`)}
                        </Tag>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const EmployeeDetail = () => {
  const { employeeId: instanceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currentUser = useUserStore((state) => state.currentUser);
  const setBreadcrumbs = useGlobalStore((state) => state.setBreadcrumbs);
  const isEmployee = isOnboardingEmployee(currentUser?.roles ?? []);
  const canManage = canManageOnboarding(currentUser?.roles ?? []);
  const userId = currentUser?.id ?? "";
  const isHr = (currentUser?.roles ?? []).includes("HR");

  // ── Local state ─────────────────────────────────────────────────────────────

  const [tab, setTab] = useState("checklist");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState("info");
  const [commentInput, setCommentInput] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    "cancel" | "complete" | null
  >(null);

  // Schedule state
  const [scheduleMode, setScheduleMode] = useState<
    null | "propose" | "reschedule"
  >(null);
  const [scheduleDates, setScheduleDates] = useState<
    [Dayjs | null, Dayjs | null]
  >([null, null]);
  const [scheduleReason, setScheduleReason] = useState("");
  const [cancelScheduleReason, setCancelScheduleReason] = useState("");
  const [noShowReason, setNoShowReason] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const {
    data: instance,
    isLoading: instanceLoading,
    isError: instanceError,
    isFetching: instanceFetching,
    refetch: refetchInstance,
  } = useQuery({
    queryKey: ["instance", instanceId],
    queryFn: () => apiGetInstance(instanceId!),
    enabled: Boolean(instanceId),
    refetchOnMount: "always",
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const raw = r?.instance ?? r?.data ?? r?.result ?? r?.payload ?? res;
      return mapInstance(
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
      );
    },
  });

  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isFetching: tasksFetching,
  } = useQuery({
    queryKey: [
      "onboarding-tasks-by-instance",
      instance?.id ?? instanceId ?? "",
    ],
    // Use the BE instance-scoped endpoint so HR/manager/employee see the full onboarding scope.
    enabled: Boolean(instance?.id),
    refetchOnMount: "always",
    queryFn: () =>
      apiListTasks(instance!.id, {
        size: 100,
        sortBy: "due_date",
        sortOrder: "ASC",
      }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "tasks",
        "content",
        "items",
        "list",
      ).map(mapTask) as OnboardingTask[],
  });

  const { data: timelineAssignees = [], isFetching: timelineFetching } =
    useQuery({
      queryKey: ["onboarding-task-timeline", instance?.id ?? ""],
      queryFn: () =>
        apiGetTaskTimeline({ onboardingId: instance!.id, includeDone: true }),
      enabled: Boolean(instance?.id),
      refetchOnMount: "always",
      select: mapTimelineResponse,
    });

  const { data: templateDetail } = useQuery({
    queryKey: ["template-detail", instance?.templateId ?? ""],
    queryFn: () => apiGetTemplate(instance!.templateId),
    enabled: Boolean(instance?.templateId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const raw = r?.template ?? r?.data ?? r?.result ?? r?.payload ?? res;
      return mapTemplate(
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
      );
    },
  });

  const { data: employeeDetail } = useQuery({
    queryKey: ["user-detail", instance?.employeeUserId ?? ""],
    queryFn: () => apiGetUserById(instance!.employeeUserId as string),
    enabled: Boolean(instance?.employeeUserId),
    select: (res: unknown) => mapUserDetail(res as GetUserResponse),
  });

  const { data: managerDetail } = useQuery({
    queryKey: ["user-detail", instance?.managerUserId ?? ""],
    queryFn: () => apiGetUserById(instance!.managerUserId as string),
    enabled: Boolean(instance?.managerUserId),
    select: (res: unknown) => mapUserDetail(res as GetUserResponse),
  });

  const { data: taskDetail, isLoading: taskDetailLoading } = useQuery({
    queryKey: ["onboarding-task-detail", selectedTaskId ?? ""],
    queryFn: () =>
      apiGetTaskDetailFull(selectedTaskId!, {
        includeActivityLogs: true,
        includeComments: false,
      }),
    enabled: Boolean(selectedTaskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const rawCandidate =
        r?.task ?? r?.data ?? r?.result ?? r?.payload ?? r?.item ?? res;
      const detail =
        rawCandidate && typeof rawCandidate === "object"
          ? (rawCandidate as Record<string, unknown>)
          : {};

      const selectedTask = tasks.find((tk) => tk.id === selectedTaskId);
      const requiredDocuments = normalizeRequiredDocuments(
        detail,
        selectedTask,
      );

      return {
        ...(detail as unknown as TaskDetailResponse),
        requiredDocuments,
      } as TaskDetailResponse;
    },
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["onboarding-task-comments", selectedTaskId ?? ""],
    queryFn: () => apiListTaskComments(selectedTaskId!),
    enabled: Boolean(selectedTaskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const list = r?.comments ?? r?.data ?? [];
      return (Array.isArray(list) ? list : []).map((item) => {
        const c = item as Record<string, unknown>;
        const content = String(c.content ?? c.message ?? "");
        return {
          ...(c as unknown as CommentResponse),
          message: content,
          content,
        };
      }) as CommentResponse[];
    },
  });

  const { data: assignableUsers = [] } = useQuery({
    queryKey: ["onboarding-assignable-users"],
    queryFn: () => apiSearchUsers({ status: "ACTIVE" }),
    enabled: canManage && Boolean(selectedTaskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const list =
        (r as { users?: unknown }).users ??
        (r as { items?: unknown }).items ??
        (r as { list?: unknown }).list ??
        (Array.isArray(r) ? r : []);
      return (Array.isArray(list) ? list : []) as UserListItem[];
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const invalidateTasks = () => {
    queryClient.invalidateQueries({
      queryKey: ["onboarding-tasks-by-instance"],
    });
    queryClient.invalidateQueries({
      queryKey: ["onboarding-task-timeline"],
    });
    queryClient.invalidateQueries({
      queryKey: ["onboarding-task-detail", selectedTaskId],
    });
  };

  // ── Mutations ────────────────────────────────────────────────────────────────

  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

  const activateInstance = useMutation({
    mutationFn: ({
      instanceId,
      managerUserId,
    }: {
      instanceId: string;
      managerUserId?: string;
    }) => apiActivateInstance({ instanceId, managerUserId }),
  });
  const cancelInstance = useMutation({
    mutationFn: (id: string) => apiCancelInstance(id),
  });
  const completeInstance = useMutation({
    mutationFn: (id: string) => apiCompleteInstance(id),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (taskId: string) => apiAcknowledgeTask({ taskId }),
    onSuccess: () => {
      invalidateTasks();
      notify.success(t("onboarding.task.toast.acknowledged"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const approveMutation = useMutation({
    mutationFn: (taskId: string) => apiApproveTask({ taskId }),
    onSuccess: () => {
      invalidateTasks();
      setSelectedTaskId(null);
      notify.success(t("onboarding.task.toast.approved"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      apiRejectTask({ taskId, reason }),
    onSuccess: () => {
      invalidateTasks();
      setSelectedTaskId(null);
      setRejectModalOpen(false);
      setRejectReason("");
      notify.success(t("onboarding.task.toast.rejected"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

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
        queryKey: ["onboarding-task-comments", selectedTaskId],
      });
      setCommentInput("");
      notify.success(t("onboarding.task.comments.toast_added"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const assignMutation = useMutation({
    mutationFn: ({
      taskId,
      assigneeUserId,
    }: {
      taskId: string;
      assigneeUserId: string;
    }) => apiAssignTask(taskId, assigneeUserId),
    onSuccess: () => {
      invalidateTasks();
      notify.success(t("onboarding.task.toast.assigned"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const addAttachmentMutation = useMutation({
    mutationFn: (payload: TaskAttachmentAddRequest) =>
      apiAddTaskAttachment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      notify.success(t("onboarding.task.toast.attachment_added"));
    },
  });

  const scheduleProposeMutation = useMutation({
    mutationFn: (payload: TaskScheduleProposeRequest) =>
      apiProposeTaskSchedule(payload),
    onSuccess: () => {
      invalidateTasks();
      setScheduleMode(null);
      setScheduleDates([null, null]);
      notify.success(t("onboarding.task.toast.schedule_proposed"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const scheduleConfirmMutation = useMutation({
    mutationFn: (taskId: string) => apiConfirmTaskSchedule({ taskId }),
    onSuccess: () => {
      invalidateTasks();
      notify.success(t("onboarding.task.toast.schedule_confirmed"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const rescheduleMutation = useMutation({
    mutationFn: (payload: TaskScheduleRescheduleRequest) =>
      apiRescheduleTask(payload),
    onSuccess: () => {
      invalidateTasks();
      setScheduleMode(null);
      setScheduleDates([null, null]);
      setScheduleReason("");
      notify.success(t("onboarding.task.toast.rescheduled"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      apiCancelTaskSchedule({ taskId, reason }),
    onSuccess: () => {
      invalidateTasks();
      setCancelScheduleReason("");
      notify.success(t("onboarding.task.toast.schedule_cancelled"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const markNoShowMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      apiMarkTaskNoShow({ taskId, reason }),
    onSuccess: () => {
      invalidateTasks();
      setNoShowReason("");
      notify.success(t("onboarding.task.toast.no_show_marked"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  // ── Derived data ─────────────────────────────────────────────────────────────

  const employeeDisplayName =
    employeeDetail?.fullName || instance?.employeeName || "-";
  const employeeDisplayEmail = employeeDetail?.email ?? null;
  const managerDisplayName =
    managerDetail?.fullName || instance?.managerName || "—";

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.overdue &&
          task.rawStatus !== "DONE" &&
          task.rawStatus !== "CANCELLED",
      ),
    [tasks],
  );

  const pendingApprovalTasks = useMemo(
    () => tasks.filter((task) => task.rawStatus === "PENDING_APPROVAL"),
    [tasks],
  );

  const scheduleIssueTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          ["MISSED", "CANCELLED"].includes(task.scheduleStatus ?? "") &&
          task.rawStatus !== "DONE",
      ),
    [tasks],
  );

  const nextDueTask = useMemo(() => {
    return tasks
      .filter(
        (task) =>
          task.rawStatus !== "DONE" &&
          task.rawStatus !== "PENDING_APPROVAL" &&
          !task.overdue &&
          !["MISSED", "CANCELLED"].includes(task.scheduleStatus ?? "") &&
          task.dueDate,
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate ?? "").getTime() -
          new Date(b.dueDate ?? "").getTime(),
      )[0];
  }, [tasks]);

  const assigneeTimeline = useMemo(
    () =>
      timelineAssignees.length > 0
        ? timelineAssignees
        : buildFallbackAssigneeTimeline(tasks),
    [tasks, timelineAssignees],
  );

  const instanceStatus = instance?.status?.toUpperCase() ?? "";
  const isActioning =
    activateInstance.isPending ||
    cancelInstance.isPending ||
    completeInstance.isPending;

  // Issue #4 (partial): HR always can approve/reject; Manager only if they are the line manager of this instance
  const canApproveOrReject =
    canManage && (isHr || instance?.managerUserId === userId);

  const taskIndex = selectedTaskId
    ? tasks.findIndex((tk) => tk.id === selectedTaskId)
    : -1;

  // ── Side effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (instanceId && employeeDisplayName !== "-") {
      setBreadcrumbs({ [instanceId]: employeeDisplayName });
    }
  }, [instanceId, employeeDisplayName, setBreadcrumbs]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleActivate = async () => {
    if (!instanceId) return;
    try {
      await activateInstance.mutateAsync({
        instanceId,
        managerUserId: instance?.managerUserId ?? undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["instance", instanceId] });
      notify.success(t("onboarding.detail.toast.activated"));
    } catch {
      notify.error(t("onboarding.detail.toast.action_failed"));
    }
  };

  const handleCancel = async () => {
    if (!instanceId) return;
    try {
      await cancelInstance.mutateAsync(instanceId);
      queryClient.invalidateQueries({ queryKey: ["instance", instanceId] });
      notify.success(t("onboarding.detail.toast.cancelled"));
      setConfirmAction(null);
    } catch {
      notify.error(t("onboarding.detail.toast.action_failed"));
    }
  };

  const handleComplete = async () => {
    if (!instanceId) return;
    try {
      await completeInstance.mutateAsync(instanceId);
      queryClient.invalidateQueries({ queryKey: ["instance", instanceId] });
      notify.success(t("onboarding.detail.toast.completed"));
      setConfirmAction(null);
    } catch {
      notify.error(t("onboarding.detail.toast.action_failed"));
    }
  };

  const handleStartTask = async (task: OnboardingTask): Promise<boolean> => {
    try {
      await updateTaskStatus.mutateAsync({
        taskId: task.id,
        status: "IN_PROGRESS",
      });
      invalidateTasks();
      notify.success(t("onboarding.task.toast.started"));
      return true;
    } catch {
      notify.error(t("onboarding.detail.toast.task_failed"));
      return false;
    }
  };

  const handleToggleTask = async (task: OnboardingTask) => {
    const isDone = task.status === STATUS_DONE;
    const rawStatus = task.rawStatus ?? "";

    // Revert DONE → TODO
    if (isDone) {
      try {
        await updateTaskStatus.mutateAsync({ taskId: task.id, status: "TODO" });
        invalidateTasks();
        notify.success(t("onboarding.detail.toast.task_undone"));
      } catch {
        notify.error(t("onboarding.detail.toast.task_failed"));
      }
      return;
    }

    // API flow: TODO/ASSIGNED -> IN_PROGRESS trước khi thao tác tiếp theo
    if (rawStatus === "TODO" || rawStatus === "ASSIGNED") {
      await handleStartTask(task);
      return;
    }

    // requireAck flow: IN_PROGRESS -> acknowledge -> WAIT_ACK -> DONE
    if (task.requireAck && rawStatus === "IN_PROGRESS") {
      try {
        await acknowledgeMutation.mutateAsync(task.id);
      } catch {
        notify.error(t("onboarding.detail.toast.task_failed"));
      }
      return;
    }

    if (rawStatus === "WAIT_ACK") {
      try {
        await updateTaskStatus.mutateAsync({
          taskId: task.id,
          status: STATUS_DONE_API,
        });
        invalidateTasks();
        notify.success(t("onboarding.detail.toast.task_done"));
      } catch {
        notify.error(t("onboarding.detail.toast.task_failed"));
      }
      return;
    }

    // requiresManagerApproval flow: IN_PROGRESS -> PENDING_APPROVAL
    if (task.requiresManagerApproval && rawStatus === "IN_PROGRESS") {
      try {
        await updateTaskStatus.mutateAsync({
          taskId: task.id,
          status: "PENDING_APPROVAL",
        });
        invalidateTasks();
        notify.success(t("onboarding.task.toast.submitted_approval"));
      } catch {
        notify.error(t("onboarding.detail.toast.task_failed"));
      }
      return;
    }

    // Chỉ cho DONE khi task đang IN_PROGRESS
    if (rawStatus !== "IN_PROGRESS") return;

    // Normal flow: IN_PROGRESS -> DONE
    try {
      await updateTaskStatus.mutateAsync({
        taskId: task.id,
        status: STATUS_DONE_API,
      });
      invalidateTasks();
      notify.success(t("onboarding.detail.toast.task_done"));
    } catch {
      notify.error(t("onboarding.detail.toast.task_failed"));
    }
  };

  const openTaskDrawer = (task: OnboardingTask) => {
    setSelectedTaskId(task.id);
    setDrawerTab("info");
    setScheduleMode(null);
    setScheduleDates([null, null]);
    setScheduleReason("");
    setCancelScheduleReason("");
    setNoShowReason("");
  };

  const openTaskDrawerById = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      openTaskDrawer(task);
      return;
    }
    setSelectedTaskId(taskId);
    setDrawerTab("info");
    setScheduleMode(null);
    setScheduleDates([null, null]);
    setScheduleReason("");
    setCancelScheduleReason("");
    setNoShowReason("");
  };

  const closeTaskDrawer = () => {
    setSelectedTaskId(null);
    setCommentInput("");
    setScheduleMode(null);
    setScheduleDates([null, null]);
    setScheduleReason("");
    setCancelScheduleReason("");
    setNoShowReason("");
  };

  const handleAddComment = (parentCommentId?: string) => {
    if (!selectedTaskId || !commentInput.trim()) return;
    addCommentMutation.mutate({
      taskId: selectedTaskId,
      content: commentInput.trim(),
      parentCommentId,
    });
  };

  const handleUploadAttachment = async (file: File) => {
    if (!selectedTaskId) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      const uploadRes = await apiUploadDocumentFile(formData);
      if (!uploadRes.fileUrl) {
        throw new Error(t("onboarding.task.attachment.missing_url"));
      }
      await addAttachmentMutation.mutateAsync({
        taskId: selectedTaskId,
        fileName: file.name,
        fileUrl: uploadRes.fileUrl,
        fileType: file.type,
        fileSizeBytes: file.size,
      });
    } catch (err) {
      notify.error(extractErrorMessage(err, t("onboarding.task.toast.failed")));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleProposeSchedule = () => {
    if (!selectedTaskId || !scheduleDates[0] || !scheduleDates[1]) return;
    scheduleProposeMutation.mutate({
      taskId: selectedTaskId,
      scheduledStartAt: scheduleDates[0].toISOString(),
      scheduledEndAt: scheduleDates[1].toISOString(),
    });
  };

  const handleReschedule = () => {
    if (!selectedTaskId || !scheduleDates[0] || !scheduleDates[1]) return;
    rescheduleMutation.mutate({
      taskId: selectedTaskId,
      scheduledStartAt: scheduleDates[0].toISOString(),
      scheduledEndAt: scheduleDates[1].toISOString(),
      reason: scheduleReason || undefined,
    });
  };

  // ── Loading / Error states ───────────────────────────────────────────────────

  if (instanceLoading && !instance) {
    return <Skeleton.Input active block style={{ height: 256 }} />;
  }

  if (instanceError && !instance) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            {t("onboarding.detail.title_fallback")}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {t("onboarding.detail.subtitle")}
          </p>
        </div>
        <Card>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm font-medium text-ink">
              {t("onboarding.detail.error.something_wrong")}
            </p>
            <Button onClick={() => refetchInstance()}>
              {t("onboarding.detail.error.retry")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!instanceId || !instance) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            {t("onboarding.detail.title_fallback")}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {t("onboarding.detail.subtitle")}
          </p>
        </div>
        <Card>
          <p className="text-sm text-muted">
            {t("onboarding.detail.not_found")}
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate("/onboarding/employees")}>
            {t("onboarding.detail.back_to_list")}
          </Button>
        </Card>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative space-y-6">
      {(instanceFetching || tasksFetching || timelineFetching) &&
        !instanceLoading && <AppLoading />}
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="flex min-w-0 gap-4">
            <Avatar
              size={64}
              className="shrink-0 bg-slate-900 text-lg font-semibold text-white">
              {getInitials(employeeDisplayName)}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Tag color="blue" className="m-0">
                  {templateDetail?.name ??
                    instance.templateName ??
                    t("onboarding.detail.title_fallback")}
                </Tag>
                <Tag
                  color={
                    instanceStatus === "ACTIVE"
                      ? "success"
                      : instanceStatus === "CANCELLED"
                        ? "warning"
                        : "default"
                  }
                  className="m-0">
                  {instance.status}
                </Tag>
                {templateDetail?.description && (
                  <Tooltip title={templateDetail.description}>
                    <Tag className="m-0 cursor-help">
                      {t("onboarding.detail.template.description")}
                    </Tag>
                  </Tooltip>
                )}
              </div>
              <h1 className="truncate text-2xl font-semibold leading-tight text-slate-950">
                {employeeDisplayName !== "-"
                  ? employeeDisplayName
                  : (templateDetail?.name ?? t("onboarding.detail.title_fallback"))}
              </h1>
              <p className="mt-2 truncate text-sm text-slate-500">
                {employeeDisplayEmail || t("onboarding.detail.profile.no_email")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <Button
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate("/onboarding/employees")}>
              {t("global.back")}
            </Button>
            {canManage && instanceStatus === "DRAFT" && (
              <Button
                type="primary"
                icon={<PlayCircle className="h-4 w-4" />}
                onClick={handleActivate}
                disabled={isActioning}>
                {t("onboarding.detail.action.activate")}
              </Button>
            )}
            {canManage && instanceStatus === "ACTIVE" && (
              <>
                <Button
                  icon={<XCircle className="h-4 w-4" />}
                  onClick={() => setConfirmAction("cancel")}
                  disabled={isActioning}>
                  {t("onboarding.detail.action.cancel")}
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => setConfirmAction("complete")}
                  disabled={isActioning}>
                  {t("onboarding.detail.action.complete")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 pt-2 shadow-sm">
            <Tabs
              activeKey={tab}
              onChange={setTab}
              items={[
                {
                  key: "checklist",
                  label: t("onboarding.detail.tab.checklist"),
                },
                { key: "activity", label: t("onboarding.detail.tab.activity") },
              ]}
            />
          </div>

          {tab === "checklist" && (
            <TaskListPanel
              tasks={tasks}
              isLoading={tasksLoading}
              isUpdating={updateTaskStatus.isPending}
              canManage={canManage}
              currentUserId={userId}
              canApproveOrReject={canApproveOrReject}
              onToggle={handleToggleTask}
              onOpenDrawer={openTaskDrawer}
              onApprove={(task) => approveMutation.mutate(task.id)}
              onReject={(task) => {
                setSelectedTaskId(task.id);
                setRejectModalOpen(true);
              }}
              isApproving={approveMutation.isPending}
              isRejecting={rejectMutation.isPending}
            />
          )}

          {tab === "activity" && <ActivityFeed tasks={tasks} t={t} />}
        </div>

        <div className="space-y-4">
          <EmployeeProfilePanel
            employeeDetail={employeeDetail}
            managerDisplayName={managerDisplayName}
            t={t}
          />
          <ActionQueuePanel
            overdueTasks={overdueTasks}
            pendingApprovalTasks={pendingApprovalTasks}
            scheduleIssueTasks={scheduleIssueTasks}
            nextDueTask={nextDueTask}
            t={t}
            onOpenTask={openTaskDrawerById}
          />
          <AssigneeTimelinePanel
            assignees={assigneeTimeline}
            isLoading={timelineFetching && assigneeTimeline.length === 0}
            t={t}
          />
        </div>
      </div>

      {/* ── Task detail drawer ───────────────────────────────────────────────── */}
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
        canApproveOrReject={canApproveOrReject}
        isAcknowledging={acknowledgeMutation.isPending}
        isUpdatingStatus={updateTaskStatus.isPending}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isAddingComment={addCommentMutation.isPending}
        isAssigning={assignMutation.isPending}
        uploadingFile={uploadingFile}
        assignableUsers={assignableUsers}
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
        onClose={closeTaskDrawer}
        onDrawerTabChange={setDrawerTab}
        onCommentChange={setCommentInput}
        onAddComment={handleAddComment}
        onStart={async () => {
          if (!taskDetail) return;
          const task = tasks.find((tk) => tk.id === taskDetail.taskId);
          if (task) await handleStartTask(task);
        }}
        onAcknowledge={() =>
          taskDetail && acknowledgeMutation.mutate(taskDetail.taskId)
        }
        onConfirmComplete={async () => {
          if (!taskDetail) return;
          try {
            await updateTaskStatus.mutateAsync({
              taskId: taskDetail.taskId,
              status: STATUS_DONE_API,
            });
            invalidateTasks();
            closeTaskDrawer();
            notify.success(t("onboarding.task.toast.done"));
          } catch {
            notify.error(t("onboarding.task.toast.failed"));
          }
        }}
        onSubmitApproval={async () => {
          if (!taskDetail) return;
          try {
            await updateTaskStatus.mutateAsync({
              taskId: taskDetail.taskId,
              status: "PENDING_APPROVAL",
            });
            invalidateTasks();
            closeTaskDrawer();
            notify.success(t("onboarding.task.toast.submitted_approval"));
          } catch {
            notify.error(t("onboarding.task.toast.failed"));
          }
        }}
        onMarkDone={async () => {
          const task = tasks.find((tk) => tk.id === selectedTaskId);
          if (task) await handleToggleTask(task);
          closeTaskDrawer();
        }}
        onApprove={() =>
          taskDetail && approveMutation.mutate(taskDetail.taskId)
        }
        onReject={() => setRejectModalOpen(true)}
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
        onAssign={(assigneeUserId) => {
          if (selectedTaskId)
            assignMutation.mutate({ taskId: selectedTaskId, assigneeUserId });
        }}
        onUploadAttachment={handleUploadAttachment}
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
        onCheckpointConfirmed={invalidateTasks}
      />

      {/* ── Reject reason modal ──────────────────────────────────────────────── */}
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
        okText={t("onboarding.task.action.reject")}
        cancelText={t("global.cancel_action")}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}>
        <div className="py-2">
          <p className="mb-3 text-sm text-gray-600">
            {t("onboarding.task.reject.desc")}
          </p>
          <Input.TextArea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("onboarding.task.reject.placeholder")}
            maxLength={500}
          />
        </div>
      </Modal>

      {/* ── Confirm cancel modal ─────────────────────────────────────────────── */}
      <BaseModal
        open={confirmAction === "cancel"}
        title={t("onboarding.detail.action.confirm_cancel_title")}
        onCancel={() => setConfirmAction(null)}
        footer={null}>
        <div className="grid gap-4">
          <p className="text-sm text-muted">
            {t("onboarding.detail.action.confirm_cancel_desc")}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setConfirmAction(null)}
              disabled={isActioning}>
              {t("global.cancel_action")}
            </Button>
            <Button onClick={handleCancel} disabled={isActioning}>
              {t("onboarding.detail.action.confirm")}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* ── Confirm complete modal ───────────────────────────────────────────── */}
      <BaseModal
        open={confirmAction === "complete"}
        title={t("onboarding.detail.action.confirm_complete_title")}
        onCancel={() => setConfirmAction(null)}
        footer={null}>
        <div className="grid gap-4">
          <p className="text-sm text-muted">
            {t("onboarding.detail.action.confirm_complete_desc")}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setConfirmAction(null)}
              disabled={isActioning}>
              {t("global.cancel_action")}
            </Button>
            <Button
              type="primary"
              onClick={handleComplete}
              disabled={isActioning}>
              {t("onboarding.detail.action.confirm")}
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default EmployeeDetail;
