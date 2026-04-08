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

  return { companyAnalytics, onboardingAnalytics, metrics };
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

  const { companyAnalytics, onboardingAnalytics, metrics } =
    usePlatformDashboard(dateRange[0], dateRange[1]);
  const ca = companyAnalytics.data as any;
  const oa = onboardingAnalytics.data as any;
  const mt = metrics.data as any;

  const mrrData = mt
    ? [
        { name: "Total", value: mt.totalSubscriptions ?? 0 },
        { name: "Active", value: mt.activeSubscriptions ?? 0 },
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
          value={mt?.mrr ? `$${Number(mt.mrr).toLocaleString()}` : "—"}
          sub={`${t("platform.dashboard.churn_rate")}: ${mt?.churn != null ? `${(mt.churn * 100).toFixed(1)}%` : "—"}`}
          color="bg-emerald-500"
          loading={metrics.isLoading}
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
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlatformDashboard;
