import type { SurveyQuestion, SurveyAnswer } from "@/interface/survey";

export type AnswerValue = string | number | string[] | null | undefined;
export type AnswerMap = Record<string, AnswerValue>;

export type SurveyInstanceDetail = {
  instanceId: string;
  templateId: string;
  templateName?: string;
  status?: string;
  scheduledAt?: string;
  draftAnswers?: Array<{
    questionId: string;
    value: string | number | string[] | null;
  }>;
};

export type SurveyAnswerQuestion = {
  questionId: string;
  type: string;
  text?: string;
  content?: string;
  required?: boolean;
  options?: string[] | null;
  scaleMin?: number | null;
  scaleMax?: number | null;
};

export type SurveyDetailHookResult = {
  instance: SurveyInstanceDetail | null;
  questions: SurveyQuestion[];
  currentQuestion: SurveyQuestion | undefined;
  normalizedQuestion: SurveyAnswerQuestion | null;
  answers: AnswerMap;
  currentStep: number;
  stepError: string | null;
  submitted: boolean;
  isLoading: boolean;
  isError: boolean;
  isLastStep: boolean;
  progress: number;
  canAnswer: boolean;
  isSavingDraft: boolean;
  isSubmitting: boolean;
  handleAnswerChange: (questionId: string, value: AnswerValue) => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleSubmit: () => Promise<void>;
};

export type SurveySubmitPayload = SurveyAnswer[];