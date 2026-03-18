import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Form } from "antd";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import BaseButton from "@/components/button";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import {
  apiGetSurveyInstances,
  apiGetSurveyTemplate,
  apiListSurveyQuestions,
  apiSubmitSurveyResponse,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type { SurveyInstanceSummary, SurveyQuestion, SurveyAnswer } from "@/interface/survey";
import SurveyQuestionField from "./components/SurveyQuestionField";

const SurveyDetail = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [form] = Form.useForm<Record<string, unknown>>();
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  /* ── Load instances ── */
  const {
    data: instancesRaw,
    isLoading: instancesLoading,
    isError,
  } = useQuery({
    queryKey: ["survey-instances"],
    queryFn: () => apiGetSurveyInstances(),
  });
  const instances = extractList<SurveyInstanceSummary>(
    instancesRaw,
    "items",
    "instances",
  );
  const instance = instances.find((i) => i.instanceId === surveyId);
  const templateId = instance?.templateId;

  /* ── Load questions ── */
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ["survey-questions", templateId],
    queryFn: () => apiListSurveyQuestions({ templateId: templateId! }),
    enabled: Boolean(templateId),
    select: (res): SurveyQuestion[] =>
      extractList<SurveyQuestion>(res, "items", "questions"),
  });
  const questions: SurveyQuestion[] = questionsData ?? [];

  /* ── Load template name ── */
  const { data: templateRaw } = useQuery({
    queryKey: ["survey-template", templateId],
    queryFn: () => apiGetSurveyTemplate({ templateId: templateId! }),
    enabled: Boolean(templateId),
  });
  const template = templateRaw as { name?: string } | null;

  /* ── Submit ── */
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: SurveyAnswer[]) =>
      apiSubmitSurveyResponse({ instanceId: surveyId!, answers: payload }),
    onSuccess: () => setSubmitted(true),
    onError: () => notify.error(t("survey.detail.error")),
  });

  const isLoading = instancesLoading || questionsLoading;
  const total = questions.length;
  const isLastStep = currentStep === total - 1;
  const progress = total > 0 ? ((currentStep + 1) / total) * 100 : 0;

  /* ── Validate & advance ── */
  const handleNext = () => {
    const q = questions[currentStep];
    if (!q) return;
    const val = form.getFieldValue(q.questionId);
    const isEmpty =
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0);
    if (q.required && isEmpty) {
      setStepError(t("survey.detail.q_required"));
      return;
    }
    setStepError(null);
    setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    setStepError(null);
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    const q = questions[currentStep];
    if (q?.required) {
      const val = form.getFieldValue(q.questionId);
      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) {
        setStepError(t("survey.detail.q_required"));
        return;
      }
    }
    const values = form.getFieldsValue();
    const payload: SurveyAnswer[] = questions.map((q) => ({
      questionId: q.questionId,
      value: (values[q.questionId] ?? "") as SurveyAnswer["value"],
    }));
    await mutateAsync(payload);
  };

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-8">
        <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  /* ── Error / not found ── */
  if (isError || !instance) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="font-medium text-red-600">{t("global.save_failed")}</p>
        <div className="mt-4">
          <BaseButton
            label="survey.detail.back"
            onClick={() => navigate("/surveys/inbox")}
          />
        </div>
      </div>
    );
  }

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-green-100 bg-green-50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-xl font-semibold text-green-700">
          {t("survey.detail.success.title")}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {t("survey.detail.success.desc")}
        </p>
        <div className="mt-6">
          <BaseButton
            type="primary"
            label="survey.detail.back"
            onClick={() => navigate("/surveys/inbox")}
          />
        </div>
      </div>
    );
  }

  /* ── No questions ── */
  if (total === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-slate-500">{t("survey.question.empty_hint")}</p>
        <div className="mt-4">
          <BaseButton
            label="survey.detail.back"
            onClick={() => navigate("/surveys/inbox")}
          />
        </div>
      </div>
    );
  }

  const currentQ = questions[currentStep];

  return (
    <div className="mx-auto max-w-xl space-y-6 py-2">
      {/* ── Progress ── */}
      <div className="space-y-2">
        {template?.name && (
          <p className="text-sm font-semibold text-[#223A59]">{template.name}</p>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {t("survey.detail.progress", {
              current: currentStep + 1,
              total,
            })}
          </span>
          <span className="font-medium text-[#223A59]">
            {Math.round(progress)}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#3684DB] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-1.5 pt-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i < currentStep
                  ? "bg-[#3684DB] w-4"
                  : i === currentStep
                    ? "bg-[#223A59] w-6"
                    : "bg-slate-200 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Question header */}
        <div className="mb-5">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#223A59] text-[11px] font-bold text-white">
              {currentStep + 1}
            </span>
            <p className="text-base font-medium leading-snug text-[#223A59]">
              {currentQ.text}
              {currentQ.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </p>
          </div>
        </div>

        {/* Answer field */}
        <Form form={form} layout="vertical" className="[&_.ant-form-item]:mb-0">
          <SurveyQuestionField question={currentQ} />
        </Form>

        {/* Required error */}
        {stepError && <p className="mt-2 text-xs text-red-500">{stepError}</p>}
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between">
        <BaseButton
          icon={<ChevronLeft className="h-4 w-4" />}
          label="survey.detail.prev"
          disabled={currentStep === 0}
          onClick={handlePrev}
        />
        {isLastStep ? (
          <BaseButton
            type="primary"
            label="survey.detail.submit"
            loading={isPending}
            onClick={handleSubmit}
          />
        ) : (
          <BaseButton
            type="primary"
            icon={<ChevronRight className="h-4 w-4" />}
            label="survey.detail.next"
            onClick={handleNext}
          />
        )}
      </div>
    </div>
  );
};

export default SurveyDetail;
