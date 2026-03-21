import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Input, InputNumber, Select, Switch, Checkbox, Divider } from "antd";
import { ArrowDown, ArrowUp, Plus, Trash2, Copy } from "lucide-react";

import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import BaseCheckbox from "@core/components/Checkbox";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import {
  apiGetSurveyTemplate,
  apiCreateSurveyTemplate,
  apiUpdateSurveyTemplate,
  apiCreateSurveyQuestion,
  apiUpdateSurveyQuestion,
  apiDeleteSurveyQuestion,
  apiListSurveyQuestions,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type { SurveyQuestion } from "@/interface/survey";

const { TextArea } = Input;

type QuestionType = "RATING" | "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

type LocalQuestion = {
  _uid: string;
  questionId?: string;
  content: string;
  type: QuestionType;
  required: boolean;
  sortOrder: number;
  options: string[];
  dimensionCode?: string;
  measurable: boolean;
  scaleMin?: number;
  scaleMax?: number;
  isNew: boolean;
  isDirty: boolean;
};

let uidCounter = 0;
const nextUid = () => `local_${++uidCounter}`;

const normalizeQuestionType = (value?: string): QuestionType => {
  switch (value) {
    case "RATING":
    case "TEXT":
    case "SINGLE_CHOICE":
    case "MULTIPLE_CHOICE":
      return value;
    default:
      return "RATING";
  }
};

const isChoiceType = (type: QuestionType) =>
  type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";

const isRatingType = (type: QuestionType) => type === "RATING";
const parseQuestionOptions = (raw: unknown): string[] => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(String);
  }

  if (typeof raw !== "string") {
    return [];
  }

  try {
    const first = JSON.parse(raw);

    if (Array.isArray(first)) {
      return first.map(String);
    }

    if (typeof first === "string") {
      const second = JSON.parse(first);
      return Array.isArray(second) ? second.map(String) : [];
    }

    return [];
  } catch {
    return [];
  }
};
const buildLocalQuestionFromApi = (
  q: SurveyQuestion,
  index: number,
): LocalQuestion => {
  const rawOptions =
    (q as any).optionsJson ??
    (q as any).options_json ??
    (q as any).options ??
    (q as any).valueOptions;

  const options = parseQuestionOptions(rawOptions);

  return {
    _uid: q.questionId,
    questionId: q.questionId,
    content: (q as any).content ?? (q as any).text ?? "",
    type: normalizeQuestionType(q.type),
    required: Boolean(q.required),
    sortOrder: (q as any).sortOrder ?? (q as any).sort_order ?? index,
    options,
    dimensionCode: (q as any).dimensionCode ?? (q as any).dimension_code ?? "",
    measurable:
      typeof (q as any).measurable === "boolean" ? (q as any).measurable : true,
    scaleMin: (q as any).scaleMin ?? (q as any).scale_min ?? 1,
    scaleMax: (q as any).scaleMax ?? (q as any).scale_max ?? 5,
    isNew: false,
    isDirty: false,
  };
};

const resequenceQuestions = (questions: LocalQuestion[]) =>
  questions.map((q, index) => ({
    ...q,
    sortOrder: index,
  }));

const SurveyTemplateEditor = () => {
  const { templateId } = useParams<{ templateId?: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const isEdit = Boolean(templateId) && templateId !== "new";
  const [templateForm] = Form.useForm();

  const [localQuestions, setLocalQuestions] = useState<LocalQuestion[]>([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = t(key as any);
      return value && value !== key ? value : fallback;
    },
    [t],
  );

  const trWithVars = useCallback(
    (
      key: string,
      fallback: string,
      vars?: Record<string, string | number>,
    ) => {
      let value = tr(key, fallback);

      if (!vars) return value;

      Object.entries(vars).forEach(([varKey, varValue]) => {
        const safeValue = String(varValue);

        value = value
          .replaceAll(`{{${varKey}}}`, safeValue)
          .replaceAll(`{${varKey}}`, safeValue);
      });

      return value;
    },
    [tr],
  );

  const getIndexedLabel = useCallback(
    (key: string, fallbackPrefix: string, index: number) => {
      return trWithVars(key, `${fallbackPrefix} ${index}`, {
        index,
        num: index,
      });
    },
    [trWithVars],
  );

  const STAGE_OPTIONS = useMemo(
    () => [
      { value: "DAY_7", label: tr("survey.template.stage.day_7", "Day 7") },
      { value: "DAY_30", label: tr("survey.template.stage.day_30", "Day 30") },
      { value: "DAY_60", label: tr("survey.template.stage.day_60", "Day 60") },
      { value: "CUSTOM", label: tr("survey.template.stage.custom", "Custom") },
    ],
    [tr],
  );

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: "DRAFT", label: tr("survey.template.status.draft", "Draft") },
      { value: "ACTIVE", label: tr("survey.template.status.active", "Active") },
      {
        value: "ARCHIVED",
        label: tr("survey.template.status.archived", "Archived"),
      },
    ],
    [tr],
  );

  const QUESTION_TYPE_OPTIONS = useMemo(
    () => [
      { value: "RATING", label: tr("survey.question.type.rating", "Rating") },
      { value: "TEXT", label: tr("survey.question.type.text", "Text") },
      {
        value: "SINGLE_CHOICE",
        label: tr("survey.question.type.single_choice", "Single choice"),
      },
      {
        value: "MULTIPLE_CHOICE",
        label: tr("survey.question.type.multiple_choice", "Multiple choice"),
      },
    ],
    [tr],
  );

  const DIMENSION_OPTIONS = useMemo(
    () => [
      {
        value: "ONBOARDING_CLARITY",
        label: tr("survey.dimension.onboarding_clarity", "Onboarding clarity"),
      },
      { value: "TRAINING", label: tr("survey.dimension.training", "Training") },
      {
        value: "MANAGER_SUPPORT",
        label: tr("survey.dimension.manager_support", "Manager support"),
      },
      {
        value: "TEAM_SUPPORT",
        label: tr("survey.dimension.team_support", "Team support"),
      },
      {
        value: "TOOLS_ACCESS",
        label: tr("survey.dimension.tools_access", "Tools access"),
      },
      { value: "CULTURE", label: tr("survey.dimension.culture", "Culture") },
      { value: "GENERAL", label: tr("survey.dimension.general", "General") },
    ],
    [tr],
  );

  const { data: templateRaw, isLoading: isTemplateLoading } = useQuery({
    queryKey: ["survey-template", templateId],
    queryFn: () => apiGetSurveyTemplate({ templateId: templateId! }),
    enabled: isEdit,
  });

  const {
    data: savedQuestionsData,
    isLoading: isQuestionsLoading,
    isFetched: isQuestionsFetched,
  } = useQuery({
    queryKey: ["survey-questions", templateId],
    queryFn: () => apiListSurveyQuestions({ templateId: templateId! }),
    enabled: isEdit,
    select: (res): SurveyQuestion[] =>
      extractList<SurveyQuestion>(res, "items", "questions"),
  });

  const savedQuestions = savedQuestionsData ?? [];

  useEffect(() => {
    if (!isEdit) {
      setInitialized(true);
      setLocalQuestions([]);
      setDeletedQuestionIds([]);
      templateForm.setFieldsValue({
        name: "",
        description: "",
        stage: undefined,
        managerOnly: false,
        status: "DRAFT",
        isDefault: false,
      });
      return;
    }

    setInitialized(false);
    setLocalQuestions([]);
    setDeletedQuestionIds([]);
  }, [isEdit, templateId, templateForm]);

  useEffect(() => {
    if (!isEdit || initialized) return;
    if (!templateRaw) return;
    if (isQuestionsLoading || !isQuestionsFetched) return;

    const tpl = templateRaw as {
      name?: string;
      description?: string;
      stage?: string;
      managerOnly?: boolean;
      manager_only?: boolean;
      status?: string;
      isDefault?: boolean;
      is_default?: boolean;
    };

    templateForm.setFieldsValue({
      name: tpl.name ?? "",
      description: tpl.description ?? "",
      stage: tpl.stage ?? undefined,
      managerOnly: tpl.managerOnly ?? tpl.manager_only ?? false,
      status: tpl.status ?? "DRAFT",
      isDefault: tpl.isDefault ?? tpl.is_default ?? false,
    });

    const mapped = savedQuestions
      .slice()
      .sort(
        (a, b) =>
          ((a as any).sortOrder ?? (a as any).sort_order ?? 0) -
          ((b as any).sortOrder ?? (b as any).sort_order ?? 0),
      )
      .map(buildLocalQuestionFromApi);

    setLocalQuestions(resequenceQuestions(mapped));
    setDeletedQuestionIds([]);
    setInitialized(true);
  }, [
    initialized,
    isEdit,
    isQuestionsFetched,
    isQuestionsLoading,
    savedQuestions,
    templateForm,
    templateRaw,
  ]);

  const isPageLoading =
    isEdit && (!templateRaw || isTemplateLoading || isQuestionsLoading || !initialized);

  const addLocalQuestion = useCallback(() => {
    setLocalQuestions((prev) =>
      resequenceQuestions([
        ...prev,
        {
          _uid: nextUid(),
          content: "",
          type: "RATING",
          required: false,
          sortOrder: prev.length,
          options: [],
          dimensionCode: "GENERAL",
          measurable: true,
          scaleMin: 1,
          scaleMax: 5,
          isNew: true,
          isDirty: true,
        },
      ]),
    );
  }, []);

  const duplicateLocalQuestion = useCallback((uid: string) => {
    setLocalQuestions((prev) => {
      const source = prev.find((q) => q._uid === uid);
      if (!source) return prev;

      const duplicated: LocalQuestion = {
        ...source,
        _uid: nextUid(),
        questionId: undefined,
        isNew: true,
        isDirty: true,
      };

      const next = [...prev];
      const index = next.findIndex((q) => q._uid === uid);
      next.splice(index + 1, 0, duplicated);

      return resequenceQuestions(next);
    });
  }, []);

  const updateLocalQuestion = useCallback(
    (uid: string, patch: Partial<LocalQuestion>) => {
      setLocalQuestions((prev) =>
        prev.map((q) => {
          if (q._uid !== uid) return q;

          const next: LocalQuestion = {
            ...q,
            ...patch,
            isDirty: true,
          };

          if (patch.type === "TEXT") {
            next.options = [];
            next.measurable = false;
            next.scaleMin = undefined;
            next.scaleMax = undefined;
          }

          if (patch.type === "RATING") {
            next.measurable = true;
            next.scaleMin = next.scaleMin ?? 1;
            next.scaleMax = next.scaleMax ?? 5;
            next.options = [];
          }

          if (
            patch.type === "SINGLE_CHOICE" ||
            patch.type === "MULTIPLE_CHOICE"
          ) {
            next.measurable = next.measurable ?? true;
            next.scaleMin = undefined;
            next.scaleMax = undefined;
          }

          return next;
        }),
      );
    },
    [],
  );

  const addOption = useCallback((uid: string) => {
    setLocalQuestions((prev) =>
      prev.map((q) =>
        q._uid === uid
          ? { ...q, options: [...q.options, ""], isDirty: true }
          : q,
      ),
    );
  }, []);

  const updateOption = useCallback(
    (uid: string, optionIndex: number, value: string) => {
      setLocalQuestions((prev) =>
        prev.map((q) => {
          if (q._uid !== uid) return q;

          const nextOptions = [...q.options];
          nextOptions[optionIndex] = value;

          return {
            ...q,
            options: nextOptions,
            isDirty: true,
          };
        }),
      );
    },
    [],
  );

  const deleteOption = useCallback((uid: string, optionIndex: number) => {
    setLocalQuestions((prev) =>
      prev.map((q) => {
        if (q._uid !== uid) return q;

        return {
          ...q,
          options: q.options.filter((_, idx) => idx !== optionIndex),
          isDirty: true,
        };
      }),
    );
  }, []);

  const deleteLocalQuestion = useCallback((uid: string) => {
    setLocalQuestions((prev) => {
      const target = prev.find((q) => q._uid === uid);

      if (target?.questionId) {
        setDeletedQuestionIds((ids) =>
          ids.includes(target.questionId!) ? ids : [...ids, target.questionId!],
        );
      }

      return resequenceQuestions(prev.filter((q) => q._uid !== uid));
    });
  }, []);

  const moveQuestion = useCallback((uid: string, direction: "up" | "down") => {
    setLocalQuestions((prev) => {
      const index = prev.findIndex((q) => q._uid === uid);
      if (index < 0) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return resequenceQuestions(
        next.map((q) => ({
          ...q,
          isDirty: true,
        })),
      );
    });
  }, []);
  const requireAtLeastOneQuestion = !isEdit;
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if ( requireAtLeastOneQuestion && localQuestions.length === 0) {
      errors.push(
        tr("survey.validation.at_least_one_question", "At least one question is required."),
      );
    }

    localQuestions.forEach((q, index) => {
      const label = getIndexedLabel(
        "survey.question.label_with_index",
        "Question",
        index + 1,
      );

      if (!q.content.trim()) {
        errors.push(
          `${label}: ${tr(
            "survey.validation.question_content_required",
            "content is required.",
          )}`,
        );
      }

      if (isChoiceType(q.type)) {
        const options = q.options.map((x) => x.trim()).filter(Boolean);

        if (options.length < 2) {
          errors.push(
            `${label}: ${tr(
              "survey.validation.choice_min_options",
              "choice questions need at least 2 options.",
            )}`,
          );
        }

        const uniqueCount = new Set(options.map((x) => x.toLowerCase())).size;
        if (uniqueCount !== options.length) {
          errors.push(
            `${label}: ${tr(
              "survey.validation.choice_unique_options",
              "options must be unique.",
            )}`,
          );
        }
      }

      if (isRatingType(q.type)) {
        const min = q.scaleMin ?? 0;
        const max = q.scaleMax ?? 0;

        if (!Number.isInteger(min) || !Number.isInteger(max)) {
          errors.push(
            `${label}: ${tr(
              "survey.validation.rating_scale_integer",
              "rating scale must be integers.",
            )}`,
          );
        } else if (min >= max) {
          errors.push(
            `${label}: ${tr(
              "survey.validation.rating_scale_min_max",
              "scale min must be smaller than scale max.",
            )}`,
          );
        }
      }

      if (!q.dimensionCode?.trim()) {
        errors.push(
          `${label}: ${tr(
            "survey.validation.dimension_required",
            "dimension is required.",
          )}`,
        );
      }
    });

    return errors;
  }, [requireAtLeastOneQuestion,getIndexedLabel, localQuestions, tr]);

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

      let tid = templateId ?? "";

      if (isEdit) {
        await apiUpdateSurveyTemplate({
          templateId: tid,
          ...templatePayload,
        });
      } else {
        const res = (await apiCreateSurveyTemplate(templatePayload)) as {
          templateId?: string;
          id?: string;
        };

        tid = res?.templateId ?? res?.id ?? "";

        if (!tid) {
          throw new Error(
            tr(
              "survey.template.error.missing_template_id",
              "Cannot determine templateId after template creation.",
            ),
          );
        }
      }

      const orderedQuestions = resequenceQuestions(localQuestions);

      for (const questionId of deletedQuestionIds) {
        await apiDeleteSurveyQuestion({ questionId });
      }

      for (const q of orderedQuestions) {
        const options = isChoiceType(q.type)
          ? q.options.map((x) => x.trim()).filter(Boolean)
          : [];

        const payload = {
          templateId: tid,
          content: q.content.trim(),
          type: q.type,
          required: q.required,
          sortOrder: q.sortOrder,
          dimensionCode: q.dimensionCode,
          measurable: q.measurable,
          ...(isChoiceType(q.type) ? { options } : {}),
          ...(isRatingType(q.type)
            ? {
                scaleMin: q.scaleMin ?? 1,
                scaleMax: q.scaleMax ?? 5,
              }
            : {}),
          optionsJson: JSON.stringify(options)
        };

        if (q.isNew || !q.questionId) {
          await apiCreateSurveyQuestion(payload);
        } else if (q.isDirty) {
          await apiUpdateSurveyQuestion({
            questionId: q.questionId,
            ...payload,
          });
        }
      }

      return { tid };
    },
    onSuccess: async ({ tid }) => {
      notify.success(t("global.save_success"));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["survey-templates"] }),
        queryClient.invalidateQueries({ queryKey: ["survey-template", tid] }),
        queryClient.invalidateQueries({ queryKey: ["survey-questions", tid] }),
        queryClient.invalidateQueries({ queryKey: ["survey-questions"] }),
      ]);

      navigate("/surveys/templates");
    },
    onError: (error: any) => {
      notify.error(error?.message || t("global.save_failed"));
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#223A59]">
          {isEdit
            ? tr("survey.template.editor.edit_title", "Edit survey template")
            : tr("survey.template.editor.title", "Create survey template")}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {tr(
            "survey.template.editor.subtitle",
            "Create and manage template information and questions.",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {tr("survey.template.editor.template_info", "Template info")}
          </h2>

          <Form
            form={templateForm}
            layout="vertical"
            initialValues={{
              name: "",
              description: "",
              stage: undefined,
              managerOnly: false,
              status: "DRAFT",
              isDefault: false,
            }}
          >
            <BaseInput
              name="name"
              label={t("survey.template.name_label")}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: tr(
                      "survey.template.validation.name_required",
                      "Template name is required",
                    ),
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
                options={STAGE_OPTIONS}
                placeholder={t("global.select")}
              />
            </div>

            <div className="mt-4">
              <BaseSelect
                name="status"
                label={tr("survey.template.status_label", "Status")}
                options={STATUS_OPTIONS}
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
                labelCheckbox={tr("survey.template.is_default_label", "Default template")}
              />
            </div>
          </Form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                {tr("survey.question.section_title", "Questions")}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {localQuestions.length}{" "}
                {localQuestions.length === 1
                  ? tr("survey.question.count_singular", "question")
                  : tr("survey.question.count_plural", "questions")}
              </p>
            </div>

            <BaseButton
              size="small"
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              label="survey.question.add"
              onClick={addLocalQuestion}
            />
          </div>

          {validationErrors.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <div className="font-medium">
                {tr(
                  "survey.template.validation.fix_before_save",
                  "Please fix these issues before saving:",
                )}
              </div>
              <ul className="mt-2 list-disc pl-5">
                {validationErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {isPageLoading ? (
            <div className="py-10 text-sm text-slate-400">
              {tr("survey.template.loading", "Loading template...")}
            </div>
          ) : localQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Plus className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">
                {t("survey.question.empty_hint")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {localQuestions.map((q, index) => (
                <div
                  key={q._uid}
                  className="rounded-xl border border-slate-200 p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">
                        {getIndexedLabel(
                          "survey.question.label_with_index",
                          "Question",
                          index + 1,
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {q.isNew
                          ? tr("survey.question.new", "New question")
                          : tr("survey.question.saved", "Saved question")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BaseButton
                        size="small"
                        icon={<ArrowUp className="h-4 w-4" />}
                        onClick={() => moveQuestion(q._uid, "up")}
                      />
                      <BaseButton
                        size="small"
                        icon={<ArrowDown className="h-4 w-4" />}
                        onClick={() => moveQuestion(q._uid, "down")}
                      />
                      <BaseButton
                        size="small"
                        icon={<Copy className="h-4 w-4" />}
                        onClick={() => duplicateLocalQuestion(q._uid)}
                      />
                      <BaseButton
                        size="small"
                        danger
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteLocalQuestion(q._uid)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {tr("survey.question.content_label", "Content")}
                      </label>
                      <TextArea
                        rows={3}
                        value={q.content}
                        onChange={(e) =>
                          updateLocalQuestion(q._uid, { content: e.target.value })
                        }
                        placeholder={tr(
                          "survey.question.content_placeholder",
                          "Enter question content",
                        )}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {tr("survey.question.type_label", "Type")}
                      </label>
                      <Select
                        className="w-full"
                        value={q.type}
                        options={QUESTION_TYPE_OPTIONS}
                        onChange={(value) =>
                          updateLocalQuestion(q._uid, {
                            type: value as QuestionType,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {tr("survey.question.dimension_label", "Dimension")}
                      </label>
                      <Select
                        className="w-full"
                        value={q.dimensionCode}
                        options={DIMENSION_OPTIONS}
                        onChange={(value) =>
                          updateLocalQuestion(q._uid, {
                            dimensionCode: value,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={q.required}
                          onChange={(e) =>
                            updateLocalQuestion(q._uid, {
                              required: e.target.checked,
                            })
                          }
                        >
                          {tr("survey.question.required", "Required")}
                        </Checkbox>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                          {tr("survey.question.measurable", "Measurable")}
                        </span>
                        <Switch
                          checked={q.measurable}
                          onChange={(checked) =>
                            updateLocalQuestion(q._uid, { measurable: checked })
                          }
                          disabled={q.type === "TEXT"}
                        />
                      </div>
                    </div>

                    {isRatingType(q.type) && (
                      <>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            {tr("survey.question.scale_min", "Scale min")}
                          </label>
                          <InputNumber
                            className="w-full"
                            min={0}
                            value={q.scaleMin}
                            onChange={(value) =>
                              updateLocalQuestion(q._uid, {
                                scaleMin: typeof value === "number" ? value : 1,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            {tr("survey.question.scale_max", "Scale max")}
                          </label>
                          <InputNumber
                            className="w-full"
                            min={1}
                            value={q.scaleMax}
                            onChange={(value) =>
                              updateLocalQuestion(q._uid, {
                                scaleMax: typeof value === "number" ? value : 5,
                              })
                            }
                          />
                        </div>
                      </>
                    )}

                    {isChoiceType(q.type) && (
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          {tr("survey.question.options_label", "Options")}
                        </label>

                        <div className="space-y-2">
                          {q.options.map((opt, idx) => (
                            <div key={`${q._uid}-${idx}`} className="flex items-center gap-2">
                              <Input
                                value={opt}
                                onChange={(e) =>
                                  updateOption(q._uid, idx, e.target.value)
                                }
                                placeholder={getIndexedLabel(
                                  "survey.question.option_with_index",
                                  "Option",
                                  idx + 1,
                                )}
                              />
                              <BaseButton
                                size="small"
                                danger
                                icon={<Trash2 className="h-4 w-4" />}
                                onClick={() => deleteOption(q._uid, idx)}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-2">
                          <BaseButton
                            size="small"
                            icon={<Plus className="h-4 w-4" />}
                            label="survey.question.add_option"
                            onClick={() => addOption(q._uid)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Divider className="my-4" />

                  <div className="text-xs text-slate-400">
                    {tr("survey.question.meta.sort_order", "sortOrder")}: {q.sortOrder} •{" "}
                    {tr("survey.question.meta.id", "id")}:{" "}
                    {q.questionId ?? tr("survey.question.meta.new", "new")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <BaseButton
          label="global.cancel"
          onClick={() => navigate("/surveys/templates")}
        />
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

export default SurveyTemplateEditor;