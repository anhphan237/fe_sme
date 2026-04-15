import { useState } from "react";
import { Card, Skeleton, DatePicker, Select, Empty, Table, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  apiGetPlatformOnboardingAnalytics,
  apiGetPlatformOnboardingTrend,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type {
  PlatformOnboardingAnalyticsResponse,
  PlatformOnboardingTrendResponse,
} from "@/interface/platform";

const { RangePicker } = DatePicker;

type GroupBy = "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";

const DEFAULT_START = dayjs().subtract(30, "day").format("YYYY-MM-DD");
const DEFAULT_END = dayjs().format("YYYY-MM-DD");

const usePlatformOnboardingAnalytics = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: ["platform-onboarding-analytics", startDate, endDate],
    queryFn: () => apiGetPlatformOnboardingAnalytics({ startDate, endDate }),
    select: (res: any) =>
      (res?.data ?? res) as PlatformOnboardingAnalyticsResponse,
  });

const usePlatformOnboardingTrend = (
  startDate: string,
  endDate: string,
  groupBy: GroupBy,
) =>
  useQuery({
    queryKey: ["platform-onboarding-trend", startDate, endDate, groupBy],
    queryFn: () =>
      apiGetPlatformOnboardingTrend({ startDate, endDate, groupBy }),
    select: (res: any) => (res?.data ?? res) as PlatformOnboardingTrendResponse,
  });

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  color,
  loading,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  loading?: boolean;
  sub?: string;
}) => (
  <Card>
    <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    {loading ? (
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: "50%" }} />
    ) : (
      <>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </>
    )}
  </Card>
);

const OnboardingMonitor = () => {
  const { t } = useLocale();
  const [dateRange, setDateRange] = useState<[string, string]>([
    DEFAULT_START,
    DEFAULT_END,
  ]);
  const [groupBy, setGroupBy] = useState<GroupBy>("DAY");

  const { data: analytics, isLoading } = usePlatformOnboardingAnalytics(
    dateRange[0],
    dateRange[1],
  );

  const {
    data: trend,
    isLoading: trendLoading,
    isError: trendError,
    refetch: refetchTrend,
  } = usePlatformOnboardingTrend(dateRange[0], dateRange[1], groupBy);

  const latestRisk = trend?.items?.length
    ? trend.items[trend.items.length - 1].risk
    : null;

  const growthRateLatest = trend?.items?.length
    ? trend.items[trend.items.length - 1].growthRate
    : null;

  const groupByOptions: { value: GroupBy; label: string }[] = [
    { value: "DAY", label: t("platform.onboarding_monitor.group_day") },
    { value: "WEEK", label: t("platform.onboarding_monitor.group_week") },
    { value: "MONTH", label: t("platform.onboarding_monitor.group_month") },
    { value: "QUARTER", label: t("platform.onboarding_monitor.group_quarter") },
    { value: "YEAR", label: t("platform.onboarding_monitor.group_year") },
  ];

  const trendColumns = [
    {
      title: t("platform.onboarding_monitor.col_period"),
      dataIndex: "bucket",
      key: "bucket",
      render: (v: string) => (
        <span className="font-mono text-xs text-slate-600">{v}</span>
      ),
    },
    {
      title: t("platform.onboarding_monitor.col_total"),
      dataIndex: "total",
      key: "total",
      align: "center" as const,
      render: (v: number) => (
        <span className="font-semibold text-violet-700">{v}</span>
      ),
    },
    {
      title: t("platform.onboarding_monitor.active"),
      dataIndex: "active",
      key: "active",
      align: "center" as const,
      render: (v: number) => (
        <span className="font-semibold text-blue-600">{v}</span>
      ),
    },
    {
      title: t("platform.onboarding_monitor.col_completed"),
      dataIndex: "completed",
      key: "completed",
      align: "center" as const,
      render: (v: number) => (
        <span className="font-semibold text-emerald-600">{v}</span>
      ),
    },
    {
      title: t("platform.onboarding_monitor.at_risk"),
      dataIndex: "risk",
      key: "risk",
      align: "center" as const,
      render: (v: number) =>
        v > 0 ? (
          <Tag color="warning" className="font-semibold">
            {v}
          </Tag>
        ) : (
          <Tag color="success">0</Tag>
        ),
    },
    {
      title: t("platform.onboarding_monitor.col_growth"),
      dataIndex: "growthRate",
      key: "growthRate",
      align: "center" as const,
      render: (v: number | null) => {
        if (v == null) return <span className="text-slate-400">—</span>;
        const pct = (v * 100).toFixed(1);
        return (
          <span className={v >= 0 ? "text-emerald-600" : "text-rose-500"}>
            {v >= 0 ? "+" : ""}
            {pct}%
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <RangePicker
          defaultValue={[dayjs(DEFAULT_START), dayjs(DEFAULT_END)]}
          onChange={(_, strs) => {
            if (strs[0] && strs[1]) {
              setDateRange([strs[0], strs[1]]);
            }
          }}
        />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={ClipboardCheck}
          label={t("platform.onboarding_monitor.total_instances")}
          value={analytics?.totalOnboardings ?? "—"}
          color="bg-violet-500"
          loading={isLoading}
        />
        <SummaryCard
          icon={CheckCircle2}
          label={t("platform.onboarding_monitor.completed")}
          value={analytics?.completedOnboardings ?? "—"}
          color="bg-emerald-500"
          loading={isLoading}
        />
        <SummaryCard
          icon={Clock}
          label={t("platform.onboarding_monitor.avg_days")}
          value={
            analytics?.averageCompletionDays != null
              ? `${analytics.averageCompletionDays.toFixed(1)}d`
              : "—"
          }
          color="bg-blue-500"
          loading={isLoading}
        />
        <SummaryCard
          icon={AlertTriangle}
          label={t("platform.onboarding_monitor.at_risk")}
          value={latestRisk ?? "—"}
          color="bg-amber-500"
          loading={isLoading || trendLoading}
          sub={
            growthRateLatest != null
              ? `${growthRateLatest >= 0 ? "+" : ""}${(growthRateLatest * 100).toFixed(1)}% vs prev`
              : undefined
          }
        />
      </div>

      {/* Overall completion rate bar */}
      {!isLoading && analytics?.completionRate != null && (
        <Card>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              {t("platform.onboarding_monitor.overall_completion")}
            </span>
            <span className="font-bold text-violet-700">
              {(analytics.completionRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-700"
              style={{
                width: `${Math.round(analytics.completionRate * 100)}%`,
              }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 border-t border-slate-100 pt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800">
                {analytics.totalOnboardings}
              </p>
              <p className="text-xs text-slate-400">
                {t("platform.onboarding_monitor.total_instances")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">
                {analytics.completedOnboardings}
              </p>
              <p className="text-xs text-slate-400">
                {t("platform.onboarding_monitor.completed")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">
                {analytics.averageCompletionDays != null
                  ? `${analytics.averageCompletionDays.toFixed(1)}d`
                  : "—"}
              </p>
              <p className="text-xs text-slate-400">
                {t("platform.onboarding_monitor.avg_days")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Trend Chart */}
      <Card
        title={
          <span className="text-sm font-semibold">
            {t("platform.onboarding_monitor.trend_chart")}
          </span>
        }
        extra={
          <Select
            value={groupBy}
            onChange={setGroupBy}
            options={groupByOptions}
            size="small"
            className="w-28"
          />
        }>
        {trendLoading ? (
          <div className="space-y-3 px-2 py-4">
            <Skeleton active paragraph={{ rows: 6 }} title={false} />
          </div>
        ) : trendError ? (
          <div className="p-6 text-sm text-red-500">
            {t("platform.onboarding_monitor.load_error")}{" "}
            <button
              className="font-semibold underline"
              onClick={() => refetchTrend()}>
              {t("global.retry")}
            </button>
          </div>
        ) : !trend?.items?.length ? (
          <div className="p-10">
            <Empty description={t("platform.onboarding_monitor.trend_empty")} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={trend.items}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,.1)",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="total"
                name={t("platform.onboarding_monitor.col_total")}
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#colorTotal)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="active"
                name={t("platform.onboarding_monitor.active")}
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorActive)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                name={t("platform.onboarding_monitor.completed")}
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorCompleted)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="risk"
                name={t("platform.onboarding_monitor.at_risk")}
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#colorRisk)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Period breakdown table */}
      {!trendLoading && !!trend?.items?.length && (
        <Card
          title={
            <span className="text-sm font-semibold">
              {t("platform.onboarding_monitor.period_breakdown")}
            </span>
          }>
          <Table
            dataSource={[...trend.items].reverse()}
            columns={trendColumns}
            rowKey="bucket"
            size="small"
            pagination={{ pageSize: 10, size: "small" }}
            className="text-sm"
          />
        </Card>
      )}
    </div>
  );
};

export default OnboardingMonitor;
