import { CheckCircle2 } from "lucide-react";
import { useLocale } from "@/i18n";

interface DeptCheckpointProgressBadgeProps {
  confirmedCount: number;
  totalCount: number;
  className?: string;
}

export function DeptCheckpointProgressBadge({
  confirmedCount,
  totalCount,
  className = "",
}: DeptCheckpointProgressBadgeProps) {
  const { t } = useLocale();

  if (totalCount === 0) return null;

  const allDone = confirmedCount === totalCount;
  const pct = Math.round((confirmedCount / totalCount) * 100);
  const trackColor = allDone
    ? "bg-green-500"
    : confirmedCount > 0
      ? "bg-amber-400"
      : "bg-gray-300";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"
        style={{ minWidth: 60 }}
      >
        <div
          className={`h-1.5 rounded-full transition-all ${trackColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`flex shrink-0 items-center gap-1 text-xs font-medium ${
          allDone ? "text-green-600" : "text-gray-500"
        }`}
      >
        {allDone ? (
          <>
            <CheckCircle2 className="h-3 w-3" />
            {t("onboarding.approvals.dept.progress.all_done")}
          </>
        ) : (
          t("onboarding.approvals.dept.progress.label", {
            confirmed: confirmedCount,
            total: totalCount,
          })
        )}
      </span>
    </div>
  );
}
