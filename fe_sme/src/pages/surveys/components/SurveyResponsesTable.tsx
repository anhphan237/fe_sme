import { Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Star } from "lucide-react";
import MyTable from "@/components/table";
import { useLocale } from "@/i18n";

type ResponseRow = {
  surveyResponseId?: string;
  responseId?: string;
  surveyInstanceId?: string;
  instanceId?: string;
  templateName?: string;
  employeeName?: string;
  overallScore?: number | string | null;
  submittedAt?: string | null;
};

type Props = {
  responses: ResponseRow[];
  loading?: boolean;
};

const formatScore = (value?: number | string | null) => {
  if (value == null) return "—";
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? "—" : n.toFixed(2);
};

const SurveyResponsesTable = ({ responses, loading }: Props) => {
  const { t } = useLocale();

  const columns: ColumnsType<ResponseRow> = [
    {
      title: t("survey.reports.col.template"),
      dataIndex: "templateName",
      key: "templateName",
      render: (value?: string) => value || "—",
    },
    {
      title: t("survey.reports.col.employee"),
      dataIndex: "employeeName",
      key: "employeeName",
      render: (value?: string) => value || "—",
    },
    {
      title: t("survey.reports.col.score"),
      dataIndex: "overallScore",
      key: "overallScore",
      width: 100,
      render: (value) => {
        const score = formatScore(value);
        return score === "—" ? (
          <span className="text-slate-300">—</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5" />
            {score}
          </span>
        );
      },
    },
    {
      title: t("survey.reports.col.submitted"),
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 140,
      render: (date?: string | null) =>
        date ? (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500 ring-1 ring-inset ring-slate-200">
            {new Date(date).toLocaleDateString()}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-[#223A59]">
        {t("survey.reports.responses")}
      </h3>

      <MyTable
        rowKey={(row) => row.surveyResponseId || row.responseId || row.surveyInstanceId || row.instanceId || Math.random()}
        columns={columns}
        dataSource={Array.isArray(responses) ? responses : []}
        loading={loading}
        pagination={{ pageSize: 10 }}
        wrapClassName="w-full"
        locale={{
          emptyText: <Empty description={t("survey.reports.no_data")} />,
        }}
      />
    </div>
  );
};

export default SurveyResponsesTable;