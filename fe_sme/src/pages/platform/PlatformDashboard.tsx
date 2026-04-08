import { useState } from "react";
import { Card, Skeleton, DatePicker } from "antd";
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
} from "lucide-react";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  apiGetPlatformCompanyAnalytics,
  apiGetPlatformOnboardingAnalytics,
  apiGetPlatformSubscriptionAnalytics,
  apiGetPlatformRevenueAnalytics,
  apiGetPlatformUsageAnalytics,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";

const { RangePicker } = DatePicker;

const DEFAULT_START = dayjs().subtract(30, "day").format("YYYY-MM-DD");
const DEFAULT_END = dayjs().format("YYYY-MM-DD");

const usePlatformDashboard = (startDate: string, endDate: string) => {
  const companyAnalytics = useQuery({
    queryKey: ["platform-company-analytics", startDate, endDate],
    queryFn: () => apiGetPlatformCompanyAnalytics({ startDate, endDate }),
    select: (res: any) => res?.data ?? res,
  });

  const onboardingAnalytics = useQuery({
    queryKey: ["platform-onboarding-analytics", startDate, endDate],
    queryFn: () => apiGetPlatformOnboardingAnalytics({ startDate, endDate }),
    select: (res: any) => res?.data ?? res,
  });

  const metrics = useQuery({
    queryKey: ["platform-subscription-analytics", startDate, endDate],
    queryFn: () => apiGetPlatformSubscriptionAnalytics({ startDate, endDate }),
    select: (res: any) => res?.data ?? res,
  });

  const revenueAnalytics = useQuery({
    queryKey: ["platform-revenue-analytics", startDate, endDate],
    queryFn: () => apiGetPlatformRevenueAnalytics({ startDate, endDate }),
    select: (res: any) => res?.data ?? res,
  });

  const usageAnalytics = useQuery({
    queryKey: ["platform-usage-analytics", startDate, endDate],
    queryFn: () => apiGetPlatformUsageAnalytics({ startDate, endDate }),
    select: (res: any) => res?.data ?? res,
  });

  return { companyAnalytics, onboardingAnalytics, metrics, revenueAnalytics, usageAnalytics };
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
  loading,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  loading?: boolean;
}) => (
  <Card className="flex flex-col gap-2">
    <div className="flex items-start justify-between">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
    {loading ? (
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: "60%" }} />
    ) : (
      <>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </>
    )}
  </Card>
);

const PlatformDashboard = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<[string, string]>([
    DEFAULT_START,
    DEFAULT_END,
  ]);

  const { companyAnalytics, onboardingAnalytics, metrics, revenueAnalytics, usageAnalytics } =
    usePlatformDashboard(dateRange[0], dateRange[1]);
  const ca = companyAnalytics.data as any;
  const oa = onboardingAnalytics.data as any;
  const mt = metrics.data as any;
  const rv = revenueAnalytics.data as any;
  const ua = usageAnalytics.data as any;

  const mrrData = mt
    ? [
        { name: t("platform.dashboard.sub_total"), value: mt.totalSubscriptions ?? 0 },
        { name: t("platform.dashboard.sub_active"), value: mt.activeSubscriptions ?? 0 },
        { name: t("platform.dashboard.sub_new"), value: mt.newSubscriptions ?? 0 },
        { name: t("platform.dashboard.sub_cancelled"), value: mt.cancelledSubscriptions ?? 0 },
        { name: t("platform.dashboard.sub_suspended"), value: mt.suspendedSubscriptions ?? 0 },
      ]
    : [];

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
        <RangePicker
          defaultValue={[dayjs(DEFAULT_START), dayjs(DEFAULT_END)]}
          onChange={(_, strs) => {
            if (strs[0] && strs[1]) setDateRange([strs[0], strs[1]]);
          }}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label={t("platform.dashboard.active_companies")}
          value={ca?.activeCompanies ?? "—"}
          sub={`${ca?.newCompanies ?? 0} ${t("platform.dashboard.on_trial")}`}
          color="bg-blue-500"
          loading={companyAnalytics.isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label={t("platform.dashboard.mrr")}
          value={rv?.mrr != null ? `${Number(rv.mrr).toLocaleString("vi-VN")}₫` : "—"}
          sub={`${t("platform.dashboard.churn_rate")}: ${mt?.churnRate != null ? `${(mt.churnRate * 100).toFixed(1)}%` : "—"}`}
          color="bg-emerald-500"
          loading={metrics.isLoading || revenueAnalytics.isLoading}
        />
        <StatCard
          icon={ClipboardCheck}
          label={t("platform.dashboard.active_onboardings")}
          value={oa?.totalOnboardings ?? "—"}
          sub={`${t("platform.dashboard.completed")}: ${oa?.completedOnboardings ?? 0}`}
          color="bg-violet-500"
          loading={onboardingAnalytics.isLoading}
        />
        <StatCard
          icon={AlertTriangle}
          label={t("platform.dashboard.at_risk")}
          value={ca?.suspendedCompanies ?? "—"}
          sub={t("platform.dashboard.at_risk_desc")}
          color="bg-rose-500"
          loading={companyAnalytics.isLoading}
        />
      </div>

      {/* Charts + Quick links */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Subscription chart */}
        <Card
          className="lg:col-span-2"
          title={
            <span className="text-sm font-semibold">
              {t("platform.dashboard.subscription_chart")}
            </span>
          }>
          {metrics.isLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mrrData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
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
          <div className="space-y-3">
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
                icon: Users,
                color: "text-emerald-600",
              },
              {
                label: t("platform.dashboard.link_subscriptions"),
                to: "/platform/admin/subscriptions",
                icon: TrendingUp,
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

      {/* Platform completion rate */}
      <Card
        title={
          <span className="text-sm font-semibold">
            {t("platform.dashboard.completion_rate")}
          </span>
        }>
        {onboardingAnalytics.isLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <div className="flex items-center gap-6">
            <div>
              <p className="text-4xl font-bold text-violet-600">
                {oa?.completionRate != null
                  ? `${(oa.completionRate * 100).toFixed(1)}%`
                  : "—"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t("platform.dashboard.completion_rate_desc")}
              </p>
            </div>
            <div className="flex-1">
              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-700"
                  style={{
                    width: `${Math.round((oa?.completionRate ?? 0) * 100)}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>0%</span>
                <span>100%</span>
              </div>
              {ua?.avgOnboardingsPerCompany != null && (
                <p className="mt-2 text-xs text-slate-500">
                  {t("platform.dashboard.avg_per_company")}:{" "}
                  {Number(ua.avgOnboardingsPerCompany).toFixed(1)}
                </p>
              )}
            </div>
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
        {revenueAnalytics.isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">
                    {t("platform.dashboard.mrr")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  {rv?.mrr != null
                    ? Number(rv.mrr).toLocaleString("vi-VN") + "₫"
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    {t("platform.dashboard.arr")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {rv?.arr != null
                    ? Number(rv.arr).toLocaleString("vi-VN") + "₫"
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-medium text-violet-700">
                    {t("platform.dashboard.total_revenue")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-violet-700">
                  {rv?.totalRevenue != null
                    ? Number(rv.totalRevenue).toLocaleString("vi-VN") + "₫"
                    : "—"}
                </p>
              </div>
            </div>

            {rv?.revenueByPlans?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t("platform.dashboard.revenue_by_plan")}
                </p>
                <div className="space-y-2">
                  {rv.revenueByPlans.map((item: any) => (
                    <div
                      key={item.planId}
                      className="flex items-center justify-between rounded-lg border border-stroke px-4 py-2.5">
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          {item.planName ?? item.planCode ?? item.planId}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">
                          {item.subscriptionCount} {t("platform.dashboard.subscriptions")}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">
                        {Number(item.revenue).toLocaleString("vi-VN")}₫
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
