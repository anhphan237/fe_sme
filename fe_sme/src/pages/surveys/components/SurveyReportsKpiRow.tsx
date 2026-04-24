import type { ReactNode } from "react";
import { Tooltip } from "antd";
import {
  Clock3,
  FileText,
  MessageSquareText,
  Star,
  TrendingUp,
  Trophy,
  TriangleAlert,
} from "lucide-react";
import { useLocale } from "@/i18n";
import type { SurveyAnalyticsReportVm } from "../types/survey-report.types";
import {
  formatPercent,
  formatScore,
  getBestDimension,
  getWorstDimension,
} from "../utils/survey-report.utils";

type KpiProps = {
  label: string;
  value: ReactNode;
  rawValue?: string;
  subtext?: string;
  loading?: boolean;
  icon?: ReactNode;
  tone?: "default" | "warning" | "danger" | "success";
};

const toneClass = {
  default: "border-slate-200 bg-white",
  warning: "border-amber-200 bg-amber-50/40",
  danger: "border-red-200 bg-red-50/40",
  success: "border-emerald-200 bg-emerald-50/40",
};

const iconToneClass = {
  default: "text-slate-400",
  warning: "text-amber-500",
  danger: "text-red-500",
  success: "text-emerald-500",
};

const KpiCard = ({
  label,
  value,
  rawValue,
  subtext,
  loading,
  icon,
  tone = "default",
}: KpiProps) => {
  if (loading) {
    return <div className="h-28 animate-pulse rounded-xl bg-slate-100" />;
  }

  const tooltipText =
    rawValue ||
    (typeof value === "string" || typeof value === "number"
      ? String(value)
      : "");

  return (
    <div
      className={`min-w-0 rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${toneClass[tone]}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Tooltip title={label}>
            <p className="line-clamp-2 min-h-[32px] text-xs font-semibold uppercase leading-4 tracking-wide text-slate-400">
              {label}
            </p>
          </Tooltip>

          <Tooltip title={tooltipText}>
            <p className="mt-2 min-h-[36px] break-words text-2xl font-bold leading-8 text-[#223A59]">
              {value}
            </p>
          </Tooltip>

          {subtext && (
            <Tooltip title={subtext}>
              <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500">
                {subtext}
              </p>
            </Tooltip>
          )}
        </div>

        {icon && (
          <div className={`shrink-0 ${iconToneClass[tone]}`}>{icon}</div>
        )}
      </div>
    </div>
  );
};

type Props = {
  analytics?: SurveyAnalyticsReportVm | null;
  loading?: boolean;
};

const SurveyReportsKpiRow = ({ analytics, loading }: Props) => {
  const { t } = useLocale();

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const best = getBestDimension(analytics);
  const worst = getWorstDimension(analytics);

  const sentCount = analytics?.sentCount ?? 0;
  const submittedCount = analytics?.submittedCount ?? 0;
  const pendingCount = Math.max(sentCount - submittedCount, 0);

  const getDimensionLabel = (name?: string) => {
    if (!name) return "—";

    const key = `survey.dimension.${name.toLowerCase()}`;
    const value = t(key);

    return value !== key ? value : name;
  };

  const worstLabel = getDimensionLabel(worst?.dimensionCode);
  const bestLabel = getDimensionLabel(best?.dimensionCode);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      <KpiCard
        label={t("survey.reports.sent_count")}
        value={sentCount}
        rawValue={String(sentCount)}
        loading={loading}
        icon={<FileText className="h-5 w-5" />}
      />

      <KpiCard
        label={t("survey.reports.submitted_count")}
        value={submittedCount}
        rawValue={String(submittedCount)}
        loading={loading}
        icon={<MessageSquareText className="h-5 w-5" />}
        tone={submittedCount > 0 ? "success" : "default"}
      />

      <KpiCard
        label={tr("survey.reports.pending", "Chưa phản hồi")}
        value={pendingCount}
        rawValue={String(pendingCount)}
        subtext={tr("survey.reports.pending_desc", "Đã gửi nhưng chưa nộp")}
        loading={loading}
        icon={<Clock3 className="h-5 w-5" />}
        tone={pendingCount > 0 ? "warning" : "success"}
      />

      <KpiCard
        label={t("survey.reports.completion_rate")}
        value={formatPercent(analytics?.responseRate)}
        rawValue={formatPercent(analytics?.responseRate)}
        loading={loading}
        icon={<TrendingUp className="h-5 w-5" />}
        tone={
          Number(analytics?.responseRate ?? 0) < 60 && sentCount > 0
            ? "danger"
            : "default"
        }
      />

      <KpiCard
        label={t("survey.reports.avg_score")}
        value={formatScore(analytics?.overallSatisfactionScore)}
        rawValue={formatScore(analytics?.overallSatisfactionScore)}
        loading={loading}
        icon={<Star className="h-5 w-5" />}
        tone={
          Number(analytics?.overallSatisfactionScore ?? 0) > 0 &&
          Number(analytics?.overallSatisfactionScore ?? 0) < 3
            ? "danger"
            : "default"
        }
      />

      <KpiCard
        label={t("survey.reports.lowest_dimension")}
        value={worstLabel}
        rawValue={worstLabel}
        subtext={worst ? formatScore(worst.averageScore) : undefined}
        loading={loading}
        icon={<TriangleAlert className="h-5 w-5" />}
        tone={worst ? "warning" : "default"}
      />

      <KpiCard
        label={t("survey.reports.best_dimension")}
        value={bestLabel}
        rawValue={bestLabel}
        subtext={best ? formatScore(best.averageScore) : undefined}
        loading={loading}
        icon={<Trophy className="h-5 w-5" />}
        tone={best ? "success" : "default"}
      />
    </div>
  );
};

export default SurveyReportsKpiRow;
