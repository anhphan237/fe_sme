import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, DatePicker, Select, Skeleton, Tag } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  CheckCircle2,
  ClipboardList,
  TrendingUp,
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

// ── types ─────────────────────────────────────────────────────────────────────

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

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inRange(date: Date | null, start?: string, end?: string) {
  if (!date) return false;
  if (!start || !end) return true;
  return (
    date >= new Date(`${start}T00:00:00`) &&
    date <= new Date(`${end}T23:59:59`)
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
    typeof funnel.activeCount === "number" ? funnel.activeCount : activeInstances;
  const summaryCompleted =
    typeof summary.completedCount === "number"
      ? summary.completedCount
      : completedInstances;

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
  ];

  const funnelData: StageVolume[] = [
    { stage: "Đang hoạt động", value: Number(funnel.activeCount ?? activeInstances) },
    { stage: "Hoàn thành", value: Number(funnel.completedCount ?? completedInstances) },
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

  const departmentStats = (byDepartment.departments ?? []).filter((item) =>
    departmentFilter ? item.departmentId === departmentFilter : true,
  );

  const departmentOptions = (byDepartment.departments ?? []).map((item) => ({
    value: item.departmentId,
    label: item.departmentName,
  }));

  const recentInstances = [...filteredInstances]
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
    .slice(0, 10);

  const isKpiLoading = summaryLoading || taskCompletionLoading;
  const isProgressLoading = instancesLoading || funnelLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Dashboard HR</h1>
        <p className="text-sm text-muted">Tổng quan quản lý onboarding toàn công ty</p>
      </div>

      {/* Filter Panel */}
      <Card className="border border-stroke bg-white shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">Khoảng thời gian</p>
            <DatePicker.RangePicker
              className="w-full"
              value={dateRange}
              format="DD/MM/YYYY"
              onChange={(value) => setDateRange(value ?? [null, null])}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">Trạng thái</p>
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
            <p className="mb-1 text-xs font-semibold uppercase text-muted">Phòng ban</p>
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
            message="Chọn khoảng thời gian để xem dữ liệu analytics."
          />
        )}
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 lg:grid-cols-4">
        {isKpiLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <Card key={`kpi-sk-${i}`} size="small" className="border border-stroke bg-white shadow-sm">
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </Card>
            ))
          : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Funnel + Progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-stroke bg-white shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">Tiến độ onboarding</h2>
          <p className="text-sm text-muted">Phân bổ trạng thái các onboarding</p>
          <div className="mt-6 h-64">
            {isProgressLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : funnelData.length === 0 ? (
              <p className="text-sm text-muted">Chưa có dữ liệu trong khoảng thời gian đã chọn.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
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
          <h2 className="text-base font-semibold text-ink">Phân tích funnel</h2>
          <p className="text-sm text-muted">Tỉ lệ chuyển đổi giữa các giai đoạn</p>
          <div className="mt-6 h-64">
            {!hasDateRange ? (
              <p className="text-sm text-muted">Chọn khoảng thời gian để xem funnel.</p>
            ) : isProgressLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : funnelData.length === 0 ? (
              <p className="text-sm text-muted">Không có dữ liệu.</p>
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

      {/* Department + Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">Thống kê theo phòng ban</h2>
          <p className="text-sm text-muted">Tổng task và task hoàn thành mỗi phòng ban</p>
          <div className="mt-6 h-72">
            {!hasDateRange ? (
              <p className="text-sm text-muted">Chọn khoảng thời gian để xem dữ liệu.</p>
            ) : byDepartmentLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : departmentStats.length === 0 ? (
              <p className="text-sm text-muted">Không có dữ liệu theo phòng ban.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departmentName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalTasks" name="Tổng task" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completedTasks" name="Hoàn thành" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">Xu hướng onboarding</h2>
          <p className="text-sm text-muted">Số lượng onboarding khởi tạo theo tháng</p>
          <div className="mt-6 h-72">
            {instancesLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : trendData.length === 0 ? (
              <p className="text-sm text-muted">Không có dữ liệu xu hướng.</p>
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
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Onboardings Table */}
      <Card className="border border-stroke bg-white shadow-sm">
        <h2 className="text-base font-semibold text-ink">Onboarding gần đây</h2>
        <p className="text-sm text-muted">10 onboarding mới nhất trong khoảng thời gian đã chọn</p>
        <div className="mt-4 overflow-x-auto">
          {instancesLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          ) : recentInstances.length === 0 ? (
            <p className="text-sm text-muted py-4">
              {hasDateRange
                ? "Không có onboarding nào trong khoảng thời gian đã chọn."
                : "Chọn khoảng thời gian để xem danh sách."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left text-xs font-semibold uppercase text-muted">
                  <th className="pb-3 pr-4">Nhân viên</th>
                  <th className="pb-3 pr-4">Ngày bắt đầu</th>
                  <th className="pb-3">Trạng thái</th>
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
                      {inst.startDate
                        ? dayjs(inst.startDate).format("DD/MM/YYYY")
                        : "—"}
                    </td>
                    <td className="py-3">
                      <Tag color={instanceStatusColor(inst.status)}>
                        {inst.status ?? "—"}
                      </Tag>
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
