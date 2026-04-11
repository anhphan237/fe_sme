import { Card, Progress } from "antd";
import { CheckCircle2, Circle } from "lucide-react";
import { useLocale } from "@/i18n";

export interface StageProgressItem {
  name: string;
  done: number;
  total: number;
  percent: number;
}

interface StageProgressCardProps {
  stageProgress: StageProgressItem[];
}

export const StageProgressCard = ({
  stageProgress,
}: StageProgressCardProps) => {
  const { t } = useLocale();

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-base font-semibold text-gray-800">
          {t("onboarding.detail.stage.title")}
        </h3>
        {stageProgress.length > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            {stageProgress.filter((s) => s.percent === 100).length}/
            {stageProgress.length}
          </span>
        )}
      </div>

      {stageProgress.length === 0 ? (
        <p className="text-sm text-muted">
          {t("onboarding.detail.stage.empty")}
        </p>
      ) : (
        <div className="space-y-5">
          {stageProgress.map((s, i) => {
            const isDone = s.percent === 100;
            const isActive =
              !isDone && (i === 0 || stageProgress[i - 1]?.percent === 100);

            return (
              <div key={s.name} className="flex gap-3">
                {/* ── Step indicator ── */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                      isDone
                        ? "border-emerald-500 bg-emerald-50"
                        : isActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                    }`}>
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle
                        className={`h-4 w-4 ${isActive ? "text-blue-500" : "text-gray-300"}`}
                      />
                    )}
                  </div>
                  {i < stageProgress.length - 1 && (
                    <div
                      className={`mt-1 h-full w-0.5 min-h-[1.5rem] ${
                        isDone ? "bg-emerald-200" : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>

                {/* ── Stage content ── */}
                <div className="mb-1 min-w-0 flex-1 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-medium leading-snug ${
                        isDone
                          ? "text-emerald-700"
                          : isActive
                            ? "text-gray-900"
                            : "text-gray-500"
                      }`}>
                      {s.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isDone
                          ? "bg-emerald-50 text-emerald-600"
                          : isActive
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-50 text-gray-400"
                      }`}>
                      {s.done}/{s.total}
                    </span>
                  </div>
                  <Progress
                    className="mt-1.5"
                    percent={s.percent}
                    showInfo={false}
                    size="small"
                    strokeColor={
                      isDone
                        ? "#10b981"
                        : isActive
                          ? { "0%": "#3b82f6", "100%": "#6366f1" }
                          : "#e2e8f0"
                    }
                    trailColor={isDone ? "#d1fae5" : "#f1f5f9"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
