import type { FC } from "react";

const DOT_FALLBACK = "bg-slate-400";
const PILL_FALLBACK = "bg-slate-100 text-slate-500";

const StatusTag: FC<{
  value: string;
  dotStyles: Record<string, string>;
  pillStyles: Record<string, string>;
  labels?: Record<string, string>;
  className?: string;
}> = ({ value, dotStyles, pillStyles, labels, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      pillStyles[value] ?? PILL_FALLBACK
    } ${className}`}>
    <span
      className={`h-1.5 w-1.5 rounded-full ${dotStyles[value] ?? DOT_FALLBACK}`}
    />
    {labels?.[value] ?? value.charAt(0) + value.slice(1).toLowerCase()}
  </span>
);

// ─── Template Status ──────────────────────────────────────────────────────────
const TEMPLATE_DOT: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  ARCHIVED: "bg-slate-400",
  DRAFT: "bg-amber-400",
};
const TEMPLATE_PILL: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  ARCHIVED: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
  DRAFT: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

export const TemplateStatusTag: FC<{ status: string; className?: string }> = (
  p,
) => (
  <StatusTag
    value={p.status}
    dotStyles={TEMPLATE_DOT}
    pillStyles={TEMPLATE_PILL}
    className={p.className}
  />
);

// ─── Stage Tag ────────────────────────────────────────────────────────────────
const STAGE_DOT: Record<string, string> = {
  DAY_7: "bg-blue-500",
  DAY_30: "bg-cyan-500",
  DAY_60: "bg-indigo-500",
  CUSTOM: "bg-violet-500",
};
const STAGE_PILL: Record<string, string> = {
  DAY_7: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  DAY_30: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
  DAY_60: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  CUSTOM: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
};

const STAGE_LABEL: Record<string, string> = {
  DAY_7: "Day 7",
  DAY_30: "Day 30",
  DAY_60: "Day 60",
  CUSTOM: "Custom",
};

export const StageTag: FC<{ stage: string; className?: string }> = (p) => (
  <StatusTag
    value={p.stage}
    dotStyles={STAGE_DOT}
    pillStyles={STAGE_PILL}
    labels={STAGE_LABEL}
    className={p.className}
  />
);

// ─── Instance Status ──────────────────────────────────────────────────────────
const INSTANCE_DOT: Record<string, string> = {
  PENDING: "bg-amber-400",
  SENT: "bg-blue-500",
  COMPLETED: "bg-emerald-500",
  EXPIRED: "bg-red-500",
};
const INSTANCE_PILL: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  SENT: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  COMPLETED:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  EXPIRED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

const INSTANCE_LABEL: Record<string, string> = {
  PENDING: "Pending",
  SENT: "Sent",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
};

export const InstanceStatusTag: FC<{ status: string; className?: string }> = (
  p,
) => (
  <StatusTag
    value={p.status}
    dotStyles={INSTANCE_DOT}
    pillStyles={INSTANCE_PILL}
    labels={INSTANCE_LABEL}
    className={p.className}
  />
);
