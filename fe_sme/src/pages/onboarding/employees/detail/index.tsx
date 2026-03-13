import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Tabs } from "@core/components/ui/Tabs";
import { Button } from "@core/components/ui/Button";
import { Modal } from "@core/components/ui/Modal";
import { Skeleton } from "@core/components/ui/Skeleton";
import { useToast } from "@core/components/ui/Toast";
import { isOnboardingEmployee, canManageOnboarding } from "@/shared/rbac";
import { useUserStore } from "@/stores/user.store";
import { useGlobalStore } from "@/stores/global.store";
import { useLocale } from "@/i18n";
import { EvaluationModal } from "./EvaluationModal";
import { InfoCard } from "./InfoCard";
import { StageProgressPanel } from "./StageProgressPanel";
import { TaskListPanel } from "./TaskListPanel";
import { TaskDrawer } from "./TaskDrawer";
import { EvaluationsPanel } from "./EvaluationsPanel";
import { ActivityPanel } from "./ActivityPanel";
import {
  useInstanceQuery,
  useUserDetailQuery,
  useActivateInstance,
  useCancelInstance,
  useCompleteInstance,
  useTemplateDetailQuery,
} from "./hooks";
import {
  STATUS_DONE,
  STATUS_DONE_API,
  useInstancesQuery,
  useTasksQuery,
  useUpdateTaskStatus,
  useUsersQuery,
} from "../hooks";
import { useTemplatesQuery } from "../../templates/hooks";
import type { OnboardingTask } from "@/shared/types";

const EmployeeDetail = () => {
  const { employeeId: instanceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLocale();
  const currentUser = useUserStore((state) => state.currentUser);
  const setBreadcrumbs = useGlobalStore((state) => state.setBreadcrumbs);
  const isEmployee = isOnboardingEmployee(currentUser?.roles ?? []);
  const canManage = canManageOnboarding(currentUser?.roles ?? []);

  // ── Queries ──────────────────────────────────────────────────────────────────

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
  const evaluations: never[] = [];
  const { data: templateDetail } = useTemplateDetailQuery(instance?.templateId);

  // ── Local state ──────────────────────────────────────────────────────────────

  const [tab, setTab] = useState("checklist");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "cancel" | "complete" | null
  >(null);
  const [evalModal, setEvalModal] = useState<{
    open: boolean;
    milestone: "7" | "30" | "60";
  } | null>(null);

  // ── Derived data ─────────────────────────────────────────────────────────────

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

  const milestones = useMemo(
    () =>
      (["7", "30", "60"] as const).map((day) => ({
        label: day,
        completed: evaluations.some((e) => e.milestone === day),
      })),
    [evaluations],
  );

  const instanceStatus = effectiveInstance?.status?.toUpperCase() ?? "";

  // ── Handlers ─────────────────────────────────────────────────────────────────

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
      toast(t("onboarding.detail.toast.activated"));
    } catch {
      toast(t("onboarding.detail.toast.action_failed"));
    }
  };

  const handleCancel = async () => {
    if (!instanceId) return;
    try {
      await cancelInstance.mutateAsync(instanceId);
      queryClient.invalidateQueries({ queryKey: ["instance", instanceId] });
      queryClient.invalidateQueries({ queryKey: ["instances"] });
      toast(t("onboarding.detail.toast.cancelled"));
      setConfirmAction(null);
    } catch {
      toast(t("onboarding.detail.toast.action_failed"));
    }
  };

  const handleComplete = async () => {
    if (!instanceId) return;
    try {
      await completeInstance.mutateAsync(instanceId);
      queryClient.invalidateQueries({ queryKey: ["instance", instanceId] });
      queryClient.invalidateQueries({ queryKey: ["instances"] });
      toast(t("onboarding.detail.toast.completed"));
      setConfirmAction(null);
    } catch {
      toast(t("onboarding.detail.toast.action_failed"));
    }
  };

  const handleToggleTask = async (task: OnboardingTask) => {
    const isDone = task.status === STATUS_DONE;
    const nextStatus = isDone ? "PENDING" : STATUS_DONE_API;
    try {
      await updateTaskStatus.mutateAsync({
        taskId: task.id,
        status: nextStatus,
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
      queryClient.invalidateQueries({ queryKey: ["instance"] });
      toast(
        isDone
          ? t("onboarding.detail.toast.task_undone")
          : t("onboarding.detail.toast.task_done"),
      );
    } catch {
      toast(t("onboarding.detail.toast.task_failed"));
    }
  };

  const openTaskDrawer = (task: OnboardingTask) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  // ── Loading / Error / Not Found states ──────────────────────────────────────

  if (instanceLoading && !effectiveInstance) {
    return <Skeleton className="h-64" />;
  }

  if (instanceError && !effectiveInstance) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("onboarding.detail.title_fallback")}
          subtitle={t("onboarding.detail.subtitle")}
        />
        <Card>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-medium text-ink">
              {t("onboarding.detail.error.something_wrong")}
            </p>
            <Button variant="secondary" onClick={() => refetchInstance()}>
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
        <PageHeader
          title={t("onboarding.detail.title_fallback")}
          subtitle={t("onboarding.detail.subtitle")}
        />
        <Card>
          <p className="text-sm text-muted">
            {t("onboarding.detail.not_found")}
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => navigate("/onboarding/employees")}>
            {t("onboarding.detail.back_to_list")}
          </Button>
        </Card>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          employeeDisplayName !== "-"
            ? employeeDisplayName
            : (template?.name ?? t("onboarding.detail.title_fallback"))
        }
        subtitle={template?.name ?? t("onboarding.detail.subtitle")}
        extra={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/onboarding/employees")}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("global.back")}
            </Button>
            {canManage && instanceStatus === "DRAFT" && (
              <Button
                variant="primary"
                onClick={handleActivate}
                disabled={isActioning}>
                {t("onboarding.detail.action.activate")}
              </Button>
            )}
            {canManage && instanceStatus === "ACTIVE" && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmAction("cancel")}
                  disabled={isActioning}>
                  {t("onboarding.detail.action.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setConfirmAction("complete")}
                  disabled={isActioning}>
                  {t("onboarding.detail.action.complete")}
                </Button>
              </>
            )}
          </div>
        }
      />

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
        items={[
          { label: t("onboarding.detail.tab.checklist"), value: "checklist" },
          {
            label: t("onboarding.detail.tab.evaluations"),
            value: "evaluations",
          },
          { label: t("onboarding.detail.tab.activity"), value: "activity" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "checklist" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <StageProgressPanel stageProgress={stageProgress} />
          <TaskListPanel
            tasks={tasks}
            isLoading={tasksLoading}
            isUpdating={updateTaskStatus.isPending}
            onToggle={handleToggleTask}
            onOpenDrawer={openTaskDrawer}
          />
        </div>
      )}

      {tab === "evaluations" && (
        <EvaluationsPanel
          milestones={milestones}
          onCreateEval={(milestone) => setEvalModal({ open: true, milestone })}
        />
      )}

      {tab === "activity" && (
        <ActivityPanel tasks={tasks} completedCount={completedCount} />
      )}

      <TaskDrawer
        open={drawerOpen}
        task={selectedTask}
        isUpdating={updateTaskStatus.isPending}
        onToggle={handleToggleTask}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTask(null);
        }}
      />

      <Modal
        open={confirmAction === "cancel"}
        title={t("onboarding.detail.action.confirm_cancel_title")}
        onClose={() => setConfirmAction(null)}>
        <div className="grid gap-4">
          <p className="text-sm text-muted">
            {t("onboarding.detail.action.confirm_cancel_desc")}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setConfirmAction(null)}
              disabled={isActioning}>
              {t("global.cancel_action")}
            </Button>
            <Button onClick={handleCancel} disabled={isActioning}>
              {t("onboarding.detail.action.confirm")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmAction === "complete"}
        title={t("onboarding.detail.action.confirm_complete_title")}
        onClose={() => setConfirmAction(null)}>
        <div className="grid gap-4">
          <p className="text-sm text-muted">
            {t("onboarding.detail.action.confirm_complete_desc")}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setConfirmAction(null)}
              disabled={isActioning}>
              {t("global.cancel_action")}
            </Button>
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={isActioning}>
              {t("onboarding.detail.action.confirm")}
            </Button>
          </div>
        </div>
      </Modal>

      {evalModal && instanceId && (
        <EvaluationModal
          open={evalModal.open}
          instanceId={instanceId}
          milestone={evalModal.milestone}
          onClose={() => setEvalModal(null)}
        />
      )}
    </div>
  );
};

export default EmployeeDetail;
