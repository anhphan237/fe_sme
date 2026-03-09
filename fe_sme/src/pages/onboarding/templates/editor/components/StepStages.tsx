import { LayoutList, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n";
import type { ChecklistDraft } from "../shared";
import { inputCls, STAGE_OPTIONS } from "../shared";

interface Props {
  checklists: ChecklistDraft[];
  onUpdate: (i: number, updates: Partial<ChecklistDraft>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}

const STAGE_COLORS: Record<string, string> = {
  PRE_BOARDING: "bg-violet-50 text-violet-600 border-violet-200",
  DAY_1: "bg-blue-50 text-blue-600 border-blue-200",
  DAY_7: "bg-sky-50 text-sky-600 border-sky-200",
  DAY_30: "bg-emerald-50 text-emerald-600 border-emerald-200",
  DAY_60: "bg-amber-50 text-amber-600 border-amber-200",
};

export function StepStages({ checklists, onUpdate, onAdd, onRemove }: Props) {
  const { t } = useLocale();

  return (
    <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-stroke bg-slate-50/60 px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <LayoutList className="h-4.5 w-4.5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink">
            {t("onboarding.template.editor.step_stages.title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {t("onboarding.template.editor.step_stages.subtitle")}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onAdd}>
          + {t("onboarding.template.editor.add_stage")}
        </Button>
      </div>

      {/* Stage list */}
      <div className="divide-y divide-stroke/60">
        {checklists.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <LayoutList className="h-6 w-6 text-muted" />
            </div>
            <p className="text-sm font-medium text-ink">
              {t("onboarding.template.editor.step_stages.empty_title")}
            </p>
            <p className="text-xs text-muted">
              {t("onboarding.template.editor.step_stages.empty_subtitle")}
            </p>
          </div>
        ) : (
          checklists.map((c, i) => {
            const stageColor =
              STAGE_COLORS[c.stageType] ??
              "bg-slate-50 text-slate-500 border-slate-200";
            return (
              <div
                key={c.id}
                className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-5 py-4 transition hover:bg-slate-50/50">
                {/* Index badge */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/8 text-xs font-bold text-brand">
                  {i + 1}
                </div>

                {/* Name input */}
                <div className="min-w-0">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => onUpdate(i, { name: e.target.value })}
                    placeholder={t(
                      "onboarding.template.editor.stage_name_placeholder",
                    )}
                    className={inputCls + " text-sm py-2"}
                  />
                </div>

                {/* Stage type select styled */}
                <div className="shrink-0">
                  <select
                    value={c.stageType}
                    onChange={(e) => onUpdate(i, { stageType: e.target.value })}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-brand/10 ${stageColor}`}>
                    {STAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(o.label)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  disabled={checklists.length <= 1}
                  aria-label="Remove stage"
                  className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none">
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer summary */}
      {checklists.length > 0 && (
        <div className="flex items-center justify-between border-t border-stroke/60 bg-slate-50/60 px-5 py-3">
          <p className="text-xs text-muted">
            <span className="font-semibold text-ink">{checklists.length}</span>{" "}
            {t("onboarding.template.editor.step_stages.footer_count")}
          </p>
          <p className="text-xs text-muted">
            {t("onboarding.template.editor.step_stages.footer_hint")}
          </p>
        </div>
      )}
    </div>
  );
}
