import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  apiGetSurveyTemplate,
  apiListSurveyQuestions,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type { SurveyQuestion } from "@/interface/survey";
import SurveyTemplateEditorContent from "./SurveyTemplateEditorContent";
import { useLocale } from "@/i18n";
import type {
  LocalQuestion,
  SurveyQuestionRaw,
  TemplateFormValues,
  TemplateRaw,
  QuestionType,
} from "./types/survey-template-editor.types";

type TemplatePreset = "MANAGER_EVALUATION_COMPLETED";

type LocationState = {
  preset?: TemplatePreset;
  name?: string;
  description?: string;
  stage?: TemplateFormValues["stage"] | "COMPLETED";
  targetRole?: TemplateFormValues["targetRole"];
  isDefault?: boolean;
  status?: TemplateFormValues["status"];
};

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
    return raw
      .map(String)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  if (typeof raw !== "string") return [];

  const text = raw.trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parsed
        .map(String)
        .map((x) => x.trim())
        .filter(Boolean);
    }

    if (typeof parsed === "string") {
      try {
        const nested = JSON.parse(parsed);
        if (Array.isArray(nested)) {
          return nested
            .map(String)
            .map((x) => x.trim())
            .filter(Boolean);
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

const normalizeStage = (
  stage?: string,
): TemplateFormValues["stage"] | "COMPLETED" | undefined => {
  const value = String(stage ?? "")
    .trim()
    .toUpperCase();

  if (!value) return undefined;
  if (value === "DAY_7") return "D7";
  if (value === "DAY_30") return "D30";
  if (value === "DAY_60") return "D60";
  if (value === "DONE" || value === "FINISHED") {
    return "COMPLETED";
  }

  if (
    value === "D7" ||
    value === "D30" ||
    value === "D60" ||
    value === "CUSTOM" ||
    value === "COMPLETED"
  ) {
    return value as TemplateFormValues["stage"] | "COMPLETED";
  }

  return undefined;
};

const mapApiQuestionToLocal = (
  q: SurveyQuestion,
  index: number,
): LocalQuestion => {
  const raw = q as SurveyQuestionRaw;

  const rawOptions =
    raw.options ?? raw.valueOptions ?? raw.optionsJson ?? raw.options_json;

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

const SurveyTemplateEditor = () => {
  const { t } = useLocale();
  const { templateId } = useParams<{ templateId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = (location.state ?? {}) as LocationState;
  const searchParams = new URLSearchParams(location.search);
  const presetFromQuery =
    searchParams.get("type") === "manager-evaluation"
      ? "MANAGER_EVALUATION_COMPLETED"
      : undefined;

  const preset = locationState.preset ?? presetFromQuery;
  const isManagerEvaluationPreset = preset === "MANAGER_EVALUATION_COMPLETED";
  const isEdit = Boolean(templateId) && templateId !== "new";

  const {
    data: templateRaw,
    isLoading: isTemplateLoading,
    isError: isTemplateError,
  } = useQuery({
    queryKey: ["survey-template", templateId],
    queryFn: () => apiGetSurveyTemplate({ templateId: templateId! }),
    enabled: isEdit,
    refetchOnMount: "always",
    staleTime: 0,
    gcTime: 0,
  });

  const {
    data: questionsMapped = [],
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
  } = useQuery({
    queryKey: ["survey-questions", templateId],
    queryFn: () => apiListSurveyQuestions({ templateId: templateId! }),
    enabled: isEdit,
    refetchOnMount: "always",
    staleTime: 0,
    gcTime: 0,
    select: (res): LocalQuestion[] => {
      const list = extractList<SurveyQuestion>(res, "items", "questions");

      return list
        .slice()
        .sort((a, b) => {
          const qa = a as SurveyQuestionRaw;
          const qb = b as SurveyQuestionRaw;

          return (
            (qa.sortOrder ?? qa.sort_order ?? 0) -
            (qb.sortOrder ?? qb.sort_order ?? 0)
          );
        })
        .map(mapApiQuestionToLocal);
    },
  });

  const initialValues = useMemo<TemplateFormValues>(() => {
    if (!isEdit || !templateRaw) {
      if (isManagerEvaluationPreset) {
        return {
          name:
            locationState.name ??
            t("survey.template.managerEvaluation.defaultName"),
          description:
            locationState.description ??
            t("survey.template.managerEvaluation.defaultDescription"),
          stage: "COMPLETED" as unknown as TemplateFormValues["stage"],
          targetRole: "MANAGER",
          status: "ACTIVE",
          isDefault: true,
        } as TemplateFormValues;
      }

      return {
        name: "",
        description: "",
        stage: undefined,
        targetRole: "EMPLOYEE",
        status: "DRAFT",
        isDefault: false,
      } as TemplateFormValues;
    }

    const template = templateRaw as TemplateRaw;
    const safeTargetRole = template.targetRole ?? template.target_role;

    return {
      name: template.name ?? "",
      description: template.description ?? "",
      stage: normalizeStage(template.stage) as
        | TemplateFormValues["stage"]
        | undefined,
      targetRole:
        safeTargetRole === "EMPLOYEE" || safeTargetRole === "MANAGER"
          ? safeTargetRole
          : "EMPLOYEE",
      status: template.status ?? "DRAFT",
      isDefault: Boolean(template.isDefault ?? template.is_default ?? false),
    };
  }, [
    isEdit,
    templateRaw,
    isManagerEvaluationPreset,
    locationState.name,
    locationState.description,
    t,
  ]);

  const inferredPreset = useMemo<TemplatePreset | undefined>(() => {
    if (isManagerEvaluationPreset) return "MANAGER_EVALUATION_COMPLETED";

    if (
      String(initialValues.stage ?? "").toUpperCase() === "COMPLETED" &&
      initialValues.targetRole === "MANAGER"
    ) {
      return "MANAGER_EVALUATION_COMPLETED";
    }

    return undefined;
  }, [
    isManagerEvaluationPreset,
    initialValues.stage,
    initialValues.targetRole,
  ]);

  const isLoading = isEdit && (isTemplateLoading || isQuestionsLoading);

  if (isEdit && (isTemplateError || isQuestionsError)) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {t("survey.template.editor.loadFailed")}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-10 text-sm text-slate-400">
        {t("survey.template.editor.loading")}
      </div>
    );
  }

  return (
    <SurveyTemplateEditorContent
      key={`${templateId ?? "new"}-${inferredPreset ?? "normal"}-${
        initialValues.isDefault ? "default" : "normal"
      }-${initialValues.stage ?? "none"}`}
      templateId={templateId}
      isEditMode={isEdit}
      preset={inferredPreset}
      initialValues={initialValues}
      initialQuestions={isEdit ? questionsMapped : []}
      onCancel={() => navigate("/surveys/templates")}
    />
  );
};

export default SurveyTemplateEditor;
