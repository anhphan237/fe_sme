export const STAGE_OPTIONS = [
  { value: "PRE_BOARDING", label: "onboarding.template.stage.pre_boarding" },
  { value: "DAY_1", label: "onboarding.template.stage.day_1" },
  { value: "DAY_7", label: "onboarding.template.stage.day_7" },
  { value: "DAY_30", label: "onboarding.template.stage.day_30" },
  { value: "DAY_60", label: "onboarding.template.stage.day_60" },
] as const;

export const WIZARD_STEP_COUNT = 4;

export const VALID_STAGE_TYPES = [
  "PRE_BOARDING",
  "DAY_1",
  "DAY_7",
  "DAY_30",
  "DAY_60",
] as const;

export type ValidStageType = (typeof VALID_STAGE_TYPES)[number];

export const inputCls =
  "w-full rounded-xl border border-stroke bg-white px-3.5 py-2.5 text-sm text-ink transition placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

export const labelCls =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted";
