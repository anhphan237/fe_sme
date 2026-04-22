import { Empty, Tooltip as AntTooltip } from "antd";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useLocale } from "@/i18n";

const COLORS = [
  "#3684DB",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
];

type Props = {
  data: {
    name: string;
    value: number;
    responseCount: number;
    questionCount: number;
  }[];
  loading?: boolean;
};

const truncateLabel = (value?: string, max = 16) => {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

const SurveyDimensionChartCard = ({ data, loading }: Props) => {
  const { t } = useLocale();

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const getDimensionLabel = (name?: string) => {
    if (!name) return "—";

    const key = `survey.dimension.${name.toLowerCase()}`;
    const value = t(key);

    return value !== key ? value : name;
  };

  const chartData = data.map((item) => {
    const fullName = getDimensionLabel(item.name);

    return {
      ...item,
      fullName,
      name: truncateLabel(fullName, 18),
    };
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-[#223A59]">
        {t("survey.reports.dimension_performance")}
      </h3>

      {loading ? (
        <div className="mt-4 h-72 animate-pulse rounded-lg bg-slate-100" />
      ) : chartData.length === 0 ? (
        <Empty className="mt-4" description={t("survey.reports.no_data")} />
      ) : (
        <>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  height={45}
                />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, _name, props) => [
                    `${value.toFixed(2)} | ${props.payload.responseCount} ${tr(
                      "survey.reports.responses_lower",
                      "phản hồi",
                    )}`,
                    props.payload.fullName,
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? ""
                  }
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {chartData.map((item, index) => (
              <AntTooltip
                key={`${item.fullName}-${index}`}
                title={item.fullName}
              >
                <span className="inline-flex max-w-[220px] cursor-help items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate">{item.fullName}</span>
                </span>
              </AntTooltip>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SurveyDimensionChartCard;
