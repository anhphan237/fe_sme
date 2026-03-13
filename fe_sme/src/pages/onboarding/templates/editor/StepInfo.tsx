import { useEffect } from "react";
import { Form } from "antd";
import { FileText, Check } from "lucide-react";
import { useLocale } from "@/i18n";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import { TEMPLATE_PRESETS } from "./constants";
import type { EditorForm, TemplatePreset } from "./constants";
interface Props {
  form: EditorForm;
  onChange: (updates: Partial<EditorForm>) => void;
  onApplyPreset: (preset: TemplatePreset) => void;
}

export const StepInfo = ({ form, onChange, onApplyPreset }: Props) => {
  const { t } = useLocale();
  const [antdForm] = Form.useForm<{ name: string; description: string }>();
  const watchedName = Form.useWatch("name", antdForm) ?? "";
  const watchedDesc = Form.useWatch("description", antdForm) ?? "";

  // Sync parent state into antd form (e.g. when edit/duplicate data loads)
  useEffect(() => {
    antdForm.setFieldsValue({ name: form.name, description: form.description });
  }, [form.name, form.description, antdForm]);

  return (
    <>
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
        <Form
          form={antdForm}
          layout="vertical"
          className="p-6 space-y-5"
          onValuesChange={(_, all) =>
            onChange({
              name: all.name ?? "",
              description: all.description ?? "",
            })
          }>
          {/* Template name */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t("onboarding.template.editor.step_info.name_label")}
              </span>
              <span className="text-[11px] text-red-400 font-medium">
                {t("onboarding.template.editor.step_info.required")}
              </span>
            </div>
            <BaseInput
              name="name"
              autoFocus
              placeholder={t(
                "onboarding.template.editor.step_info.name_placeholder",
              )}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: t(
                      "onboarding.template.editor.step_info.name_placeholder",
                    ),
                  },
                ],
              }}
            />
            {watchedName.trim().length > 0 && (
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
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t("onboarding.template.editor.step_info.desc_label")}
              </span>
              <span className="text-[11px] text-muted/50">
                {t("onboarding.template.editor.step_info.optional")}
              </span>
            </div>
            <BaseTextArea
              name="description"
              placeholder={t(
                "onboarding.template.editor.step_info.desc_placeholder",
              )}
              rows={4}
              maxLength={500}
              className="resize-none leading-relaxed"
            />
            <p className="mt-1.5 text-right text-[11px] text-muted/50">
              {watchedDesc.length}{" "}
              {t("onboarding.template.editor.step_info.chars")}
            </p>
          </div>
        </Form>
      </div>

      {/* Preset picker */}
      <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke bg-slate-50/60 px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t("onboarding.template.preset.title")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted/70">
            {t("onboarding.template.preset.subtitle")}
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {TEMPLATE_PRESETS.map((preset) => {
            const stageCount = preset.checklists.length;
            const taskCount = preset.checklists.reduce(
              (sum, c) => sum + c.tasks.length,
              0,
            );
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onApplyPreset(preset)}
                className="group flex flex-col items-start gap-2 rounded-xl border border-stroke bg-white p-4 text-left transition hover:border-brand/40 hover:shadow-md">
                <span className="text-2xl">{preset.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-ink group-hover:text-brand">
                    {t(preset.nameKey)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {t(preset.descKey)}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[11px] text-muted/60">
                  <span>
                    {stageCount} {t("onboarding.template.preset.stages")}
                  </span>
                  <span>·</span>
                  <span>
                    {taskCount} {t("onboarding.template.preset.tasks")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
