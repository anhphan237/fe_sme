// ?? Shared draft types ????????????????????????????????????????????????????????
export interface TaskDraft {
  id: string;
  /** BE taskTemplateId ??null/undefined for newly added tasks (BE will create) */
  taskTemplateId?: string;
  name: string;
  description: string;
  dueDaysOffset: number;
  requireAck: boolean;
  requireDoc: boolean;
  requiresManagerApproval: boolean;
  /** Designated approver user ID ??overrides default manager when requiresManagerApproval=true */
  approverUserId?: string;
  /** Display name for approverUserId ??FE-only, not sent to BE */
  approverUserName?: string;
  /** Document IDs required for this task (fetched from com.sme.content.document.list) */
  requiredDocumentIds?: string[];
  /** Document display names ??FE-only, not sent to BE */
  requiredDocumentNames?: string[];
  assignee: "HR" | "MANAGER" | "EMPLOYEE" | "IT" | "DEPARTMENT";
  /** When assignee=DEPARTMENT: holds the department ID (sent as ownerRefId). FE-only display. */
  ownerRefId?: string | null;
  /** Display name of the owner department ??FE-only, not sent to BE */
  ownerRefName?: string;
  /** Departments that must confirm this task before completion (become TaskTemplateDepartmentCheckpointEntity rows on BE) */
  responsibleDepartmentIds?: string[];
  /** Display names for responsibleDepartmentIds ??FE-only, not sent to BE */
  responsibleDepartmentNames?: string[];
}

export interface ChecklistDraft {
  id: string;
  /** BE checklistTemplateId ??null/undefined for newly added checklists (BE will create) */
  checklistTemplateId?: string;
  name: string;
  stageType: string;
  /** Deadline in days from onboarding start date */
  deadlineDays?: number;
  tasks: TaskDraft[];
}

// ?? Event draft (s沼?ki沼뇆 chung) ???????????????????????????????????????????????
export interface EventDraft {
  id: string;
  /** Populated after the event template is created on BE */
  eventTemplateId?: string;
  name: string;
  /** Agenda / content of the event */
  content: string;
  description?: string;
  /** Day offset from onboarding start date (0 = first day) */
  dueDaysOffset: number;
  /** Duration in hours */
  durationHours?: number;
}

export interface EditorForm {
  name: string;
  description: string;
  checklists: ChecklistDraft[];
  /** Common events applied to all employees in this onboarding template */
  events: EventDraft[];
}

// ?? Stage options ??????????????????????????????????????????????????????????????
export const STAGE_OPTIONS = [
  { value: "PRE_BOARDING", label: "onboarding.template.stage.pre_boarding" },
  { value: "DAY_1", label: "onboarding.template.stage.day_1" },
  { value: "DAY_7", label: "onboarding.template.stage.day_7" },
  { value: "DAY_30", label: "onboarding.template.stage.day_30" },
  { value: "DAY_60", label: "onboarding.template.stage.day_60" },
  { value: "CUSTOM", label: "onboarding.template.stage.custom" },
] as const;

export type StageType = (typeof STAGE_OPTIONS)[number]["value"];

export const STAGE_COLORS: Record<string, string> = {
  PRE_BOARDING: "bg-indigo-50 text-indigo-700 border-indigo-100",
  DAY_1: "bg-sky-50 text-sky-700 border-sky-100",
  DAY_7: "bg-teal-50 text-teal-700 border-teal-100",
  DAY_30: "bg-emerald-50 text-emerald-700 border-emerald-100",
  DAY_60: "bg-amber-50 text-amber-700 border-amber-100",
  CUSTOM: "bg-slate-50 text-slate-600 border-slate-200",
};

// ?? Stage metadata (phase + day range + theme) ????????????????????????????????
/**
 * Rich metadata used by the stage picker, sidebar, task panel banner and
 * template view modal. Keep `value` aligned with STAGE_OPTIONS so the stored
 * stage string remains compatible with BE.
 */
export interface StageMeta {
  value: StageType;
  order: number;
  /** Short uppercase phase code rendered in compact chips (PRE / D1 / WK1 ??. */
  code: string;
  /** i18n key for the stage short name (also used in Select label). */
  labelKey: string;
  /** i18n key for the onboarding phase (Preparation / Orientation / ??. */
  phaseKey: string;
  /** i18n key for the 1-line description shown in the picker / banner. */
  descKey: string;
  /** i18n key for the day-range chip (e.g. "D-14 ??D-1", "D+0"). */
  dayRangeKey: string;
  /** Suggested default stage name (i18n key) when user picks this stage. */
  defaultNameKey: string;
  /** Suggested dueDaysOffset for tasks created inside this stage. */
  defaultDueOffset: number;
  /** Single color token for the stage (used to derive bg / border / text). */
  accent: "indigo" | "sky" | "teal" | "emerald" | "amber" | "slate";
}

export const STAGE_META: Record<StageType, StageMeta> = {
  PRE_BOARDING: {
    value: "PRE_BOARDING",
    order: 0,
    code: "PRE",
    labelKey: "onboarding.template.stage.pre_boarding",
    phaseKey: "onboarding.template.stage.phase.preparation",
    descKey: "onboarding.template.stage.desc.pre_boarding",
    dayRangeKey: "onboarding.template.stage.range.pre_boarding",
    defaultNameKey: "onboarding.template.stage.default_name.pre_boarding",
    defaultDueOffset: 0,
    accent: "indigo",
  },
  DAY_1: {
    value: "DAY_1",
    order: 1,
    code: "D1",
    labelKey: "onboarding.template.stage.day_1",
    phaseKey: "onboarding.template.stage.phase.orientation",
    descKey: "onboarding.template.stage.desc.day_1",
    dayRangeKey: "onboarding.template.stage.range.day_1",
    defaultNameKey: "onboarding.template.stage.default_name.day_1",
    defaultDueOffset: 1,
    accent: "sky",
  },
  DAY_7: {
    value: "DAY_7",
    order: 2,
    code: "WK1",
    labelKey: "onboarding.template.stage.day_7",
    phaseKey: "onboarding.template.stage.phase.immersion",
    descKey: "onboarding.template.stage.desc.day_7",
    dayRangeKey: "onboarding.template.stage.range.day_7",
    defaultNameKey: "onboarding.template.stage.default_name.day_7",
    defaultDueOffset: 7,
    accent: "teal",
  },
  DAY_30: {
    value: "DAY_30",
    order: 3,
    code: "MO1",
    labelKey: "onboarding.template.stage.day_30",
    phaseKey: "onboarding.template.stage.phase.ramp_up",
    descKey: "onboarding.template.stage.desc.day_30",
    dayRangeKey: "onboarding.template.stage.range.day_30",
    defaultNameKey: "onboarding.template.stage.default_name.day_30",
    defaultDueOffset: 30,
    accent: "emerald",
  },
  DAY_60: {
    value: "DAY_60",
    order: 4,
    code: "MO2",
    labelKey: "onboarding.template.stage.day_60",
    phaseKey: "onboarding.template.stage.phase.evaluation",
    descKey: "onboarding.template.stage.desc.day_60",
    dayRangeKey: "onboarding.template.stage.range.day_60",
    defaultNameKey: "onboarding.template.stage.default_name.day_60",
    defaultDueOffset: 60,
    accent: "amber",
  },
  CUSTOM: {
    value: "CUSTOM",
    order: 5,
    code: "CUS",
    labelKey: "onboarding.template.stage.custom",
    phaseKey: "onboarding.template.stage.phase.custom",
    descKey: "onboarding.template.stage.desc.custom",
    dayRangeKey: "onboarding.template.stage.range.custom",
    defaultNameKey: "onboarding.template.stage.default_name.custom",
    defaultDueOffset: 0,
    accent: "slate",
  },
};

export const STAGE_META_ORDERED: StageMeta[] = Object.values(STAGE_META).sort(
  (a, b) => a.order - b.order,
);

/** Tailwind tokens derived from the accent color, used by all stage consumers. */
export const STAGE_ACCENTS: Record<
  StageMeta["accent"],
  {
    /** Pill / chip background + text + border (kept muted, HRM-style) */
    chip: string;
    /** Soft tinted background for banner / card */
    soft: string;
    /** Solid dot used for timeline rail / side-strip */
    dot: string;
    /** Subtle border */
    border: string;
    /** Foreground text tone */
    text: string;
  }
> = {
  indigo: {
    chip: "bg-indigo-50 text-indigo-700 border-indigo-100",
    soft: "bg-indigo-50/50",
    dot: "bg-indigo-500",
    border: "border-indigo-100",
    text: "text-indigo-700",
  },
  sky: {
    chip: "bg-sky-50 text-sky-700 border-sky-100",
    soft: "bg-sky-50/50",
    dot: "bg-sky-500",
    border: "border-sky-100",
    text: "text-sky-700",
  },
  teal: {
    chip: "bg-teal-50 text-teal-700 border-teal-100",
    soft: "bg-teal-50/50",
    dot: "bg-teal-500",
    border: "border-teal-100",
    text: "text-teal-700",
  },
  emerald: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
    soft: "bg-emerald-50/50",
    dot: "bg-emerald-500",
    border: "border-emerald-100",
    text: "text-emerald-700",
  },
  amber: {
    chip: "bg-amber-50 text-amber-700 border-amber-100",
    soft: "bg-amber-50/50",
    dot: "bg-amber-500",
    border: "border-amber-100",
    text: "text-amber-700",
  },
  slate: {
    chip: "bg-slate-50 text-slate-600 border-slate-200",
    soft: "bg-slate-50/60",
    dot: "bg-slate-400",
    border: "border-slate-200",
    text: "text-slate-600",
  },
};

export const getStageMeta = (stage: string | undefined): StageMeta =>
  STAGE_META[(stage as StageType) ?? "CUSTOM"] ?? STAGE_META.CUSTOM;
