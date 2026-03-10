import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n";
import type { EvaluationsPanelProps } from "../types";

export function EvaluationsPanel({
  milestones,
  onCreateEval,
}: EvaluationsPanelProps) {
  const { t } = useLocale();
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {milestones.map((mile) => (
        <Card key={mile.label}>
          <h3 className="text-lg font-semibold">
            {t("onboarding.detail.eval.day", { day: mile.label })}
          </h3>
          <p className="text-sm text-muted">
            {mile.completed
              ? t("onboarding.detail.eval.status_completed")
              : t("onboarding.detail.eval.status_pending")}
          </p>
          {!mile.completed && (
            <Button className="mt-4" onClick={() => onCreateEval(mile.label)}>
              {t("onboarding.detail.eval.create")}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
