import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { useLocale } from "@/i18n";
import type { StageProgress } from "../types";

interface Props {
  stageProgress: StageProgress[];
}

export function StageProgressPanel({ stageProgress }: Props) {
  const { t } = useLocale();
  return (
    <Card>
      <h3 className="text-lg font-semibold">
        {t("onboarding.detail.stage.title")}
      </h3>
      <div className="mt-4 space-y-4">
        {stageProgress.length > 0 ? (
          stageProgress.map((s) => (
            <div key={s.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{s.name}</span>
                <span className="text-muted">
                  {s.done}/{s.total}
                </span>
              </div>
              <Progress value={s.percent} />
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
}
