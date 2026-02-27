import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/Tabs";
import { Progress } from "../../components/ui/Progress";
import { Pill } from "../../components/ui/Pill";
import { Drawer } from "../../components/ui/Drawer";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import type {
  OnboardingInstance,
  OnboardingTemplate,
  OnboardingTask,
  User,
} from "@/shared/types";

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
      extractList(res, "users", "items").map(mapUser) as User[],
  });
const useUserDetailQuery = (userId: string | undefined) =>
  useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res: any) => mapUserDetail(res),
  });
const useOnboardingTasksByInstanceQuery = (
  onboardingId?: string,
  options?: any,
  enabled = true,
) =>
  useQuery({
    queryKey: ["onboarding-tasks-by-instance", onboardingId ?? "", options],
    queryFn: () => apiListTasks(onboardingId!, options),
    enabled: Boolean(enabled && onboardingId),
    select: (res: any) =>
      extractList(res, "content", "tasks", "items", "list").map(
        mapTask,
      ) as OnboardingTask[],
  });
const useUpdateOnboardingTaskStatus = () =>
  useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });
const useSaveEvaluation = () =>
  useMutation({
    mutationFn: (_payload: any) => Promise.resolve(undefined as any),
  });
import { useToast } from "../../components/ui/Toast";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROLE_LABELS, getPrimaryRole } from "../../shared/rbac";
import { useAppStore } from "../../store/useAppStore";
import type { OnboardingTask } from "../../shared/types";

const STATUS_DONE = "Done";
const STATUS_COMPLETED_API = "DONE";

function EmployeeDetail() {
  const { employeeId: instanceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUser = useAppStore((state) => state.currentUser);
  const isEmployee = Boolean(
    currentUser?.roles?.includes("EMPLOYEE") &&
    !currentUser?.roles?.some((r) => r === "HR" || r === "MANAGER"),
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
  const { data: tasks = [], isLoading: tasksLoading } =
    useOnboardingTasksByInstanceQuery(instance?.id ?? instanceId);
  const updateTaskStatus = useUpdateOnboardingTaskStatus();
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
    (t) => t.id === effectiveInstance?.templateId,
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
      const matchedTasks = tasks.filter((t) => stageTitles.has(t.title));
      const done = matchedTasks.filter((t) => t.status === STATUS_DONE).length;
      const total = stage.tasks.length || 1;
      return {
        name: stage.name,
        done,
        total,
        percent: total ? Math.round((done / total) * 100) : 0,
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
    const nextStatus = isDone ? "PENDING" : STATUS_COMPLETED_API;
    try {
      await updateTaskStatus.mutateAsync({
        taskId: task.id,
        status: nextStatus,
      });
      queryClient.invalidateQueries({
        queryKey: ["onboarding-tasks-by-instance"],
      });
      queryClient.invalidateQueries({ queryKey: ["instance"] });
      toast(isDone ? "Task marked incomplete." : "Task marked complete.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to update task.");
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
          Something went wrong.{" "}
          <button className="font-semibold" onClick={() => refetchInstance()}>
            Retry
          </button>
        </p>
      </Card>
    );
  }

  if (!instanceId || !effectiveInstance) {
    return (
      <div className="space-y-6">
        <PageHeader title="Onboarding" subtitle="Detail" />
        <Card>
          <p className="text-sm text-muted">Onboarding not found.</p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => navigate("/onboarding/employees")}>
            Back to list
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={template?.name ?? "Onboarding"}
        subtitle={
          employeeDisplayName !== "-"
            ? `Chi tiết onboarding — ${employeeDisplayName}`
            : "Track checklist progress and evaluations."
        }
      />

      <Card className="overflow-hidden">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted">Template</p>
            <p className="font-semibold">{template?.name ?? "-"}</p>
            {template?.description ? (
              <p className="text-sm text-muted line-clamp-2">
                {template.description}
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted">Status</p>
            <Pill
              className={
                effectiveInstance.status === "Active"
                  ? "bg-emerald-100 text-emerald-800"
                  : effectiveInstance.status === "Completed"
                    ? "bg-slate-100 text-slate-700"
                    : "bg-amber-100 text-amber-800"
              }>
              {effectiveInstance.status}
            </Pill>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted">
              Start date
            </p>
            <p className="font-medium">{effectiveInstance.startDate || "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted">Progress</p>
            <Progress value={progressPercent} />
            <p className="text-sm text-muted">
              {completedCount} / {totalTasks} tasks
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-6 border-t border-stroke pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted">Employee</p>
            <p className="font-semibold">{employeeDisplayName}</p>
            {employeeDisplayEmail ? (
              <p className="text-sm text-muted">{employeeDisplayEmail}</p>
            ) : null}
            {employee ? (
              <p className="text-sm text-muted">
                {ROLE_LABELS[getPrimaryRole(employee.roles)]}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted">Manager</p>
            <p className="font-medium">{managerDisplayName}</p>
          </div>
        </div>
      </Card>

      <Tabs
        items={[
          { label: "Checklist", value: "checklist" },
          { label: "Evaluations", value: "evaluations" },
          { label: "Activity", value: "activity" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "checklist" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold">Stage progress</h3>
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
                <p className="text-sm text-muted">No stages defined.</p>
              )}
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Tasks</h3>
            {tasksLoading ? (
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
                      className="flex items-center gap-3 rounded-2xl border border-stroke bg-slate-50/50 px-4 py-3">
                      <label className="flex flex-1 cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleTask(task)}
                          disabled={updateTaskStatus.isPending}
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
                          Due: {task.dueDate}
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
                        onClick={() => openTaskDrawer(task)}>
                        Detail
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">
                No tasks for this onboarding yet.
              </p>
            )}
          </Card>
        </div>
      )}

      {tab === "evaluations" && (
        <div className="grid gap-4 lg:grid-cols-3">
          {milestones.map((mile) => (
            <Card key={mile.label}>
              <h3 className="text-lg font-semibold">Day {mile.label}</h3>
              <p className="text-sm text-muted">Status: {mile.status}</p>
              {mile.status !== "Complete" && (
                <Button className="mt-4" onClick={() => setEvalOpen(true)}>
                  Create evaluation
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "activity" && (
        <Card>
          <h3 className="text-lg font-semibold">Activity</h3>
          <div className="mt-4 space-y-3 text-sm">
            {completedCount > 0 ? (
              tasks
                .filter((t) => t.status === STATUS_DONE)
                .map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-stroke bg-slate-50 p-4">
                    Task completed: {t.title}
                  </div>
                ))
            ) : (
              <p className="text-muted">
                No activity yet. Complete tasks to see history here.
              </p>
            )}
          </div>
        </Card>
      )}

      <Drawer
        open={drawerOpen}
        title={selectedTask?.title ?? "Task details"}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTask(null);
        }}>
        <div className="space-y-4">
          {selectedTask ? (
            <>
              <p className="text-sm text-muted">
                Due: {selectedTask.dueDate ?? "—"}
              </p>
              <Pill>{selectedTask.required ? "Required" : "Optional"}</Pill>
              <Button
                onClick={() => selectedTask && handleToggleTask(selectedTask)}
                disabled={updateTaskStatus.isPending}>
                {selectedTask.status === STATUS_DONE
                  ? "Mark incomplete"
                  : "Mark done"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted">Select a task to view details.</p>
          )}
        </div>
      </Drawer>

      <Modal
        open={evalOpen}
        title="Create evaluation"
        onClose={() => setEvalOpen(false)}>
        <div className="grid gap-3 text-sm">
          <label className="grid gap-2">
            Rating (1-5)
            <input
              type="number"
              min={1}
              max={5}
              className="rounded-2xl border border-stroke px-4 py-2"
            />
          </label>
          <label className="grid gap-2">
            Notes
            <textarea
              className="rounded-2xl border border-stroke px-4 py-2"
              rows={3}
            />
          </label>
          <Button
            onClick={async () => {
              await saveEvaluation.mutateAsync({
                employeeId:
                  employeeDetailData?.employeeId ??
                  employee?.employeeId ??
                  effectiveInstance?.employeeId,
                milestone: "30",
                rating: 4,
              });
              setEvalOpen(false);
            }}>
            Save evaluation
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default EmployeeDetail;
