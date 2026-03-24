import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Drawer, Progress, Skeleton, Tabs, Tag } from "antd";
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
} from "@/api/onboarding/onboarding.api";
import { apiGetUserById, apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask, mapTemplate } from "@/utils/mappers/onboarding";
import { mapUser, mapUserDetail } from "@/utils/mappers/identity";
import type { GetUserResponse } from "@/interface/identity";
import { InfoCard } from "./InfoCard";
import { TaskListPanel } from "./TaskListPanel";
import type {
  OnboardingInstance,
  OnboardingTask,
  OnboardingTemplate,
  User,
} from "@/shared/types";

// ── Inline hooks (from ./hooks + ../hooks) ──────────────────────────────────────────────

const STATUS_DONE = "Done";
const STATUS_DONE_API = "DONE";

interface InstancesFilter {
  employeeId?: string;
  status?: string;
}

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
    select: (res: unknown) => mapTemplate(res as Record<string, unknown>),
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
  const { data: templateDetail } = useTemplateDetailQuery(instance?.templateId);

  // ── Local state ──────────────────────────────────────────────────────────────

  const [tab, setTab] = useState("checklist");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "cancel" | "complete" | null
  >(null);

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
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  // ── Loading / Error / Not Found states ──────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────

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
            onToggle={handleToggleTask}
            onOpenDrawer={openTaskDrawer}
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

      <Drawer
        open={drawerOpen}
        title={selectedTask?.title ?? t("onboarding.detail.task.title")}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTask(null);
        }}>
        <div className="space-y-4">
          {selectedTask ? (
            <>
              <p className="text-sm text-muted">
                {t("onboarding.detail.task.due", {
                  date: selectedTask.dueDate ?? "—",
                })}
              </p>
              <Tag>
                {selectedTask.required
                  ? t("onboarding.detail.task.required")
                  : t("onboarding.detail.task.optional")}
              </Tag>
              <Button
                onClick={() => handleToggleTask(selectedTask)}
                disabled={updateTaskStatus.isPending}>
                {selectedTask.status === STATUS_DONE
                  ? t("onboarding.detail.task.mark_incomplete")
                  : t("onboarding.detail.task.mark_done")}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted">
              {t("onboarding.detail.task.empty")}
            </p>
          )}
        </div>
      </Drawer>

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
