import { Empty, Tag } from "antd";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  MessageCircleWarning,
  Send,
  TrendingDown,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import { useLocale } from "@/i18n";
import type {
  InsightItem,
  SurveyAnalyticsReportVm,
  SurveyStageTrend,
} from "../types/survey-report.types";
import { formatPercent, formatScore } from "../utils/survey-report.utils";

type RecommendationTone = "danger" | "warning" | "info" | "success";

type RecommendationItem = {
  key: string;
  title: string;
  description: string;
  action: string;
  tone: RecommendationTone;
  icon: React.ReactNode;
};

type Props = {
  analytics?: SurveyAnalyticsReportVm | null;
  riskItems?: InsightItem[];
  strengthItems?: InsightItem[];
  stageTrends?: SurveyStageTrend[];
  loading?: boolean;
};

const toneStyle: Record<RecommendationTone, string> = {
  danger: "border-red-100 bg-red-50 text-red-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  info: "border-blue-100 bg-blue-50 text-blue-700",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
};

const iconStyle: Record<RecommendationTone, string> = {
  danger: "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-blue-100 text-blue-600",
  success: "bg-emerald-100 text-emerald-600",
};

const toNumber = (value?: number | string | null) => {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const normalizeStage = (stage?: string) => {
  const value = String(stage ?? "").toUpperCase();

  if (value === "D7" || value === "DAY_7") return "D7";
  if (value === "D30" || value === "DAY_30") return "D30";
  if (value === "D60" || value === "DAY_60") return "D60";
  if (value === "CUSTOM") return "CUSTOM";

  return value || "—";
};

const SurveyRecommendationCard = ({
  analytics,
  riskItems = [],
  strengthItems = [],
  stageTrends = [],
  loading,
}: Props) => {
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

  const responseRate = toNumber(analytics?.responseRate);
  const overallScore = toNumber(analytics?.overallSatisfactionScore);
  const sentCount = toNumber(analytics?.sentCount);
  const submittedCount = toNumber(analytics?.submittedCount);
  const pendingCount = Math.max(sentCount - submittedCount, 0);

  const lowestRisk = riskItems[0];
  const bestStrength = strengthItems[0];

  const normalizedStages = (stageTrends ?? []).map((item) => ({
    stage: normalizeStage(item.stage),
    score: toNumber(item.averageOverall),
    submittedCount: toNumber(item.submittedCount),
  }));

  const d7 = normalizedStages.find((item) => item.stage === "D7");
  const d30 = normalizedStages.find((item) => item.stage === "D30");
  const d60 = normalizedStages.find((item) => item.stage === "D60");

  const recommendations: RecommendationItem[] = [];

  if (sentCount > 0 && responseRate < 60) {
    recommendations.push({
      key: "low-response-rate",
      title: tr(
        "survey.reports.rec.low_response_title",
        "Tỷ lệ phản hồi đang thấp",
      ),
      description: `${tr(
        "survey.reports.rec.low_response_desc",
        "Hiện còn nhiều khảo sát chưa được phản hồi.",
      )} ${tr("survey.reports.pending", "Pending")}: ${pendingCount}.`,
      action: tr(
        "survey.reports.rec.low_response_action",
        "HR nên gửi reminder cho nhân viên/manager chưa phản hồi hoặc rút gọn nội dung khảo sát.",
      ),
      tone: "danger",
      icon: <Send className="h-4 w-4" />,
    });
  }

  if (overallScore > 0 && overallScore < 3) {
    recommendations.push({
      key: "low-overall-score",
      title: tr(
        "survey.reports.rec.low_score_title",
        "Mức độ hài lòng onboarding thấp",
      ),
      description: `${tr(
        "survey.reports.rec.low_score_desc",
        "Điểm trung bình hiện tại",
      )}: ${formatScore(overallScore)}.`,
      action: tr(
        "survey.reports.rec.low_score_action",
        "HR nên kiểm tra lại quy trình onboarding tổng thể, đặc biệt là tuần đầu và các bước hỗ trợ nhân viên mới.",
      ),
      tone: "danger",
      icon: <TrendingDown className="h-4 w-4" />,
    });
  }

  if (lowestRisk) {
    const dimension = getDimensionLabel(lowestRisk.label);
    const lowerDimension = String(lowestRisk.label ?? "").toLowerCase();

    let action = tr(
      "survey.reports.rec.dimension_action_default",
      "HR nên xem lại các câu hỏi điểm thấp trong nhóm này và trao đổi với nhân viên mới để xác định nguyên nhân.",
    );

    let icon = <AlertTriangle className="h-4 w-4" />;

    if (
      lowerDimension.includes("equipment") ||
      lowerDimension.includes("device") ||
      lowerDimension.includes("tool")
    ) {
      action = tr(
        "survey.reports.rec.equipment_action",
        "HR nên phối hợp IT kiểm tra quy trình cấp laptop, email, tài khoản nội bộ và công cụ làm việc.",
      );
      icon = <Wrench className="h-4 w-4" />;
    }

    if (
      lowerDimension.includes("manager") ||
      lowerDimension.includes("support")
    ) {
      action = tr(
        "survey.reports.rec.manager_action",
        "HR nên nhắc manager follow-up nhân viên mới trong 7 ngày đầu và có lịch 1:1 rõ ràng.",
      );
      icon = <UserRoundCheck className="h-4 w-4" />;
    }

    if (
      lowerDimension.includes("training") ||
      lowerDimension.includes("learning") ||
      lowerDimension.includes("orientation")
    ) {
      action = tr(
        "survey.reports.rec.training_action",
        "HR nên bổ sung tài liệu hướng dẫn, handbook hoặc buổi orientation để nhân viên mới dễ nắm quy trình.",
      );
      icon = <Lightbulb className="h-4 w-4" />;
    }

    recommendations.push({
      key: "risk-dimension",
      title: `${tr("survey.reports.rec.risk_dimension_title", "Điểm yếu nổi bật")}: ${dimension}`,
      description: `${tr(
        "survey.reports.rec.risk_dimension_desc",
        "Điểm hiện tại",
      )}: ${formatScore(lowestRisk.value)}.`,
      action,
      tone: "warning",
      icon,
    });
  }

  if (d7 && d30 && d7.score > 0 && d30.score > 0) {
    if (d7.score < d30.score) {
      recommendations.push({
        key: "d7-below-d30",
        title: tr(
          "survey.reports.rec.week1_issue_title",
          "Tuần đầu onboarding cần được cải thiện",
        ),
        description: `${tr("survey.reports.stage_d7", "D7")}: ${formatScore(
          d7.score,
        )}, ${tr("survey.reports.stage_d30", "D30")}: ${formatScore(d30.score)}.`,
        action: tr(
          "survey.reports.rec.week1_issue_action",
          "HR nên tập trung cải thiện trải nghiệm ngày đầu, cấp thiết bị, giới thiệu quy trình và người phụ trách.",
        ),
        tone: "info",
        icon: <MessageCircleWarning className="h-4 w-4" />,
      });
    }

    if (d30.score < d7.score) {
      recommendations.push({
        key: "d30-drop",
        title: tr(
          "survey.reports.rec.d30_drop_title",
          "Trải nghiệm giảm sau giai đoạn đầu",
        ),
        description: `${tr("survey.reports.stage_d7", "D7")}: ${formatScore(
          d7.score,
        )}, ${tr("survey.reports.stage_d30", "D30")}: ${formatScore(d30.score)}.`,
        action: tr(
          "survey.reports.rec.d30_drop_action",
          "HR nên kiểm tra workload, độ rõ vai trò công việc và mức độ hỗ trợ từ team/manager sau 2–4 tuần.",
        ),
        tone: "warning",
        icon: <TrendingDown className="h-4 w-4" />,
      });
    }
  }

  if (d60 && d30 && d60.score > 0 && d30.score > 0 && d60.score < d30.score) {
    recommendations.push({
      key: "d60-drop",
      title: tr(
        "survey.reports.rec.d60_drop_title",
        "Cần theo dõi giai đoạn sau thử việc",
      ),
      description: `${tr("survey.reports.stage_d30", "D30")}: ${formatScore(
        d30.score,
      )}, ${tr("survey.reports.stage_d60", "D60")}: ${formatScore(d60.score)}.`,
      action: tr(
        "survey.reports.rec.d60_drop_action",
        "HR nên kiểm tra kỳ vọng công việc, áp lực hiệu suất và khả năng hòa nhập của nhân viên mới.",
      ),
      tone: "warning",
      icon: <TrendingDown className="h-4 w-4" />,
    });
  }

  if (recommendations.length === 0 && analytics && submittedCount > 0) {
    recommendations.push({
      key: "healthy",
      title: tr(
        "survey.reports.rec.healthy_title",
        "Tình hình khảo sát đang ổn định",
      ),
      description: `${tr(
        "survey.reports.rec.healthy_desc",
        "Không phát hiện rủi ro lớn từ dữ liệu hiện tại.",
      )} ${bestStrength ? `${tr("survey.reports.best_dimension", "Best dimension")}: ${getDimensionLabel(bestStrength.label)}.` : ""}`,
      action: tr(
        "survey.reports.rec.healthy_action",
        "HR nên tiếp tục duy trì quy trình hiện tại và theo dõi phản hồi text để cải thiện chi tiết nhỏ.",
      ),
      tone: "success",
      icon: <CheckCircle2 className="h-4 w-4" />,
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#223A59]">
            {tr("survey.reports.hr_recommendations", "HR Action Summary")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {tr(
              "survey.reports.hr_recommendations_desc",
              "Gợi ý hành động dựa trên tỷ lệ phản hồi, điểm hài lòng, dimension rủi ro và xu hướng theo stage.",
            )}
          </p>
        </div>

        {!loading && sentCount > 0 && (
          <Tag color={pendingCount > 0 ? "gold" : "green"}>
            {tr("survey.reports.pending", "Pending")}: {pendingCount}
          </Tag>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Empty description={tr("survey.reports.no_data", "No data")} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {recommendations.slice(0, 6).map((item) => (
            <div
              key={item.key}
              className={`rounded-xl border p-4 ${toneStyle[item.tone]}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${iconStyle[item.tone]}`}
                >
                  {item.icon}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-semibold">{item.title}</h4>
                  <p className="mt-1 text-xs opacity-80">{item.description}</p>
                  <p className="mt-3 text-xs font-medium">{item.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && sentCount > 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          {tr("survey.reports.response_rate", "Response rate")}:{" "}
          <span className="font-semibold text-slate-700">
            {formatPercent(responseRate)}
          </span>
          {" · "}
          {tr("survey.reports.submitted_count", "Submitted")}:{" "}
          <span className="font-semibold text-slate-700">{submittedCount}</span>
          {" · "}
          {tr("survey.reports.sent_count", "Sent")}:{" "}
          <span className="font-semibold text-slate-700">{sentCount}</span>
        </div>
      )}
    </div>
  );
};

export default SurveyRecommendationCard;
