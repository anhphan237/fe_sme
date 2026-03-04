import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  apiListInstances,
  apiListTemplates,
  apiListTasks,
  apiUpdateTaskStatus,
} from "@/api/onboarding/onboarding.api";
import { apiSearchUsers, apiGetUserById } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTemplate, mapTask } from "@/utils/mappers/onboarding";
import { mapUser, mapUserDetail } from "@/utils/mappers/identity";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/i18n";
import type {
  OnboardingInstance,
  OnboardingTemplate,
  OnboardingTask,
  User,
} from "@/shared/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_DONE = "Done";
const STATUS_DONE_API = "DONE";

// ── Hooks ─────────────────────────────────────────────────────────────────────

const useInstanceQuery = (instanceId?: string) =>
  useQuery({
    queryKey: ["instance", instanceId],
    queryFn: () => apiGetInstance(instanceId!),
    enabled: Boolean(instanceId),
    select: (res: any) => {
      const raw =
        res?.instance ?? res?.data ?? res?.result ?? res?.payload ?? res;
      return mapInstance(raw && typeof raw === "object" ? raw : {});
    },
  });

const useInstancesQuery = (
  filters?: { employeeId?: string; status?: string },
  enabled = true,
) =>
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
    select: (res: any) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
  });

const useTemplatesQuery = () =>
  useQuery({
    queryKey: ["templates"],
    queryFn: () => apiListTemplates(),
    select: (res: any) =>
      extractList(res, "templates", "items", "list").map(
        mapTemplate,
      ) as OnboardingTemplate[],
  });

const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: any) =>
      (extractList(res, "users", "items") as any[]).map(mapUser) as User[],
  });

const useUserDetailQuery = (userId?: string) =>
  useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res: any) => mapUserDetail(res),
  });

const useTasksQuery = (onboardingId?: string) =>
  useQuery({
    queryKey: ["onboarding-tasks-by-instance", onboardingId ?? ""],
    queryFn: () => apiListTasks(onboardingId!),
    enabled: Boolean(onboardingId),
    select: (res: any) =>
      extractList(res, "content", "tasks", "items", "list").map(
        mapTask,
      ) as OnboardingTask[],
  });

const useUpdateTaskStatus = () =>
  useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

const useSaveEvaluation = () =>
  useMutation({
    mutationFn: (_payload: any) => Promise.resolve(undefined as any),
  });

// ── Components ────────────────────────────────────────────────────────────────

function InstanceStatusPill({ status }: { status: string }) {
  const cls =
    status === "Active" || status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Completed" || status === "COMPLETED"
        ? "bg-slate-100 text-slate-700"
        : "bg-amber-100 text-amber-800";
  return <Pill className={cls}>{status}</Pill>;
}

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
  t,
}: {
  instance: OnboardingInstance;
  template?: OnboardingTemplate;
  employeeDisplayName: string;
  employeeDisplayEmail: string | null;
  employee?: User;
  managerDisplayName: string;
  completedCount: number;
  totalTasks: number;
  progressPercent: number;
  t: (k: string, v?: Record<string, any>) => string;
}) {
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
          <InstanceStatusPill status={instance.status} />
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
  t,
}: {
  stageProgress: {
    name: string;
    done: number;
    total: number;
    percent: number;
  }[];
  t: (k: string) => string;
}) {
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
  t,
}: {
  tasks: OnboardingTask[];
  isLoading: boolean;
  isUpdating: boolean;
  onToggle: (task: OnboardingTask) => void;
  onOpenDrawer: (task: OnboardingTask) => void;
  t: (k: string) => string;
}) {
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
                    className="h-4 w-4 rounded border-stroke text-[#0071e3]"
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
                    {t("onboarding.detail.task.due").replace(
                      "{date}",
                      task.dueDate,
                    )}
                  </span>
                )}
                <Pill
                  className={
                    isDone
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }>
                  {task.status ?? "Pending"}
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
  t,
}: {
  open: boolean;
  task: OnboardingTask | null;
  isUpdating: boolean;
  onToggle: (task: OnboardingTask) => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  return (
    <Drawer
      open={open}
      title={task?.title ?? t("onboarding.detail.task.title")}
      onClose={onClose}>
      <div className="space-y-4">
        {task ? (
          <>
            <p className="text-sm text-muted">
              {t("onboarding.detail.task.due").replace(
                "{date}",
                task.dueDate ?? "—",
              )}
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
  t,
}: {
  milestones: { label: string; status: string }[];
  onCreateEval: () => void;
  t: (k: string, v?: Record<string, any>) => string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {milestones.map((mile) => (
        <Card key={mile.label}>
          <h3 className="text-lg font-semibold">
            {t("onboarding.detail.eval.day", { day: mile.label })}
          </h3>
          <p className="text-sm text-muted">
            {t("onboarding.detail.eval.status", { status: mile.status })}
          </p>
          {mile.status !== "Complete" && (
            <Button className="mt-4" onClick={onCreateEval}>
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
  t,
}: {
  tasks: OnboardingTask[];
  completedCount: number;
  t: (k: string, v?: Record<string, any>) => string;
}) {
  return (
    <Card>
      <h3 className="text-lg font-semibold">
        {t("onboarding.detail.activity.title")}
      </h3>
      <div className="mt-4 space-y-3 text-sm">
        {completedCount > 0 ? (
          tasks
            .filter((t) => t.status === STATUS_DONE)
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

function EvaluationModal({
  open,
  onClose,
  onSave,
  isLoading,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (rating: number, notes: string) => void;
  isLoading: boolean;
  t: (k: string) => string;
}) {
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");
  return (
    <Modal
      open={open}
      title={t("onboarding.detail.eval.modal.title")}
      onClose={onClose}>
      <div className="grid gap-4 text-sm">
        <label className="grid gap-1.5 font-medium">
          {t("onboarding.detail.eval.rating")}
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="rounded-lg border border-stroke px-3 py-2"
          />
        </label>
        <label className="grid gap-1.5 font-medium">
          {t("onboarding.detail.eval.notes")}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg border border-stroke px-3 py-2"
            rows={3}
          />
        </label>
        <Button onClick={() => onSave(rating, notes)} disabled={isLoading}>
          {t("onboarding.detail.eval.save")}
        </Button>
      </div>
    </Modal>
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
  const isEmployee = Boolean(
    currentUser?.roles?.includes("EMPLOYEE") &&
    !currentUser?.roles?.some((r: string) => r === "HR" || r === "MANAGER"),
  );

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
  );
  const { data: templates } = useTemplatesQuery();
  const { data: users } = useUsersQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery(
    instance?.id ?? instanceId,
  );
  const updateTaskStatus = useUpdateTaskStatus();
  const saveEvaluation = useSaveEvaluation();

  const [tab, setTab] = useState("checklist");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);
  const [evalOpen, setEvalOpen] = useState(false);

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
  const template = templates?.find(
    (tpl) => tpl.id === effectiveInstance?.templateId,
  );

  const completedCount = tasks.filter((t) => t.status === STATUS_DONE).length;
  const totalTasks = tasks.length;
  const progressPercent =
    totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100)
      : (effectiveInstance?.progress ?? 0);

  const stageProgress = useMemo(() => {
    if (!template?.stages?.length) return [];
    return template.stages.map((stage) => {
      const stageTitles = new Set(stage.tasks.map((t) => t.title));
      const matched = tasks.filter((t) => stageTitles.has(t.title));
      const done = matched.filter((t) => t.status === STATUS_DONE).length;
      const total = stage.tasks.length || 1;
      return {
        name: stage.name,
        done,
        total,
        percent: Math.round((done / total) * 100),
      };
    });
  }, [template?.stages, tasks]);

  const milestones = useMemo(
    () => [
      { label: "7", status: "Complete" },
      { label: "30", status: "Pending" },
      { label: "60", status: "Pending" },
    ],
    [],
  );

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
      <Card>
        <p className="text-sm">
          {t("onboarding.detail.error.something_wrong")}{" "}
          <button className="font-semibold" onClick={() => refetchInstance()}>
            {t("onboarding.detail.error.retry")}
          </button>
        </p>
      </Card>
    );
  }

  if (!instanceId || !effectiveInstance) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Onboarding"
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={template?.name ?? "Onboarding"}
        subtitle={t("onboarding.detail.subtitle")}
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
        t={t}
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
          <StageProgressPanel stageProgress={stageProgress} t={t} />
          <TaskListPanel
            tasks={tasks}
            isLoading={tasksLoading}
            isUpdating={updateTaskStatus.isPending}
            onToggle={handleToggleTask}
            onOpenDrawer={openTaskDrawer}
            t={t}
          />
        </div>
      )}

      {tab === "evaluations" && (
        <EvaluationsPanel
          milestones={milestones}
          onCreateEval={() => setEvalOpen(true)}
          t={t}
        />
      )}

      {tab === "activity" && (
        <ActivityPanel tasks={tasks} completedCount={completedCount} t={t} />
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
        t={t}
      />

      <EvaluationModal
        open={evalOpen}
        onClose={() => setEvalOpen(false)}
        onSave={async (rating) => {
          await saveEvaluation.mutateAsync({
            employeeId:
              employeeDetailData?.employeeId ??
              employee?.employeeId ??
              effectiveInstance?.employeeId,
            milestone: "30",
            rating,
          });
          setEvalOpen(false);
        }}
        isLoading={saveEvaluation.isPending}
        t={t}
      />
    </div>
  );
}

export default EmployeeDetail;
