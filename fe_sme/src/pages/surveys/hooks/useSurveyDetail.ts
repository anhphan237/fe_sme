import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import { useUserStore } from "@/stores/user.store";
import {
  apiGetSurveyInstance,
  apiListSurveyQuestions,
  apiSaveSurveyDraft,
  apiSubmitSurveyResponse,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type { SurveyQuestion, SurveyAnswer } from "@/interface/survey";
import type {
  AnswerMap,
  AnswerValue,
  SurveyDetailHookResult,
  SurveyInstanceDetail,
} from "../types/survey-detail.types";
import {
  canAnswerSurvey,
  mapDraftAnswersToAnswerMap,
  normalizeQuestion,
  validateQuestionAnswer,
} from "../utils/survey-detail.utils";

type SurveyViewMode = "edit" | "readonly" | "blocked";

const COMPLETED_STATUS = "COMPLETED";

export const useSurveyDetail = (
  surveyId?: string,
): SurveyDetailHookResult & {
  isCompleted: boolean;
  isReadonly: boolean;
  isHrViewer: boolean;
  viewMode: SurveyViewMode;
} => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.currentUser);
  const roles = currentUser?.roles ?? [];

  const isHrViewer = useMemo(
    () =>
      roles.some((role) => String(role).toUpperCase() === "HR"),
    [roles],
  );

  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const {
    data: instanceRaw,
    isLoading: instanceLoading,
    isError: instanceError,
  } = useQuery({
    queryKey: ["survey-instance", surveyId],
    queryFn: () => apiGetSurveyInstance({ instanceId: surveyId! }),
    enabled: Boolean(surveyId),
  });

  const instance = (instanceRaw ?? null) as SurveyInstanceDetail | null;
  const templateId = instance?.templateId;
  const isCompleted = instance?.status === COMPLETED_STATUS;

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ["survey-questions", templateId],
    queryFn: () => apiListSurveyQuestions({ templateId: templateId! }),
    enabled: Boolean(templateId),
    select: (res): SurveyQuestion[] =>
      extractList<SurveyQuestion>(res, "items", "questions"),
  });

  const questions = questionsData ?? [];

  const saveDraftMutation = useMutation({
    mutationFn: (payload: {
      instanceId: string;
      answers: Array<{
        questionId: string;
        value: string | number | string[] | null;
      }>;
    }) => apiSaveSurveyDraft(payload),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: SurveyAnswer[]) =>
      apiSubmitSurveyResponse({
        surveyInstanceId: surveyId!,
        answers: payload,
      }),
    onSuccess: async () => {
      setSubmitted(true);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["survey-instance", surveyId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["survey-instances"],
          exact: false,
        }),
      ]);
    },
    onError: () => notify.error(t("survey.detail.error")),
  });

  const loadedAnswerMap = useMemo(
    () => mapDraftAnswersToAnswerMap(instance),
    [instance],
  );

  useEffect(() => {
    setAnswers(loadedAnswerMap);
  }, [loadedAnswerMap]);

  const currentQuestion = questions[currentStep];

  const normalizedQuestion = useMemo(
    () => normalizeQuestion(currentQuestion),
    [currentQuestion],
  );

  const total = questions.length;
  const isLoading = instanceLoading || questionsLoading;
  const isLastStep = total > 0 && currentStep === total - 1;
  const progress = total > 0 ? ((currentStep + 1) / total) * 100 : 0;

  const canEmployeeAnswer = !isCompleted && canAnswerSurvey(instance?.status);

  const viewMode: SurveyViewMode = useMemo(() => {
    if (isHrViewer) return "readonly";
    if (canEmployeeAnswer) return "edit";
    if (isCompleted) return "readonly";
    return "blocked";
  }, [isHrViewer, canEmployeeAnswer, isCompleted]);

  const isReadonly = viewMode === "readonly";
  const canAnswer = viewMode === "edit";

  useEffect(() => {
    if (!surveyId) return;
    if (!Object.keys(answers).length) return;
    if (!canAnswer || submitted) return;

    const timer = setTimeout(() => {
      const payload = Object.entries(answers)
        .filter(([, value]) => value !== undefined)
        .map(([questionId, value]) => ({
          questionId,
          value: (value ?? null) as string | number | string[] | null,
        }));

      if (!payload.length) return;

      saveDraftMutation.mutate({
        instanceId: surveyId,
        answers: payload,
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [answers, surveyId, canAnswer, submitted, saveDraftMutation]);

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    if (!canAnswer) return;

    setStepError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    setStepError(null);
    setCurrentStep((s) => Math.min(s + 1, total - 1));
  };

  const handlePrev = () => {
    setStepError(null);
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    if (!canAnswer || submitMutation.isPending) return;

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const error = validateQuestionAnswer(
        q,
        answers[q.questionId],
        t("survey.detail.q_required"),
      );

      if (error) {
        setCurrentStep(i);
        setStepError(error);
        return;
      }
    }

    const payload: SurveyAnswer[] = questions.map((q) => ({
      questionId: q.questionId,
      value: (answers[q.questionId] ?? "") as SurveyAnswer["value"],
    }));

    await submitMutation.mutateAsync(payload);
  };

  return {
    instance,
    questions,
    currentQuestion,
    normalizedQuestion,
    answers,
    currentStep,
    stepError,
    submitted,
    isCompleted,
    isReadonly,
    isHrViewer,
    viewMode,
    isLoading,
    isError: instanceError,
    isLastStep,
    progress,
    canAnswer,
    isSavingDraft: saveDraftMutation.isPending,
    isSubmitting: submitMutation.isPending,
    handleAnswerChange,
    handleNext,
    handlePrev,
    handleSubmit,
  };
};