import { memo } from "react";
import { useLocale } from "@/i18n";
import type { StatusFilter } from ".";

const STATUS_TAB_VALUES: StatusFilter[] = ["ACTIVE", "INACTIVE", ""];

const STATUS_TAB_KEYS = [
  "onboarding.template.filter.active",
  "onboarding.template.filter.inactive",
  "onboarding.template.filter.all",
] as const;

interface TemplateFiltersProps {
  statusFilter: StatusFilter;
  onChange: (value: StatusFilter) => void;
  count: number | undefined;
  isLoading: boolean;
}

export const TemplateFilters = memo(function TemplateFilters({
  statusFilter,
  onChange,
  count,
  isLoading,
}: TemplateFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="flex gap-0.5 rounded-xl bg-slate-100 p-1">
      {STATUS_TAB_VALUES.map((value, i) => (
        <button
          key={value || "all"}
          onClick={() => onChange(value)}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
            statusFilter === value
              ? "bg-white text-ink shadow-sm"
              : "text-muted hover:text-ink"
          }`}>
          {t(STATUS_TAB_KEYS[i])}
          {/* Use ternary to avoid rendering falsy number 0 — rendering-conditional-render */}
          {!isLoading && count !== undefined && statusFilter === value ? (
            <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
              {count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
});
