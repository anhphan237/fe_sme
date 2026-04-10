import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Card,
  DatePicker,
  Progress,
  Select,
  Skeleton,
  Tag,
  Tooltip as AntTooltip,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useUserStore } from "@/stores/user.store";
import {
  apiGetCompanyOnboardingByDepartment,
  apiGetCompanyOnboardingFunnel,
  apiGetCompanyOnboardingSummary,
  apiGetCompanyTaskCompletion,
} from "@/api/admin/admin.api";
import { apiListInstances } from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapInstance } from "@/utils/mappers/onboarding";
import type { OnboardingInstance } from "@/shared/types";
import { AppRouters } from "@/constants/router";

// ── Types ─────────────────────────────────────────────────────────────────────

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

type StageVolume = { stage: string; value: number };

const FUNNEL_COLORS = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"];
const DONUT_COLORS = ["#0f766e", "#e5e7eb"];

// ── Query hooks ────────────────────────────────────────────────────────────────

function useInstancesQuery(filters?: { status?: string }, enabled = true) {
  return useQuery({
    queryKey: ["hr-instances", filters?.status ?? ""],
    queryFn: () => apiListInstances({ status: filters?.status }),
    enabled,
    select: (res: unknown) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
  });
}

function useSummaryQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["hr-summary", companyId ?? "", startDate ?? "", endDate ?? ""],
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
    queryKey: ["hr-funnel", companyId ?? "", startDate ?? "", endDate ?? ""],
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
      "hr-task-completion",
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
      "hr-by-department",
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone: "teal" | "emerald" | "amber" | "indigo" | "violet";
}) {
  const toneClass: Record<typeof tone, string> = {
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <Card
      size="small"
      className="overflow-hidden border border-stroke bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${toneClass[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

/** Donut chart hiển thị tỉ lệ hoàn thành task */
function TaskCompletionDonut({
  completed,
  total,
  rate,
  loading,
}: {
  completed: number;
  total: number;
  rate: number;
  loading: boolean;
}) {
  const data = [
    { name: "Hoàn thành", value: completed },
    { name: "Còn lại", value: Math.max(total - completed, 0) },
  ];
  const hasData = total > 0;

  return (
    <Card className="border border-stroke bg-white shadow-sm">
      <h2 className="text-base font-semibold text-ink">
        Tỉ lệ hoàn thành task
      </h2>
      <p className="text-sm text-muted">Task đã xử lý / tổng task trong kỳ</p>
      <div className="relative mt-4 flex h-56 items-center justify-center">
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} title={false} />
        ) : !hasData ? (
          <p className="text-sm text-muted">Chọn khoảng thời gian để xem.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  startAngle={90}
                  endAngle={-270}>
                  {data.map((_, i) => (
                    <Cell
                      key={`completion-cell-${i}`}
                      fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, ""]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-ink">{rate}%</span>
              <span className="text-xs text-muted">hoàn thành</span>
            </div>
          </>
        )}
      </div>
      {hasData && !loading && (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-stroke pt-3">
          <div className="text-center">
            <p className="text-xs text-muted">Đã hoàn thành</p>
            <p className="text-lg font-bold text-teal-700">{completed}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted">Còn lại</p>
            <p className="text-lg font-bold text-amber-600">
              {Math.max(total - completed, 0)}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

/** Thẻ hiển thị instance cần chú ý (progress thấp) */
function AttentionCard({ inst }: { inst: OnboardingInstance }) {
  const progress = inst.progress ?? 0;
  const progressColor =
    progress < 10 ? "exception" : progress < 30 ? "active" : "normal";
  return (
    <Link to={`${AppRouters.ONBOARDING_EMPLOYEES}/${inst.id}`}>
      <div className="flex items-center gap-3 rounded-lg border border-stroke bg-white px-3 py-2.5 transition-colors hover:border-amber-300 hover:bg-amber-50/40">
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-ink">
            {inst.employeeId || "—"}
          </p>
          {inst.managerName && (
            <p className="truncate text-xs text-muted">
              Manager: {inst.managerName}
            </p>
          )}
          <Progress
            percent={progress}
            size="small"
            status={progressColor}
            className="mt-1"
          />
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
      </div>
    </Link>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inRange(date: Date | null, start?: string, end?: string) {
  if (!date) return false;
  if (!start || !end) return true;
  return (
    date >= new Date(`${start}T00:00:00`) && date <= new Date(`${end}T23:59:59`)
  );
}

function instanceStatusColor(status?: string) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "blue";
    case "COMPLETED":
      return "green";
    case "CANCELLED":
      return "red";
    case "DRAFT":
    default:
      return "default";
  }
}

/** Label renderer cho recharts BarChart — hiển thị % hoàn thành */
function DeptCompletionLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
  index?: number;
  data?: DashboardDepartmentStat[];
}) {
  const { x = 0, y = 0, width = 0, index = 0, data = [] } = props;
  const stat = data[index];
  if (!stat || stat.totalTasks === 0) return null;
  const pct = Math.round((stat.completedTasks / stat.totalTasks) * 100);
  return (
    <text
      x={x + width / 2}
      y={y - 4}
      textAnchor="middle"
      fontSize={10}
      fill="#6b7280">
      {pct}%
    </text>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function HRDashboard() {
  const currentTenant = useUserStore((s) => s.currentTenant);
  const currentUser = useUserStore((s) => s.currentUser);
  const companyId = currentTenant?.id ?? currentUser?.companyId ?? undefined;

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  const startDate = dateRange[0]?.format("YYYY-MM-DD");
  const endDate = dateRange[1]?.format("YYYY-MM-DD");
  const hasDateRange = Boolean(startDate && endDate);
  const analyticsEnabled = Boolean(companyId) && hasDateRange;

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: instances = [], isLoading: instancesLoading } =
    useInstancesQuery(
      statusFilter ? { status: statusFilter } : undefined,
      true,
    );

  const filteredInstances = useMemo(
    () =>
      instances.filter((inst) =>
        inRange(parseDate(inst.startDate), startDate, endDate),
      ),
    [instances, startDate, endDate],
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

  // ── Data derivation ──────────────────────────────────────────────────────
  const summary = (summaryRaw ?? {}) as DashboardSummary;
  const funnel = (funnelRaw ?? {}) as DashboardFunnel;
  const taskCompletion = (taskCompletionRaw ?? {}) as DashboardTaskCompletion;
  const byDepartment = (byDepartmentRaw ?? { departments: [] }) as {
    departments?: DashboardDepartmentStat[];
  };

  const activeInstances = filteredInstances.filter(
    (it) => it.status === "ACTIVE",
  ).length;
  const completedInstances = filteredInstances.filter(
    (it) => it.status === "COMPLETED",
  ).length;

  const summaryActive =
    typeof funnel.activeCount === "number"
      ? funnel.activeCount
      : activeInstances;
  const summaryCompleted =
    typeof summary.completedCount === "number"
      ? summary.completedCount
      : completedInstances;
  const totalEmployees =
    typeof summary.totalEmployees === "number" ? summary.totalEmployees : null;

  const completionTotal =
    typeof taskCompletion.totalTasks === "number"
      ? taskCompletion.totalTasks
      : 0;
  const completionDone =
    typeof taskCompletion.completedTasks === "number"
      ? taskCompletion.completedTasks
      : 0;
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

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Đang onboarding",
      value: String(summaryActive),
      icon: <Users className="h-4 w-4" />,
      tone: "teal" as const,
    },
    {
      label: "Hoàn thành",
      value: String(summaryCompleted),
      sub: hasDateRange ? "trong kỳ" : undefined,
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: "emerald" as const,
    },
    {
      label: "Task đang chờ",
      value: String(completionPending),
      icon: <ClipboardList className="h-4 w-4" />,
      tone: "amber" as const,
    },
    {
      label: "Tỉ lệ hoàn thành",
      value: `${completionRate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      tone: "indigo" as const,
    },
    {
      label: "Tổng nhân viên",
      value: totalEmployees !== null ? String(totalEmployees) : "—",
      sub: hasDateRange ? "trong kỳ đã chọn" : "chọn kỳ để xem",
      icon: <UserCheck className="h-4 w-4" />,
      tone: "violet" as const,
    },
  ];

  // ── Funnel BarChart data ──────────────────────────────────────────────────
  const funnelData: StageVolume[] = [
    {
      stage: "Đang hoạt động",
      value: Number(funnel.activeCount ?? activeInstances),
    },
    {
      stage: "Hoàn thành",
      value: Number(funnel.completedCount ?? completedInstances),
    },
    {
      stage: "Đã huỷ",
      value: Number(
        funnel.cancelledCount ??
          filteredInstances.filter((x) => x.status === "CANCELLED").length,
      ),
    },
    {
      stage: "Nháp",
      value: Number(
        funnel.otherCount ??
          filteredInstances.filter((x) => x.status === "DRAFT").length,
      ),
    },
  ].filter((s) => s.value > 0);

  // ── Trend data (instances by month) ──────────────────────────────────────
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

  // ── Department data ───────────────────────────────────────────────────────
  const departmentStats = (byDepartment.departments ?? []).filter((item) =>
    departmentFilter ? item.departmentId === departmentFilter : true,
  );

  const departmentOptions = (byDepartment.departments ?? []).map((item) => ({
    value: item.departmentId,
    label: item.departmentName,
  }));

  // ── Attention needed — ACTIVE instances with progress < 30% ──────────────
  const attentionInstances = useMemo(
    () =>
      filteredInstances
        .filter((i) => i.status === "ACTIVE" && (i.progress ?? 0) < 30)
        .sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0))
        .slice(0, 8),
    [filteredInstances],
  );

  // ── Recent table ─────────────────────────────────────────────────────────
  const recentInstances = useMemo(
    () =>
      [...filteredInstances]
        .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
        .slice(0, 10),
    [filteredInstances],
  );

  const isKpiLoading = summaryLoading || taskCompletionLoading;
  const isProgressLoading = instancesLoading || funnelLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Dashboard HR</h1>
        <p className="text-sm text-muted">
          Tổng quan quản lý onboarding toàn công ty
        </p>
      </div>

      {/* Filter Panel */}
      <Card className="border border-stroke bg-white shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              Khoảng thời gian
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
              Trạng thái
            </p>
            <Select
              className="w-full"
              value={statusFilter || undefined}
              allowClear
              onChange={(value) => setStatusFilter(value ?? "")}
              options={[
                { value: "DRAFT", label: "Nháp" },
                { value: "ACTIVE", label: "Đang hoạt động" },
                { value: "COMPLETED", label: "Hoàn thành" },
                { value: "CANCELLED", label: "Đã huỷ" },
              ]}
              placeholder="Tất cả"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              Phòng ban
            </p>
            <Select
              className="w-full"
              value={departmentFilter || undefined}
              allowClear
              options={departmentOptions}
              onChange={(value) => setDepartmentFilter(value ?? "")}
              placeholder="Tất cả"
              disabled={!hasDateRange}
            />
          </div>
        </div>
        {!hasDateRange && (
          <Alert
            className="mt-3"
            type="info"
            showIcon
            message="Chọn khoảng thời gian để xem dữ liệu analytics đầy đủ."
          />
        )}
      </Card>

      {/* KPI Cards — 5 tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {isKpiLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <Card
                key={`kpi-sk-${i}`}
                size="small"
                className="border border-stroke bg-white shadow-sm">
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </Card>
            ))
          : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Funnel bar + Task Completion Donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-stroke bg-white shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">
            Tiến độ onboarding
          </h2>
          <p className="text-sm text-muted">
            Phân bổ trạng thái các onboarding trong kỳ
          </p>
          <div className="mt-6 h-64">
            {isProgressLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : funnelData.length === 0 ? (
              <p className="text-sm text-muted">
                Chưa có dữ liệu trong khoảng thời gian đã chọn.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Số lượng" radius={[6, 6, 0, 0]}>
                    {funnelData.map((_, index) => (
                      <Cell
                        key={`funnel-bar-${index}`}
                        fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                      />
                    ))}
                    <LabelList dataKey="value" position="top" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <TaskCompletionDonut
          completed={completionDone}
          total={completionTotal}
          rate={completionRate}
          loading={taskCompletionLoading}
        />
      </div>

      {/* Department stats + Attention needed */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Department bar chart */}
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            Thống kê theo phòng ban
          </h2>
          <p className="text-sm text-muted">
            Task hoàn thành — nhãn % là tỉ lệ hoàn thành mỗi phòng ban
          </p>
          <div className="mt-6 h-72">
            {!hasDateRange ? (
              <p className="text-sm text-muted">
                Chọn khoảng thời gian để xem dữ liệu.
              </p>
            ) : byDepartmentLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : departmentStats.length === 0 ? (
              <p className="text-sm text-muted">
                Không có dữ liệu theo phòng ban.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="departmentName"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="totalTasks"
                    name="Tổng task"
                    fill="#60a5fa"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completedTasks"
                    name="Hoàn thành"
                    fill="#0f766e"
                    radius={[4, 4, 0, 0]}>
                    <LabelList
                      content={(props: any) => (
                        <DeptCompletionLabel
                          {...props}
                          data={departmentStats}
                        />
                      )}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Attention needed panel */}
        <Card className="border border-stroke bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold text-ink">Cần chú ý</h2>
          </div>
          <p className="text-sm text-muted">
            Onboarding đang hoạt động nhưng tiến độ dưới 30%
          </p>
          <div className="mt-4 space-y-2">
            {!hasDateRange ? (
              <p className="text-sm text-muted">
                Chọn khoảng thời gian để xem.
              </p>
            ) : instancesLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} title={false} />
            ) : attentionInstances.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium text-ink">
                  Tất cả onboarding đều ổn
                </p>
                <p className="text-xs text-muted">
                  Không có onboarding nào dưới 30% tiến độ.
                </p>
              </div>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {attentionInstances.map((inst) => (
                  <AttentionCard key={inst.id} inst={inst} />
                ))}
              </div>
            )}
          </div>
          {attentionInstances.length > 0 && (
            <div className="mt-3 border-t border-stroke pt-2">
              <Link
                to={AppRouters.ONBOARDING_EMPLOYEES}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                Xem tất cả nhân viên
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Onboarding Trend — full width */}
      <Card className="border border-stroke bg-white shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          Xu hướng onboarding
        </h2>
        <p className="text-sm text-muted">
          Số lượng onboarding khởi tạo theo tháng
        </p>
        <div className="mt-6 h-64">
          {instancesLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          ) : trendData.length === 0 ? (
            <p className="text-sm text-muted">
              {hasDateRange
                ? "Không có dữ liệu xu hướng trong kỳ đã chọn."
                : "Chọn khoảng thời gian để xem xu hướng."}
            </p>
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
                  name="Số onboarding"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Recent Onboardings Table — enhanced */}
      <Card className="border border-stroke bg-white shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Onboarding gần đây
            </h2>
            <p className="text-sm text-muted">
              10 onboarding mới nhất trong kỳ đã chọn
            </p>
          </div>
          <Link
            to={AppRouters.ONBOARDING_EMPLOYEES}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
            Xem tất cả
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {instancesLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          ) : recentInstances.length === 0 ? (
            <p className="py-4 text-sm text-muted">
              {hasDateRange
                ? "Không có onboarding nào trong khoảng thời gian đã chọn."
                : "Chọn khoảng thời gian để xem danh sách."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left text-xs font-semibold uppercase text-muted">
                  <th className="pb-3 pr-4">Nhân viên</th>
                  <th className="pb-3 pr-4">Manager</th>
                  <th className="pb-3 pr-4">Ngày bắt đầu</th>
                  <th className="pb-3 pr-4">Trạng thái</th>
                  <th className="pb-3 pr-4">Tiến độ</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {recentInstances.map((inst) => (
                  <tr
                    key={inst.id}
                    className="border-b border-stroke/50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-ink">
                      {inst.employeeId ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      <AntTooltip title={inst.managerName ?? undefined}>
                        <span className="max-w-[120px] truncate block">
                          {inst.managerName ?? "—"}
                        </span>
                      </AntTooltip>
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {inst.startDate
                        ? dayjs(inst.startDate).format("DD/MM/YYYY")
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Tag color={instanceStatusColor(inst.status)}>
                        {inst.status ?? "—"}
                      </Tag>
                    </td>
                    <td className="py-3 pr-4 min-w-[100px]">
                      <Progress
                        percent={inst.progress ?? 0}
                        size="small"
                        showInfo={false}
                        strokeColor={
                          (inst.progress ?? 0) >= 70
                            ? "#0f766e"
                            : (inst.progress ?? 0) >= 30
                              ? "#2563eb"
                              : "#f59e0b"
                        }
                      />
                      <span className="text-xs text-muted">
                        {inst.progress ?? 0}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`${AppRouters.ONBOARDING_EMPLOYEES}/${inst.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        Chi tiết
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
