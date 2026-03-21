import { Form } from "antd";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import BaseCheckbox from "@core/components/Checkbox";
import QuestionCard from "@/pages/surveys/components/QuestionCard";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import {
  apiCreateSurveyQuestion,
  apiCreateSurveyTemplate,
  apiDeleteSurveyQuestion,
  apiUpdateSurveyQuestion,
  apiUpdateSurveyTemplate,
} from "@/api/survey/survey.api";

import type {
  LocalQuestion,
  TemplateFormValues,
} from "./types/survey-template-editor.types";
import {
  getDimensionOptions,
  getQuestionTypeOptions,
  getStageOptions,
  getStatusOptions,
} from "./utils/survey-template-editor.constants";
import {
  isChoiceType,
  isRatingType,
  resequenceQuestions,
  useSurveyTemplateEditor,
} from "./hooks/useSurveyTemplateEditor";

type Props = {
  templateId?: string;
  isEdit: boolean;
  initialValues: TemplateFormValues;
  initialQuestions: LocalQuestion[];
  onCancel: () => void;
};

const SurveyTemplateEditorContent = ({
  templateId,
  isEdit,
  initialValues,
  initialQuestions,
  onCancel,
}: Props) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [templateForm] = Form.useForm<TemplateFormValues>();

  const stageOptions = getStageOptions(t);
  const statusOptions = getStatusOptions(t);
  const questionTypeOptions = getQuestionTypeOptions(t);
  const dimensionOptions = getDimensionOptions(t);

  const {
    localQuestions,
    deletedQuestionIds,
    validationErrors,
    updateQuestion,
    addQuestion,
    duplicateQuestion,
    deleteQuestion,
    moveQuestion,
    addOption,
    updateOption,
    deleteOption,
  } = useSurveyTemplateEditor({
    initialQuestions,
    isEdit,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await templateForm.validateFields();

      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      const templatePayload = {
        name: values.name,
        description: values.description,
        stage: values.stage,
        managerOnly: values.managerOnly ?? false,
        status: values.status,
        isDefault: values.isDefault ?? false,
      };

      let currentTemplateId = templateId ?? "";

      if (isEdit) {
        await apiUpdateSurveyTemplate({
          templateId: currentTemplateId,
          ...templatePayload,
        });
      } else {
        const created = (await apiCreateSurveyTemplate(templatePayload)) as {
          templateId?: string;
          id?: string;
        };

        currentTemplateId = created?.templateId ?? created?.id ?? "";

        if (!currentTemplateId) {
          throw new Error("Cannot determine templateId after template creation.");
        }
      }

      for (const questionId of deletedQuestionIds) {
        await apiDeleteSurveyQuestion({ questionId });
      }

      for (const question of resequenceQuestions(localQuestions)) {
        const options = isChoiceType(question.type)
          ? question.options.map((item) => item.trim()).filter(Boolean)
          : [];

        const payload = {
          templateId: currentTemplateId,
          content: question.content.trim(),
          type: question.type,
          required: question.required,
          sortOrder: question.sortOrder,
          dimensionCode: question.dimensionCode,
          measurable: question.measurable,
          optionsJson: JSON.stringify(options),
          ...(isChoiceType(question.type) ? { options } : {}),
          ...(isRatingType(question.type)
            ? {
                scaleMin: question.scaleMin ?? 1,
                scaleMax: question.scaleMax ?? 5,
              }
            : {}),
        };

        if (question.isNew || !question.questionId) {
          await apiCreateSurveyQuestion(payload);
        } else if (question.isDirty) {
          await apiUpdateSurveyQuestion({
            questionId: question.questionId,
            ...payload,
          });
        }
      }

      return currentTemplateId;
    },
    onSuccess: async (savedTemplateId) => {
      notify.success(t("global.save_success"));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["survey-templates"] }),
        queryClient.invalidateQueries({
          queryKey: ["survey-template", savedTemplateId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["survey-questions", savedTemplateId],
        }),
        queryClient.invalidateQueries({ queryKey: ["survey-questions"] }),
      ]);

      onCancel();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("global.save_failed");
      notify.error(message);
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#223A59]">
          {isEdit
            ? t("survey.template.editor.edit_title") || "Edit survey template"
            : t("survey.template.editor.title") || "Create survey template"}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {t("survey.template.editor.subtitle") ||
            "Create and manage template information and questions."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t("survey.template.editor.template_info") || "Template info"}
          </h2>

          <Form
            form={templateForm}
            layout="vertical"
            initialValues={initialValues}
          >
            <BaseInput
              name="name"
              label={t("survey.template.name_label")}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message:
                      t("survey.template.validation.name_required") ||
                      "Template name is required",
                  },
                ],
              }}
            />

            <div className="mt-4">
              <BaseTextArea
                name="description"
                label={t("survey.template.description_label")}
                rows={4}
              />
            </div>

            <div className="mt-4">
              <BaseSelect
                name="stage"
                label={t("survey.template.stage_label")}
                options={stageOptions}
                placeholder={t("global.select")}
              />
            </div>

            <div className="mt-4">
              <BaseSelect
                name="status"
                label={t("survey.template.status_label") || "Status"}
                options={statusOptions}
                placeholder={t("global.select")}
              />
            </div>

            <div className="mt-4">
              <BaseCheckbox
                name="managerOnly"
                labelCheckbox={t("survey.template.manager_only_label")}
              />
            </div>

            <div className="mt-4">
              <BaseCheckbox
                name="isDefault"
                labelCheckbox={
                  t("survey.template.is_default_label") || "Default template"
                }
              />
            </div>
          </Form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                {t("survey.question.section_title") || "Questions"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {localQuestions.length}{" "}
                {localQuestions.length === 1
                  ? t("survey.question.count_singular") || "question"
                  : t("survey.question.count_plural") || "questions"}
              </p>
            </div>

            <BaseButton
              size="small"
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              label="survey.question.add"
              onClick={addQuestion}
            />
          </div>

          {validationErrors.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <div className="font-medium">
                {t("survey.template.validation.fix_before_save") ||
                  "Please fix these issues before saving:"}
              </div>
              <ul className="mt-2 list-disc pl-5">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {localQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Plus className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">
                {t("survey.question.empty_hint") || "No questions yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {localQuestions.map((question, index) => (
                <QuestionCard
                  key={question._uid}
                  question={question}
                  index={index}
                  questionTypeOptions={questionTypeOptions}
                  dimensionOptions={dimensionOptions}
                  onChange={updateQuestion}
                  onDelete={deleteQuestion}
                  onDuplicate={duplicateQuestion}
                  onMoveUp={(uid) => moveQuestion(uid, "up")}
                  onMoveDown={(uid) => moveQuestion(uid, "down")}
                  onAddOption={addOption}
                  onDeleteOption={deleteOption}
                  onUpdateOption={updateOption}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <BaseButton label="global.cancel" onClick={onCancel} />
        <BaseButton
          type="primary"
          label="survey.template.save"
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        />
      </div>
    </div>
  );
};

export default SurveyTemplateEditorContent;