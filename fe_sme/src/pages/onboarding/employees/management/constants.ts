export type StatusFilter = "" | "Active" | "Inactive" | "Invited";

export const STATUS_BADGE_VARIANT = {
  Active: "success",
  Inactive: "danger",
  Invited: "warning",
} as const satisfies Record<string, "success" | "danger" | "warning">;

export const inputCls =
  "rounded-xl border border-stroke bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";
