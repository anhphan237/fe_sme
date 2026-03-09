import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Progress } from "@/components/ui/Progress";
import { Pill } from "@/components/ui/Pill";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  apiGetInstance,
  apiGetTemplate,
  apiListEvaluations,
  apiActivateInstance,
  apiCancelInstance,
  apiCompleteInstance,
} from "@/api/onboarding/onboarding.api";
import { apiGetUserById } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTemplate } from "@/utils/mappers/onboarding";
import { mapUserDetail } from "@/utils/mappers/identity";
import {
  ROLE_LABELS,
  getPrimaryRole,
  isOnboardingEmployee,
  canManageOnboarding,
} from "@/shared/rbac";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/i18n";
import { EvaluationModal } from "./components/EvaluationModal";
import { CommentThread } from "./components/CommentThread";
import { InstanceStatusBadge } from "../components/InstanceStatusBadge";
import {
  STATUS_DONE,
  STATUS_DONE_API,
  useInstancesQuery,
  useTasksQuery,
  useUpdateTaskStatus,
  useUsersQuery,
} from "../hooks";
import { useTemplatesQuery } from "../../templates/hooks";
import type { OnboardingInstance, OnboardingTask, User } from "@/shared/types";
import type { EvaluationResponse } from "@/interface/onboarding";
import type { GetUserResponse } from "@/interface/identity";

// ── Local Hooks ────────────────────────────────────────────────────────────────

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

const useEvaluationsQuery = (instanceId?: string) =>
  useQuery({
    queryKey: ["evaluations", instanceId ?? ""],
    queryFn: () => apiListEvaluations({ instanceId: instanceId! }),
    enabled: Boolean(instanceId),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "evaluations",
        "items",
        "list",
      ) as EvaluationResponse[],
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
    select: (res: unknown) => mapTemplate(res as Record<string, unknown>),
  });

// ── Components ────────────────────────────────────────────────────────────────

function InfoCard({
  instance,
  template,
  employeeDisplayName,
  employeeDisplayEmail,
  employee,
  managerDisplayName,
  completedCount,
  totalTasks,
  progressPercent,
}: {
  instance: OnboardingInstance;
  template?: { name?: string; description?: string } | undefined;
  employeeDisplayName: string;
  employeeDisplayEmail: string | null;
  employee?: User;
  managerDisplayName: string;
  completedCount: number;
  totalTasks: number;
  progressPercent: number;
}) {
  const { t } = useLocale();
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.template")}
          </p>
          <p className="font-semibold">{template?.name ?? "-"}</p>
          {template?.description && (
            <p className="line-clamp-2 text-sm text-muted">
              {template.description}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.status")}
          </p>
          <InstanceStatusBadge status={instance.status} />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.start_date")}
          </p>
          <p className="font-medium">{instance.startDate || "-"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.progress")}
          </p>
          <Progress value={progressPercent} />
          <p className="text-sm text-muted">
            {t("onboarding.detail.info.tasks_summary", {
              completed: completedCount,
              total: totalTasks,
            })}
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 border-t border-stroke pt-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.employee")}
          </p>
          <p className="font-semibold">{employeeDisplayName}</p>
          {employeeDisplayEmail && (
            <p className="text-sm text-muted">{employeeDisplayEmail}</p>
          )}
          {employee && (
            <p className="text-sm text-muted">
              {ROLE_LABELS[getPrimaryRole(employee.roles)]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.manager")}
          </p>
          <p className="font-medium">{managerDisplayName}</p>
        </div>
      </div>
    </Card>
  );
}

function StageProgressPanel({
  stageProgress,
}: {
  stageProgress: {
    name: string;
    done: number;
    total: number;
    percent: number;
  }[];
}) {
  const { t } = useLocale();
  return (
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
              <Progress value={s.percent} />
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">
            {t("onboarding.detail.stage.empty")}
          </p>
        )}
      </div>
    </Card>
  );
}

function TaskListPanel({
  tasks,
  isLoading,
  isUpdating,
  onToggle,
  onOpenDrawer,
}: {
  tasks: OnboardingTask[];
  isLoading: boolean;
  isUpdating: boolean;
  onToggle: (task: OnboardingTask) => void;
  onOpenDrawer: (task: OnboardingTask) => void;
}) {
  const { t } = useLocale();
  return (
    <Card>
      <h3 className="text-lg font-semibold">
        {t("onboarding.detail.task.title")}
      </h3>
      {isLoading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : tasks.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => {
            const isDone = task.status === STATUS_DONE;
            return (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-stroke bg-slate-50/50 px-4 py-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => onToggle(task)}
                    disabled={isUpdating}
                    className="h-4 w-4 rounded border-stroke text-brand"
                  />
                  <span
                    className={
                      isDone ? "text-muted line-through" : "font-medium"
                    }>
                    {task.title}
                  </span>
                </label>
                {task.dueDate && (
                  <span className="text-xs text-muted">
                    {t("onboarding.detail.task.due", { date: task.dueDate })}
                  </span>
                )}
                <Pill
                  className={
                    isDone
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }>
                  {task.status ?? t("onboarding.detail.task.status.pending")}
                </Pill>
                <Button
                  variant="ghost"
                  className="py-1.5 text-xs"
                  onClick={() => onOpenDrawer(task)}>
                  {t("onboarding.detail.task.detail")}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">
          {t("onboarding.detail.task.empty")}
        </p>
      )}
    </Card>
  );
}

function TaskDrawer({
  open,
  task,
  isUpdating,
  onToggle,
  onClose,
}: {
  open: boolean;
  task: OnboardingTask | null;
  isUpdating: boolean;
  onToggle: (task: OnboardingTask) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  return (
    <Drawer
      open={open}
      title={task?.title ?? t("onboarding.detail.task.title")}
      onClose={onClose}>
      <div className="space-y-4">
        {task ? (
          <>
            <p className="text-sm text-muted">
              {t("onboarding.detail.task.due", { date: task.dueDate ?? "—" })}
            </p>
            <Pill>
              {task.required
                ? t("onboarding.detail.task.required")
                : t("onboarding.detail.task.optional")}
            </Pill>
            <Button onClick={() => onToggle(task)} disabled={isUpdating}>
              {task.status === STATUS_DONE
                ? t("onboarding.detail.task.mark_incomplete")
                : t("onboarding.detail.task.mark_done")}
            </Button>
            <CommentThread taskId={task.id} />
          </>
        ) : (
          <p className="text-sm text-muted">
            {t("onboarding.detail.task.empty")}
          </p>
        )}
      </div>
    </Drawer>
  );
}

function EvaluationsPanel({
  milestones,
  onCreateEval,
}: {
  milestones: { label: "7" | "30" | "60"; completed: boolean }[];
  onCreateEval: (milestone: "7" | "30" | "60") => void;
}) {
  const { t } = useLocale();
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {milestones.map((mile) => (
        <Card key={mile.label}>
          <h3 className="text-lg font-semibold">
            {t("onboarding.detail.eval.day", { day: mile.label })}
          </h3>
          <p className="text-sm text-muted">
            {mile.completed
              ? t("onboarding.detail.eval.status_completed")
              : t("onboarding.detail.eval.status_pending")}
          </p>
          {!mile.completed && (
            <Button className="mt-4" onClick={() => onCreateEval(mile.label)}>
              {t("onboarding.detail.eval.create")}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}

function ActivityPanel({
  tasks,
  completedCount,
}: {
  tasks: OnboardingTask[];
  completedCount: number;
}) {
  const { t } = useLocale();
  return (
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
          <p className="text-muted">{t("onboarding.detail.activity.empty")}</p>
        )}
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function EmployeeDetail() {
  const { employeeId: instanceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLocale();
  const currentUser = useAppStore((state) => state.currentUser);
  const setBreadcrumbs = useAppStore((state) => state.setBreadcrumbs);
  const isEmployee = isOnboardingEmployee(currentUser?.roles ?? []);
  const canManage = canManageOnboarding(currentUser?.roles ?? []);

  const {
    data: instance,
    isLoading: instanceLoading,
    isError: instanceError,
    refetch: refetchInstance,
  } = useInstanceQuery(instanceId);

  // Fallback: only fetch instance list when main query fails and user is an employee
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
  const { data: evaluations = [] } = useEvaluationsQuery(instanceId);
  const { data: templateDetail } = useTemplateDetailQuery(instance?.templateId);

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

  // Use full template detail (with stages) for accurate progress calculation
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

  const isActioning =
    activateInstance.isPending ||
    cancelInstance.isPending ||
    completeInstance.isPending;

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

  const actionButtons = (
    <div className="flex items-center gap-2">
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
  );

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
            {instanceId && actionButtons}
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
}

export default EmployeeDetail;
