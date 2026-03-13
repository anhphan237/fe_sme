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

export const getDeptTypeLabel = (value: string | null): string => {
  if (!value) return "Other";
  return DEPARTMENT_TYPES.find((t) => t.value === value)?.label ?? value;
};

export const getDeptTypeStyle = (value: string | null): string => {
  return TYPE_STYLES[value ?? "OTHER"] ?? TYPE_STYLES.OTHER;
};
