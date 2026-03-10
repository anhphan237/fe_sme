import { FileText, Check } from "lucide-react";
import { useLocale } from "@/i18n";
import type { EditorForm } from "./types";
import { inputCls } from "./constants";

interface Props {
  form: EditorForm;
  onChange: (updates: Partial<EditorForm>) => void;
}

export function StepInfo({ form, onChange }: Props) {
  const { t } = useLocale();

  return (
    <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-stroke bg-slate-50/60 px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <FileText className="h-4.5 w-4.5 text-brand" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">
            {t("onboarding.template.editor.step_info.title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {t("onboarding.template.editor.step_info.subtitle")}
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="p-6 space-y-5">
        {/* Template name */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t("onboarding.template.editor.step_info.name_label")}
            </label>
            <span className="text-[11px] text-red-400 font-medium">
              {t("onboarding.template.editor.step_info.required")}
            </span>
          </div>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={t(
              "onboarding.template.editor.step_info.name_placeholder",
            )}
            className={inputCls}
            autoFocus
          />
          {form.name.trim().length > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-brand">
              <Check className="h-3 w-3" strokeWidth={2.5} />
              {t("onboarding.template.editor.step_info.looks_good")}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-stroke/60" />

        {/* Description */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t("onboarding.template.editor.step_info.desc_label")}
            </label>
            <span className="text-[11px] text-muted/50">
              {t("onboarding.template.editor.step_info.optional")}
            </span>
          </div>
          <textarea
            value={form.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder={t(
              "onboarding.template.editor.step_info.desc_placeholder",
            )}
            rows={4}
            className={inputCls + " resize-none leading-relaxed"}
          />
          <p className="mt-1.5 text-right text-[11px] text-muted/50">
            {form.description.length}{" "}
            {t("onboarding.template.editor.step_info.chars")}
          </p>
        </div>
      </div>
    </div>
  );
}
