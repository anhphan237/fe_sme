export const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "HR", label: "HR" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
  { value: "IT", label: "IT" },
];

export const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: "bg-indigo-50 text-indigo-700",
  HR: "bg-purple-50 text-purple-700",
  MANAGER: "bg-blue-50 text-blue-700",
  IT: "bg-cyan-50 text-cyan-700",
  EMPLOYEE: "bg-slate-100 text-slate-600",
  STAFF: "bg-slate-100 text-slate-600",
};

export const statusVariant = (
  status: string,
): "success" | "warning" | "danger" | "default" => {
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
};
