import { Card } from "@/components/ui/Card";
import { useLocale } from "@/i18n";
import type { ActivityPanelProps } from "./types";
import { STATUS_DONE } from "../hooks";

export function ActivityPanel({ tasks, completedCount }: ActivityPanelProps) {
  const { t } = useLocale();
  return (
    <Card>
      <h3 className="text-lg font-semibold">
        {t("onboarding.detail.activity.title")}
      </h3>
      <div className="mt-4 space-y-3 text-sm">
        {completedCount > 0 ? (
          tasks
            .filter((task) => task.status === STATUS_DONE)
            .map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-stroke bg-slate-50 p-4">
                {t("onboarding.detail.activity.task_completed", {
                  title: task.title,
                })}
              </div>
            ))
        ) : (
          <p className="text-muted">{t("onboarding.detail.activity.empty")}</p>
        )}
      </div>
    </Card>
  );
}
