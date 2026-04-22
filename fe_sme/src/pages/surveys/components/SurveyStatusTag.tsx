import type { FC } from "react";
import { useLocale } from "@/i18n";

const DOT_FALLBACK = "bg-slate-400";
const PILL_FALLBACK = "bg-slate-100 text-slate-500";

const normalizeValue = (value?: string) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const StatusTag: FC<{
  value: string;
  dotStyles: Record<string, string>;
  pillStyles: Record<string, string>;
  labelKeys?: Record<string, string>;
  fallbackLabels?: Record<string, string>;
  className?: string;
}> = ({
  value,
  dotStyles,
  pillStyles,
  labelKeys,
  fallbackLabels,
  className = "",
}) => {
  const { t } = useLocale();
  const normalized = normalizeValue(value);

  const getLabel = () => {
    const key = labelKeys?.[normalized];

    if (key) {
      const translated = t(key);
      if (translated !== key) return translated;
    }

    return (
      fallbackLabels?.[normalized] ||
      normalized.charAt(0) + normalized.slice(1).toLowerCase()
    );
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        pillStyles[normalized] ?? PILL_FALLBACK
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dotStyles[normalized] ?? DOT_FALLBACK
        }`}
      />
      {getLabel()}
    </span>
  );
};

// ─── Template Status ──────────────────────────────────────────────────────────
const TEMPLATE_DOT: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  ARCHIVED: "bg-slate-400",
  DRAFT: "bg-amber-400",
  DISABLED: "bg-red-500",
};

const TEMPLATE_PILL: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  ARCHIVED: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
  DRAFT: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  DISABLED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

const TEMPLATE_LABEL_KEY: Record<string, string> = {
  ACTIVE: "survey.status.template.active",
  ARCHIVED: "survey.status.template.archived",
  DRAFT: "survey.status.template.draft",
  DISABLED: "survey.status.template.disabled",
};

const TEMPLATE_FALLBACK: Record<string, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
  DRAFT: "Draft",
  DISABLED: "Disabled",
};

export const TemplateStatusTag: FC<{ status: string; className?: string }> = (
  p,
) => (
  <StatusTag
    value={p.status}
    dotStyles={TEMPLATE_DOT}
    pillStyles={TEMPLATE_PILL}
    labelKeys={TEMPLATE_LABEL_KEY}
    fallbackLabels={TEMPLATE_FALLBACK}
    className={p.className}
  />
);

// ─── Stage Tag ────────────────────────────────────────────────────────────────
const STAGE_DOT: Record<string, string> = {
  D7: "bg-blue-500",
  D30: "bg-cyan-500",
  D60: "bg-indigo-500",
  CUSTOM: "bg-violet-500",
};

const STAGE_PILL: Record<string, string> = {
  D7: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  D30: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
  D60: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  CUSTOM: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
};

const STAGE_LABEL_KEY: Record<string, string> = {
  D7: "survey.stage.d7",
  D30: "survey.stage.d30",
  D60: "survey.stage.d60",
  CUSTOM: "survey.stage.custom",
};

const STAGE_FALLBACK: Record<string, string> = {
  D7: "Day 7",
  D30: "Day 30",
  D60: "Day 60",
  CUSTOM: "Custom",
};

const normalizeStage = (stage?: string) => {
  const value = normalizeValue(stage);

  if (value === "DAY_7" || value === "D7") return "D7";
  if (value === "DAY_30" || value === "D30") return "D30";
  if (value === "DAY_60" || value === "D60") return "D60";
  if (value === "CUSTOM") return "CUSTOM";

  return value;
};

export const StageTag: FC<{ stage: string; className?: string }> = (p) => {
  const normalizedStage = normalizeStage(p.stage);

  return (
    <StatusTag
      value={normalizedStage}
      dotStyles={STAGE_DOT}
      pillStyles={STAGE_PILL}
      labelKeys={STAGE_LABEL_KEY}
      fallbackLabels={STAGE_FALLBACK}
      className={p.className}
    />
  );
};

// ─── Instance Status ──────────────────────────────────────────────────────────
const INSTANCE_DOT: Record<string, string> = {
  SCHEDULED: "bg-slate-500",
  PENDING: "bg-amber-400",
  SENT: "bg-blue-500",
  COMPLETED: "bg-emerald-500",
  EXPIRED: "bg-red-500",
  CANCELLED: "bg-slate-500",
  CANCELED: "bg-slate-500",
};

const INSTANCE_PILL: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  SENT: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  COMPLETED:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  EXPIRED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
  CANCELED: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
};

const INSTANCE_LABEL_KEY: Record<string, string> = {
  SCHEDULED: "survey.status.instance.scheduled",
  PENDING: "survey.status.instance.pending",
  SENT: "survey.status.instance.sent",
  COMPLETED: "survey.status.instance.completed",
  EXPIRED: "survey.status.instance.expired",
  CANCELLED: "survey.status.instance.cancelled",
  CANCELED: "survey.status.instance.cancelled",
};

const INSTANCE_FALLBACK: Record<string, string> = {
  SCHEDULED: "Scheduled",
  PENDING: "Pending",
  SENT: "Sent",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  CANCELED: "Cancelled",
};

export const InstanceStatusTag: FC<{ status: string; className?: string }> = (
  p,
) => (
  <StatusTag
    value={p.status}
    dotStyles={INSTANCE_DOT}
    pillStyles={INSTANCE_PILL}
    labelKeys={INSTANCE_LABEL_KEY}
    fallbackLabels={INSTANCE_FALLBACK}
    className={p.className}
  />
);
