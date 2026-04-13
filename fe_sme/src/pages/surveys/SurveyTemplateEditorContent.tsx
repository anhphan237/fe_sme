import { Form, Modal, Switch } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
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
import SurveyQuestionBuilder from "./components/SurveyQuestionBuilder";
import { useSurveyExcelImport } from "./hooks/useSurveyExcelImport";

type Props = {
  templateId?: string;
  initialValues: TemplateFormValues;
  initialQuestions: LocalQuestion[];
  onCancel: () => void;
  isEditMode: boolean;
};

type SaveTemplatePayload = {
  forceReplaceDefault?: boolean;
};

const SurveyTemplateEditorContent = ({
  templateId,
  initialValues,
  initialQuestions,
  onCancel,
  isEditMode,
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
    importQuestions,
  } = useSurveyTemplateEditor({
    initialQuestions,
    isEdit: isEditMode,
  });

  const {
    importInputRef,
    handleDownloadSample,
    handleChooseImportFile,
    handleImportFileChange,
  } = useSurveyExcelImport({
    onImportQuestions: importQuestions,
    sampleTemplateUrl: "/files/survey_questions_template.xlsx",
  });

  const buildTemplatePayload = (
    values: TemplateFormValues,
    override?: SaveTemplatePayload,
  ) => ({
    name: values.name,
    description: values.description,
    stage: values.stage,
    status: values.status ?? "DRAFT",
    targetRole: values.targetRole ?? "EMPLOYEE",
    ...(isEditMode
      ? {
          isDefault:
            values.stage === "CUSTOM" ? false : Boolean(values.isDefault),
        }
      : {}),
    ...override,
  });

  const saveMutation = useMutation({
    mutationFn: async (override?: SaveTemplatePayload) => {
      const values = await templateForm.validateFields();

      if (validationErrors.length > 0) {
        notify.error(validationErrors[0]);
        throw new Error("Validation failed");
      }

      const templatePayload = buildTemplatePayload(values, override);

      let currentTemplateId = templateId ?? "";

      if (isEditMode && currentTemplateId) {
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
          throw new Error(
            "Cannot determine templateId after template creation.",
          );
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
        queryClient.invalidateQueries({ queryKey: ["survey-template"] }),
        queryClient.invalidateQueries({ queryKey: ["survey-questions"] }),
        queryClient.refetchQueries({ queryKey: ["survey-templates"] }),
      ]);

      queryClient.removeQueries({
        queryKey: ["survey-template", savedTemplateId],
        exact: true,
      });

      queryClient.removeQueries({
        queryKey: ["survey-questions", savedTemplateId],
        exact: true,
      });

      onCancel();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("global.save_failed");

      if (message.includes("DEFAULT_TEMPLATE_ALREADY_EXISTS")) {
        Modal.confirm({
          title: "Replace default template?",
          content: "Đã có default. Bạn có muốn thay thế không?",
          onOk: () => {
            saveMutation.mutate({
              forceReplaceDefault: true,
            });
          },
        });
        return;
      }

      if (message.includes("CUSTOM_STAGE_CANNOT_BE_DEFAULT")) {
        notify.error("Custom survey cannot be default.");
        return;
      }

      if (message.includes("ONLY_ACTIVE_TEMPLATE_CAN_BE_DEFAULT")) {
        notify.error("Only ACTIVE template can be set as default.");
        return;
      }

      notify.error(message);
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#223A59]">
          {isEditMode
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
                onChange={(value) => {
                  if (value === "CUSTOM") {
                    templateForm.setFieldValue("isDefault", false);
                  }
                }}
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
              <BaseSelect
                name="targetRole"
                label={t("survey.template.target_role") || "Target role"}
                options={[
                  {
                    value: "EMPLOYEE",
                    label: t("survey.role.employee") || "Employee",
                  },
                  {
                    value: "MANAGER",
                    label: t("survey.role.manager") || "Manager",
                  },
                ]}
                placeholder={t("global.select")}
                formItemProps={{
                  rules: [
                    {
                      required: true,
                      message:
                        t("survey.template.validation.target_role_required") ||
                        "Target role is required",
                    },
                  ],
                }}
              />
            </div>

            <div className="mt-4">
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue }) => {
                  const stage = getFieldValue("stage");
                  const disabled = !isEditMode || stage === "CUSTOM";

                  return (
                    <Form.Item name="isDefault" valuePropName="checked">
                      <Switch
                        disabled={disabled}
                        checkedChildren="Default"
                        unCheckedChildren="Normal"
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </div>
          </Form>
        </div>

        <SurveyQuestionBuilder
          t={t}
          localQuestions={localQuestions}
          validationErrors={validationErrors}
          questionTypeOptions={questionTypeOptions}
          dimensionOptions={dimensionOptions}
          importInputRef={importInputRef}
          onChooseImportFile={handleChooseImportFile}
          onImportFileChange={handleImportFileChange}
          onDownloadSample={handleDownloadSample}
          onAddQuestion={addQuestion}
          onUpdateQuestion={updateQuestion}
          onDeleteQuestion={deleteQuestion}
          onDuplicateQuestion={duplicateQuestion}
          onMoveQuestion={moveQuestion}
          onAddOption={addOption}
          onDeleteOption={deleteOption}
          onUpdateOption={updateOption}
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <BaseButton label="global.cancel" onClick={onCancel} />
        <BaseButton
          type="primary"
          label="survey.template.save"
          onClick={() => saveMutation.mutate({})}
          loading={saveMutation.isPending}
        />
      </div>
    </div>
  );
};

export default SurveyTemplateEditorContent;