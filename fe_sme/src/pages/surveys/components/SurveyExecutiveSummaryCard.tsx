import { Button, Tag } from "antd";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  MessageSquareText,
  RefreshCcw,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "@/i18n";
import type {
  InsightItem,
  SurveyAnalyticsReportVm,
  SurveyQuestionStat,
  SurveyStageTrend,
} from "../types/survey-report.types";
import type { SurveyAiSummaryResponse } from "@/interface/survey";
import {
  formatPercent,
  formatScore,
  truncate,
} from "../utils/survey-report.utils";

type Props = {
  analytics?: SurveyAnalyticsReportVm | null;
  riskItems?: InsightItem[];
  strengthItems?: InsightItem[];
  questionStats?: SurveyQuestionStat[];
  stageTrends?: SurveyStageTrend[];
  loading?: boolean;
  aiSummary?: SurveyAiSummaryResponse | null;
  aiLoading?: boolean;
  onGenerateAi?: () => void;
  onRefreshAi?: () => void;
  refreshBlocked?: boolean;
};

type HealthLevel = "good" | "stable" | "warning";

const toNumber = (value?: number | string | null) => {
  if (value == null) return 0;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getHealthLevel = (responseRate: number, avgScore: number): HealthLevel => {
  if (responseRate >= 80 && avgScore >= 4) return "good";
  if (responseRate >= 60 && avgScore >= 3) return "stable";
  return "warning";
};

const normalizeAiHealth = (value?: string): HealthLevel | null => {
  const normalized = String(value ?? "").toUpperCase();

  if (normalized === "GOOD") return "good";
  if (normalized === "STABLE") return "stable";
  if (normalized === "WARNING") return "warning";

  return null;
};

const SurveyExecutiveSummaryCard = ({
  analytics,
  riskItems = [],
  strengthItems = [],
  questionStats = [],
  stageTrends = [],
  loading,
  aiSummary,
  aiLoading,
  onGenerateAi,
  onRefreshAi,
  refreshBlocked = false,
}: Props) => {
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

  const sentCount = toNumber(analytics?.sentCount);
  const submittedCount = toNumber(analytics?.submittedCount);
  const pendingCount = Math.max(sentCount - submittedCount, 0);
  const responseRate = toNumber(analytics?.responseRate);
  const avgScore = toNumber(analytics?.overallSatisfactionScore);

  const weakest = riskItems[0];
  const strongest = strengthItems[0];

  const weakestLabel = getDimensionLabel(weakest?.label);
  const strongestLabel = getDimensionLabel(strongest?.label);

  const ruleHealthLevel = getHealthLevel(responseRate, avgScore);
  const healthLevel =
    normalizeAiHealth(aiSummary?.healthLevel) ?? ruleHealthLevel;

  const healthMeta = {
    good: {
      label: tr("survey.reports.summary.health_good", "Tốt"),
      color: "green",
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: tr(
        "survey.reports.summary.health_good_text",
        "Tỷ lệ phản hồi và điểm hài lòng đều đang ở mức tốt.",
      ),
    },
    stable: {
      label: tr("survey.reports.summary.health_stable", "Ổn định"),
      color: "blue",
      icon: <TrendingUp className="h-4 w-4" />,
      text: tr(
        "survey.reports.summary.health_stable_text",
        "Dữ liệu khảo sát đang ở mức ổn định, nhưng vẫn còn điểm cần cải thiện.",
      ),
    },
    warning: {
      label: tr("survey.reports.summary.health_warning", "Cần chú ý"),
      color: "orange",
      icon: <AlertTriangle className="h-4 w-4" />,
      text: tr(
        "survey.reports.summary.health_warning_text",
        "Có dấu hiệu cần HR theo dõi, đặc biệt ở tỷ lệ phản hồi hoặc điểm hài lòng.",
      ),
    },
  }[healthLevel];

  const textFeedbacks = (questionStats ?? [])
    .filter((item) => String(item.questionType ?? "").toUpperCase() === "TEXT")
    .flatMap((item) => item.sampleTexts ?? [])
    .filter(Boolean);

  const stageInsight = (() => {
    const normalizeStage = (stage?: string | null) => {
      const value = String(stage ?? "").trim().toUpperCase();

      if (value === "DAY_7" || value === "D7") return "D7";
      if (value === "DAY_30" || value === "D30") return "D30";
      if (value === "DAY_60" || value === "D60") return "D60";

      return value || "—";
    };

    const stageData = (stageTrends ?? []).map((item) => ({
      stage: normalizeStage(item.stage),
      score: toNumber(item.averageOverall),
    }));

    const d7 = stageData.find((item) => item.stage === "D7");
    const d30 = stageData.find((item) => item.stage === "D30");
    const d60 = stageData.find((item) => item.stage === "D60");

    if (d7 && d30 && d7.score > 0 && d30.score > 0) {
      if (d7.score < d30.score) {
        return tr(
          "survey.reports.summary.stage_d7_low",
          "Điểm D7 thấp hơn D30, cho thấy tuần đầu onboarding là giai đoạn cần HR ưu tiên cải thiện.",
        );
      }

      if (d30.score < d7.score) {
        return tr(
          "survey.reports.summary.stage_d30_drop",
          "Điểm D30 giảm so với D7, HR nên kiểm tra workload, độ rõ vai trò và hỗ trợ từ manager sau vài tuần đầu.",
        );
      }
    }

    if (d30 && d60 && d30.score > 0 && d60.score > 0 && d60.score < d30.score) {
      return tr(
        "survey.reports.summary.stage_d60_drop",
        "Điểm D60 giảm so với D30, HR nên theo dõi giai đoạn sau thử việc và mức độ hòa nhập lâu hơn.",
      );
    }

    return tr(
      "survey.reports.summary.stage_normal",
      "Xu hướng theo giai đoạn chưa cho thấy biến động lớn hoặc chưa đủ dữ liệu để kết luận mạnh.",
    );
  })();

  const ruleMainSummary = (() => {
    if (!analytics || sentCount === 0) {
      return tr(
        "survey.reports.summary.no_data_text",
        "Chưa có đủ dữ liệu khảo sát để tạo tóm tắt cho HR.",
      );
    }

    return `${tr(
      "survey.reports.summary.overview_prefix",
      "Trong kỳ này, hệ thống đã gửi",
    )} ${sentCount} ${tr("survey.reports.summary.surveys", "khảo sát")} ${tr(
      "survey.reports.summary.and_received",
      "và nhận được",
    )} ${submittedCount} ${tr(
      "survey.reports.summary.responses",
      "phản hồi",
    )}, ${tr(
      "survey.reports.summary.response_rate_is",
      "đạt tỷ lệ phản hồi",
    )} ${formatPercent(responseRate)}. ${
      pendingCount > 0
        ? `${tr(
            "survey.reports.summary.pending_sentence",
            "Hiện còn",
          )} ${pendingCount} ${tr(
            "survey.reports.summary.pending_surveys",
            "khảo sát chưa được nộp",
          )}.`
        : tr(
            "survey.reports.summary.no_pending_sentence",
            "Tất cả khảo sát đã gửi đều đã được phản hồi.",
          )
    }`;
  })();

  const ruleScoreSummary = (() => {
    if (!analytics || submittedCount === 0) {
      return tr(
        "survey.reports.summary.score_no_data",
        "Chưa có phản hồi đã nộp để đánh giá điểm hài lòng.",
      );
    }

    return `${tr(
      "survey.reports.summary.avg_score_sentence",
      "Điểm hài lòng trung bình hiện tại là",
    )} ${formatScore(avgScore)}/5. ${
      weakest
        ? `${tr(
            "survey.reports.summary.weakest_sentence",
            "Khía cạnh cần ưu tiên là",
          )} "${weakestLabel}" ${tr(
            "survey.reports.summary.with_score",
            "với điểm",
          )} ${formatScore(weakest.value)}/5.`
        : ""
    } ${
      strongest
        ? `${tr(
            "survey.reports.summary.strongest_sentence",
            "Khía cạnh đang làm tốt nhất là",
          )} "${strongestLabel}" ${tr(
            "survey.reports.summary.with_score",
            "với điểm",
          )} ${formatScore(strongest.value)}/5.`
        : ""
    }`;
  })();

  const ruleActionItems: string[] = [];

  if (pendingCount > 0) {
    ruleActionItems.push(
      `${tr(
        "survey.reports.summary.action_remind",
        "Gửi reminder cho khảo sát chưa phản hồi",
      )}: ${pendingCount}.`,
    );
  }

  if (weakest) {
    ruleActionItems.push(
      `${tr(
        "survey.reports.summary.action_review_dimension",
        "Xem lại các câu hỏi điểm thấp trong khía cạnh",
      )} "${weakestLabel}".`,
    );
  }

  if (avgScore > 0 && avgScore < 3.5) {
    ruleActionItems.push(
      tr(
        "survey.reports.summary.action_process_review",
        "Rà soát lại checklist onboarding tổng thể vì điểm hài lòng chưa thật sự ổn định.",
      ),
    );
  }

  if (textFeedbacks.length > 0) {
    ruleActionItems.push(
      tr(
        "survey.reports.summary.action_read_feedback",
        "Đọc phản hồi dạng text để tìm nguyên nhân cụ thể phía sau điểm số.",
      ),
    );
  }

  if (ruleActionItems.length === 0) {
    ruleActionItems.push(
      tr(
        "survey.reports.summary.action_keep_monitoring",
        "Tiếp tục duy trì quy trình hiện tại và theo dõi biến động theo từng đợt khảo sát.",
      ),
    );
  }

  const usingAi = Boolean(aiSummary?.summary);
  const mainSummary = usingAi ? aiSummary?.summary : ruleMainSummary;
  const keyFindings = usingAi
    ? aiSummary?.keyFindings ?? []
    : [ruleScoreSummary, stageInsight].filter(Boolean);

  const actionItems = usingAi
    ? aiSummary?.recommendedActions ?? []
    : ruleActionItems;

  const sampleFeedback = textFeedbacks[0];

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-6 w-52 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 space-y-3">
          <div className="h-5 animate-pulse rounded bg-slate-100" />
          <div className="h-5 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-[#223A59]">
              {tr("survey.reports.summary.title", "Tóm tắt nhanh cho HR")}
            </h3>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {usingAi
              ? tr(
                  "survey.reports.summary.ai_subtitle",
                  "Tóm tắt được tạo bằng AI dựa trên dữ liệu dashboard và cache theo dữ liệu hiện tại.",
                )
              : tr(
                  "survey.reports.summary.subtitle",
                  "Bản tóm tắt tự động giúp HR đọc nhanh tình hình khảo sát và hành động cần làm.",
                )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tag
            color={healthMeta.color}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
          >
            {healthMeta.icon}
            {healthMeta.label}
          </Tag>

          {usingAi && aiSummary?.source && (
            <Tag color={aiSummary.source === "AI" ? "purple" : "blue"}>
              {aiSummary.source}
            </Tag>
          )}

          {!usingAi ? (
            <Button
              icon={<Bot className="h-4 w-4" />}
              loading={aiLoading}
              onClick={onGenerateAi}
              disabled={!analytics}
            >
              {tr("survey.reports.summary.generate_ai", "Tạo tóm tắt AI")}
            </Button>
          ) : (
            <Button
              icon={<RefreshCcw className="h-4 w-4" />}
              loading={aiLoading}
              onClick={onRefreshAi}
              disabled={refreshBlocked}
            >
              {tr("survey.reports.summary.refresh_ai", "Làm mới AI")}
            </Button>
          )}
        </div>
      </div>

      {aiSummary?.errorMessage && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {aiSummary.errorMessage}
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              {tr("survey.reports.summary.overall", "Tổng quan")}
            </div>
            <p className="text-sm leading-6 text-slate-700">{mainSummary}</p>
          </div>

          {keyFindings.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                {tr("survey.reports.summary.key_finding", "Nhận định chính")}
              </div>

              <div className="space-y-2">
                {keyFindings.slice(0, 4).map((item, index) => (
                  <p key={index} className="text-sm leading-6 text-slate-700">
                    • {item}
                  </p>
                ))}
              </div>
            </div>
          )}

          {usingAi && aiSummary?.riskExplanation && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {tr("survey.reports.summary.risk_explanation", "Giải thích rủi ro")}
              </div>
              <p className="text-sm leading-6 text-slate-700">
                {aiSummary.riskExplanation}
              </p>
            </div>
          )}

          {usingAi && aiSummary?.positiveSignal && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Lightbulb className="h-4 w-4 text-emerald-500" />
                {tr("survey.reports.summary.positive_signal", "Tín hiệu tích cực")}
              </div>
              <p className="text-sm leading-6 text-slate-700">
                {aiSummary.positiveSignal}
              </p>
            </div>
          )}

          {!usingAi && sampleFeedback && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MessageSquareText className="h-4 w-4 text-emerald-500" />
                {tr(
                  "survey.reports.summary.sample_feedback",
                  "Phản hồi đáng chú ý",
                )}
              </div>
              <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm italic leading-6 text-slate-600">
                “{truncate(sampleFeedback, 220)}”
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-800">
            <Send className="h-4 w-4" />
            {tr("survey.reports.summary.next_actions", "HR nên làm gì ngay?")}
          </div>

          <div className="space-y-3">
            {actionItems.slice(0, 5).map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm leading-5 text-slate-700"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/80 px-2 py-3">
              <p className="text-xs text-slate-400">
                {tr("survey.reports.sent_count", "Đã gửi")}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-800">
                {sentCount}
              </p>
            </div>

            <div className="rounded-xl bg-white/80 px-2 py-3">
              <p className="text-xs text-slate-400">
                {tr("survey.reports.pending", "Chưa phản hồi")}
              </p>
              <p className="mt-1 text-lg font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-xl bg-white/80 px-2 py-3">
              <p className="text-xs text-slate-400">
                {tr("survey.reports.avg_score", "Điểm TB")}
              </p>
              <p className="mt-1 text-lg font-bold text-blue-700">
                {formatScore(avgScore)}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-blue-700/80">
            {healthMeta.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveyExecutiveSummaryCard;