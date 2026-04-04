import { Empty } from "antd";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale } from "@/i18n";

type TrendChartItem = {
  bucket: string;
  score: number;
  submitted: number;
};

type Props = {
  data?: TrendChartItem[];
  loading?: boolean;
};

const SurveyTrendChartCard = ({ data = [], loading }: Props) => {
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-[#223A59]">
        {t("survey.reports.trend_over_time")}
      </h3>

      {loading ? (
        <div className="mt-4 h-72 animate-pulse rounded-lg bg-slate-100" />
      ) : data.length === 0 ? (
        <Empty className="mt-4" description={t("survey.reports.no_data")} />
      ) : (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, _name, props) => [
                  `${value.toFixed(2)} | ${props.payload.submitted} responses`,
                  t("survey.reports.avg_score"),
                ]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3684DB"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SurveyTrendChartCard;