import { useLocale } from "@/i18n";

export type StatusFilter = "ACTIVE" | "COMPLETED" | "CANCELLED";

const FILTER_OPTIONS: { value: StatusFilter; key: string }[] = [
  { value: "ACTIVE", key: "onboarding.employee.filter.active" },
  { value: "COMPLETED", key: "onboarding.employee.filter.completed" },
  { value: "CANCELLED", key: "onboarding.employee.filter.paused" },
];

interface FilterTabsProps {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}

export const FilterTabs = ({ value, onChange }: FilterTabsProps) => {
  const { t } = useLocale();

  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-white text-ink shadow-sm"
              : "text-muted hover:text-ink"
          }`}>
          {t(opt.key)}
        </button>
      ))}
    </div>
  );
};
