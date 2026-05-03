import type { OptionItem } from "../types/survey-template-editor.types";

type TranslateFn = (key: string) => string;

export const getStageOptions = (t: TranslateFn): OptionItem[] => [
  { value: "D7", label: t("survey.template.stage.day_7") || "Day 7" },
  { value: "D30", label: t("survey.template.stage.day_30") || "Day 30" },
  { value: "D60", label: t("survey.template.stage.day_60") || "Day 60" },
  { value: "CUSTOM", label: t("survey.template.stage.custom") || "Custom" },
];

export const getStatusOptions = (t: TranslateFn): OptionItem[] => [
  { value: "DRAFT", label: t("survey.template.status.draft") || "Draft" },
  { value: "ACTIVE", label: t("survey.template.status.active") || "Active" },
  {
    value: "ARCHIVED",
    label: t("survey.template.status.archived") || "Archived",
  },
];

export const getQuestionTypeOptions = (t: TranslateFn): OptionItem[] => [
  { value: "RATING", label: t("survey.question.type.rating") || "Rating" },
  { value: "TEXT", label: t("survey.question.type.text") || "Text" },
  {
    value: "SINGLE_CHOICE",
    label: t("survey.question.type.single_choice") || "Single choice",
  },
  {
    value: "MULTIPLE_CHOICE",
    label: t("survey.question.type.multiple_choice") || "Multiple choice",
  },
];

export const getDimensionOptions = (t: TranslateFn): OptionItem[] => [
  {
    value: "ONBOARDING_CLARITY",
    label: t("survey.dimension.onboarding_clarity") || "Onboarding clarity",
  },
  { value: "TRAINING", label: t("survey.dimension.training") || "Training" },
  {
    value: "MANAGER_SUPPORT",
    label: t("survey.dimension.manager_support") || "Manager support",
  },
  {
    value: "TEAM_SUPPORT",
    label: t("survey.dimension.team_support") || "Team support",
  },
  {
    value: "TOOLS_ACCESS",
    label: t("survey.dimension.tools_access") || "Tools access",
  },
  { value: "CULTURE", label: t("survey.dimension.culture") || "Culture" },
  { value: "GENERAL", label: t("survey.dimension.general") || "General" },
];

export const getManagerEvaluationDimensionOptions = (
  t: (key: string) => string,
) => [
  {
    value: "ROLE_FIT",
    label: t("survey.dimension.manager.roleFit"),
  },
  {
    value: "WORK_QUALITY",
    label: t("survey.dimension.manager.workQuality"),
  },
  {
    value: "LEARNING_ABILITY",
    label: t("survey.dimension.manager.learningAbility"),
  },
  {
    value: "PROACTIVENESS",
    label: t("survey.dimension.manager.proactiveness"),
  },
  {
    value: "TEAM_INTEGRATION",
    label: t("survey.dimension.manager.teamIntegration"),
  },
  {
    value: "ATTITUDE_CULTURE",
    label: t("survey.dimension.manager.attitudeCulture"),
  },
  {
    value: "RECOMMENDATION",
    label: t("survey.dimension.manager.recommendation"),
  },
  {
    value: "OVERALL_COMMENT",
    label: t("survey.dimension.manager.overallComment"),
  },
];