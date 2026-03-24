import { useParams, useNavigate } from "react-router-dom";
import { Card, Skeleton, Tabs } from "antd";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { apiGetPlatformCompanyDetail } from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type { PlatformCompanyDetailResponse } from "@/interface/platform";

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIAL: "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

const PIE_COLORS = ["#6366f1", "#22c55e", "#ef4444", "#94a3b8"];

const useCompanyDetail = (companyId: string) =>
  useQuery({
    queryKey: ["platform-company-detail", companyId],
    queryFn: () => apiGetPlatformCompanyDetail({ companyId }),
    select: (res: any) => (res?.data ?? res) as PlatformCompanyDetailResponse,
    enabled: !!companyId,
  });

const KpiCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) => (
  <Card>
    <div className="flex items-center justify-between">
      <div className={`rounded-xl p-2.5 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
    <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
    <p className="mt-0.5 text-sm text-slate-500">{label}</p>
  </Card>
);

const CompanyDetail = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { t } = useLocale();
  const navigate = useNavigate();

  const { data: company, isLoading, isError } = useCompanyDetail(companyId!);

  const funnelData = company
    ? [
        {
          name: t("platform.company_detail.status_active"),
          value: company.activeOnboardings,
        },
        {
          name: t("platform.company_detail.status_completed"),
          value: company.completedOnboardings,
        },
        {
          name: t("platform.company_detail.status_cancelled"),
          value: company.cancelledOnboardings,
        },
      ]
    : [];

  const deptData =
    company?.departments?.map((d) => ({
      name: d.departmentName,
      total: d.totalTasks,
      completed: d.completedTasks,
      rate: Math.round(d.completionRate),
    })) ?? [];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <XCircle className="h-12 w-12 text-rose-400" />
        <p className="text-sm text-slate-500">
          {t("platform.company_detail.load_error")}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200">
          {t("global.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/platform/companies")}
          className="flex items-center gap-1.5 rounded-xl border border-stroke px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />
          {t("global.back")}
        </button>
      </div>

      {/* Company header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
            <Building2 className="h-7 w-7 text-violet-600" />
          </div>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: 200 }} />
          ) : (
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                {company?.name}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                <span>{company?.industry}</span>
                <span>·</span>
                <span>{company?.size}</span>
                <span>·</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[company?.status ?? ""] ?? "bg-slate-100 text-slate-600"}`}>
                  {company?.status}
                </span>
              </div>
            </div>
          )}
        </div>
        {!isLoading && company && (
          <div className="text-right text-sm text-slate-400">
            <p>
              {t("platform.company_detail.plan")}:{" "}
              <span className="font-medium text-slate-700">{company.plan}</span>
            </p>
            <p>
              {t("platform.company_detail.admin")}: {company.adminEmail}
            </p>
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={ClipboardCheck}
          label={t("platform.company_detail.total_onboardings")}
          value={isLoading ? "—" : (company?.totalOnboardings ?? 0)}
          color="bg-violet-500"
        />
        <KpiCard
          icon={Clock}
          label={t("platform.company_detail.active_onboardings")}
          value={isLoading ? "—" : (company?.activeOnboardings ?? 0)}
          color="bg-blue-500"
        />
        <KpiCard
          icon={CheckCircle2}
          label={t("platform.company_detail.completed_onboardings")}
          value={isLoading ? "—" : (company?.completedOnboardings ?? 0)}
          color="bg-emerald-500"
        />
        <KpiCard
          icon={TrendingUp}
          label={t("platform.company_detail.task_completion_rate")}
          value={
            isLoading ? "—" : `${company?.taskCompletionRate?.toFixed(1) ?? 0}%`
          }
          color="bg-amber-500"
        />
      </div>

      {/* Tabs: Onboarding Funnel | Department Breakdown */}
      <Tabs
        items={[
          {
            label: t("platform.company_detail.tab_funnel"),
            key: "funnel",
            children: (
              <Card>
                {isLoading ? (
                  <Skeleton active paragraph={{ rows: 5 }} />
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-slate-700">
                        {t("platform.company_detail.funnel_distribution")}
                      </h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={funnelData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }>
                            {funnelData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 pt-4">
                      {[
                        {
                          label: t("platform.company_detail.status_active"),
                          value: company?.activeOnboardings,
                          color: "bg-violet-500",
                        },
                        {
                          label: t("platform.company_detail.status_completed"),
                          value: company?.completedOnboardings,
                          color: "bg-emerald-500",
                        },
                        {
                          label: t("platform.company_detail.status_cancelled"),
                          value: company?.cancelledOnboardings,
                          color: "bg-rose-500",
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${row.color}`}
                            />
                            <span className="text-sm text-slate-600">
                              {row.label}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-800">
                            {row.value ?? 0}
                          </span>
                        </div>
                      ))}
                      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                        <p className="text-sm text-violet-700">
                          {t("platform.company_detail.overall_completion")}{" "}
                          <span className="font-bold">
                            {company?.completionRate?.toFixed(1) ?? 0}%
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ),
          },
          {
            label: t("platform.company_detail.tab_departments"),
            key: "departments",
            children: (
              <Card>
                {isLoading ? (
                  <Skeleton active paragraph={{ rows: 5 }} />
                ) : deptData.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    {t("platform.company_detail.no_dept_data")}
                  </p>
                ) : (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={deptData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          angle={-30}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar
                          dataKey="total"
                          name={t("platform.company_detail.total_tasks")}
                          fill="#e0e7ff"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="completed"
                          name={t("platform.company_detail.completed_tasks")}
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-2">
                              {t("platform.company_detail.dept_name")}
                            </th>
                            <th className="px-4 py-2">
                              {t("platform.company_detail.total_tasks")}
                            </th>
                            <th className="px-4 py-2">
                              {t("platform.company_detail.completed_tasks")}
                            </th>
                            <th className="px-4 py-2">
                              {t("platform.company_detail.rate")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {company?.departments?.map((d) => (
                            <tr
                              key={d.departmentId}
                              className="border-t border-stroke">
                              <td className="px-4 py-2 font-medium">
                                {d.departmentName}
                              </td>
                              <td className="px-4 py-2 text-slate-500">
                                {d.totalTasks}
                              </td>
                              <td className="px-4 py-2 text-slate-500">
                                {d.completedTasks}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-violet-500"
                                      style={{
                                        width: `${Math.min(d.completionRate, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {d.completionRate?.toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CompanyDetail;
