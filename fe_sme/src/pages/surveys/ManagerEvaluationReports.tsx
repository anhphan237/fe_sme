import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, DatePicker, Empty, Input, Progress, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { BarChart3, CheckCircle2, Clock3, Send, Star, UserRoundCheck } from "lucide-react";

import MyTable from "@/components/table";
import { useLocale } from "@/i18n";
import { apiGetManagerEvaluationReport } from "@/api/survey/survey.api";
import SurveyDimensionChartCard from "./components/SurveyDimensionChartCard";
import SurveyQuestionStatsTable from "./components/SurveyQuestionStatsTable";
import SurveyInsightCard from "./components/SurveyInsightCard";
import type { ManagerEvaluationEmployeeRow, ManagerEvaluationReportResponse } from "@/interface/survey";



type Filters = {
  startDate?: string;
  endDate?: string;
  templateId?: string;
  keyword?: string;
};

const extractData = <T,>(res: unknown): T => {
  const raw = res as Record<string, unknown>;
  return ((raw?.data as T) ?? (raw?.result as T) ?? (raw?.payload as T) ?? (res as T));
};

const toNumber = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const formatScore = (value?: number | null) => {
  const n = toNumber(value);
  return n > 0 ? n.toFixed(2) : "—";
};

const formatPercent = (value?: number | null) => `${toNumber(value).toFixed(1)}%`;

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : value;
};
type Props = {
  embedded?: boolean;
};
const getDimensionKey = (dimensionCode?: string | null) =>
  `survey.dimension.manager.${String(dimensionCode ?? "").toLowerCase()}`;

const KpiCard = ({
  title,
  value,
  subtext,
  icon,
  tone = "default",
  loading,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  loading?: boolean;
}) => {
  const toneClass = {
    default: "border-slate-200 bg-white text-slate-500",
    success: "border-emerald-200 bg-emerald-50 text-emerald-600",
    warning: "border-amber-200 bg-amber-50 text-amber-600",
    danger: "border-red-200 bg-red-50 text-red-600",
  }[tone];

  if (loading) return <div className="h-28 animate-pulse rounded-xl bg-slate-100" />;

  return (
    <Card className={`border shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#223A59]">{value}</p>
          {subtext ? <p className="mt-1 text-xs text-slate-500">{subtext}</p> : null}
        </div>
        <div className="shrink-0">{icon}</div>
      </div>
    </Card>
  );
};

const ManagerEvaluationReports = ({ embedded = false }: Props) => {
  const { t } = useLocale();
  const [filters, setFilters] = useState<Filters>({});

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["manager-evaluation-report", filters],
    queryFn: () => apiGetManagerEvaluationReport(filters),
    select: (res) => extractData<ManagerEvaluationReportResponse>(res),
  });

  const report = data ?? {
    sentCount: 0,
    submittedCount: 0,
    pendingCount: 0,
    responseRate: 0,
    averageScore: 0,
    recommendationRate: 0,
    dimensionStats: [],
    questionStats: [],
    employees: [],
    riskItems: [],
    strengthItems: [],
  };

  const dimensionChartData = useMemo(
    () =>
      report.dimensionStats.map((item) => ({
        name: item.dimensionCode,
        value: item.averageScore,
        responseCount: item.responseCount,
        questionCount: item.questionCount,
      })),
    [report.dimensionStats],
  );

  const employeeColumns = useMemo<ColumnsType<ManagerEvaluationEmployeeRow>>(
    () => [
      {
        title: t("survey.managerEvaluationReport.employee"),
        key: "employee",
        render: (_, row) => (
          <div>
            <p className="font-medium text-slate-900">{row.employeeName || "—"}</p>
            <p className="text-xs text-slate-500">{row.employeeEmail || "—"}</p>
          </div>
        ),
      },
      {
        title: t("survey.managerEvaluationReport.manager"),
        key: "manager",
        render: (_, row) => <span className="text-sm text-slate-600">{row.managerName || "—"}</span>,
      },
      {
        title: t("survey.managerEvaluationReport.score"),
        key: "score",
        render: (_, row) => (
          <div className="min-w-[120px]">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{formatScore(row.overallScore)}</span>
              <span>/5</span>
            </div>
            <Progress percent={Math.min((toNumber(row.overallScore) / 5) * 100, 100)} showInfo={false} size="small" />
          </div>
        ),
      },
      {
        title: t("survey.managerEvaluationReport.recommendation"),
        dataIndex: "recommendation",
        key: "recommendation",
        render: (value) => <span className="text-sm text-slate-600">{value || "—"}</span>,
      },
      {
        title: t("global.status"),
        key: "status",
        render: (_, row) => {
          const status = String(row.status ?? "").toUpperCase();
          const color = status === "SUBMITTED" ? "success" : status === "PENDING" || status === "SENT" ? "warning" : "default";
          return <Tag color={color}>{t(`survey.managerEvaluationReport.status.${status.toLowerCase()}`)}</Tag>;
        },
      },
      {
        title: t("survey.managerEvaluationReport.submittedAt"),
        key: "submittedAt",
        render: (_, row) => <span className="text-sm text-slate-500">{formatDateTime(row.submittedAt)}</span>,
      },
    ],
    [t],
  );

  const handleRangeChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    setFilters((prev) => ({
      ...prev,
      startDate: dates?.[0] ? dates[0].format("YYYY-MM-DD") : undefined,
      endDate: dates?.[1] ? dates[1].format("YYYY-MM-DD") : undefined,
    }));
  };

  const loading = isLoading || isFetching;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
              <UserRoundCheck className="h-3.5 w-3.5" />
              {t("survey.managerEvaluationReport.badge")}
            </div>
            <h1 className="mt-3 text-xl font-semibold text-[#223A59]">
              {t("survey.managerEvaluationReport.title")}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              {t("survey.managerEvaluationReport.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input.Search
              allowClear
              className="w-64"
              placeholder={t("survey.managerEvaluationReport.searchPlaceholder")}
              onSearch={(value) => setFilters((prev) => ({ ...prev, keyword: value || undefined }))}
            />
            <DatePicker.RangePicker format="YYYY-MM-DD" onChange={handleRangeChange} />
            <Button onClick={() => refetch()}>{t("global.refresh")}</Button>
          </div>
        </div>
      </div>

      <Alert
        type="info"
        showIcon
        message={t("survey.managerEvaluationReport.noticeTitle")}
        description={t("survey.managerEvaluationReport.noticeDesc")}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard title={t("survey.reports.sent_count")} value={report.sentCount} loading={loading} icon={<Send className="h-5 w-5" />} />
        <KpiCard title={t("survey.reports.submitted_count")} value={report.submittedCount} loading={loading} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
        <KpiCard title={t("survey.reports.pending")} value={report.pendingCount} loading={loading} icon={<Clock3 className="h-5 w-5" />} tone={report.pendingCount > 0 ? "warning" : "success"} />
        <KpiCard title={t("survey.reports.completion_rate")} value={formatPercent(report.responseRate)} loading={loading} icon={<BarChart3 className="h-5 w-5" />} />
        <KpiCard title={t("survey.reports.avg_score")} value={formatScore(report.averageScore)} subtext="/5" loading={loading} icon={<Star className="h-5 w-5" />} />
        <KpiCard title={t("survey.managerEvaluationReport.recommendationRate")} value={formatPercent(report.recommendationRate)} loading={loading} icon={<UserRoundCheck className="h-5 w-5" />} tone="success" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SurveyDimensionChartCard data={dimensionChartData} loading={loading} />
        <div className="grid gap-5">
          <SurveyInsightCard title={t("survey.managerEvaluationReport.needFollowUp")} items={report.riskItems} tone="danger" />
          <SurveyInsightCard title={t("survey.managerEvaluationReport.strengths")} items={report.strengthItems} tone="success" />
        </div>
      </div>

      <SurveyQuestionStatsTable data={report.questionStats} loading={loading} />

      <Card title={t("survey.managerEvaluationReport.employeeTableTitle")} className="shadow-sm">
        {report.employees.length === 0 && !loading ? (
          <Empty description={t("survey.reports.no_data")} />
        ) : (
          <MyTable<ManagerEvaluationEmployeeRow>
            rowKey="surveyInstanceId"
            columns={employeeColumns}
            dataSource={report.employees}
            loading={loading}
            pagination={{}}
          />
        )}
      </Card>
    </div>
  );
};

export default ManagerEvaluationReports;
