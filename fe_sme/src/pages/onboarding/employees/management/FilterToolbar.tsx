import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n";
import { inputCls, type StatusFilter } from "../constants";
import type { DepartmentItem } from "@/interface/company";

interface Props {
  searchText: string;
  onSearchChange: (value: string) => void;
  filterStatus: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  filterDept: string;
  onDeptChange: (value: string) => void;
  departments?: DepartmentItem[];
  hasActiveFilter: boolean;
  onReset: () => void;
}

export function FilterToolbar({
  searchText,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterDept,
  onDeptChange,
  departments,
  hasActiveFilter,
  onReset,
}: Props) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-stroke px-4 py-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          className={`${inputCls} w-full pl-9`}
          placeholder={t("onboarding.employee.filter.search_placeholder")}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        className={inputCls}
        value={filterStatus}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}>
        <option value="">{t("onboarding.employee.filter.all_status")}</option>
        <option value="Active">{t("global.active")}</option>
        <option value="Inactive">{t("global.inactive")}</option>
        <option value="Invited">
          {t("onboarding.employee.filter.invited")}
        </option>
      </select>

      <select
        className={inputCls}
        value={filterDept}
        onChange={(e) => onDeptChange(e.target.value)}>
        <option value="">{t("onboarding.employee.filter.all_dept")}</option>
        {departments?.map((d) => (
          <option key={d.departmentId} value={d.name}>
            {d.name}
          </option>
        ))}
      </select>

      {hasActiveFilter && (
        <Button
          variant="ghost"
          className="text-sm font-medium text-brand hover:underline"
          onClick={onReset}>
          {t("global.reset")}
        </Button>
      )}
    </div>
  );
}
