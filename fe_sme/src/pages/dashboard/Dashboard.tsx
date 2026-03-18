import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, DatePicker, Progress, Select, Skeleton } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, ClipboardList, TrendingUp, Users } from "lucide-react";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { isPlatformRole } from "@/shared/rbac";
import {
  apiGetCompanyOnboardingByDepartment,
  apiGetCompanyOnboardingFunnel,
  apiGetCompanyOnboardingSummary,
  apiGetCompanyTaskCompletion,
} from "@/api/admin/admin.api";
import {
  apiListInstances,
  apiListTasks,
} from "@/api/onboarding/onboarding.api";
import { apiGetDocuments } from "@/api/document/document.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import type { OnboardingInstance } from "@/shared/types";
import type { OnboardingTask } from "@/shared/types";
import StatusTag, { COMMON_STATUS } from "@/core/components/Status/StatusTag";

type DashboardDocument = {
  documentId: string;
  name: string;
  status?: string;
};

type StageVolume = {
  stage: string;
  value: number;
};

type DashboardSummary = {
  totalEmployees?: number;
  completedCount?: number;
  totalOnboardings?: number;
  activeOnboardings?: number;
  completedOnboardings?: number;
};

type DashboardFunnel = {
  stages?: Array<{ stage?: string; count?: number }>;
  activeCount?: number;
  completedCount?: number;
  cancelledCount?: number;
  otherCount?: number;
};

type DashboardTaskCompletion = {
  totalTasks?: number;
  completedTasks?: number;
  completionRate?: number;
};

type DashboardDepartmentStat = {
  departmentId: string;
  departmentName: string;
  totalTasks: number;
  completedTasks: number;
};

type TaskQueryFilters = {
  onboardingId?: string;
  status?: string;
  assignedUserId?: string;
};

const FUNNEL_COLORS = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"];
const TASK_STATUS_COLORS = ["#eab308", "#3b82f6", "#16a34a"];

const BE_TASK_STATUS_MAP: Record<string, string> = {
  Pending: "TODO",
  "In Progress": "IN_PROGRESS",
  Done: "DONE",
};

// ---- Query hooks ----

function useInstancesQuery(
  filters?: { employeeId?: string; status?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ["instances", filters?.employeeId ?? "", filters?.status ?? ""],
    queryFn: () =>
      apiListInstances({
        employeeId: filters?.employeeId,
        status: filters?.status,
      }),
    enabled,
    select: (res: unknown) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
  });
}

function useDocumentsQuery(enabled = true) {
  return useQuery({
    queryKey: ["documents"],
    queryFn: apiGetDocuments,
    enabled,
    select: (res: unknown) =>
      extractList<DashboardDocument>(res, "items", "documents", "list"),
  });
}

function useTasksQuery(filters?: TaskQueryFilters, enabled = true) {
  return useQuery({
    queryKey: [
      "dashboard-tasks",
      filters?.onboardingId ?? "",
      filters?.status ?? "",
      filters?.assignedUserId ?? "",
    ],
    queryFn: () =>
      apiListTasks(filters?.onboardingId ?? "", {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.assignedUserId
          ? { assignedUserId: filters.assignedUserId }
          : {}),
        size: 20,
        sortBy: "due_date",
        sortOrder: "ASC",
      }),
    enabled: enabled && Boolean(filters?.onboardingId),
    select: (res: unknown) =>
      extractList(res, "tasks", "items", "list").map(
        mapTask,
      ) as OnboardingTask[],
  });
}

function useSummaryQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "dashboard-summary",
      companyId ?? "",
      startDate ?? "",
      endDate ?? "",
    ],
    queryFn: () =>
      apiGetCompanyOnboardingSummary({
        companyId: companyId ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      }),
    enabled:
      enabled && Boolean(companyId) && Boolean(startDate) && Boolean(endDate),
  });
}

function useFunnelQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "dashboard-funnel",
      companyId ?? "",
      startDate ?? "",
      endDate ?? "",
    ],
    queryFn: () =>
      apiGetCompanyOnboardingFunnel({
        companyId: companyId ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      }),
    enabled:
      enabled && Boolean(companyId) && Boolean(startDate) && Boolean(endDate),
  });
}

function useTaskCompletionQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "dashboard-task-completion",
      companyId ?? "",
      startDate ?? "",
      endDate ?? "",
    ],
    queryFn: () =>
      apiGetCompanyTaskCompletion({
        companyId: companyId ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      }),
    enabled:
      enabled && Boolean(companyId) && Boolean(startDate) && Boolean(endDate),
  });
}

function useByDepartmentQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "dashboard-by-department",
      companyId ?? "",
      startDate ?? "",
      endDate ?? "",
    ],
    queryFn: () =>
      apiGetCompanyOnboardingByDepartment({
        companyId: companyId ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      }),
    enabled:
      enabled && Boolean(companyId) && Boolean(startDate) && Boolean(endDate),
  });
}

// ---- Sub-components ----

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "teal" | "emerald" | "amber" | "indigo";
}) {
  const toneClass: Record<typeof tone, string> = {
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };

  return (
    <Card
      size="small"
      className="overflow-hidden border border-stroke bg-white shadow-sm transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${toneClass[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton.Input key={i} active block size="small" />
      ))}
    </div>
  );
}

function mapDocumentStatus(value?: string): COMMON_STATUS {
  const normalized = (value ?? "").toUpperCase();
  if (
    normalized.includes("DONE") ||
    normalized.includes("PROCESSED") ||
    normalized.includes("ACK")
  ) {
    return COMMON_STATUS.PROCESSED;
  }
  if (
    normalized.includes("IN_PROGRESS") ||
    normalized.includes("PROCESSING") ||
    normalized.includes("REVIEW")
  ) {
    return COMMON_STATUS.PROCESSING;
  }
  return COMMON_STATUS.PENDING;
}

function formatDueDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inRange(date: Date | null, start?: string, end?: string) {
  if (!date) return false;
  if (!start || !end) return true;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59`);
  return date >= startDate && date <= endDate;
}

const Dashboard = () => {
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const currentTenant = useUserStore((s) => s.currentTenant);
  const isPlatformUser = isPlatformRole(currentUser?.roles ?? []);
  const companyId = currentTenant?.id ?? currentUser?.companyId ?? undefined;
  const shouldLoadOnboardingData = !isPlatformUser;

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("");

  const startDate = dateRange[0]?.format("YYYY-MM-DD");
  const endDate = dateRange[1]?.format("YYYY-MM-DD");
  const hasDateRange = Boolean(startDate && endDate);
  const analyticsEnabled =
    shouldLoadOnboardingData && Boolean(companyId) && hasDateRange;

  const {
    data: instances = [],
    isLoading: instancesLoading,
    isError: isInstancesError,
    refetch: refetchInstances,
  } = useInstancesQuery(
    statusFilter ? { status: statusFilter } : undefined,
    shouldLoadOnboardingData,
  );

  const { data: documents = [], isLoading: docsLoading } = useDocumentsQuery(
    shouldLoadOnboardingData,
  );

  const filteredInstances = useMemo(
    () =>
      instances.filter((instance) => {
        const startedAt = parseDate(instance.startDate);
        return inRange(startedAt, startDate, endDate);
      }),
    [instances, startDate, endDate],
  );

  const latestInstance = filteredInstances
    .slice()
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))[0];

  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: isTasksError,
    refetch: refetchTasks,
  } = useTasksQuery(
    {
      onboardingId: latestInstance?.id,
      assignedUserId: assigneeFilter || undefined,
      status: taskStatusFilter
        ? BE_TASK_STATUS_MAP[taskStatusFilter]
        : undefined,
    },
    shouldLoadOnboardingData,
  );

  const { data: summaryRaw, isLoading: summaryLoading } = useSummaryQuery(
    companyId,
    startDate,
    endDate,
    analyticsEnabled,
  );
  const { data: funnelRaw, isLoading: funnelLoading } = useFunnelQuery(
    companyId,
    startDate,
    endDate,
    analyticsEnabled,
  );
  const { data: taskCompletionRaw, isLoading: taskCompletionLoading } =
    useTaskCompletionQuery(companyId, startDate, endDate, analyticsEnabled);
  const { data: byDepartmentRaw, isLoading: byDepartmentLoading } =
    useByDepartmentQuery(companyId, startDate, endDate, analyticsEnabled);

  const summary = (summaryRaw ?? {}) as DashboardSummary;
  const funnel = (funnelRaw ?? {}) as DashboardFunnel;
  const taskCompletion = (taskCompletionRaw ?? {}) as DashboardTaskCompletion;
  const byDepartment = (byDepartmentRaw ?? {
    departments: [],
  }) as { departments?: DashboardDepartmentStat[] };

  const activeInstances = filteredInstances.filter(
    (it) => it.status === "ACTIVE",
  ).length;
  const completedInstances = filteredInstances.filter(
    (it) => it.status === "COMPLETED",
  ).length;
  const pendingTasks = tasks.filter((it) => it.status !== "Done").length;
  const doneTasks = tasks.filter((it) => it.status === "Done").length;

  const summaryTotal =
    typeof summary.totalEmployees === "number"
      ? summary.totalEmployees
      : filteredInstances.length;
  const summaryCompleted =
    typeof summary.completedCount === "number"
      ? summary.completedCount
      : completedInstances;
  const summaryActive =
    typeof funnel.activeCount === "number"
      ? funnel.activeCount
      : Math.max(summaryTotal - summaryCompleted, 0);

  const completionTotal =
    typeof taskCompletion.totalTasks === "number"
      ? taskCompletion.totalTasks
      : tasks.length;
  const completionDone =
    typeof taskCompletion.completedTasks === "number"
      ? taskCompletion.completedTasks
      : doneTasks;
  const completionPending = Math.max(completionTotal - completionDone, 0);

  const completionRateRaw =
    typeof taskCompletion.completionRate === "number"
      ? taskCompletion.completionRate
      : completionTotal > 0
        ? Math.round((completionDone / completionTotal) * 100)
        : 0;

  const completionRate =
    completionRateRaw > 0 && completionRateRaw <= 1
      ? Math.round(completionRateRaw * 100)
      : Math.round(completionRateRaw);

  const kpis = [
    {
      label: t("dashboard.kpi.active_onboardings"),
      value: String(summaryActive ?? activeInstances),
      icon: <Users className="h-4 w-4" />,
      tone: "teal" as const,
    },
    {
      label: t("dashboard.kpi.completed_onboardings"),
      value: String(summaryCompleted ?? completedInstances),
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: "emerald" as const,
    },
    {
      label: t("dashboard.kpi.pending_tasks"),
      value: String(completionPending ?? pendingTasks),
      icon: <ClipboardList className="h-4 w-4" />,
      tone: "amber" as const,
    },
    {
      label: t("dashboard.kpi.task_completion"),
      value: `${completionRate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      tone: "indigo" as const,
    },
  ];

  const progressData: StageVolume[] = [
    {
      stage: t("dashboard.stage.active"),
      value: Number(funnel.activeCount ?? activeInstances),
    },
    {
      stage: t("dashboard.stage.completed"),
      value: Number(funnel.completedCount ?? completedInstances),
    },
    {
      stage: t("dashboard.stage.cancelled"),
      value: Number(
        funnel.cancelledCount ??
          filteredInstances.filter((x) => x.status === "CANCELLED").length,
      ),
    },
    {
      stage: t("dashboard.stage.draft"),
      value: Number(
        funnel.otherCount ??
          filteredInstances.filter((x) => x.status === "DRAFT").length,
      ),
    },
  ].filter((s) => s.value > 0);

  const funnelData = progressData;

  const taskStatusData = [
    {
      label: t("dashboard.status.pending"),
      value: tasks.filter((task) => task.status === "Pending").length,
    },
    {
      label: t("dashboard.status.in_progress"),
      value: tasks.filter((task) => task.status === "In Progress").length,
    },
    {
      label: t("dashboard.status.done"),
      value: tasks.filter((task) => task.status === "Done").length,
    },
  ].filter((item) => item.value > 0);

  const departmentStats = (byDepartment.departments ?? []).filter((item) =>
    departmentFilter ? item.departmentId === departmentFilter : true,
  );

  const trendData = useMemo(() => {
    const bucket = new Map<string, number>();
    filteredInstances.forEach((item) => {
      const parsed = parseDate(item.startDate);
      if (!parsed) return;
      const key = dayjs(parsed).format("MM/YYYY");
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    });

    return Array.from(bucket.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }, [filteredInstances]);

  const upcomingTasks = tasks
    .filter((task) => task.status !== "Done")
    .slice(0, 5);

  const assigneeOptions = Array.from(
    new Set(
      tasks
        .map((task) => task.assignedUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  ).map((id) => ({ value: id, label: id }));

  const departmentOptions = (byDepartment.departments ?? []).map((item) => ({
    value: item.departmentId,
    label: item.departmentName,
  }));

  const isProgressLoading = instancesLoading || funnelLoading;
  const isKpiLoading = summaryLoading || taskCompletionLoading;
  const hasBlockingError = isInstancesError || isTasksError;

  if (isPlatformUser) {
    return (
      <Card className="border border-stroke bg-white shadow-sm">
        <p className="text-sm text-muted">
          {t("dashboard.platform_user_notice")}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border border-stroke bg-white shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {t("dashboard.filters.date_range")}
            </p>
            <DatePicker.RangePicker
              className="w-full"
              value={dateRange}
              format="DD/MM/YYYY"
              onChange={(value) => setDateRange(value ?? [null, null])}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {t("dashboard.filters.status")}
            </p>
            <Select
              className="w-full"
              value={statusFilter || undefined}
              allowClear
              onChange={(value) => setStatusFilter(value ?? "")}
              options={[
                { value: "DRAFT", label: t("dashboard.stage.draft") },
                { value: "ACTIVE", label: t("dashboard.stage.active") },
                {
                  value: "COMPLETED",
                  label: t("dashboard.stage.completed"),
                },
                {
                  value: "CANCELLED",
                  label: t("dashboard.stage.cancelled"),
                },
              ]}
              placeholder={t("dashboard.filters.all")}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {t("dashboard.filters.department")}
            </p>
            <Select
              className="w-full"
              value={departmentFilter || undefined}
              allowClear
              options={departmentOptions}
              onChange={(value) => setDepartmentFilter(value ?? "")}
              placeholder={t("dashboard.filters.all")}
              disabled={!hasDateRange}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {t("dashboard.filters.assignee")}
            </p>
            <Select
              className="w-full"
              value={assigneeFilter || undefined}
              allowClear
              options={assigneeOptions}
              onChange={(value) => setAssigneeFilter(value ?? "")}
              placeholder={t("dashboard.filters.all")}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {t("dashboard.filters.task_status")}
            </p>
            <Select
              className="w-full"
              value={taskStatusFilter || undefined}
              allowClear
              onChange={(value) => setTaskStatusFilter(value ?? "")}
              options={[
                {
                  value: "Pending",
                  label: t("dashboard.status.pending"),
                },
                {
                  value: "In Progress",
                  label: t("dashboard.status.in_progress"),
                },
                { value: "Done", label: t("dashboard.status.done") },
              ]}
              placeholder={t("dashboard.filters.all")}
            />
          </div>
        </div>
        {!hasDateRange && (
          <Alert
            className="mt-3"
            type="info"
            showIcon
            message={t("dashboard.filters.date_required")}
          />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        {isKpiLoading
          ? Array.from({ length: 4 }, (_, idx) => (
              <Card
                key={`kpi-skeleton-${idx}`}
                size="small"
                className="border border-stroke bg-white shadow-sm">
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </Card>
            ))
          : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-stroke bg-white shadow-sm lg:col-span-2">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">
                {t("dashboard.progress.title")}
              </h2>
              <p className="text-sm text-muted">
                {t("dashboard.progress.subtitle")}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase text-muted">
              {t("dashboard.live_data")}
            </span>
          </div>
          <div className="mt-6 h-64">
            {isProgressLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : progressData.length === 0 ? (
              <p className="text-sm text-muted">
                {t("dashboard.empty.onboarding")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.charts.funnel.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.charts.funnel.subtitle")}
          </p>
          <div className="mt-6 h-64">
            {!hasDateRange ? (
              <p className="text-sm text-muted">
                {t("dashboard.filters.date_required")}
              </p>
            ) : isProgressLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : funnelData.length === 0 ? (
              <p className="text-sm text-muted">
                {t("dashboard.empty.funnel")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funnelData}
                    dataKey="value"
                    nameKey="stage"
                    innerRadius={45}
                    outerRadius={82}>
                    {funnelData.map((_, index) => (
                      <Cell
                        key={`funnel-cell-${index}`}
                        fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.charts.department.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.charts.department.subtitle")}
          </p>
          <div className="mt-6 h-72">
            {!hasDateRange ? (
              <p className="text-sm text-muted">
                {t("dashboard.filters.date_required")}
              </p>
            ) : byDepartmentLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : departmentStats.length === 0 ? (
              <p className="text-sm text-muted">
                {t("dashboard.empty.department")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departmentName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="totalTasks"
                    fill="#60a5fa"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completedTasks"
                    fill="#0f766e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.charts.trend.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.charts.trend.subtitle")}
          </p>
          <div className="mt-6 h-72">
            {instancesLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : trendData.length === 0 ? (
              <p className="text-sm text-muted">{t("dashboard.empty.trend")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.charts.task_status.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.charts.task_status.subtitle")}
          </p>
          <div className="mt-6 h-64">
            {tasksLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : taskStatusData.length === 0 ? (
              <p className="text-sm text-muted">
                {t("dashboard.empty.task_status")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={45}
                    outerRadius={82}>
                    {taskStatusData.map((_, index) => (
                      <Cell
                        key={`task-status-cell-${index}`}
                        fill={
                          TASK_STATUS_COLORS[index % TASK_STATUS_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.upcoming_tasks.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.upcoming_tasks.subtitle")}
          </p>
          {tasksLoading ? (
            <SkeletonRows />
          ) : upcomingTasks.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {t("dashboard.empty.pending_tasks")}
            </p>
          ) : (
            <ul
              className="mt-4 space-y-3 text-sm"
              aria-label={t("dashboard.aria.upcoming_tasks")}>
              {upcomingTasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-stroke bg-slate-50/60 p-3 transition-colors hover:bg-slate-100/70">
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDueDate(task.dueDate)
                      ? t("dashboard.task_due", {
                          date: formatDueDate(task.dueDate),
                        })
                      : t("dashboard.no_due_date")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.documents.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.documents.subtitle")}
          </p>
          {docsLoading ? (
            <SkeletonRows />
          ) : documents.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {t("dashboard.empty.documents")}
            </p>
          ) : (
            <ul
              className="mt-4 space-y-3 text-sm"
              aria-label={t("dashboard.aria.documents_list")}>
              {documents.slice(0, 4).map((doc) => (
                <li
                  key={doc.documentId}
                  className="flex min-w-0 items-center justify-between rounded-lg border border-stroke bg-slate-50/60 p-3 transition-colors hover:bg-slate-100/70">
                  <span className="truncate">{doc.name}</span>
                  <StatusTag value={mapDocumentStatus(doc.status)} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="border border-stroke bg-white shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          {t("dashboard.execution_health.title")}
        </h2>
        <p className="text-sm text-muted">
          {t("dashboard.execution_health.subtitle")}
        </p>
        {hasBlockingError ? (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
            {t("dashboard.error.something_wrong")}{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                void refetchInstances();
                void refetchTasks();
              }}>
              {t("dashboard.error.retry")}
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-lg border border-stroke bg-slate-50/60 p-3">
              <p className="font-semibold text-ink">
                {t("dashboard.execution_health.active_load")}
              </p>
              <p className="text-muted">
                {t("dashboard.execution_health.active_load_desc", {
                  count: summaryActive ?? activeInstances,
                })}
              </p>
            </div>
            <div className="rounded-lg border border-stroke bg-slate-50/60 p-3">
              <p className="font-semibold text-ink">
                {t("dashboard.execution_health.pending_tasks")}
              </p>
              <p className="text-muted">
                {t("dashboard.execution_health.pending_tasks_desc", {
                  count: completionPending ?? pendingTasks,
                })}
              </p>
            </div>
            <div className="rounded-lg border border-stroke bg-slate-50/60 p-3">
              <p className="font-semibold text-ink">
                {t("dashboard.execution_health.completion_rate")}
              </p>
              <Progress percent={completionRate} size="small" />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
