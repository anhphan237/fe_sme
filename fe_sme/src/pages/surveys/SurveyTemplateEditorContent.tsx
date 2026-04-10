import { Form, Modal, Switch } from "antd";
import { Download, Plus, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import * as XLSX from "xlsx";

import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";

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
  initialValues: TemplateFormValues;
  initialQuestions: LocalQuestion[];
  onCancel: () => void;
  isEditMode: boolean;
};

type SaveTemplatePayload = {
  forceReplaceDefault?: boolean;
};

type ParsedExcelQuestion = {
  content: string;
  type: "RATING" | "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  required: boolean;
  sortOrder: number;
  dimensionCode: string;
  measurable: boolean;
  scaleMin?: number;
  scaleMax?: number;
  options?: string[];
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
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Đặt file này trong public/files/survey_questions_template.xlsx
  const SAMPLE_TEMPLATE_URL = "/files/survey_questions_template.xlsx";

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

  const normalizeQuestionType = (
    value?: unknown,
  ): ParsedExcelQuestion["type"] => {
    const v = String(value ?? "")
      .trim()
      .toUpperCase();

    if (v === "RATING" || v === "ĐÁNH GIÁ") return "RATING";
    if (v === "TEXT" || v === "TỰ LUẬN") return "TEXT";
    if (v === "SINGLE_CHOICE" || v === "MỘT LỰA CHỌN")
      return "SINGLE_CHOICE";
    if (v === "MULTIPLE_CHOICE" || v === "NHIỀU LỰA CHỌN")
      return "MULTIPLE_CHOICE";

    return "TEXT";
  };

  const toBoolean = (value: unknown, defaultValue = false) => {
    if (typeof value === "boolean") return value;

    const v = String(value ?? "")
      .trim()
      .toLowerCase();

    if (["true", "1", "yes", "y", "x"].includes(v)) return true;
    if (["false", "0", "no", "n"].includes(v)) return false;

    return defaultValue;
  };

  const toNumber = (value: unknown, defaultValue?: number) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
  };

  const parseOptions = (value: unknown) =>
    String(value ?? "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

  const parseExcelQuestions = async (
    file: File,
  ): Promise<ParsedExcelQuestion[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
    });

    return rows
      .map((row, index) => {
        const type = normalizeQuestionType(row.Type);

        return {
          content: String(row.Content ?? "").trim(),
          type,
          required: toBoolean(row.Required, false),
          sortOrder: toNumber(row.SortOrder, index + 1) ?? index + 1,
          dimensionCode:
            String(row.DimensionCode ?? "GENERAL")
              .trim()
              .toUpperCase() || "GENERAL",
          measurable: toBoolean(row.Measurable, type === "RATING"),
          scaleMin: type === "RATING" ? toNumber(row.ScaleMin, 1) : undefined,
          scaleMax: type === "RATING" ? toNumber(row.ScaleMax, 5) : undefined,
          options:
            type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE"
              ? parseOptions(row.Options)
              : [],
        };
      })
      .filter((item) => item.content);
  };

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

  const handleDownloadSample = () => {
    try {
      const link = document.createElement("a");
      link.href = SAMPLE_TEMPLATE_URL;
      link.download = "survey_questions_template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      notify.error(
        t("survey.question.sample_download_failed") ||
          "Cannot download sample file",
      );
    }
  };

  const handleChooseImportFile = () => {
    importInputRef.current?.click();
  };

  const handleImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      notify.error(
        t("survey.question.import_invalid_file") ||
          "Please select a valid .xlsx file",
      );
      return;
    }

    try {
      const importedRows = await parseExcelQuestions(file);

      if (!importedRows.length) {
        notify.error(
          t("survey.question.import_failed") || "Import questions failed",
        );
        return;
      }

      Modal.confirm({
        title:
          t("survey.question.import_dialog_title") ||
          "Import questions from Excel",
        content:
          t("survey.question.import_dialog_content") ||
          "Choose how to import questions into this survey template.",
        okText: t("survey.question.import_append") || "Append",
        cancelText: t("survey.question.import_replace_all") || "Replace all",
        onOk: async () => {
          importQuestions(importedRows, "APPEND");
          notify.success(
            t("survey.question.import_success") ||
              "Import questions successfully",
          );
        },
        onCancel: async () => {
          importQuestions(importedRows, "REPLACE_ALL");
          notify.success(
            t("survey.question.import_success") ||
              "Import questions successfully",
          );
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("survey.question.import_failed") || "Import questions failed";
      notify.error(message);
    }
  };

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

            <div className="flex items-center gap-2">
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleImportFileChange}
              />

              <BaseButton
                size="small"
                icon={<Download className="h-4 w-4" />}
                label="survey.question.download_sample"
                onClick={handleDownloadSample}
              />

              <BaseButton
                size="small"
                icon={<Upload className="h-4 w-4" />}
                label="survey.question.import_excel"
                onClick={handleChooseImportFile}
              />

              <BaseButton
                size="small"
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                label="survey.question.add"
                onClick={addQuestion}
              />
            </div>
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
              <p className="mt-2 text-xs text-slate-400">
                {t("survey.question.empty_hint_import") ||
                  "You can add questions manually or quickly import from Excel."}
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
          onClick={() => saveMutation.mutate({})}
          loading={saveMutation.isPending}
        />
      </div>
    </div>
  );
};

export default SurveyTemplateEditorContent;