import { Alert, Form, Modal, Switch } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import {
  apiCreateManagerEvaluationSurveyTemplate,
  apiCreateSurveyQuestion,
  apiCreateSurveyTemplate,
  apiDeleteSurveyQuestion,
  apiUpdateManagerEvaluationSurveyTemplate,
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

type TemplatePreset = "MANAGER_EVALUATION_COMPLETED";

type Props = {
  templateId?: string;
  initialValues: TemplateFormValues;
  initialQuestions: LocalQuestion[];
  onCancel: () => void;
  isEditMode: boolean;
  preset?: TemplatePreset;
};

type SaveTemplatePayload = {
  forceReplaceDefault?: boolean;
};

type TargetRole = "EMPLOYEE" | "MANAGER" | "BOTH";

type TemplatePayload = {
  name: string;
  description?: string;
  stage?: string;
  status: string;
  targetRole: TargetRole;
  isDefault: boolean;
  forceReplaceDefault?: boolean;
};

type ManagerEvaluationTemplatePayload = {
  templateId?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  forceReplaceDefault?: boolean;
};

type ApiCreateResult = {
  templateId?: string;
  id?: string;
  data?: {
    templateId?: string;
    id?: string;
  };
};

const STAGE_COMPLETED = "COMPLETED";
const TARGET_ROLE_MANAGER = "MANAGER";
const STATUS_ACTIVE = "ACTIVE";

const normalizeTargetRole = (value?: string): TargetRole => {
  const raw = String(value ?? "").trim().toUpperCase();

  if (raw === "MANAGER") return "MANAGER";
  if (raw === "BOTH") return "BOTH";

  return "EMPLOYEE";
};

const isCustomStage = (stage: unknown): boolean =>
  String(stage ?? "").trim().toUpperCase() === "CUSTOM";

const isCompletedStage = (stage: unknown): boolean =>
  String(stage ?? "").trim().toUpperCase() === STAGE_COMPLETED;

const isManagerRole = (targetRole: unknown): boolean =>
  String(targetRole ?? "").trim().toUpperCase() === TARGET_ROLE_MANAGER;

const withCompletedStageOption = (
  options: Array<{ value: string; label: string }>,
  completedLabel: string,
): Array<{ value: string; label: string }> => {
  if (options.some((item) => item.value === STAGE_COMPLETED)) {
    return options;
  }

  return [
    ...options,
    {
      value: STAGE_COMPLETED,
      label: completedLabel,
    },
  ];
};

const getManagerEvaluationDimensionOptions = (
  t: (key: string) => string,
): Array<{ value: string; label: string }> => [
  {
    value: "ROLE_FIT",
    label: t("survey.dimension.manager.roleFit"),
  },
  {
    value: "WORK_QUALITY",
    label: t("survey.dimension.manager.workQuality"),
  },
  {
    value: "LEARNING_ABILITY",
    label: t("survey.dimension.manager.learningAbility"),
  },
  {
    value: "PROACTIVENESS",
    label: t("survey.dimension.manager.proactiveness"),
  },
  {
    value: "TEAM_INTEGRATION",
    label: t("survey.dimension.manager.teamIntegration"),
  },
  {
    value: "ATTITUDE_CULTURE",
    label: t("survey.dimension.manager.attitudeCulture"),
  },
  {
    value: "RECOMMENDATION",
    label: t("survey.dimension.manager.recommendation"),
  },
  {
    value: "OVERALL_COMMENT",
    label: t("survey.dimension.manager.overallComment"),
  },
];

const extractCreatedTemplateId = (result: unknown): string => {
  const raw = result as ApiCreateResult;

  return (
    raw?.templateId ??
    raw?.id ??
    raw?.data?.templateId ??
    raw?.data?.id ??
    ""
  );
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;

    const message = obj.message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }

    const data = obj.data as Record<string, unknown> | undefined;
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message.trim();
    }

    const response = obj.response as Record<string, unknown> | undefined;
    const responseData = response?.data as Record<string, unknown> | undefined;

    if (
      typeof responseData?.message === "string" &&
      responseData.message.trim()
    ) {
      return responseData.message.trim();
    }
  }

  return fallback;
};

const normalizeManagerEvaluationQuestionDimension = (
  dimensionCode?: string,
): string => {
  const raw = String(dimensionCode ?? "").trim().toUpperCase();

  const allowed = new Set([
    "ROLE_FIT",
    "WORK_QUALITY",
    "LEARNING_ABILITY",
    "PROACTIVENESS",
    "TEAM_INTEGRATION",
    "ATTITUDE_CULTURE",
    "RECOMMENDATION",
    "OVERALL_COMMENT",
  ]);

  if (allowed.has(raw)) return raw;

  return "ROLE_FIT";
};

const SurveyTemplateEditorContent = ({
  templateId,
  initialValues,
  initialQuestions,
  onCancel,
  isEditMode,
  preset,
}: Props) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [templateForm] = Form.useForm<TemplateFormValues>();

  const isManagerEvaluationTemplate =
    preset === "MANAGER_EVALUATION_COMPLETED" ||
    (isCompletedStage(initialValues.stage) &&
      isManagerRole(initialValues.targetRole));

  const stageOptions = isManagerEvaluationTemplate
    ? withCompletedStageOption(
        getStageOptions(t),
        t("survey.template.stage.completed"),
      )
    : getStageOptions(t);

  const statusOptions = getStatusOptions(t);
  const questionTypeOptions = getQuestionTypeOptions(t);

  const dimensionOptions = isManagerEvaluationTemplate
    ? getManagerEvaluationDimensionOptions(t)
    : getDimensionOptions(t);

  const normalizedInitialValues: TemplateFormValues =
    isManagerEvaluationTemplate
      ? ({
          ...initialValues,
          stage: STAGE_COMPLETED as unknown as TemplateFormValues["stage"],
          targetRole: TARGET_ROLE_MANAGER,
          status: STATUS_ACTIVE,
          isDefault: Boolean(initialValues.isDefault),
        } as TemplateFormValues)
      : initialValues;

  const normalizedInitialQuestions = isManagerEvaluationTemplate
    ? initialQuestions.map((question) => ({
        ...question,
        dimensionCode: normalizeManagerEvaluationQuestionDimension(
          question.dimensionCode,
        ),
      }))
    : initialQuestions;

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
    initialQuestions: normalizedInitialQuestions,
    isEdit: isEditMode,
  });

  const {
    importInputRef,
    handleDownloadSample,
    handleChooseImportFile,
    handleImportFileChange,
  } = useSurveyExcelImport({
    onImportQuestions: (questions) => {
      if (!isManagerEvaluationTemplate) {
        importQuestions(questions);
        return;
      }

      importQuestions(
        questions.map((question) => ({
          ...question,
          dimensionCode: normalizeManagerEvaluationQuestionDimension(
            question.dimensionCode,
          ),
        })),
      );
    },
    sampleTemplateUrl: "/files/survey_questions_template.xlsx",
  });

  const buildTemplatePayload = (
    values: TemplateFormValues,
    override?: SaveTemplatePayload,
  ): TemplatePayload => {
    const normalizedValues: TemplateFormValues = isManagerEvaluationTemplate
      ? ({
          ...values,
          stage: STAGE_COMPLETED as unknown as TemplateFormValues["stage"],
          targetRole: TARGET_ROLE_MANAGER,
          status: STATUS_ACTIVE,
        } as TemplateFormValues)
      : values;

    const stage = String(normalizedValues.stage ?? "").trim();

    return {
      name: normalizedValues.name.trim(),
      description: normalizedValues.description,
      stage: stage || undefined,
      status: normalizedValues.status ?? "DRAFT",
      targetRole: normalizeTargetRole(normalizedValues.targetRole),
      isDefault: isCustomStage(stage) ? false : Boolean(normalizedValues.isDefault),
      ...override,
    };
  };

  const buildManagerEvaluationPayload = (
    templatePayload: TemplatePayload,
  ): ManagerEvaluationTemplatePayload => ({
    templateId,
    name: templatePayload.name,
    description: templatePayload.description,
    isDefault: Boolean(templatePayload.isDefault),
    forceReplaceDefault: templatePayload.forceReplaceDefault,
  });

  const saveMutation = useMutation({
    mutationFn: async (override?: SaveTemplatePayload) => {
      if (isManagerEvaluationTemplate) {
        templateForm.setFieldsValue({
          stage: STAGE_COMPLETED as unknown as TemplateFormValues["stage"],
          targetRole: TARGET_ROLE_MANAGER,
          status: STATUS_ACTIVE,
        } as Partial<TemplateFormValues>);
      }

      const values = await templateForm.validateFields();

      if (validationErrors.length > 0) {
        notify.error(validationErrors[0]);
        throw new Error(t("survey.template.editor.validationFailed"));
      }

      const templatePayload = buildTemplatePayload(values, override);
      let currentTemplateId = templateId ?? "";

      if (isManagerEvaluationTemplate) {
        const managerPayload = buildManagerEvaluationPayload(templatePayload);

        if (isEditMode && currentTemplateId) {
          await apiUpdateManagerEvaluationSurveyTemplate({
            ...managerPayload,
            templateId: currentTemplateId,
          });
        } else {
          const created = await apiCreateManagerEvaluationSurveyTemplate(
            managerPayload,
          );

          currentTemplateId = extractCreatedTemplateId(created);

          if (!currentTemplateId) {
            throw new Error(t("survey.template.editor.missingTemplateId"));
          }
        }
      } else if (isEditMode && currentTemplateId) {
        await apiUpdateSurveyTemplate({
          templateId: currentTemplateId,
          ...templatePayload,
        } as Parameters<typeof apiUpdateSurveyTemplate>[0]);
      } else {
        const created = await apiCreateSurveyTemplate(
          templatePayload as Parameters<typeof apiCreateSurveyTemplate>[0],
        );

        currentTemplateId = extractCreatedTemplateId(created);

        if (!currentTemplateId) {
          throw new Error(t("survey.template.editor.missingTemplateId"));
        }
      }

      for (const questionId of deletedQuestionIds) {
        await apiDeleteSurveyQuestion({ questionId });
      }

      for (const question of resequenceQuestions(localQuestions)) {
        const options = isChoiceType(question.type)
          ? question.options.map((item) => item.trim()).filter(Boolean)
          : [];

        const dimensionCode = isManagerEvaluationTemplate
          ? normalizeManagerEvaluationQuestionDimension(question.dimensionCode)
          : question.dimensionCode;

        const questionPayload = {
          templateId: currentTemplateId,
          content: question.content.trim(),
          type: question.type,
          required: question.required,
          sortOrder: question.sortOrder,
          dimensionCode,
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
          await apiCreateSurveyQuestion(questionPayload);
        } else if (question.isDirty) {
          await apiUpdateSurveyQuestion({
            questionId: question.questionId,
            ...questionPayload,
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
      const message = extractErrorMessage(error, t("global.save_failed"));

      if (message.includes("DEFAULT_TEMPLATE_ALREADY_EXISTS")) {
        Modal.confirm({
          title: t("survey.template.default.replaceTitle"),
          content: isManagerEvaluationTemplate
            ? t("survey.template.default.replaceManagerEvaluationDesc")
            : t("survey.template.default.replaceDesc"),
          okText: t("survey.template.default.replaceConfirm"),
          cancelText: t("global.cancel"),
          onOk: () => {
            saveMutation.mutate({
              forceReplaceDefault: true,
            });
          },
        });
        return;
      }

      if (message.includes("CUSTOM_STAGE_CANNOT_BE_DEFAULT")) {
        notify.error(t("survey.template.default.customCannotDefault"));
        return;
      }

      if (message.includes("ONLY_ACTIVE_TEMPLATE_CAN_BE_DEFAULT")) {
        notify.error(t("survey.template.default.onlyActiveCanDefault"));
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
            ? t("survey.template.editor.edit_title")
            : isManagerEvaluationTemplate
              ? t("survey.template.managerEvaluation.createTitle")
              : t("survey.template.editor.title")}
        </h1>

        <p className="mt-0.5 text-sm text-slate-500">
          {isManagerEvaluationTemplate
            ? t("survey.template.managerEvaluation.subtitle")
            : t("survey.template.editor.subtitle")}
        </p>
      </div>

      {isManagerEvaluationTemplate && (
        <Alert
          type="info"
          showIcon
          message={t("survey.template.managerEvaluation.noticeTitle")}
          description={t("survey.template.managerEvaluation.noticeDesc")}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t("survey.template.editor.template_info")}
          </h2>

          <Form
            form={templateForm}
            layout="vertical"
            initialValues={normalizedInitialValues}
          >
            <BaseInput
              name="name"
              label={t("survey.template.name_label")}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: t("survey.template.validation.name_required"),
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
                disabled={isManagerEvaluationTemplate}
                onChange={(value) => {
                  if (String(value).toUpperCase() === "CUSTOM") {
                    templateForm.setFieldValue("isDefault", false);
                  }
                }}
              />

              {isManagerEvaluationTemplate && (
                <p className="mt-1 text-xs text-slate-500">
                  {t("survey.template.managerEvaluation.stageLockedHint")}
                </p>
              )}
            </div>

            <div className="mt-4">
              <BaseSelect
                name="status"
                label={t("survey.template.status_label")}
                options={statusOptions}
                placeholder={t("global.select")}
                disabled={isManagerEvaluationTemplate}
              />
            </div>

            <div className="mt-4">
              <BaseSelect
                name="targetRole"
                label={t("survey.template.target_role")}
                options={[
                  {
                    value: "EMPLOYEE",
                    label: t("survey.role.employee"),
                  },
                  {
                    value: "MANAGER",
                    label: t("survey.role.manager"),
                  },
                ]}
                placeholder={t("global.select")}
                disabled={isManagerEvaluationTemplate}
                formItemProps={{
                  rules: [
                    {
                      required: true,
                      message: t(
                        "survey.template.validation.target_role_required",
                      ),
                    },
                  ],
                }}
              />
            </div>

            <div className="mt-4">
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue }) => {
                  const currentStage = getFieldValue("stage");
                  const disabled = isCustomStage(currentStage);

                  return (
                    <Form.Item name="isDefault" valuePropName="checked">
                      <Switch
                        disabled={disabled}
                        checkedChildren={t("survey.template.default.on")}
                        unCheckedChildren={t("survey.template.default.off")}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>

              <p className="mt-1 text-xs text-slate-500">
                {isManagerEvaluationTemplate
                  ? t("survey.template.managerEvaluation.defaultHint")
                  : t("survey.template.default.normalHint")}
              </p>
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
          onUpdateQuestion={(questionId, patch) => {
            updateQuestion(
              questionId,
              isManagerEvaluationTemplate && patch.dimensionCode
                ? {
                    ...patch,
                    dimensionCode: normalizeManagerEvaluationQuestionDimension(
                      patch.dimensionCode,
                    ),
                  }
                : patch,
            );
          }}
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