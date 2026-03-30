import type { ReactNode } from "react";
import {
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
  subtext?: string;
  loading?: boolean;
  icon?: ReactNode;
};

const KpiCard = ({ label, value, subtext, loading, icon }: KpiProps) =>
  loading ? (
    <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
  ) : (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-[#223A59]">{value}</p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
    </div>
  );

type Props = {
  analytics?: SurveyAnalyticsReportVm | null;
  loading?: boolean;
};

const SurveyReportsKpiRow = ({ analytics, loading }: Props) => {
  const { t } = useLocale();
  const best = getBestDimension(analytics);
  const worst = getWorstDimension(analytics);

  const getDimensionLabel = (name?: string) => {
    if (!name) return "—";
    const key = `survey.dimension.${name.toLowerCase()}`;
    const value = t(key);
    return value !== key ? value : name;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label={t("survey.reports.sent_count")}
        value={analytics?.sentCount ?? 0}
        loading={loading}
        icon={<FileText className="h-5 w-5" />}
      />
      <KpiCard
        label={t("survey.reports.submitted_count")}
        value={analytics?.submittedCount ?? 0}
        loading={loading}
        icon={<MessageSquareText className="h-5 w-5" />}
      />
      <KpiCard
        label={t("survey.reports.completion_rate")}
        value={formatPercent(analytics?.responseRate)}
        loading={loading}
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <KpiCard
        label={t("survey.reports.avg_score")}
        value={formatScore(analytics?.overallSatisfactionScore)}
        loading={loading}
        icon={<Star className="h-5 w-5" />}
      />
      <KpiCard
        label={t("survey.reports.lowest_dimension")}
        value={getDimensionLabel(worst?.dimensionCode)}
        subtext={worst ? formatScore(worst.averageScore) : undefined}
        loading={loading}
        icon={<TriangleAlert className="h-5 w-5" />}
      />
      <KpiCard
        label={t("survey.reports.best_dimension")}
        value={getDimensionLabel(best?.dimensionCode)}
        subtext={best ? formatScore(best.averageScore) : undefined}
        loading={loading}
        icon={<Trophy className="h-5 w-5" />}
      />
    </div>
  );
};

export default SurveyReportsKpiRow;