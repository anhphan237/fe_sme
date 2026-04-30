import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Select } from "antd";
import { apiListDepartments } from "@/api/company/company.api";
import { useLocale } from "@/i18n";
import type { DepartmentItem } from "@/interface/company";

interface DeptDepartmentSelectorProps {
  value: string | null;
  onChange: (departmentId: string | null) => void;
}

const extractDepartments = (res: unknown): DepartmentItem[] => {
  if (Array.isArray(res)) return res as DepartmentItem[];
  const r = res as Record<string, unknown>;
  const items = r?.items ?? r?.data ?? r?.content ?? [];
  return Array.isArray(items) ? (items as DepartmentItem[]) : [];
};

export function DeptDepartmentSelector({
  value,
  onChange,
}: DeptDepartmentSelectorProps) {
  const { t } = useLocale();

  const { data = [], isLoading } = useQuery({
    queryKey: ["departments-for-checkpoint-selector"],
    queryFn: () => apiListDepartments(),
    select: extractDepartments,
  });

  const options = data
    .filter((d) => Boolean(d.managerUserId))
    .map((d) => ({ label: d.name, value: d.departmentId }));

  return (
    <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium text-gray-700">
          {t("onboarding.approvals.dept.selector.label")}
        </span>
      </div>
      <p className="mb-2 text-xs text-gray-500">
        {t("onboarding.approvals.dept.selector.hint")}
      </p>
      <Select
        value={value ?? undefined}
        onChange={(v) => onChange(v ?? null)}
        options={options}
        loading={isLoading}
        placeholder={t("onboarding.approvals.dept.selector.placeholder")}
        className="w-full"
        allowClear
        showSearch
        filterOption={(input, opt) =>
          (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
    </div>
  );
}
