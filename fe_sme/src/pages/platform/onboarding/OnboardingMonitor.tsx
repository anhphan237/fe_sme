import { useState } from "react";
import { Card, Skeleton, DatePicker, Empty } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { apiGetPlatformOnboardingAnalytics } from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type { PlatformOnboardingAnalyticsResponse } from "@/interface/platform";

const { RangePicker } = DatePicker;

const DEFAULT_START = dayjs().subtract(30, "day").format("YYYY-MM-DD");
const DEFAULT_END = dayjs().format("YYYY-MM-DD");

const usePlatformOnboardingAnalytics = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: ["platform-onboarding-analytics", startDate, endDate],
    queryFn: () => apiGetPlatformOnboardingAnalytics({ startDate, endDate }),
    select: (res: any) =>
      (res?.data ?? res) as PlatformOnboardingAnalyticsResponse,
  });

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  loading?: boolean;
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

  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = usePlatformOnboardingAnalytics(dateRange[0], dateRange[1]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("platform.onboarding_monitor.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("platform.onboarding_monitor.subtitle")}
          </p>
        </div>
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
          icon={XCircle}
          label={t("platform.onboarding_monitor.cancelled")}
          value="—"
          color="bg-rose-400"
          loading={isLoading}
        />
        <SummaryCard
          icon={AlertTriangle}
          label={t("platform.onboarding_monitor.at_risk")}
          value="—"
          color="bg-amber-500"
          loading={isLoading}
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
        </Card>
      )}

      {/* Per-company breakdown */}
      <Card
        title={
          <span className="text-sm font-semibold">
            {t("platform.onboarding_monitor.by_company")}
          </span>
        }
        className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} active paragraph={false} />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-500">
            {t("platform.onboarding_monitor.load_error")}{" "}
            <button
              className="font-semibold underline"
              onClick={() => refetch()}>
              {t("global.retry")}
            </button>
          </div>
        ) : (
          <div className="p-10">
            <Empty description={t("platform.onboarding_monitor.empty")} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default OnboardingMonitor;
