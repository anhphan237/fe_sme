import { useMemo } from "react";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { useLocale } from "@/i18n";
import type { ImportFieldConfig } from "./types";

interface Props {
  sourceHeaders: string[];
  fields: ImportFieldConfig[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

export const ColumnMapper = ({
  sourceHeaders,
  fields,
  mapping,
  onMappingChange,
}: Props) => {
  const { t } = useLocale();

  const usedSources = useMemo(() => new Set(Object.values(mapping)), [mapping]);

  const mappedCount = fields.filter((f) => mapping[f.key]).length;
  const requiredCount = fields.filter((f) => f.required).length;
  const requiredMapped = fields.filter(
    (f) => f.required && mapping[f.key],
  ).length;

  const handleChange = (fieldKey: string, sourceCol: string) => {
    const next = { ...mapping };
    if (sourceCol) {
      next[fieldKey] = sourceCol;
    } else {
      delete next[fieldKey];
    }
    onMappingChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 rounded-lg bg-surface px-4 py-2.5 text-sm">
        <span className="text-muted">
          {t("bulk_import.map.mapped_count", {
            count: mappedCount,
            total: fields.length,
          })}
        </span>
        <span className="mx-auto" />
        {requiredMapped < requiredCount && (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("bulk_import.map.required_missing", {
              count: requiredCount - requiredMapped,
            })}
          </span>
        )}
        {requiredMapped === requiredCount && (
          <span className="flex items-center gap-1 text-green-600">
            <Check className="h-3.5 w-3.5" />
            {t("bulk_import.map.all_required_mapped")}
          </span>
        )}
      </div>

      {/* Mapping rows */}
      <div className="space-y-2">
        {fields.map((field) => {
          const mapped = !!mapping[field.key];
          return (
            <div
              key={field.key}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                mapped
                  ? "border-green-200 bg-green-50/50"
                  : field.required
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-stroke"
              }`}>
              {/* Target field label */}
              <div className="flex min-w-[180px] items-center gap-2">
                <span className="text-sm font-medium text-ink">
                  {field.label}
                </span>
                {field.required && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-muted" />

              {/* Source column dropdown */}
              <select
                value={mapping[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="flex-1 rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                <option value="">{t("bulk_import.map.select_column")}</option>
                {sourceHeaders.map((h) => (
                  <option
                    key={h}
                    value={h}
                    disabled={usedSources.has(h) && mapping[field.key] !== h}>
                    {h}
                    {usedSources.has(h) && mapping[field.key] !== h
                      ? ` (${t("bulk_import.map.already_used")})`
                      : ""}
                  </option>
                ))}
              </select>

              {/* Status icon */}
              {mapped && <Check className="h-4 w-4 shrink-0 text-green-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
