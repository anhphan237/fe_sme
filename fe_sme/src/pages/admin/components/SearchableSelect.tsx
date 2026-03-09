import { useState, useRef, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { clsx } from "clsx";
import { useLocale } from "@/i18n";

export interface SelectOption {
  id: string;
  label: string;
  subLabel?: string;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
}: SearchableSelectProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.id === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subLabel ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={open ? query : selected ? selected.label : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={
            placeholder ?? t("department.manager_search_placeholder")
          }
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          autoComplete="off"
        />
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {value && (
            <li
              role="option"
              className="cursor-pointer px-3 py-2 text-sm text-slate-400 hover:bg-slate-50"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange("");
                setQuery("");
                setOpen(false);
              }}>
              {t("department.clear_selection")}
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">
              {t("department.no_matches")}
            </li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt.id}
                role="option"
                className={clsx(
                  "cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50",
                  opt.id === value &&
                    "bg-indigo-50 font-medium text-indigo-700",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.id);
                  setQuery("");
                  setOpen(false);
                }}>
                <span className="font-medium">{opt.label}</span>
                {opt.subLabel && (
                  <span className="ml-1 text-slate-400">{opt.subLabel}</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
