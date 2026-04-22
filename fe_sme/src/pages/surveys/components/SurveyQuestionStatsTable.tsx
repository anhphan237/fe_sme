import { Empty, Progress, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import MyTable from "@/components/table";
import { useLocale } from "@/i18n";
import type { SurveyQuestionStat } from "../types/survey-report.types";
import {
  formatPercent,
  formatScore,
  truncate,
} from "../utils/survey-report.utils";

type Props = {
  data: SurveyQuestionStat[];
  loading?: boolean;
};

type ChoiceDistribution =
  | Record<string, number>
  | Array<{
      label?: string;
      value?: string;
      count?: number;
      percentage?: number;
      percent?: number;
    }>;

type QuestionStatWithDistribution = SurveyQuestionStat & {
  choiceDistribution?: ChoiceDistribution;
};

const isChoiceQuestion = (type?: string | null) => {
  const value = String(type ?? "").toUpperCase();
  return (
    value === "CHOICE" ||
    value === "SINGLE_CHOICE" ||
    value === "MULTIPLE_CHOICE" ||
    value === "MULTI_CHOICE" ||
    value === "CHECKBOX"
  );
};

const normalizeDistribution = (distribution?: ChoiceDistribution) => {
  if (!distribution) return [];

  if (Array.isArray(distribution)) {
    return distribution
      .map((item) => ({
        label: item.label ?? item.value ?? "—",
        count: item.count ?? 0,
        percent: item.percentage ?? item.percent,
      }))
      .filter((item) => item.label);
  }

  return Object.entries(distribution).map(([label, count]) => ({
    label,
    count: Number(count) || 0,
    percent: undefined,
  }));
};

const SurveyQuestionStatsTable = ({ data, loading }: Props) => {
  const { t } = useLocale();

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

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
      render: (value: string, row) => (
        <div>
          <span className="font-medium text-slate-800">
            {truncate(value, 96)}
          </span>
          {row.questionType?.toUpperCase() === "TEXT" &&
          row.sampleTexts?.length ? (
            <div className="mt-1 text-xs text-slate-400">
              {tr("survey.reports.has_text_feedback", "Has text feedback")}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: t("survey.reports.type"),
      dataIndex: "questionType",
      key: "questionType",
      width: 140,
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
      width: 150,
      render: (value) => (
        <div className="min-w-[110px]">
          <div className="mb-1 text-xs text-slate-500">
            {formatPercent(value)}
          </div>
          <Progress
            percent={Number(value ?? 0)}
            showInfo={false}
            size="small"
          />
        </div>
      ),
    },
    {
      title: tr("survey.reports.choice_distribution", "Choice distribution"),
      key: "choiceDistribution",
      width: 240,
      render: (_, row) => {
        const record = row as QuestionStatWithDistribution;
        const distribution = normalizeDistribution(record.choiceDistribution);

        if (!isChoiceQuestion(row.questionType) || distribution.length === 0) {
          return "—";
        }

        const total = distribution.reduce((sum, item) => sum + item.count, 0);

        return (
          <div className="space-y-2">
            {distribution.slice(0, 3).map((item, index) => {
              const percent =
                item.percent != null
                  ? item.percent
                  : total > 0
                    ? Math.round((item.count / total) * 100)
                    : 0;

              return (
                <div key={`${item.label}-${index}`}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-slate-600">
                      {truncate(item.label, 28)}
                    </span>
                    <span className="shrink-0 font-medium text-slate-500">
                      {item.count} · {percent}%
                    </span>
                  </div>
                  <Progress percent={percent} showInfo={false} size="small" />
                </div>
              );
            })}

            {distribution.length > 3 && (
              <div className="text-xs text-slate-400">
                +{distribution.length - 3}{" "}
                {tr("survey.reports.more_options", "more options")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: t("survey.reports.sample_comments"),
      key: "sampleTexts",
      width: 260,
      render: (_, row) =>
        row.questionType?.toUpperCase() === "TEXT" &&
        row.sampleTexts?.length ? (
          <div className="space-y-1">
            {row.sampleTexts.slice(0, 2).map((text, index) => (
              <div key={index} className="text-xs text-slate-500">
                • {truncate(text, 72)}
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
        scroll={{ x: 1280 }}
        locale={{
          emptyText: <Empty description={t("survey.reports.no_data")} />,
        }}
      />
    </div>
  );
};

export default SurveyQuestionStatsTable;
