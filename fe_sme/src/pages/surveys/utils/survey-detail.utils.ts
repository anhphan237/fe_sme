import type { SurveyQuestion } from "@/interface/survey";
import type {
  AnswerMap,
  AnswerValue,
  SurveyAnswerQuestion,
  SurveyInstanceDetail,
} from "../types/survey-detail.types";

const parseQuestionOptions = (question?: SurveyQuestion): string[] | null => {
  if (!question) return null;

  if (Array.isArray(question.options) && question.options.length) {
    return question.options;
  }

  const raw = (question as SurveyQuestion & { optionsJson?: string | null })
    .optionsJson;

  if (!raw) return null;

  try {
    const level1 = JSON.parse(raw);

    if (Array.isArray(level1)) {
      return level1.map(String);
    }

    if (typeof level1 === "string") {
      const level2 = JSON.parse(level1);
      if (Array.isArray(level2)) {
        return level2.map(String);
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const mapDraftAnswersToAnswerMap = (
  instance?: SurveyInstanceDetail | null,
): AnswerMap => {
  if (!instance?.draftAnswers?.length) return {};

  const nextAnswers: AnswerMap = {};
  instance.draftAnswers.forEach((item) => {
    nextAnswers[item.questionId] = item.value;
  });

  return nextAnswers;
};

export const normalizeQuestion = (
  question?: SurveyQuestion,
): SurveyAnswerQuestion | null => {
  if (!question) return null;

  return {
    questionId: question.questionId,
    type: question.type,
    text: question.text ?? question.content ?? "",
    content: question.content ?? question.text ?? "",
    required: question.required,
    options: parseQuestionOptions(question),
    scaleMin: question.scaleMin ?? null,
    scaleMax: question.scaleMax ?? null,
  };
};

export const canAnswerSurvey = (status?: string) =>
  status === "PENDING" || status === "SENT" || status === "SCHEDULED";

export const validateQuestionAnswer = (
  question: SurveyQuestion,
  value: AnswerValue,
  requiredMessage: string,
): string | null => {
  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (question.required && isEmpty) {
    return requiredMessage;
  }

  if (isEmpty) return null;

  const type = String(question.type || "").toUpperCase();
  const options = parseQuestionOptions(question) ?? [];

  if (type === "RATING") {
    if (typeof value !== "number") return requiredMessage;

    const min = question.scaleMin ?? 1;
    const max = question.scaleMax ?? 5;

    if (value < min || value > max) return requiredMessage;
  }

  if (type === "CHOICE" || type === "SINGLE_CHOICE") {
    if (typeof value !== "string") return requiredMessage;
    if (options.length && !options.includes(value)) return requiredMessage;
  }

  if (
    type === "MULTIPLE_CHOICE" ||
    type === "MULTI_CHOICE" ||
    type === "CHECKBOX"
  ) {
    if (!Array.isArray(value) || value.length === 0) return requiredMessage;

    const invalid = value.some((item) => !options.includes(String(item)));
    if (invalid) return requiredMessage;
  }

  if (type === "TEXT" && typeof value !== "string") {
    return requiredMessage;
  }

  return null;
};