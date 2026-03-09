import { Card } from "@/components/ui/Card";
import { useLocale } from "@/i18n";
import { ROLE_LABELS } from "@/shared/rbac";
import type { Role } from "@/shared/types";
import type { EditorForm } from "../shared";
import { STAGE_OPTIONS } from "../shared";

interface Props {
  form: EditorForm;
}

export function StepReview({ form }: Props) {
  const { t } = useLocale();
  const totalTasks = form.checklists.reduce((n, c) => n + c.tasks.length, 0);

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <div className="px-6 pt-6 pb-5 border-b border-stroke">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t("onboarding.template.editor.step_label", { num: 4 })}
          </p>
          <h3 className="mt-1 text-base font-semibold text-ink">
            {t("onboarding.template.editor.step_review.title")}
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {t("onboarding.template.editor.step_review.subtitle")}
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4 rounded-xl border border-stroke bg-slate-50 p-4">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {t("onboarding.template.editor.review.template_label")}
              </p>
              <p className="mt-1 text-lg font-bold text-ink truncate">
                {form.name || "—"}
              </p>
              {form.description && (
                <p className="mt-0.5 text-sm text-muted">{form.description}</p>
              )}
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="text-center rounded-lg border border-stroke bg-white px-4 py-2.5">
                <p className="text-xl font-bold text-brand">
                  {form.checklists.length}
                </p>
                <p className="text-[11px] text-muted">
                  {t("onboarding.template.review.stages")}
                </p>
              </div>
              <div className="text-center rounded-lg border border-stroke bg-white px-4 py-2.5">
                <p className="text-xl font-bold text-brand">{totalTasks}</p>
                <p className="text-[11px] text-muted">
                  {t("onboarding.template.review.tasks")}
                </p>
              </div>
            </div>
          </div>

          <ul className="space-y-2">
            {form.checklists.map((c, i) => {
              const stageLabelKey = STAGE_OPTIONS.find(
                (o) => o.value === c.stageType,
              )?.label;
              const stageLabel = stageLabelKey ? t(stageLabelKey) : c.stageType;
              return (
                <li
                  key={c.id}
                  className="rounded-xl border border-stroke bg-white">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-stroke/60">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                      {i + 1}
                    </span>
                    <span className="font-medium text-ink text-sm">
                      {c.name || t("onboarding.template.editor.stage_fallback", { num: i + 1 })}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-muted">
                      {stageLabel}
                    </span>
                    <span className="ml-auto text-xs text-muted">
                      {c.tasks.length}{" "}
                      {t("onboarding.template.review.tasks").toLowerCase()}
                    </span>
                  </div>

                  {c.tasks.length > 0 && (
                    <ul className="divide-y divide-stroke/40">
                      {c.tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
                          <span className="shrink-0 text-muted/40">·</span>
                          <span className="flex-1 text-ink font-medium">
                            {task.name ||
                              t(
                                "onboarding.template.editor.review.untitled_task",
                              )}
                          </span>
                          <span className="shrink-0 text-xs text-muted">
                            {task.dueDaysOffset}d
                          </span>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-muted">
                            {ROLE_LABELS[task.ownerRefId as Role] ??
                              task.ownerRefId}
                          </span>
                          {task.requireAck && (
                            <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] text-brand">
                              {t("onboarding.template.editor.task_ack")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Card>
    </div>
  );
}
