import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form } from "antd";
import { Plus } from "lucide-react";
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
  apiListSurveyQuestions,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type { SurveyQuestion } from "@/interface/survey";
import QuestionCard, { type LocalQuestion } from "./components/QuestionCard";

const STAGE_OPTIONS = [
  { value: "DAY_7", label: "Day 7" },
  { value: "DAY_30", label: "Day 30" },
  { value: "DAY_60", label: "Day 60" },
  { value: "CUSTOM", label: "Custom" },
];

let uidCounter = 0;
const nextUid = () => `local_${++uidCounter}`;

const SurveyTemplateEditor = () => {
  const { templateId } = useParams<{ templateId?: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const isEdit = Boolean(templateId) && templateId !== "new";
  const queryClient = useQueryClient();

  const [templateForm] = Form.useForm();
  const [localQuestions, setLocalQuestions] = useState<LocalQuestion[]>([]);
  const [initialized, setInitialized] = useState(false);

  /* ── Fetch existing template ── */
  const { data: templateRaw } = useQuery({
    queryKey: ["survey-template", templateId],
    queryFn: () => apiGetSurveyTemplate({ templateId: templateId! }),
    enabled: isEdit,
  });

  const { data: savedQuestionsData } = useQuery({
    queryKey: ["survey-questions", templateId],
    queryFn: () => apiListSurveyQuestions({ templateId: templateId! }),
    enabled: isEdit,
    select: (res): SurveyQuestion[] =>
      extractList<SurveyQuestion>(res, "items", "questions"),
  });
  const savedQuestions: SurveyQuestion[] = savedQuestionsData ?? [];

  /* Seed form + local questions from server data (once) */
  useEffect(() => {
    if (!isEdit || initialized) return;
    const tpl = templateRaw as {
      name?: string;
      description?: string;
      stage?: string;
      managerOnly?: boolean;
    } | null;
    if (tpl) {
      templateForm.setFieldsValue({
        name: tpl.name,
        description: tpl.description,
        stage: tpl.stage,
        managerOnly: tpl.managerOnly,
      });
    }
    if (savedQuestions.length > 0) {
      setLocalQuestions(
        savedQuestions.map((q) => ({
          _uid: q.questionId,
          text: q.text,
          type: q.type as LocalQuestion["type"],
          required: q.required,
          options: q.options?.join(", ") ?? "",
        })),
      );
      setInitialized(true);
    }
  }, [isEdit, templateRaw, savedQuestions, initialized, templateForm]);

  /* ── Local question CRUD ── */
  const addLocalQuestion = useCallback(() => {
    setLocalQuestions((prev) => [
      ...prev,
      {
        _uid: nextUid(),
        text: "",
        type: "RATING",
        required: false,
        options: "",
      },
    ]);
  }, []);

  const updateLocalQuestion = useCallback(
    (uid: string, patch: Partial<LocalQuestion>) => {
      setLocalQuestions((prev) =>
        prev.map((q) => (q._uid === uid ? { ...q, ...patch } : q)),
      );
    },
    [],
  );

  const deleteLocalQuestion = useCallback((uid: string) => {
    setLocalQuestions((prev) => prev.filter((q) => q._uid !== uid));
  }, []);

  /* ── Save ── */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await templateForm.validateFields();

      let tid = templateId!;
      if (isEdit) {
        await apiUpdateSurveyTemplate({ templateId: tid, ...values });
      } else {
        const res = (await apiCreateSurveyTemplate(values)) as {
          templateId?: string;
          id?: string;
        };
        tid = res?.templateId ?? res?.id ?? "";
      }

      /* Batch-create new local questions */
      const newQuestions = localQuestions.filter((q) =>
        q._uid.startsWith("local_"),
      );
      for (const q of newQuestions) {
        const opts = q.options
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        await apiCreateSurveyQuestion({
          templateId: tid,
          text: q.text,
          type: q.type,
          required: q.required,
          ...(opts.length > 0 ? { options: opts } : {}),
        });
      }
    },
    onSuccess: () => {
      notify.success(t("global.save_success"));
      queryClient.invalidateQueries({ queryKey: ["survey-templates"] });
      queryClient.invalidateQueries({ queryKey: ["survey-questions"] });
      navigate("/surveys/templates");
    },
    onError: () => notify.error(t("global.save_failed")),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-lg font-semibold text-[#223A59]">
          {isEdit
            ? t("survey.template.editor.edit_title")
            : t("survey.template.editor.title")}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {t("survey.template.editor.subtitle")}
        </p>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card 1 — Template Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t("survey.template.info_title")}
          </h2>

          <Form form={templateForm} layout="vertical">
            <BaseInput
              name="name"
              label={t("survey.template.name_label")}
              formItemProps={{ rules: [{ required: true }] }}
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
              <BaseCheckbox
                name="managerOnly"
                labelCheckbox={t("survey.template.manager_only_label")}
              />
            </div>
          </Form>
        </div>

        {/* Card 2 — Questions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                {t("survey.question.list")}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {localQuestions.length}{" "}
                {localQuestions.length === 1 ? "question" : "questions"}
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

          {localQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Plus className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">
                {t("survey.question.empty_hint")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {localQuestions.map((q, i) => (
                <QuestionCard
                  key={q._uid}
                  question={q}
                  index={i}
                  onChange={updateLocalQuestion}
                  onDelete={deleteLocalQuestion}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
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
