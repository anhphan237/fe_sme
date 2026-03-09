export const DEPARTMENT_TYPES = [
  { value: "IT", label: "IT" },
  { value: "HR", label: "HR" },
  { value: "FCT", label: "Finance" },
  { value: "OPS", label: "Operations" },
  { value: "SLS", label: "Sales" },
  { value: "MKT", label: "Marketing" },
  { value: "GEN", label: "General" },
  { value: "OTHER", label: "Other" },
] as const;

export const TYPE_STYLES: Record<string, string> = {
  IT: "bg-blue-50 text-blue-700",
  HR: "bg-purple-50 text-purple-700",
  FCT: "bg-emerald-50 text-emerald-700",
  OPS: "bg-amber-50 text-amber-700",
  SLS: "bg-rose-50 text-rose-700",
  MKT: "bg-pink-50 text-pink-700",
  GEN: "bg-slate-100 text-slate-600",
  OTHER: "bg-gray-100 text-gray-600",
};

export const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: "bg-indigo-50 text-indigo-700",
  HR: "bg-purple-50 text-purple-700",
  MANAGER: "bg-blue-50 text-blue-700",
  IT: "bg-cyan-50 text-cyan-700",
  EMPLOYEE: "bg-slate-100 text-slate-600",
  STAFF: "bg-slate-100 text-slate-600",
};

/** Maps a user/detail status string to a Badge variant prop */
export function statusVariant(
  status: string,
): "success" | "warning" | "danger" | "default" {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "success";
    case "INVITED":
      return "warning";
    case "INACTIVE":
    case "DISABLED":
      return "danger";
    default:
      return "default";
  }
}

export function getDeptTypeLabel(value: string | null): string {
  if (!value) return "Other";
  return DEPARTMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function getDeptTypeStyle(value: string | null): string {
  return TYPE_STYLES[value ?? "OTHER"] ?? TYPE_STYLES.OTHER;
}
