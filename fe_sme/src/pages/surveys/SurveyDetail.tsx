import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, ChevronLeft, ChevronRight, Eye, Lock } from "lucide-react";
import BaseButton from "@/components/button";
import { useLocale } from "@/i18n";
import SurveyQuestionAnswerField from "./components/SurveyQuestionAnswerField";
import { useSurveyDetail } from "./hooks/useSurveyDetail";

const SurveyDetail = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();

  const {
    instance,
    normalizedQuestion,
    answers,
    currentStep,
    stepError,
    submitted,
    isCompleted,
    isReadonly,
    isHrViewer,
    isLoading,
    isError,
    isLastStep,
    progress,
    canAnswer,
    questions,
    isSavingDraft,
    isSubmitting,
    handleAnswerChange,
    handleNext,
    handlePrev,
    handleSubmit,
  } = useSurveyDetail(surveyId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-8">
        <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

if (!isLoading && instance && !canAnswer && !isReadonly) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <Lock className="h-7 w-7 text-amber-600" />
      </div>

      <p className="text-lg font-semibold text-amber-700">
        Khảo sát chưa tới thời gian mở
      </p>

      <p className="mt-2 text-sm text-amber-600">
        Vui lòng quay lại sau khi đến ngày mở khảo sát.
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

  if (!isLoading && instance && !canAnswer && !isReadonly) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <Lock className="h-7 w-7 text-amber-600" />
      </div>

      <p className="text-lg font-semibold text-amber-700">
        Khảo sát chưa tới thời gian mở
      </p>

      <p className="mt-2 text-sm text-amber-600">
        Vui lòng quay lại sau khi đến ngày mở khảo sát.
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

  if (!questions.length || !normalizedQuestion) {
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
if (isError || !instance) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-red-100 bg-red-50 p-8 text-center">
      <p className="font-medium text-red-600">
        {t("global.load_failed")}
      </p>
      <div className="mt-4">
        <BaseButton
          label="survey.detail.back"
          onClick={() => navigate("/surveys/inbox")}
        />
      </div>
    </div>
  );
}
  return (
    <div className="mx-auto max-w-xl space-y-6 py-2">
      <div className="space-y-2">
        {instance.templateName && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#223A59]">
              {instance.templateName}
            </p>

            {isReadonly ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                <Eye className="h-3.5 w-3.5" />
                {isHrViewer ? "HR view only" : "Read only"}
              </span>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {t("survey.detail.progress", {
              current: currentStep + 1,
              total: questions.length,
            })}
          </span>

          <span className="font-medium text-[#223A59]">
            {canAnswer
              ? `${isSavingDraft ? "Saving..." : "Saved"} · ${Math.round(progress)}%`
              : `${isCompleted ? "Completed" : "View only"} · ${Math.round(progress)}%`}
          </span>
        </div>

        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#3684DB] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

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

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#223A59] text-[11px] font-bold text-white">
              {currentStep + 1}
            </span>

            <p className="text-base font-medium leading-snug text-[#223A59]">
              {normalizedQuestion.text}
              {normalizedQuestion.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </p>
          </div>
        </div>

        <SurveyQuestionAnswerField
          question={normalizedQuestion}
          value={answers[normalizedQuestion.questionId]}
          disabled={isReadonly}
          onChange={(value) =>
            handleAnswerChange(normalizedQuestion.questionId, value)
          }
        />

        {canAnswer && stepError ? (
          <p className="mt-2 text-xs text-red-500">{stepError}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <BaseButton
          icon={<ChevronLeft className="h-4 w-4" />}
          label="survey.detail.prev"
          disabled={currentStep === 0}
          onClick={handlePrev}
        />

        {isLastStep ? (
          canAnswer ? (
            <BaseButton
              type="primary"
              label="survey.detail.submit"
              loading={isSubmitting}
              disabled={!canAnswer || isSubmitting}
              onClick={handleSubmit}
            />
          ) : (
            <BaseButton
              type="primary"
              label="survey.detail.back"
              onClick={() => navigate("/surveys/inbox")}
            />
          )
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