import { Empty } from "antd";
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

const COLORS = ["#3684DB", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#14b8a6"];

type Props = {
  data: {
    name: string;
    value: number;
    responseCount: number;
    questionCount: number;
  }[];
  loading?: boolean;
};

const SurveyDimensionChartCard = ({ data, loading }: Props) => {
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-[#223A59]">
        {t("survey.reports.dimension_performance")}
      </h3>

      {loading ? (
        <div className="mt-4 h-72 animate-pulse rounded-lg bg-slate-100" />
      ) : data.length === 0 ? (
        <Empty className="mt-4" description={t("survey.reports.no_data")} />
      ) : (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, _name, props) => [
                  `${value.toFixed(2)} | ${props.payload.responseCount} responses`,
                  t("survey.reports.avg_score"),
                ]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SurveyDimensionChartCard;