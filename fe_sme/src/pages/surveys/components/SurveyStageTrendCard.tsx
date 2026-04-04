import { Empty } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale } from "@/i18n";
import type { SurveyStageTrend } from "../types/survey-report.types";

type Props = {
  data: SurveyStageTrend[];
  loading?: boolean;
};

const STAGE_LABELS: Record<string, string> = {
  D7: "7 ngày",
  DAY_7: "7 ngày",
  D30: "30 ngày",
  DAY_30: "30 ngày",
  D60: "60 ngày",
  DAY_60: "60 ngày",
  CUSTOM: "Tùy chỉnh",
};

const STAGE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

const toNumber = (value?: number | string | null) => {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const normalizeStageLabel = (stage?: string) => {
  if (!stage) return "—";
  return STAGE_LABELS[stage.toUpperCase()] || stage;
};

const SurveyStageTrendCard = ({ data, loading }: Props) => {
  const { t } = useLocale();

  const chartData = (data ?? []).map((item) => ({
    stage: item.stage,
    label: normalizeStageLabel(item.stage),
    score: toNumber(item.averageOverall),
    submittedCount: item.submittedCount ?? 0,
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#223A59]">
          {t("survey.reports.stage_trends")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          So sánh mức độ hài lòng theo từng giai đoạn onboarding.
        </p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      ) : chartData.length === 0 ? (
        <Empty description={t("survey.reports.no_data")} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="h-64 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  width={70}
                />
                <Tooltip
                  formatter={(value: number, _name, props) => [
                    `${value.toFixed(2)} | ${props.payload.submittedCount} phản hồi`,
                    "Điểm trung bình",
                  ]}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={24}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={STAGE_COLORS[index % STAGE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {chartData.map((item, index) => (
              <div
                key={`${item.stage}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#223A59]">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.submittedCount} phản hồi
                    </div>
                  </div>

                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                    style={{
                      backgroundColor:
                        STAGE_COLORS[index % STAGE_COLORS.length],
                    }}
                  >
                    {item.score.toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.score / 5) * 100}%`,
                      backgroundColor:
                        STAGE_COLORS[index % STAGE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyStageTrendCard;