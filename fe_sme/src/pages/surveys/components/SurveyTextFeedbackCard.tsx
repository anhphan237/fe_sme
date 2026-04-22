import { Empty, Tag } from "antd";
import { MessageSquareText } from "lucide-react";
import { useLocale } from "@/i18n";
import type { SurveyQuestionStat } from "../types/survey-report.types";
import { truncate } from "../utils/survey-report.utils";

type Props = {
  questionStats: SurveyQuestionStat[];
  loading?: boolean;
};

const SurveyTextFeedbackCard = ({ questionStats, loading }: Props) => {
  const { t } = useLocale();

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const getDimensionLabel = (name?: string | null) => {
    if (!name) return "—";
    const key = `survey.dimension.${String(name).toLowerCase()}`;
    const value = t(key);
    return value !== key ? value : name;
  };

  const feedbacks = (questionStats ?? [])
    .filter((item) => item.questionType?.toUpperCase() === "TEXT")
    .flatMap((item) =>
      (item.sampleTexts ?? []).filter(Boolean).map((text) => ({
        text,
        questionText: item.questionText,
        dimensionCode: item.dimensionCode,
      })),
    )
    .slice(0, 8);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <MessageSquareText className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#223A59]">
            {tr("survey.reports.text_feedback", "Recent Text Feedback")}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {tr(
              "survey.reports.text_feedback_desc",
              "Các phản hồi định tính nổi bật từ câu hỏi dạng text.",
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <Empty
          className="mt-4"
          description={tr(
            "survey.reports.no_text_feedback",
            "No text feedback",
          )}
        />
      ) : (
        <div className="mt-4 space-y-3">
          {feedbacks.map((item, index) => (
            <div
              key={`${item.text}-${index}`}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Tag color="blue">{getDimensionLabel(item.dimensionCode)}</Tag>
                <span className="text-xs text-slate-400">
                  {truncate(item.questionText ?? "—", 60)}
                </span>
              </div>

              <p className="text-sm leading-5 text-slate-700">
                “{truncate(item.text, 180)}”
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SurveyTextFeedbackCard;
