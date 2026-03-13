import { Card } from "@core/components/ui/Card";
import { Pill } from "@core/components/ui/Pill";
import { Button } from "@core/components/ui/Button";
import { Skeleton } from "@core/components/ui/Skeleton";
import { useLocale } from "@/i18n";
import { STATUS_DONE } from "../../hooks";
import type { TaskListPanelProps } from "../types";

export const TaskListPanel = ({
  tasks,
  isLoading,
  isUpdating,
  onToggle,
  onOpenDrawer,
}: TaskListPanelProps) => {
  const { t } = useLocale();
  return (
    <Card>
      <h3 className="text-lg font-semibold">
        {t("onboarding.detail.task.title")}
      </h3>
      {isLoading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : tasks.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => {
            const isDone = task.status === STATUS_DONE;
            return (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-stroke bg-slate-50/50 px-4 py-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => onToggle(task)}
                    disabled={isUpdating}
                    className="h-4 w-4 rounded border-stroke text-brand"
                  />
                  <span
                    className={
                      isDone ? "text-muted line-through" : "font-medium"
                    }>
                    {task.title}
                  </span>
                </label>
                {task.dueDate && (
                  <span className="text-xs text-muted">
                    {t("onboarding.detail.task.due", { date: task.dueDate })}
                  </span>
                )}
                <Pill
                  className={
                    isDone
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }>
                  {task.status ?? t("onboarding.detail.task.status.pending")}
                </Pill>
                <Button
                  variant="ghost"
                  className="py-1.5 text-xs"
                  onClick={() => onOpenDrawer(task)}>
                  {t("onboarding.detail.task.detail")}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">
          {t("onboarding.detail.task.empty")}
        </p>
      )}
    </Card>
  );
};
