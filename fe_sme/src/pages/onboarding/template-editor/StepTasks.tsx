import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n";
import { ROLE_LABELS } from "@/shared/rbac";
import type { ChecklistDraft, TaskDraft } from "./shared";
import { inputCls, labelCls, OWNER_OPTIONS } from "./shared";

const STAGE_COLORS: Record<string, string> = {
  PRE_BOARDING: "bg-violet-50 text-violet-700 border-violet-200",
  DAY_1: "bg-blue-50 text-blue-700 border-blue-200",
  DAY_7: "bg-sky-50 text-sky-700 border-sky-200",
  DAY_30: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DAY_60: "bg-amber-50 text-amber-700 border-amber-200",
};

interface TaskCardProps {
  task: TaskDraft;
  index: number;
  total: number;
  onUpdate: (updates: Partial<TaskDraft>) => void;
  onRemove: () => void;
}

function TaskCard({ task, index, total, onUpdate, onRemove }: TaskCardProps) {
  const { t } = useLocale();
  return (
    <div className="group overflow-hidden rounded-xl border border-stroke bg-white transition hover:shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-stroke/60 bg-slate-50/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-muted">
            {t("onboarding.template.editor.step_tasks.task_label")}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={total <= 1}
          className="flex items-center gap-1 text-xs font-medium text-muted/60 opacity-0 transition hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {t("onboarding.template.editor.remove_task")}
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>
              {t("onboarding.template.editor.task.name_label")}
            </label>
            <input
              type="text"
              value={task.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder={t(
                "onboarding.template.editor.task.name_placeholder",
              )}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              {t("onboarding.template.editor.task.due_label")}
            </label>
            <input
              type="number"
              value={task.dueDaysOffset}
              min={0}
              onChange={(e) =>
                onUpdate({ dueDaysOffset: parseInt(e.target.value, 10) || 0 })
              }
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>
              {t("onboarding.template.editor.task.desc_label")}
            </label>
            <input
              type="text"
              value={task.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder={t(
                "onboarding.template.editor.task.desc_placeholder",
              )}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              {t("onboarding.template.editor.task.owner_label")}
            </label>
            <select
              value={task.ownerRefId}
              onChange={(e) => onUpdate({ ownerRefId: e.target.value })}
              className={inputCls}>
              {OWNER_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-stroke/60 pt-3">
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={task.requireAck}
              onChange={(e) => onUpdate({ requireAck: e.target.checked })}
              className="h-4 w-4 rounded border-stroke accent-brand"
            />
            {t("onboarding.template.editor.task.require_ack")}
          </label>
        </div>
      </div>
    </div>
  );
}

interface Props {
  checklists: ChecklistDraft[];
  activeIndex: number;
  onSelectStage: (i: number) => void;
  onUpdateTask: (ci: number, ti: number, updates: Partial<TaskDraft>) => void;
  onAddTask: (ci: number) => void;
  onRemoveTask: (ci: number, ti: number) => void;
}

export function StepTasks({
  checklists,
  activeIndex,
  onSelectStage,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
}: Props) {
  const { t } = useLocale();
  const active = checklists[activeIndex];

  return (
    <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-stroke bg-slate-50/60 px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <svg
            className="h-4.5 w-4.5 text-brand"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink">
            {t("onboarding.template.editor.step_tasks.title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {t("onboarding.template.editor.step_tasks.subtitle")}
          </p>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-stroke px-4 py-3">
        {checklists.map((c, i) => {
          const isActive = i === activeIndex;
          const colorCls =
            STAGE_COLORS[c.stageType] ??
            "bg-slate-50 text-slate-600 border-slate-200";
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectStage(i)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? colorCls +
                    " shadow-sm ring-1 ring-inset " +
                    colorCls.split(" ").find((c) => c.startsWith("border-"))
                  : "border-transparent text-muted hover:bg-slate-50 hover:text-ink"
              }`}>
              <span className="opacity-60">{i + 1}.</span>
              <span className="max-w-[110px] truncate">
                {c.name ||
                  `${t("onboarding.template.editor.step_tasks.stage_fallback")} ${
                    i + 1
                  }`}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/50" : "bg-slate-100 text-muted"
                }`}>
                {c.tasks.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tasks area */}
      {active && (
        <div>
          {/* Sub-header */}
          <div className="flex items-center justify-between border-b border-stroke/60 bg-slate-50/30 px-5 py-3">
            <p className="text-xs font-semibold text-muted">
              {active.name ||
                `${t(
                  "onboarding.template.editor.step_tasks.stage_fallback",
                )} ${activeIndex + 1}`}
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
                {active.tasks.length}
              </span>
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onAddTask(activeIndex)}>
              + {t("onboarding.template.editor.add_task")}
            </Button>
          </div>

          {active.tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <svg
                  className="h-6 w-6 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-ink">
                {t("onboarding.template.editor.step_tasks.no_tasks")}
              </p>
              <p className="text-xs text-muted">
                {t("onboarding.template.editor.step_tasks.no_tasks_hint")}
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-5">
              {active.tasks.map((task, ti) => (
                <TaskCard
                  key={ti}
                  task={task}
                  index={ti}
                  total={active.tasks.length}
                  onUpdate={(upd) => onUpdateTask(activeIndex, ti, upd)}
                  onRemove={() => onRemoveTask(activeIndex, ti)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
