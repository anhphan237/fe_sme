import { Empty, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import MyTable from "@/components/table";
import { useLocale } from "@/i18n";
import type { SurveyQuestionStat } from "../types/survey-report.types";
import { formatPercent, formatScore, truncate } from "../utils/survey-report.utils";

type Props = {
  data: SurveyQuestionStat[];
  loading?: boolean;
};

const SurveyQuestionStatsTable = ({ data, loading }: Props) => {
  const { t } = useLocale();

  const getDimensionLabel = (name?: string | null) => {
    if (!name) return "—";
    const key = `survey.dimension.${name.toLowerCase()}`;
    const value = t(key);
    return value !== key ? value : name;
  };

  const columns: ColumnsType<SurveyQuestionStat> = [
    {
      title: t("survey.reports.question"),
      dataIndex: "questionText",
      key: "questionText",
      render: (value: string) => (
        <span className="font-medium text-slate-800">{truncate(value, 96)}</span>
      ),
    },
    {
      title: t("survey.reports.type"),
      dataIndex: "questionType",
      key: "questionType",
      width: 130,
      render: (value: string) => <Tag>{value || "—"}</Tag>,
    },
    {
      title: t("survey.reports.dimension"),
      dataIndex: "dimensionCode",
      key: "dimensionCode",
      width: 170,
      render: (value?: string | null) => getDimensionLabel(value),
    },
    {
      title: t("survey.reports.avg_score"),
      dataIndex: "averageScore",
      key: "averageScore",
      width: 110,
      render: (value) => formatScore(value),
    },
    {
      title: t("survey.reports.responses"),
      dataIndex: "responseCount",
      key: "responseCount",
      width: 110,
      render: (value?: number) => value ?? 0,
    },
    {
      title: t("survey.reports.completion"),
      dataIndex: "completionRate",
      key: "completionRate",
      width: 130,
      render: (value) => formatPercent(value),
    },
    {
      title: t("survey.reports.sample_comments"),
      key: "sampleTexts",
      render: (_, row) =>
        row.questionType?.toUpperCase() === "TEXT" && row.sampleTexts?.length ? (
          <div className="space-y-1">
            {row.sampleTexts.slice(0, 2).map((text, index) => (
              <div key={index} className="text-xs text-slate-500">
                • {truncate(text, 60)}
              </div>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-[#223A59]">
        {t("survey.reports.question_performance")}
      </h3>

      <MyTable
        rowKey="questionId"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 8 }}
        wrapClassName="w-full"
        locale={{
          emptyText: <Empty description={t("survey.reports.no_data")} />,
        }}
      />
    </div>
  );
};

export default SurveyQuestionStatsTable;