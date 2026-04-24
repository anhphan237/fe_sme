import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input, Modal, Skeleton, Tabs, Tag } from "antd";
import {
  CheckCircle2,
  Circle,
  Clock,
  HourglassIcon,
  Loader2,
  Send,
  CheckSquare,
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
  apiListTasksByAssignee,
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
import { InfoCard } from "./components/InfoCard";
import { TaskListPanel } from "./components/TaskListPanel";
import { TaskDrawer } from "./components/TaskDrawer";
import { StageProgressCard } from "./components/StageProgressCard";
import { STATUS_DONE, STATUS_DONE_API, STATUS_TAG_COLOR } from "./constants";
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
                            {task.title}
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
      isEmployee ? "assignee" : "manager",
    ],
    // Chờ instance load để luôn filter chính xác theo onboarding hiện tại
    enabled: Boolean(instance?.id),
    refetchOnMount: "always",
    queryFn: () => {
      if (isEmployee) {
        // Nhân viên xem task của chính mình → dùng listByAssignee
        return apiListTasksByAssignee({ size: 100 });
      }
      // HR/Manager xem task của instance → dùng listByOnboarding
      return apiListTasks(instance!.id);
    },
    select: (res: unknown) => {
      const all = extractList(
        res as Record<string, unknown>,
        "tasks",
        "content",
        "items",
        "list",
      ).map(mapTask) as OnboardingTask[];

      if (isEmployee) {
        // Filter về đúng onboarding instance đang xem
        const currentInstanceId = instance?.id;
        if (!currentInstanceId) return all;
        return all.filter((tk) => tk.onboardingId === currentInstanceId);
      }
      // HR/Manager view: chỉ tính task được assign cho nhân viên của instance
      // (khớp ngữ nghĩa listByAssignee để thống kê chính xác)
      const employeeUserId = instance?.employeeUserId;
      if (!employeeUserId) return all;
      return all.filter((tk) => tk.assignedUserId === employeeUserId);
    },
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

  const completedCount = tasks.filter((t) => t.status === STATUS_DONE).length;
  const totalTasks = tasks.length;
  const progressPercent =
    totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100)
      : (instance?.progress ?? 0);

  const stageProgress = useMemo(() => {
    const groups: Record<
      string,
      { name: string; done: number; total: number }
    > = {};
    for (const task of tasks) {
      const key = task.checklistName ?? "—";
      if (!groups[key]) groups[key] = { name: key, done: 0, total: 0 };
      groups[key].total++;
      if (task.rawStatus === "DONE") groups[key].done++;
    }
    return Object.values(groups).map((g) => ({
      name: g.name,
      done: g.done,
      total: g.total,
      percent: Math.round((g.done / (g.total || 1)) * 100),
    }));
  }, [tasks]);

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
        throw new Error("Upload succeeded but file URL is missing");
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
      {(instanceFetching || tasksFetching) && !instanceLoading && (
        <AppLoading />
      )}
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            {employeeDisplayName !== "-"
              ? employeeDisplayName
              : (templateDetail?.name ?? t("onboarding.detail.title_fallback"))}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {templateDetail?.name ?? t("onboarding.detail.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => navigate("/onboarding/employees")}>
            {t("global.back")}
          </Button>
          {canManage && instanceStatus === "DRAFT" && (
            <Button
              type="primary"
              onClick={handleActivate}
              disabled={isActioning}>
              {t("onboarding.detail.action.activate")}
            </Button>
          )}
          {canManage && instanceStatus === "ACTIVE" && (
            <>
              <Button
                onClick={() => setConfirmAction("cancel")}
                disabled={isActioning}>
                {t("onboarding.detail.action.cancel")}
              </Button>
              <Button
                type="primary"
                onClick={() => setConfirmAction("complete")}
                disabled={isActioning}>
                {t("onboarding.detail.action.complete")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Info card ────────────────────────────────────────────────────────── */}
      <InfoCard
        instance={instance}
        template={templateDetail}
        employeeDisplayName={employeeDisplayName}
        employeeDisplayEmail={employeeDisplayEmail}
        employeeDetail={employeeDetail}
        managerDisplayName={managerDisplayName}
        completedCount={completedCount}
        totalTasks={totalTasks}
        progressPercent={progressPercent}
      />

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: "checklist", label: t("onboarding.detail.tab.checklist") },
          { key: "activity", label: t("onboarding.detail.tab.activity") },
        ]}
      />

      {/* ── Checklist tab ────────────────────────────────────────────────────── */}
      {tab === "checklist" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <StageProgressCard stageProgress={stageProgress} />
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
        </div>
      )}

      {/* ── Activity tab ─────────────────────────────────────────────────────── */}
      {tab === "activity" && <ActivityFeed tasks={tasks} t={t} />}

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
            {t("onboarding.task.reject.desc") ??
              "Lý do từ chối (không bắt buộc):"}
          </p>
          <Input.TextArea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={
              t("onboarding.task.reject.placeholder") ?? "Nhập lý do từ chối..."
            }
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
