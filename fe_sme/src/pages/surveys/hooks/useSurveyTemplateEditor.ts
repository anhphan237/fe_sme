import { useMemo, useState } from "react";
import type { SurveyQuestion } from "@/interface/survey";
import type {
  LocalQuestion,
  QuestionType,
  SurveyQuestionRaw,
} from "../types/survey-template-editor.types";

type Params = {
  initialQuestions: LocalQuestion[];
  isEdit: boolean;
};

let uidCounter = 0;
const nextUid = () => `local_${++uidCounter}`;

const normalizeQuestionType = (value?: string): QuestionType => {
  if (
    value === "RATING" ||
    value === "TEXT" ||
    value === "SINGLE_CHOICE" ||
    value === "MULTIPLE_CHOICE"
  ) {
    return value;
  }

  return "RATING";
};

const parseQuestionOptions = (raw: unknown): string[] => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(String).map((x) => x.trim()).filter(Boolean);
  }

  if (typeof raw !== "string") return [];

  const text = raw.trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parsed.map(String).map((x) => x.trim()).filter(Boolean);
    }

    if (typeof parsed === "string") {
      try {
        const nested = JSON.parse(parsed);
        if (Array.isArray(nested)) {
          return nested.map(String).map((x) => x.trim()).filter(Boolean);
        }
      } catch {
        return parsed
          .split(/\r?\n|,|;/)
          .map((x) => x.trim())
          .filter(Boolean);
      }
    }
  } catch {
    return text
      .split(/\r?\n|,|;/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
};

export const resequenceQuestions = (questions: LocalQuestion[]) =>
  questions.map((question, index) => ({
    ...question,
    sortOrder: index,
  }));

export const createEmptyQuestion = (sortOrder: number): LocalQuestion => ({
  _uid: nextUid(),
  content: "",
  type: "RATING",
  required: false,
  sortOrder,
  options: [],
  dimensionCode: "GENERAL",
  measurable: true,
  scaleMin: 1,
  scaleMax: 5,
  isNew: true,
  isDirty: true,
});

export const isChoiceType = (type: QuestionType) =>
  type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";

export const isRatingType = (type: QuestionType) => type === "RATING";

export const mapApiQuestionToLocal = (
  q: SurveyQuestion,
  index: number,
): LocalQuestion => {
  const raw = q as SurveyQuestionRaw;

  const rawOptions =
    raw.options ??
    raw.valueOptions ??
    raw.optionsJson ??
    raw.options_json;

  return {
    _uid: q.questionId,
    questionId: q.questionId,
    content: raw.content ?? raw.text ?? "",
    type: normalizeQuestionType(q.type),
    required: Boolean(q.required),
    sortOrder: raw.sortOrder ?? raw.sort_order ?? index,
    options: parseQuestionOptions(rawOptions),
    dimensionCode: raw.dimensionCode ?? raw.dimension_code ?? "",
    measurable: typeof raw.measurable === "boolean" ? raw.measurable : true,
    scaleMin: raw.scaleMin ?? raw.scale_min ?? 1,
    scaleMax: raw.scaleMax ?? raw.scale_max ?? 5,
    isNew: false,
    isDirty: false,
  };
};

export const getQuestionValidationErrors = (
  questions: LocalQuestion[],
  isEdit: boolean,
) => {
  const errors: string[] = [];

  if (!isEdit && questions.length === 0) {
    errors.push("At least one question is required.");
  }

  questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;

    if (!question.content.trim()) {
      errors.push(`${label}: content is required.`);
    }

    if (!question.dimensionCode?.trim()) {
      errors.push(`${label}: dimension is required.`);
    }

    if (isChoiceType(question.type)) {
      const options = question.options.map((item) => item.trim()).filter(Boolean);

      if (options.length < 2) {
        errors.push(`${label}: choice questions need at least 2 options.`);
      }

      if (
        new Set(options.map((item) => item.toLowerCase())).size !== options.length
      ) {
        errors.push(`${label}: options must be unique.`);
      }
    }

    if (isRatingType(question.type)) {
      const min = question.scaleMin ?? 0;
      const max = question.scaleMax ?? 0;

      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        errors.push(`${label}: rating scale must be integers.`);
      } else if (min < 1 || max > 5) {
        errors.push(`${label}: scale must be between 1 and 5.`);
      } else if (min >= max) {
        errors.push(`${label}: scale min must be smaller than scale max.`);
      }
    }
  });

  return errors;
};

export const useSurveyTemplateEditor = ({
  initialQuestions,
  isEdit,
}: Params) => {
  const [localQuestions, setLocalQuestions] = useState<LocalQuestion[]>(
    resequenceQuestions(initialQuestions),
  );
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);

  const validationErrors = useMemo(
    () => getQuestionValidationErrors(localQuestions, isEdit),
    [localQuestions, isEdit],
  );

  const updateQuestion = (uid: string, patch: Partial<LocalQuestion>) => {
    setLocalQuestions((prev) =>
      prev.map((question) => {
        if (question._uid !== uid) return question;

        const next = { ...question, ...patch, isDirty: true };

        if (patch.type === "TEXT") {
          next.options = [];
          next.measurable = false;
          next.scaleMin = undefined;
          next.scaleMax = undefined;
        }

        if (patch.type === "RATING") {
          next.options = [];
          next.measurable = true;
          next.scaleMin = next.scaleMin ?? 1;
          next.scaleMax = next.scaleMax ?? 5;
        }

        if (
          patch.type === "SINGLE_CHOICE" ||
          patch.type === "MULTIPLE_CHOICE"
        ) {
          next.scaleMin = undefined;
          next.scaleMax = undefined;
          if (next.options.length === 0) next.options = ["", ""];
        }

        return next;
      }),
    );
  };

  const addQuestion = () => {
    setLocalQuestions((prev) =>
      resequenceQuestions([...prev, createEmptyQuestion(prev.length)]),
    );
  };

  const duplicateQuestion = (uid: string) => {
    setLocalQuestions((prev) => {
      const source = prev.find((question) => question._uid === uid);
      if (!source) return prev;

      const index = prev.findIndex((question) => question._uid === uid);
      const duplicated: LocalQuestion = {
        ...source,
        _uid: nextUid(),
        questionId: undefined,
        isNew: true,
        isDirty: true,
      };

      const next = [...prev];
      next.splice(index + 1, 0, duplicated);

      return resequenceQuestions(next);
    });
  };

  const deleteQuestion = (uid: string) => {
    setLocalQuestions((prev) => {
      const target = prev.find((question) => question._uid === uid);

      if (target?.questionId) {
        setDeletedQuestionIds((current) =>
          current.includes(target.questionId!)
            ? current
            : [...current, target.questionId!],
        );
      }

      return resequenceQuestions(
        prev.filter((question) => question._uid !== uid),
      );
    });
  };

  const moveQuestion = (uid: string, direction: "up" | "down") => {
    setLocalQuestions((prev) => {
      const index = prev.findIndex((question) => question._uid === uid);
      if (index < 0) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return resequenceQuestions(
        next.map((question) => ({ ...question, isDirty: true })),
      );
    });
  };

  const addOption = (uid: string) => {
    setLocalQuestions((prev) =>
      prev.map((question) =>
        question._uid === uid
          ? {
              ...question,
              options: [...question.options, ""],
              isDirty: true,
            }
          : question,
      ),
    );
  };

  const updateOption = (uid: string, optionIndex: number, value: string) => {
    setLocalQuestions((prev) =>
      prev.map((question) => {
        if (question._uid !== uid) return question;

        const options = [...question.options];
        options[optionIndex] = value;

        return { ...question, options, isDirty: true };
      }),
    );
  };

  const deleteOption = (uid: string, optionIndex: number) => {
    setLocalQuestions((prev) =>
      prev.map((question) =>
        question._uid === uid
          ? {
              ...question,
              options: question.options.filter((_, i) => i !== optionIndex),
              isDirty: true,
            }
          : question,
      ),
    );
  };

  return {
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
  };
};