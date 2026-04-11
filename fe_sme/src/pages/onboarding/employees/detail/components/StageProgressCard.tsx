import { Card, Progress } from "antd";
import { CheckCircle2 } from "lucide-react";
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
      <h3 className="text-lg font-semibold text-gray-800">
        {t("onboarding.detail.stage.title")}
      </h3>
      <div className="mt-4 space-y-4">
        {stageProgress.length > 0 ? (
          stageProgress.map((s) => (
            <div key={s.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {s.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {s.percent === 100 && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  <span className="text-xs font-medium text-gray-500">
                    {s.done}/{s.total}
                  </span>
                </div>
              </div>
              <Progress
                percent={s.percent}
                showInfo={false}
                size="small"
                strokeColor={
                  s.percent === 100
                    ? "#10b981"
                    : { "0%": "#3b82f6", "100%": "#6366f1" }
                }
              />
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">
            {t("onboarding.detail.stage.empty")}
          </p>
        )}
      </div>
    </Card>
  );
};
