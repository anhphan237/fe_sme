import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Send,
  User,
  Calendar,
  Paperclip,
  CheckSquare,
  ThumbsUp,
  XCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Input,
  Modal,
  Progress,
  Row,
  Skeleton,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
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
  apiListInstances,
  apiListTemplates,
  apiListTasks,
  apiUpdateTaskStatus,
  apiGetTaskDetailFull,
  apiListTaskComments,
  apiAcknowledgeTask,
  apiApproveTask,
  apiRejectTask,
  apiAddTaskComment,
} from "@/api/onboarding/onboarding.api";
import { apiGetUserById, apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask, mapTemplate } from "@/utils/mappers/onboarding";
import { mapUser, mapUserDetail } from "@/utils/mappers/identity";
import type { GetUserResponse } from "@/interface/identity";
import type { CommentResponse, TaskDetailResponse } from "@/interface/onboarding";
import { InfoCard } from "./InfoCard";
import { TaskListPanel } from "./TaskListPanel";
import type {
  OnboardingInstance,
  OnboardingTask,
  OnboardingTemplate,
  User,
} from "@/shared/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_DONE = "Done";
const STATUS_DONE_API = "DONE";

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

interface InstancesFilter {
  employeeId?: string;
  status?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  return { label: validLabel, color: STAGE_TAG_COLOR[upper] ?? "default" };
};

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Hooks ─────────────────────────────────────────────────────────────────────

const useInstanceQuery = (instanceId?: string) =>
  useQuery({
    queryKey: ["instance", instanceId],
    queryFn: () => apiGetInstance(instanceId!),
    enabled: Boolean(instanceId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const raw = r?.instance ?? r?.data ?? r?.result ?? r?.payload ?? res;
      return mapInstance(
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
      );
    },
  });

const useUserDetailQuery = (userId?: string) =>
  useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res: unknown) => mapUserDetail(res as GetUserResponse),
  });

const useActivateInstance = () =>
  useMutation({
    mutationFn: (instanceId: string) => apiActivateInstance(instanceId),
  });

const useCancelInstance = () =>
  useMutation({
    mutationFn: (instanceId: string) => apiCancelInstance(instanceId),
  });

const useCompleteInstance = () =>
  useMutation({
    mutationFn: (instanceId: string) => apiCompleteInstance(instanceId),
  });

const useTemplateDetailQuery = (templateId?: string) =>
  useQuery({
    queryKey: ["template-detail", templateId ?? ""],
    queryFn: () => apiGetTemplate(templateId!),
    enabled: Boolean(templateId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const raw = r?.template ?? r?.data ?? r?.result ?? r?.payload ?? res;
      return mapTemplate(
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
      );
    },
  });

const useInstancesQuery = (filters?: InstancesFilter, enabled = true) =>
  useQuery({
    queryKey: [
      "instances",
      filters?.employeeId ?? "",
      filters?.status ?? "ACTIVE",
    ],
    queryFn: () =>
      apiListInstances({
        employeeId: filters?.employeeId,
        status: filters?.status ?? "ACTIVE",
      }),
    enabled,
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

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

const useUpdateTaskStatus = () =>
  useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: unknown) =>
      extractList(res as Record<string, unknown>, "users", "items").map((u) =>
        mapUser(u as Record<string, unknown>),
      ) as User[],
  });

const useTemplatesQuery = (status?: string) =>
  useQuery({
    queryKey: ["templates", status ?? ""],
    queryFn: () => apiListTemplates({ status }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
        "list",
      ).map(mapTemplate) as OnboardingTemplate[],
  });

const useTaskDetailQuery = (taskId?: string) =>
  useQuery({
    queryKey: ["onboarding-task-detail", taskId ?? ""],
    queryFn: () => apiGetTaskDetailFull(taskId!),
    enabled: Boolean(taskId),
    select: (res: unknown) => {
      const record = res as Record<string, unknown>;
      return (record?.task ??
        record?.data ??
        record?.result ??
        record?.payload ??
        res) as TaskDetailResponse;
    },
  });

const useTaskCommentsQuery = (taskId?: string) =>
  useQuery({
    queryKey: ["onboarding-task-comments", taskId ?? ""],
    queryFn: () => apiListTaskComments(taskId!),
    enabled: Boolean(taskId),
    select: (res: unknown) => {
      const record = res as Record<string, unknown>;
      const list = record?.comments ?? record?.data ?? [];
      return (Array.isArray(list) ? list : []) as CommentResponse[];
    },
  });

// ── Page ──────────────────────────────────────────────────────────────────────

const EmployeeDetail = () => {
  const { employeeId: instanceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currentUser = useUserStore((state) => state.currentUser);
  const setBreadcrumbs = useGlobalStore((state) => state.setBreadcrumbs);
  const isEmployee = isOnboardingEmployee(currentUser?.roles ?? []);
  const backToEmployees = "/onboarding/employees";
  const canManage = canManageOnboarding(currentUser?.roles ?? []);

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: instance,
    isLoading: instanceLoading,
    isError: instanceError,
    refetch: refetchInstance,
  } = useInstanceQuery(instanceId);

  const { data: instances } = useInstancesQuery(
    isEmployee && currentUser?.id
      ? { employeeId: currentUser.id, status: "ACTIVE" }
      : undefined,
    Boolean(isEmployee && currentUser?.id && !instance),
  );

  const { data: templates } = useTemplatesQuery("ACTIVE");
  const { data: users } = useUsersQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery(
    instance?.id || instanceId,
  );
  const updateTaskStatus = useUpdateTaskStatus();
  const activateInstance = useActivateInstance();
  const cancelInstance = useCancelInstance();
  const completeInstance = useCompleteInstance();
  const { data: templateDetail } = useTemplateDetailQuery(instance?.templateId);

  // ── Local state ──────────────────────────────────────────────────────────

  const [tab, setTab] = useState("checklist");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState("info");
  const [commentInput, setCommentInput] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    "cancel" | "complete" | null
  >(null);

  // ── Task detail queries + mutations ──────────────────────────────────────

  const { data: taskDetail, isLoading: taskDetailLoading } =
    useTaskDetailQuery(selectedTaskId ?? undefined);

  const { data: comments, isLoading: commentsLoading } =
    useTaskCommentsQuery(selectedTaskId ?? undefined);

  const acknowledgeMutation = useMutation({
    mutationFn: (taskId: string) => apiAcknowledgeTask({ taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "onboarding-tasks-by-instance",
          instance?.id ?? instanceId ?? "",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      notify.success(t("onboarding.task.toast.acknowledged"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const approveMutation = useMutation({
    mutationFn: (taskId: string) => apiApproveTask({ taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      setSelectedTaskId(null);
      notify.success(t("onboarding.task.toast.approved"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      apiRejectTask({ taskId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail", selectedTaskId],
      });
      setSelectedTaskId(null);
      setRejectModalOpen(false);
      setRejectReason("");
      notify.success(t("onboarding.task.toast.rejected"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ taskId, message }: { taskId: string; message: string }) =>
      apiAddTaskComment(taskId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-task-comments", selectedTaskId],
      });
      setCommentInput("");
      notify.success(t("onboarding.task.comments.toast_added"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  // ── Derived data ─────────────────────────────────────────────────────────

  const effectiveInstance =
    instance ?? instances?.find((i) => i.id === instanceId);
  const employee = users?.find(
    (u) =>
      u.id === effectiveInstance?.employeeUserId ||
      u.id === effectiveInstance?.employeeId ||
      u.employeeId === effectiveInstance?.employeeId,
  );
  const employeeUserId = effectiveInstance?.employeeUserId || employee?.id;
  const { data: employeeDetail } = useUserDetailQuery(employeeUserId);
  const employeeDetailData =
    employeeDetail && "userId" in employeeDetail ? employeeDetail : null;
  const resolvedManagerUserId =
    effectiveInstance?.managerUserId ??
    employeeDetailData?.managerUserId ??
    employee?.managerUserId;
  const { data: managerDetail } = useUserDetailQuery(
    resolvedManagerUserId ?? undefined,
  );
  const managerDetailData =
    managerDetail && "userId" in managerDetail ? managerDetail : null;

  const employeeDisplayName =
    employeeDetailData?.fullName || employee?.name || "-";
  const employeeDisplayEmail =
    employeeDetailData?.email || employee?.email || null;
  const managerDisplayName =
    managerDetailData?.fullName ||
    effectiveInstance?.managerName ||
    employee?.manager ||
    "—";
  const template =
    templateDetail ??
    templates?.find((tpl) => tpl.id === effectiveInstance?.templateId);

  useEffect(() => {
    if (instanceId && employeeDisplayName !== "-") {
      setBreadcrumbs({ [instanceId]: employeeDisplayName });
    }
  }, [instanceId, employeeDisplayName, setBreadcrumbs]);

  const completedCount = tasks.filter(
    (task) => task.status === STATUS_DONE,
  ).length;
  const totalTasks = tasks.length;
  const progressPercent =
    totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100)
      : (effectiveInstance?.progress ?? 0);

  const stageProgress = useMemo(() => {
    if (!templateDetail?.stages?.length) return [];
    return templateDetail.stages.map((stage) => {
      const stageTitles = new Set(
        stage.tasks.map((task) => task.title.trim().toLowerCase()),
      );
      const matched = tasks.filter((task) =>
        stageTitles.has(task.title.trim().toLowerCase()),
      );
      const done = matched.filter((task) => task.status === STATUS_DONE).length;
      const total = stage.tasks.length || 1;
      return {
        name: stage.name,
        done,
        total,
        percent: Math.round((done / total) * 100),
      };
    });
  }, [templateDetail?.stages, tasks]);

  // Task navigation
  const taskIndex = selectedTaskId
    ? tasks.findIndex((tk) => tk.id === selectedTaskId)
    : -1;
  const hasPrev = taskIndex > 0;
  const hasNext = taskIndex >= 0 && taskIndex < tasks.length - 1;

  const instanceStatus = effectiveInstance?.status?.toUpperCase() ?? "";

  // ── Handlers ─────────────────────────────────────────────────────────────

  const isActioning =
    activateInstance.isPending ||
    cancelInstance.isPending ||
    completeInstance.isPending;

  const handleActivate = async () => {
    if (!instanceId) return;
    try {
      await activateInstance.mutateAsync(instanceId);
      queryClient.invalidateQueries({ queryKey: ["instance", instanceId] });
      queryClient.invalidateQueries({ queryKey: ["instances"] });
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
      queryClient.invalidateQueries({ queryKey: ["instances"] });
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
      queryClient.invalidateQueries({ queryKey: ["instances"] });
      notify.success(t("onboarding.detail.toast.completed"));
      setConfirmAction(null);
    } catch {
      notify.error(t("onboarding.detail.toast.action_failed"));
    }
  };

  const handleToggleTask = async (task: OnboardingTask) => {
    const isDone = task.status === STATUS_DONE;
    const nextStatus = isDone ? "TODO" : STATUS_DONE_API;
    try {
      await updateTaskStatus.mutateAsync({
        taskId: task.id,
        status: nextStatus,
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
      queryClient.invalidateQueries({ queryKey: ["instance"] });
      notify.success(
        isDone
          ? t("onboarding.detail.toast.task_undone")
          : t("onboarding.detail.toast.task_done"),
      );
    } catch {
      notify.error(t("onboarding.detail.toast.task_failed"));
    }
  };

  const openTaskDrawer = (task: OnboardingTask) => {
    setSelectedTaskId(task.id);
    setDrawerTab("info");
  };

  const closeTaskDrawer = () => {
    setSelectedTaskId(null);
    setCommentInput("");
  };

  const handleAddComment = () => {
    if (!selectedTaskId || !commentInput.trim()) return;
    addCommentMutation.mutate({
      taskId: selectedTaskId,
      message: commentInput.trim(),
    });
  };

  // ── Loading / Error / Not Found ──────────────────────────────────────────

  if (instanceLoading && !effectiveInstance) {
    return <Skeleton.Input active block style={{ height: 256 }} />;
  }

  if (instanceError && !effectiveInstance) {
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

  if (!instanceId || !effectiveInstance) {
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
          <Button className="mt-4" onClick={() => navigate(backToEmployees)}>
            {t("onboarding.detail.back_to_list")}
          </Button>
        </Card>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            {employeeDisplayName !== "-"
              ? employeeDisplayName
              : (template?.name ?? t("onboarding.detail.title_fallback"))}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {template?.name ?? t("onboarding.detail.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => navigate(backToEmployees)}>
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

      <InfoCard
        instance={effectiveInstance}
        template={template}
        employeeDisplayName={employeeDisplayName}
        employeeDisplayEmail={employeeDisplayEmail}
        employee={employee}
        managerDisplayName={managerDisplayName}
        completedCount={completedCount}
        totalTasks={totalTasks}
        progressPercent={progressPercent}
      />

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: "checklist", label: t("onboarding.detail.tab.checklist") },
          { key: "activity", label: t("onboarding.detail.tab.activity") },
        ]}
      />

      {tab === "checklist" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold">
              {t("onboarding.detail.stage.title")}
            </h3>
            <div className="mt-4 space-y-4">
              {stageProgress.length > 0 ? (
                stageProgress.map((s) => (
                  <div key={s.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-muted">
                        {s.done}/{s.total}
                      </span>
                    </div>
                    <Progress
                      percent={s.percent}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">
                  {t("onboarding.detail.stage.empty")}
                </p>
              )}
            </div>
          </Card>
          <TaskListPanel
            tasks={tasks}
            isLoading={tasksLoading}
            isUpdating={updateTaskStatus.isPending}
            canManage={canManage}
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

      {tab === "activity" && (
        <Card>
          <h3 className="text-lg font-semibold">
            {t("onboarding.detail.activity.title")}
          </h3>
          <div className="mt-4 space-y-3 text-sm">
            {completedCount > 0 ? (
              tasks
                .filter((task) => task.status === STATUS_DONE)
                .map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-stroke bg-slate-50 p-4">
                    {t("onboarding.detail.activity.task_completed", {
                      title: task.title,
                    })}
                  </div>
                ))
            ) : (
              <p className="text-muted">
                {t("onboarding.detail.activity.empty")}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* ── Task Detail Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={Boolean(selectedTaskId)}
        width={640}
        onClose={closeTaskDrawer}
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
                  onClick={() => {
                    if (hasPrev) {
                      setSelectedTaskId(tasks[taskIndex - 1].id);
                      setDrawerTab("info");
                    }
                  }}
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
                  onClick={() => {
                    if (hasNext) {
                      setSelectedTaskId(tasks[taskIndex + 1].id);
                      setDrawerTab("info");
                    }
                  }}
                />
              </Tooltip>
            </div>
          )
        }>
        {taskDetailLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : taskDetail ? (
          <Tabs
            activeKey={drawerTab}
            onChange={setDrawerTab}
            size="small"
            items={[
              {
                key: "info",
                label: t("onboarding.detail.task.tab.info") ?? "Chi tiết",
                children: (
                  <div className="space-y-5 pt-2">
                    {/* Header block */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                      <div className="mb-2 flex flex-wrap items-start gap-2">
                        <Typography.Title
                          level={5}
                          className="!mb-0 flex-1 !text-gray-800">
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
                            const info = getStageLabel(
                              taskDetail.checklistName,
                              t,
                            );
                            return (
                              <Tag
                                color={info.color}
                                style={{ margin: 0, fontSize: 11 }}>
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
                          <InfoField
                            label={t("onboarding.task.field.completed_at")}>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />
                              {formatDate(taskDetail.completedAt)}
                            </span>
                          </InfoField>
                        </div>
                      </Col>
                      {(taskDetail.assignedUserName ||
                        taskDetail.assignedUserId) && (
                        <Col span={12}>
                          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <InfoField
                              label={t("onboarding.task.field.assignee")}>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-gray-400" />
                                {taskDetail.assignedUserName ??
                                  taskDetail.assignedUserId}
                              </span>
                            </InfoField>
                          </div>
                        </Col>
                      )}
                      {taskDetail.createdAt && (
                        <Col
                          span={
                            taskDetail.assignedUserName ||
                            taskDetail.assignedUserId
                              ? 12
                              : 24
                          }>
                          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <InfoField
                              label={t("onboarding.task.field.created_at")}>
                              {formatDateTime(taskDetail.createdAt)}
                            </InfoField>
                          </div>
                        </Col>
                      )}
                    </Row>

                    {/* Description */}
                    {taskDetail.description && (
                      <div>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}>
                          {t(
                            "onboarding.employee.home.task_detail.field_description",
                          )}
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
                                <InfoField
                                  label={t(
                                    "onboarding.task.field.acknowledged_by",
                                  )}>
                                  {taskDetail.acknowledgedBy ?? "-"}
                                </InfoField>
                              </Col>
                              <Col span={12}>
                                <InfoField
                                  label={t(
                                    "onboarding.task.field.acknowledged_at",
                                  )}>
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
                              {t(
                                "onboarding.employee.home.task_detail.field_status",
                              )}
                              :
                            </span>
                            <Tag
                              color={
                                APPROVAL_STATUS_COLOR[
                                  taskDetail.approvalStatus ?? "NONE"
                                ] ?? "default"
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
                                  <InfoField
                                    label={t(
                                      "onboarding.task.field.approved_by",
                                    )}>
                                    {taskDetail.approvedBy}
                                  </InfoField>
                                </Col>
                              )}
                              {taskDetail.approvedAt && (
                                <Col span={12}>
                                  <InfoField
                                    label={t(
                                      "onboarding.task.field.approved_at",
                                    )}>
                                    {formatDateTime(taskDetail.approvedAt)}
                                  </InfoField>
                                </Col>
                              )}
                            </Row>
                          )}
                          {taskDetail.rejectionReason && (
                            <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2">
                              <Typography.Text
                                type="danger"
                                style={{ fontSize: 12 }}>
                                <XCircle className="mr-1 inline h-3 w-3" />
                                <span className="font-medium">
                                  {t(
                                    "onboarding.task.rejection_reason_label",
                                  )}
                                  :
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
                                {t(
                                  "onboarding.employee.home.task_detail.field_status",
                                )}
                                :
                              </span>
                              <Tag
                                color={
                                  SCHEDULE_STATUS_COLOR[
                                    taskDetail.scheduleStatus
                                  ] ?? "default"
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
                                    label={t(
                                      "onboarding.task.schedule.field.start",
                                    )}>
                                    {formatDateTime(taskDetail.scheduledStartAt)}
                                  </InfoField>
                                </Col>
                              )}
                              {taskDetail.scheduledEndAt && (
                                <Col span={12}>
                                  <InfoField
                                    label={t(
                                      "onboarding.task.schedule.field.end",
                                    )}>
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
                        (taskDetail.status === "TODO" ||
                          taskDetail.status === "IN_PROGRESS") && (
                          <Button
                            type="primary"
                            icon={<CheckSquare className="h-3.5 w-3.5" />}
                            loading={acknowledgeMutation.isPending}
                            onClick={() =>
                              acknowledgeMutation.mutate(taskDetail.taskId)
                            }>
                            {t("onboarding.task.action.acknowledge")}
                          </Button>
                        )}
                      {isEmployee && taskDetail.status === "WAIT_ACK" && (
                        <Button
                          type="primary"
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          loading={updateTaskStatus.isPending}
                          onClick={async () => {
                            try {
                              await updateTaskStatus.mutateAsync({
                                taskId: taskDetail.taskId,
                                status: STATUS_DONE_API,
                              });
                              queryClient.invalidateQueries({
                                queryKey: ["onboarding-tasks-by-instance"],
                              });
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "onboarding-task-detail",
                                  selectedTaskId,
                                ],
                              });
                              closeTaskDrawer();
                              notify.success(t("onboarding.task.toast.done"));
                            } catch {
                              notify.error(t("onboarding.task.toast.failed"));
                            }
                          }}>
                          {t("onboarding.task.action.confirm_complete")}
                        </Button>
                      )}
                      {isEmployee &&
                        taskDetail.requiresManagerApproval &&
                        (taskDetail.status === "TODO" ||
                          taskDetail.status === "IN_PROGRESS") && (
                          <Button
                            type="primary"
                            icon={<Send className="h-3.5 w-3.5" />}
                            loading={updateTaskStatus.isPending}
                            onClick={async () => {
                              try {
                                await updateTaskStatus.mutateAsync({
                                  taskId: taskDetail.taskId,
                                  status: "PENDING_APPROVAL",
                                });
                                queryClient.invalidateQueries({
                                  queryKey: ["onboarding-tasks-by-instance"],
                                });
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "onboarding-task-detail",
                                    selectedTaskId,
                                  ],
                                });
                                closeTaskDrawer();
                                notify.success(
                                  t(
                                    "onboarding.task.toast.submitted_approval",
                                  ),
                                );
                              } catch {
                                notify.error(t("onboarding.task.toast.failed"));
                              }
                            }}>
                            {t("onboarding.task.action.submit_approval")}
                          </Button>
                        )}
                      {isEmployee &&
                        !taskDetail.requireAck &&
                        !taskDetail.requiresManagerApproval &&
                        (taskDetail.status === "TODO" ||
                          taskDetail.status === "IN_PROGRESS") && (
                          <Button
                            type="primary"
                            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            loading={updateTaskStatus.isPending}
                            onClick={async () => {
                              const task = tasks.find(
                                (tk) => tk.id === selectedTaskId,
                              );
                              if (task) await handleToggleTask(task);
                              closeTaskDrawer();
                            }}>
                            {t(
                              "onboarding.employee.home.today_actions.mark_done",
                            )}
                          </Button>
                        )}
                      {canManage &&
                        taskDetail.status === "PENDING_APPROVAL" && (
                          <>
                            <Button
                              type="primary"
                              icon={<ThumbsUp className="h-3.5 w-3.5" />}
                              loading={approveMutation.isPending}
                              onClick={() =>
                                approveMutation.mutate(taskDetail.taskId)
                              }>
                              {t("onboarding.task.action.approve")}
                            </Button>
                            <Button
                              danger
                              icon={<XCircle className="h-3.5 w-3.5" />}
                              loading={rejectMutation.isPending}
                              onClick={() => setRejectModalOpen(true)}>
                              {t("onboarding.task.action.reject")}
                            </Button>
                          </>
                        )}
                      <Button onClick={closeTaskDrawer}>
                        {t("global.close")}
                      </Button>
                    </div>
                  </div>
                ),
              },
              {
                key: "activity",
                label:
                  t("onboarding.detail.task.tab.activity") ?? "Hoạt động",
                children: (
                  <div className="space-y-4 pt-2">
                    {taskDetail.activityLogs &&
                    taskDetail.activityLogs.length > 0 ? (
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
                                <span className="font-medium text-gray-700">
                                  {log.action}
                                </span>
                                {log.newValue && (
                                  <span className="ml-1 text-gray-500">
                                    → {log.newValue}
                                  </span>
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
                          ))}
                        </div>
                      </>
                    ) : (
                      <Empty
                        description={
                          t("onboarding.task.activity.empty") ??
                          "Chưa có hoạt động"
                        }
                        imageStyle={{ height: 40 }}
                      />
                    )}

                    {taskDetail.attachments &&
                      taskDetail.attachments.length > 0 && (
                        <>
                          <Divider orientationMargin={0}>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Paperclip className="h-3 w-3" />
                              {t(
                                "onboarding.employee.home.task_detail.field_attachments",
                              )}
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
                                <span className="flex-1 truncate">
                                  {att.fileName}
                                </span>
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
                ),
              },
              {
                key: "comments",
                label: t("onboarding.task.comments.title") ?? "Bình luận",
                children: (
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
                                  t(
                                    "onboarding.task.comments.unknown_author",
                                  )}
                              </p>
                              <p className="text-sm text-gray-600">
                                {c.message}
                              </p>
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
                        placeholder={t(
                          "onboarding.task.comments.placeholder",
                        )}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onPressEnter={handleAddComment}
                        maxLength={500}
                      />
                      <Button
                        type="primary"
                        icon={<Send className="h-3.5 w-3.5" />}
                        loading={addCommentMutation.isPending}
                        onClick={handleAddComment}
                        disabled={!commentInput.trim()}>
                        {t("onboarding.task.comments.send")}
                      </Button>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <Empty description={t("onboarding.task.detail.not_found")} />
        )}
      </Drawer>

      {/* ── Reject Reason Modal ───────────────────────────────────────────────── */}
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
              t("onboarding.task.reject.placeholder") ??
              "Nhập lý do từ chối..."
            }
            maxLength={500}
          />
        </div>
      </Modal>

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
