import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input, Modal, Skeleton, Tabs } from "antd";
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
  apiUpdateTaskStatus,
  apiGetTaskDetailFull,
  apiListTaskComments,
  apiAcknowledgeTask,
  apiApproveTask,
  apiRejectTask,
  apiAddTaskComment,
} from "@/api/onboarding/onboarding.api";
import { apiGetUserById } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask, mapTemplate } from "@/utils/mappers/onboarding";
import { mapUserDetail } from "@/utils/mappers/identity";
import type { GetUserResponse } from "@/interface/identity";
import type {
  CommentResponse,
  TaskDetailResponse,
} from "@/interface/onboarding";
import { InfoCard } from "./components/InfoCard";
import { TaskListPanel } from "./components/TaskListPanel";
import { TaskDrawer } from "./components/TaskDrawer";
import { StageProgressCard } from "./components/StageProgressCard";
import { STATUS_DONE, STATUS_DONE_API } from "./constants";
import type { OnboardingTask } from "@/shared/types";

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

  // ── Queries ──────────────────────────────────────────────────────────────────

  const {
    data: instance,
    isLoading: instanceLoading,
    isError: instanceError,
    refetch: refetchInstance,
  } = useQuery({
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

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["onboarding-tasks-by-instance", instance?.id ?? instanceId ?? ""],
    queryFn: () => apiListTasks(instance?.id ?? instanceId!),
    enabled: Boolean(instance?.id ?? instanceId),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "tasks",
        "content",
        "items",
        "list",
      ).map(mapTask) as OnboardingTask[],
  });

  const { data: templateDetail } = useQuery({
    queryKey: ["template-detail", instance?.templateId ?? ""],
    queryFn: () => apiGetTemplate(instance?.templateId!),
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
    queryFn: () => apiGetUserById(instance?.employeeUserId!),
    enabled: Boolean(instance?.employeeUserId),
    select: (res: unknown) => mapUserDetail(res as GetUserResponse),
  });

  const { data: managerDetail } = useQuery({
    queryKey: ["user-detail", instance?.managerUserId ?? ""],
    queryFn: () => apiGetUserById(instance?.managerUserId!),
    enabled: Boolean(instance?.managerUserId),
    select: (res: unknown) => mapUserDetail(res as GetUserResponse),
  });

  const { data: taskDetail, isLoading: taskDetailLoading } = useQuery({
    queryKey: ["onboarding-task-detail", selectedTaskId ?? ""],
    queryFn: () => apiGetTaskDetailFull(selectedTaskId!),
    enabled: Boolean(selectedTaskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      return (r?.task ?? r?.data ?? r?.result ?? r?.payload ?? res) as TaskDetailResponse;
    },
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["onboarding-task-comments", selectedTaskId ?? ""],
    queryFn: () => apiListTaskComments(selectedTaskId!),
    enabled: Boolean(selectedTaskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const list = r?.comments ?? r?.data ?? [];
      return (Array.isArray(list) ? list : []) as CommentResponse[];
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
    mutationFn: (id: string) => apiActivateInstance(id),
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

  // ── Derived data ─────────────────────────────────────────────────────────────

  const employeeDisplayName = employeeDetail?.fullName || instance?.employeeName || "-";
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

  const instanceStatus = instance?.status?.toUpperCase() ?? "";
  const isActioning =
    activateInstance.isPending ||
    cancelInstance.isPending ||
    completeInstance.isPending;

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
      await activateInstance.mutateAsync(instanceId);
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

  const handleToggleTask = async (task: OnboardingTask) => {
    const isDone = task.status === STATUS_DONE;
    const nextStatus = isDone ? "TODO" : STATUS_DONE_API;
    try {
      await updateTaskStatus.mutateAsync({ taskId: task.id, status: nextStatus });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
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
          <Button className="mt-4" onClick={() => navigate("/onboarding/employees")}>
            {t("onboarding.detail.back_to_list")}
          </Button>
        </Card>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
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
        isAcknowledging={acknowledgeMutation.isPending}
        isUpdatingStatus={updateTaskStatus.isPending}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isAddingComment={addCommentMutation.isPending}
        onClose={closeTaskDrawer}
        onDrawerTabChange={setDrawerTab}
        onCommentChange={setCommentInput}
        onAddComment={handleAddComment}
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
          }
        }}
        onNavigateNext={() => {
          if (taskIndex >= 0 && taskIndex < tasks.length - 1) {
            setSelectedTaskId(tasks[taskIndex + 1].id);
            setDrawerTab("info");
          }
        }}
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
              t("onboarding.task.reject.placeholder") ??
              "Nhập lý do từ chối..."
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
