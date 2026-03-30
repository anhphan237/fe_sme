import { Empty } from "antd";
import type { InsightItem } from "../types/survey-report.types";
import { formatScore, truncate } from "../utils/survey-report.utils";

type Props = {
  title: string;
  items: InsightItem[];
  tone?: "danger" | "success";
};

const toneMap = {
  danger: {
    badge: "bg-red-50 text-red-600 ring-red-100",
  },
  success: {
    badge: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
};

const SurveyInsightCard = ({ title, items, tone = "danger" }: Props) => {
  const currentTone = toneMap[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-[#223A59]">{title}</h3>

      {items.length === 0 ? (
        <Empty className="mt-4" description="No data" />
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800">
                  {truncate(item.label, 72)}
                </div>
                {item.subtext && (
                  <div className="mt-1 text-xs text-slate-500">{item.subtext}</div>
                )}
              </div>

              <div
                className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${currentTone.badge}`}
              >
                {formatScore(item.value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SurveyInsightCard;