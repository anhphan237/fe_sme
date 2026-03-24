import { useState } from "react";
import { Card, Skeleton, DatePicker, Empty, Pagination } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { apiGetPlatformOnboardingOverview } from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type { PlatformOnboardingCompanyStat } from "@/interface/platform";

const { RangePicker } = DatePicker;

const DEFAULT_START = dayjs().subtract(30, "day").format("YYYY-MM-DD");
const DEFAULT_END = dayjs().format("YYYY-MM-DD");
const PAGE_SIZE = 10;

const usePlatformOnboardingOverview = (
  startDate: string,
  endDate: string,
  page: number,
) =>
  useQuery({
    queryKey: ["platform-onboarding-overview", startDate, endDate, page],
    queryFn: () =>
      apiGetPlatformOnboardingOverview({
        startDate,
        endDate,
        page,
        pageSize: PAGE_SIZE,
      }),
    select: (res: any) => ({
      summary: res?.data ?? res,
      companies: (res?.data?.companies ??
        res?.companies ??
        []) as PlatformOnboardingCompanyStat[],
      total: res?.data?.total ?? res?.total ?? 0,
    }),
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
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = usePlatformOnboardingOverview(
    dateRange[0],
    dateRange[1],
    page,
  );

  const summary = data?.summary as any;
  const companies = data?.companies ?? [];
  const total = data?.total ?? 0;

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
              setPage(1);
            }
          }}
        />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={ClipboardCheck}
          label={t("platform.onboarding_monitor.total_instances")}
          value={summary?.totalInstances ?? "—"}
          color="bg-violet-500"
          loading={isLoading}
        />
        <SummaryCard
          icon={CheckCircle2}
          label={t("platform.onboarding_monitor.completed")}
          value={summary?.completedInstances ?? "—"}
          color="bg-emerald-500"
          loading={isLoading}
        />
        <SummaryCard
          icon={XCircle}
          label={t("platform.onboarding_monitor.cancelled")}
          value={summary?.cancelledInstances ?? "—"}
          color="bg-rose-400"
          loading={isLoading}
        />
        <SummaryCard
          icon={AlertTriangle}
          label={t("platform.onboarding_monitor.at_risk")}
          value={summary?.atRiskCount ?? "—"}
          color="bg-amber-500"
          loading={isLoading}
        />
      </div>

      {/* Overall completion rate bar */}
      {!isLoading && summary?.overallCompletionRate != null && (
        <Card>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              {t("platform.onboarding_monitor.overall_completion")}
            </span>
            <span className="font-bold text-violet-700">
              {(summary.overallCompletionRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-700"
              style={{
                width: `${Math.round(summary.overallCompletionRate * 100)}%`,
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
        ) : companies.length === 0 ? (
          <div className="p-10">
            <Empty description={t("platform.onboarding_monitor.empty")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">
                    {t("platform.onboarding_monitor.col_company")}
                  </th>
                  <th className="px-5 py-3">
                    {t("platform.onboarding_monitor.col_total")}
                  </th>
                  <th className="px-5 py-3">
                    {t("platform.onboarding_monitor.col_active")}
                  </th>
                  <th className="px-5 py-3">
                    {t("platform.onboarding_monitor.col_completed")}
                  </th>
                  <th className="px-5 py-3">
                    {t("platform.onboarding_monitor.col_cancelled")}
                  </th>
                  <th className="px-5 py-3">
                    {t("platform.onboarding_monitor.col_rate")}
                  </th>
                  <th className="px-5 py-3">
                    {t("platform.onboarding_monitor.col_risk")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.companyId}
                    className="border-t border-stroke hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {c.companyName}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.totalInstances}
                    </td>
                    <td className="px-5 py-3 text-blue-600">{c.activeCount}</td>
                    <td className="px-5 py-3 text-emerald-600">
                      {c.completedCount}
                    </td>
                    <td className="px-5 py-3 text-rose-500">
                      {c.cancelledCount}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{
                              width: `${Math.min(c.completionRate, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {c.completionRate?.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {c.atRisk ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                          <AlertTriangle className="h-3 w-3" />
                          {t("platform.onboarding_monitor.at_risk_label")}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          {t("platform.onboarding_monitor.healthy_label")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex justify-end">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
};

export default OnboardingMonitor;
