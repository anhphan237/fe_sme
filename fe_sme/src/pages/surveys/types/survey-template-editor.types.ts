import type { SurveyQuestion } from "@/interface/survey";

export type QuestionType =
  | "RATING"
  | "TEXT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE";

export type LocalQuestion = {
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

export type TemplateFormValues = {
  name: string;
  description?: string;
  stage?: string;
  managerOnly?: boolean;
  status: string;
  isDefault?: boolean;
};

export type SurveyQuestionRaw = SurveyQuestion & {
  optionsJson?: unknown;
  options_json?: unknown;
  options?: unknown;
  valueOptions?: unknown;
  content?: string;
  text?: string;
  sortOrder?: number;
  sort_order?: number;
  dimensionCode?: string;
  dimension_code?: string;
  measurable?: boolean;
  scaleMin?: number;
  scale_min?: number;
  scaleMax?: number;
  scale_max?: number;
};

export type TemplateRaw = {
  name?: string;
  description?: string;
  stage?: string;
  managerOnly?: boolean;
  manager_only?: boolean;
  status?: string;
  isDefault?: boolean;
  is_default?: boolean;
};

export type OptionItem = {
  value: string;
  label: string;
};