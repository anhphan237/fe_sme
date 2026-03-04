import { useLocale } from "@/i18n";
import type { EditorForm } from "./shared";
import { inputCls } from "./shared";

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
          <svg
            className="h-4.5 w-4.5 text-brand"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
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
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
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
