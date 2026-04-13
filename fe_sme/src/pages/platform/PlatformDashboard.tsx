import { useState } from "react";
import { Card, Skeleton, DatePicker, Table, Tag, Select } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Building2,
  Users,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  TrendingDown,
  CreditCard,
  Clock,
  ShieldAlert,
  BarChart2,
} from "lucide-react";
import dayjs from "dayjs";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  apiGetPlatformDashboardOverview,
  apiGetPlatformRiskDashboard,
  apiGetPlatformRevenueTrend,
  apiGetPlatformRevenueAnalytics,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type {
  PlatformDashboardOverviewResponse,
  PlatformRiskDashboardResponse,
  PlatformRevenueTrendResponse,
  PlatformRevenueAnalyticsResponse,
  LowCompletionCompanyItem,
} from "@/interface/platform";

const { RangePicker } = DatePicker;

type PeriodPreset = "today" | "7d" | "30d" | "3m" | "6m" | "ytd" | "custom";

const PERIOD_OPTIONS: { value: PeriodPreset; labelVi: string; labelEn: string }[] = [
  { value: "today", labelVi: "Hôm nay", labelEn: "Today" },
  { value: "7d",    labelVi: "7 ngày qua", labelEn: "Last 7 days" },
  { value: "30d",   labelVi: "30 ngày qua", labelEn: "Last 30 days" },
  { value: "3m",    labelVi: "3 tháng qua", labelEn: "Last 3 months" },
  { value: "6m",    labelVi: "6 tháng qua", labelEn: "Last 6 months" },
  { value: "ytd",   labelVi: "Năm nay", labelEn: "This year" },
  { value: "custom", labelVi: "Tùy chỉnh", labelEn: "Custom" },
];

const calcPresetRange = (preset: PeriodPreset): [string, string] => {
  const today = dayjs().format("YYYY-MM-DD");
  switch (preset) {
    case "today": return [today, today];
    case "7d":    return [dayjs().subtract(6, "day").format("YYYY-MM-DD"), today];
    case "30d":   return [dayjs().subtract(29, "day").format("YYYY-MM-DD"), today];
    case "3m":    return [dayjs().subtract(3, "month").format("YYYY-MM-DD"), today];
    case "6m":    return [dayjs().subtract(6, "month").format("YYYY-MM-DD"), today];
    case "ytd":   return [dayjs().startOf("year").format("YYYY-MM-DD"), today];
    default:      return [dayjs().subtract(29, "day").format("YYYY-MM-DD"), today];
  }
};

const DEFAULT_PRESET: PeriodPreset = "30d";
const [DEFAULT_START, DEFAULT_END] = calcPresetRange(DEFAULT_PRESET);

const getGroupBy = (start: string, end: string) => {
  const days = dayjs(end).diff(dayjs(start), "day");
  if (days <= 7) return "DAY" as const;
  if (days <= 90) return "WEEK" as const;
  return "MONTH" as const;
};

const formatVnd = (v: number) => `${Number(v).toLocaleString("vi-VN")}₫`;

// ── Sub-components ────────────────────────────────────────────

const GrowthBadge = ({ rate }: { rate: number | null | undefined }) => {
  if (rate == null) return null;
  const up = rate >= 0;
  const pct = `${up ? "+" : ""}${(rate * 100).toFixed(1)}%`;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      }`}>
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {pct}
    </span>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  growth,
  color,
  loading,
}: {
  icon: any;
  label: string;
  value: string | number;
  growth?: number | null;
  color: string;
  loading?: boolean;
}) => (
  <Card className="flex flex-col gap-2">
    <div className="flex items-start justify-between">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <GrowthBadge rate={growth} />
    </div>
    {loading ? (
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: "60%" }} />
    ) : (
      <>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </>
    )}
  </Card>
);

const RiskChip = ({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: any;
  label: string;
  count: number;
  color: string;
}) => (
  <div
    className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${color}`}>
    <Icon className="h-4 w-4 shrink-0" />
    <div className="min-w-0">
      <p className="text-lg font-bold leading-none">{count}</p>
      <p className="mt-0.5 text-xs">{label}</p>
    </div>
  </div>
);

// ── Dashboard hook ────────────────────────────────────────────

const usePlatformDashboard = (startDate: string, endDate: string) => {
  const groupBy = getGroupBy(startDate, endDate);

  const overview = useQuery({
    queryKey: ["platform-dashboard-overview", startDate, endDate],
    queryFn: () =>
      apiGetPlatformDashboardOverview({ startDate, endDate, groupBy }),
    select: (res: any) => res?.data ?? res,
  });

  const risk = useQuery({
    queryKey: ["platform-dashboard-risk", startDate, endDate],
    queryFn: () => apiGetPlatformRiskDashboard({ startDate, endDate }),
    select: (res: any) => res?.data ?? res,
  });

  const revenueTrend = useQuery({
    queryKey: ["platform-revenue-trend", startDate, endDate, groupBy],
    queryFn: () => apiGetPlatformRevenueTrend({ startDate, endDate, groupBy }),
    select: (res: any) => res?.data ?? res,
  });

  const revenue = useQuery({
    queryKey: ["platform-revenue-analytics", startDate, endDate],
    queryFn: () => apiGetPlatformRevenueAnalytics({ startDate, endDate }),
    select: (res: any) => res?.data ?? res,
  });

  return { overview, risk, revenueTrend, revenue };
};

// ── Main component ────────────────────────────────────────────

const PlatformDashboard = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState<PeriodPreset>(DEFAULT_PRESET);
  const [dateRange, setDateRange] = useState<[string, string]>([
    DEFAULT_START,
    DEFAULT_END,
  ]);

  const handlePeriodChange = (preset: PeriodPreset) => {
    setActivePeriod(preset);
    if (preset !== "custom") {
      setDateRange(calcPresetRange(preset));
    }
  };

  const handleRangeChange = (_: any, strs: [string, string]) => {
    if (strs[0] && strs[1]) {
      setDateRange([strs[0], strs[1]]);
      setActivePeriod("custom");
    }
  };

  const { overview, risk, revenueTrend, revenue } = usePlatformDashboard(
    dateRange[0],
    dateRange[1],
  );

  const ov = overview.data as PlatformDashboardOverviewResponse | undefined;
  const rk = risk.data as PlatformRiskDashboardResponse | undefined;
  const rt = revenueTrend.data as PlatformRevenueTrendResponse | undefined;
  const rv = revenue.data as PlatformRevenueAnalyticsResponse | undefined;

  const chartData = (rt?.items ?? []).map((item) => ({
    bucket: item.bucket,
    value: item.value,
    prev: item.previousValue,
  }));

  const hasRisk =
    rk &&
    (rk.riskOnboardings > 0 ||
      rk.failedPayments > 0 ||
      rk.suspendedCompanies > 0 ||
      rk.companiesNearPlanLimit > 0 ||
      rk.expiringSubscriptions > 0);

  const lowCompletionColumns = [
    {
      title: t("platform.dashboard.risk.company"),
      dataIndex: "companyName",
      key: "companyName",
    },
    {
      title: t("platform.dashboard.risk.completion_rate"),
      dataIndex: "completionRate",
      key: "completionRate",
      render: (v: number) => (
        <span className="font-medium text-rose-600">
          {(v * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      render: (_: any, row: LowCompletionCompanyItem) => (
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={() =>
            navigate(`/platform/admin/companies/${row.companyId}`)
          }>
          {t("platform.dashboard.view_detail")}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("platform.dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("platform.dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={activePeriod}
            onChange={handlePeriodChange}
            style={{ width: 150 }}
            options={PERIOD_OPTIONS.map((o) => ({
              value: o.value,
              label: o.labelVi,
            }))}
          />
          <RangePicker
            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            onChange={handleRangeChange}
          />
        </div>
      </div>

      {/* KPI Cards — 5 metrics with growth rates */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={Building2}
          label={t("platform.dashboard.total_companies")}
          value={ov?.totalCompanies ?? "—"}
          growth={ov?.companyGrowthRate}
          color="bg-blue-500"
          loading={overview.isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label={t("platform.dashboard.mrr")}
          value={ov?.mrr != null ? formatVnd(ov.mrr) : "—"}
          growth={ov?.mrrGrowthRate}
          color="bg-emerald-500"
          loading={overview.isLoading}
        />
        <StatCard
          icon={ClipboardCheck}
          label={t("platform.dashboard.active_onboardings")}
          value={ov?.activeOnboardings ?? "—"}
          growth={ov?.activeOnboardingsGrowthRate}
          color="bg-violet-500"
          loading={overview.isLoading}
        />
        <StatCard
          icon={AlertTriangle}
          label={t("platform.dashboard.risk_onboardings")}
          value={ov?.riskOnboardings ?? "—"}
          growth={ov?.riskOnboardingsGrowthRate}
          color="bg-amber-500"
          loading={overview.isLoading}
        />
        <StatCard
          icon={Users}
          label={t("platform.dashboard.total_employees")}
          value={ov?.totalEmployees ?? "—"}
          growth={ov?.employeeGrowthRate}
          color="bg-sky-500"
          loading={overview.isLoading}
        />
      </div>

      {/* Revenue Trend chart + Quick links */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title={
            <span className="text-sm font-semibold">
              {t("platform.dashboard.revenue_trend")}
            </span>
          }>
          {revenueTrend.isLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : chartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
              {t("platform.dashboard.no_data")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatVnd(value),
                    t("platform.dashboard.mrr"),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revGradient)"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Quick links */}
        <Card
          title={
            <span className="text-sm font-semibold">
              {t("platform.dashboard.quick_links")}
            </span>
          }>
          <div className="space-y-2">
            {[
              {
                label: t("platform.dashboard.link_companies"),
                to: "/platform/admin/companies",
                icon: Building2,
                color: "text-blue-600",
              },
              {
                label: t("platform.dashboard.link_onboarding"),
                to: "/platform/admin/onboarding",
                icon: ClipboardCheck,
                color: "text-violet-600",
              },
              {
                label: t("platform.dashboard.link_templates"),
                to: "/platform/admin/templates",
                icon: BarChart2,
                color: "text-emerald-600",
              },
              {
                label: t("platform.dashboard.link_subscriptions"),
                to: "/platform/admin/subscriptions",
                icon: TrendingUp,
                color: "text-sky-600",
              },
              {
                label: t("platform.dashboard.link_plans"),
                to: "/platform/admin/plans",
                icon: CreditCard,
                color: "text-rose-600",
              },
            ].map((l) => (
              <button
                key={l.to}
                onClick={() => navigate(l.to)}
                className="flex w-full items-center justify-between rounded-xl border border-stroke px-4 py-3 text-left transition hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <l.icon className={`h-4 w-4 ${l.color}`} />
                  <span className="text-sm font-medium">{l.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Risk Dashboard */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-semibold">
              {t("platform.dashboard.risk_dashboard")}
            </span>
          </div>
        }>
        {risk.isLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : !hasRisk ? (
          <p className="text-sm text-slate-400">
            {t("platform.dashboard.no_risk")}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <RiskChip
                icon={AlertTriangle}
                label={t("platform.dashboard.at_risk")}
                count={rk?.riskOnboardings ?? 0}
                color="border-amber-200 bg-amber-50 text-amber-700"
              />
              <RiskChip
                icon={CreditCard}
                label={t("platform.dashboard.risk.failed_payments")}
                count={rk?.failedPayments ?? 0}
                color="border-rose-200 bg-rose-50 text-rose-700"
              />
              <RiskChip
                icon={Building2}
                label={t("platform.dashboard.suspended")}
                count={rk?.suspendedCompanies ?? 0}
                color="border-slate-200 bg-slate-50 text-slate-700"
              />
              <RiskChip
                icon={BarChart2}
                label={t("platform.dashboard.risk.near_limit")}
                count={rk?.companiesNearPlanLimit ?? 0}
                color="border-orange-200 bg-orange-50 text-orange-700"
              />
              <RiskChip
                icon={Clock}
                label={t("platform.dashboard.risk.expiring")}
                count={rk?.expiringSubscriptions ?? 0}
                color="border-yellow-200 bg-yellow-50 text-yellow-700"
              />
            </div>
            {(rk?.lowCompletionCompanyItems?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("platform.dashboard.risk.low_completion")} (
                  {rk!.lowCompletionCompanies})
                </p>
                <Table
                  dataSource={rk!.lowCompletionCompanyItems}
                  columns={lowCompletionColumns}
                  rowKey="companyId"
                  size="small"
                  pagination={false}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Revenue Analytics */}
      <Card
        title={
          <span className="text-sm font-semibold">
            {t("platform.dashboard.revenue")}
          </span>
        }>
        {revenue.isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">
                    {t("platform.dashboard.mrr")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  {rv?.mrr != null ? formatVnd(rv.mrr) : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    {t("platform.dashboard.arr")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {rv?.arr != null ? formatVnd(rv.arr) : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-medium text-violet-700">
                    {t("platform.dashboard.total_revenue")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-violet-700">
                  {rv?.totalRevenue != null ? formatVnd(rv.totalRevenue) : "—"}
                </p>
              </div>
            </div>

            {(rv?.revenueByPlans?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("platform.dashboard.revenue_by_plan")}
                </p>
                <div className="space-y-2">
                  {rv!.revenueByPlans.map((item) => (
                    <div
                      key={item.planId}
                      className="flex items-center justify-between rounded-lg border border-stroke px-4 py-2.5">
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          {item.planName ?? item.planCode ?? item.planId}
                        </span>
                        <Tag className="ml-2" color="default">
                          {item.subscriptionCount}{" "}
                          {t("platform.dashboard.subscriptions")}
                        </Tag>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatVnd(item.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlatformDashboard;
