import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Star, TrendingUp, Users } from "lucide-react";
import MyTable from "@/components/table";
import BaseButton from "@/components/button";
import BaseSelect from "@core/components/Select/BaseSelect";
import { useLocale } from "@/i18n";
import {
  apiGetSurveyAnalyticsReport,
  apiGetSurveyInstances,
  apiListSurveyResponses,
  apiListSurveyTemplates,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type {
  SurveyAnswer,
  SurveyInstanceSummary,
  SurveyResponseRecord,
  SurveyAnalyticsReport,
  SurveyTemplateSummary,
} from "@/interface/survey";

const CHART_COLORS = ["#3684DB", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

const getScore = (answers: SurveyAnswer[]): string => {
  const nums = answers
    .map((a) =>
      typeof a.value === "number" ? a.value : parseFloat(String(a.value)),
    )
    .filter((n) => !isNaN(n));
  if (nums.length === 0) return "—";
  return (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(1);
};

type KpiProps = {
  label: string;
  value: ReactNode;
  subtext?: string;
  loading?: boolean;
  icon?: ReactNode;
  accentColor?: string;
};

const Kpi = ({
  label,
  value,
  subtext,
  loading,
  icon,
  accentColor = "#3684DB",
}: KpiProps) =>
  loading ? (
    <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
  ) : (
    <div
      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      style={{ borderLeftColor: accentColor, borderLeftWidth: 4 }}>
      {icon && (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}18` }}>
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-3xl font-bold text-[#223A59]">{value}</p>
        {subtext && <p className="mt-0.5 text-xs text-slate-400">{subtext}</p>}
      </div>
    </div>
  );

const SurveyReports = () => {
  const { t } = useLocale();
  const [templateFilter, setTemplateFilter] = useState("");

  /* ── Templates for filter dropdown ── */
  const { data: templatesRaw } = useQuery({
    queryKey: ["survey-templates-report"],
    queryFn: () => apiListSurveyTemplates(),
  });
  const templates = extractList<SurveyTemplateSummary>(
    templatesRaw,
    "items",
    "templates",
    "list",
  );

  /* ── Instances for template name resolution ── */
  const { data: instancesRaw } = useQuery({
    queryKey: ["survey-instances-report"],
    queryFn: () => apiGetSurveyInstances(),
  });
  const instances = extractList<SurveyInstanceSummary>(
    instancesRaw,
    "items",
    "instances",
  );
  const instanceMap = useMemo(
    () =>
      Object.fromEntries(instances.map((i) => [i.instanceId, i.templateName])),
    [instances],
  );

  /* ── Analytics ── */
  const { data: analyticsRaw, isLoading: analyticsLoading } = useQuery({
    queryKey: ["survey-analytics", templateFilter],
    queryFn: () =>
      apiGetSurveyAnalyticsReport(
        templateFilter ? { templateId: templateFilter } : undefined,
      ),
  });

  /* ── Responses ── */
  const { data: responsesRaw, isLoading: responsesLoading } = useQuery({
    queryKey: ["survey-responses", templateFilter],
    queryFn: () =>
      apiListSurveyResponses(
        templateFilter ? { templateId: templateFilter } : undefined,
      ),
  });

  const analytics = analyticsRaw as SurveyAnalyticsReport | null;
  const responses = extractList<SurveyResponseRecord>(
    responsesRaw,
    "items",
    "responses",
    "list",
  );

  const chartData =
    analytics?.byQuestion?.map((q) => ({
      question: q.text.length > 25 ? q.text.slice(0, 25) + "…" : q.text,
      value: q.averageRating ?? 0,
      responseCount: q.responseCount,
    })) ?? [];

  const templateOptions = [
    { value: "", label: t("survey.reports.filter.all_templates") },
    ...templates.map((tmpl) => ({ value: tmpl.templateId, label: tmpl.name })),
  ];

  const responseColumns: ColumnsType<SurveyResponseRecord> = [
    {
      title: t("survey.reports.col.template"),
      key: "template",
      render: (_, row) => (
        <span className="text-sm font-medium text-[#223A59]">
          {instanceMap[row.instanceId] ?? "—"}
        </span>
      ),
    },
    {
      title: t("survey.reports.col.employee"),
      dataIndex: "employeeId",
      key: "employeeId",
      render: (id: string) => (
        <span className="font-mono text-xs text-slate-500">{id}</span>
      ),
    },
    {
      title: t("survey.reports.col.score"),
      key: "score",
      width: 90,
      render: (_, row) => {
        const s = getScore(row.answers);
        return s === "—" ? (
          <span className="text-slate-300">—</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5" />
            {s}
          </span>
        );
      },
    },
    {
      title: t("survey.reports.col.submitted"),
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 130,
      defaultSortOrder: "descend",
      sorter: (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      render: (date: string) =>
        date ? (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500 ring-1 ring-inset ring-slate-200">
            {new Date(date).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#223A59]">
            {t("survey.reports.title")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {t("survey.reports.subtitle")}
          </p>
        </div>
        <div className="w-52">
          <BaseSelect
            name="templateFilter"
            options={templateOptions}
            placeholder={t("survey.reports.filter.all_templates")}
            onChange={(v) => setTemplateFilter((v as string) ?? "")}
            allowClear
          />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Kpi
          label={t("survey.reports.total")}
          value={analytics?.totalSurveys ?? 0}
          subtext={t("survey.reports.filter.responses_count", {
            count: responses.length,
          })}
          loading={analyticsLoading}
          icon={<Users className="h-5 w-5" />}
          accentColor="#3684DB"
        />
        <Kpi
          label={t("survey.reports.completion_rate")}
          value={
            analytics?.completionRate != null
              ? `${(analytics.completionRate * 100).toFixed(0)}%`
              : "—"
          }
          loading={analyticsLoading}
          icon={<TrendingUp className="h-5 w-5" />}
          accentColor="#10b981"
        />
        <Kpi
          label={t("survey.reports.avg_score")}
          value={analytics?.averageScore?.toFixed(1) ?? "—"}
          loading={analyticsLoading}
          icon={<Star className="h-5 w-5" />}
          accentColor="#8b5cf6"
        />
      </div>

      {/* ── Chart ── */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-[#223A59]">
          {t("survey.reports.by_question")}
        </h3>
        {analyticsLoading ? (
          <div className="mt-4 h-56 animate-pulse rounded-lg bg-slate-100" />
        ) : chartData.length === 0 ? (
          <Empty className="mt-4" description={t("survey.reports.no_data")} />
        ) : (
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                <XAxis dataKey="question" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, _name, props) => [
                    `${val} (${props.payload.responseCount} ${t("survey.reports.responses")})`,
                    t("survey.reports.avg_score"),
                  ]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Responses Table ── */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#223A59]">
            {t("survey.reports.responses")}
          </h3>
          <BaseButton
            icon={<Download className="h-4 w-4" />}
            label="survey.reports.export"
          />
        </div>
        <MyTable
          columns={responseColumns}
          dataSource={responses}
          rowKey="responseId"
          loading={responsesLoading}
          pagination={{ pageSize: 10 }}
          wrapClassName="w-full"
          locale={{
            emptyText: <Empty description={t("survey.reports.no_data")} />,
          }}
        />
      </div>
    </div>
  );
};

export default SurveyReports;
