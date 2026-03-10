import { Drawer } from "@/components/ui/Drawer";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n";
import { STATUS_DONE } from "../../hooks";
import { CommentThread } from "./CommentThread";
import type { TaskDrawerProps } from "../types";

export function TaskDrawer({
  open,
  task,
  isUpdating,
  onToggle,
  onClose,
}: TaskDrawerProps) {
  const { t } = useLocale();
  return (
    <Drawer
      open={open}
      title={task?.title ?? t("onboarding.detail.task.title")}
      onClose={onClose}>
      <div className="space-y-4">
        {task ? (
          <>
            <p className="text-sm text-muted">
              {t("onboarding.detail.task.due", { date: task.dueDate ?? "—" })}
            </p>
            <Pill>
              {task.required
                ? t("onboarding.detail.task.required")
                : t("onboarding.detail.task.optional")}
            </Pill>
            <Button onClick={() => onToggle(task)} disabled={isUpdating}>
              {task.status === STATUS_DONE
                ? t("onboarding.detail.task.mark_incomplete")
                : t("onboarding.detail.task.mark_done")}
            </Button>
            <CommentThread taskId={task.id} />
          </>
        ) : (
          <p className="text-sm text-muted">
            {t("onboarding.detail.task.empty")}
          </p>
        )}
      </div>
    </Drawer>
  );
}
