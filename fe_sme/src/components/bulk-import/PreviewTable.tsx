import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/i18n";
import type { ImportFieldConfig, MappedRow } from "./types";

interface Props {
  rows: MappedRow[];
  fields: ImportFieldConfig[];
}

const PAGE_SIZE = 20;

export const PreviewTable = ({ rows, fields }: Props) => {
  const { t } = useLocale();
  const [page, setPage] = useState(0);

  const totalErrors = useMemo(
    () => rows.filter((r) => Object.keys(r.errors).length > 0).length,
    [rows],
  );

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-4 rounded-lg bg-surface px-4 py-2.5 text-sm">
        <span className="text-ink font-medium">
          {t("bulk_import.preview.row_count", { count: rows.length })}
        </span>
        <span className="mx-auto" />
        {totalErrors > 0 ? (
          <span className="flex items-center gap-1 text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("bulk_import.preview.error_count", { count: totalErrors })}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("bulk_import.preview.no_errors")}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-stroke">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left">
              <th className="whitespace-nowrap px-3 py-2 font-medium text-muted">
                #
              </th>
              {fields.map((f) => (
                <th
                  key={f.key}
                  className="whitespace-nowrap px-3 py-2 font-medium text-muted">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-2 font-medium text-muted">
                {t("bulk_import.preview.status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const hasError = Object.keys(row.errors).length > 0;
              return (
                <tr
                  key={row.index}
                  className={`border-t border-stroke ${hasError ? "bg-red-50/40" : ""}`}>
                  <td className="px-3 py-2 text-muted">{row.index + 1}</td>
                  {fields.map((f) => {
                    const err = row.errors[f.key];
                    return (
                      <td
                        key={f.key}
                        className={`px-3 py-2 ${err ? "text-red-600" : "text-ink"}`}
                        title={err ?? undefined}>
                        <span className="block max-w-[200px] truncate">
                          {row.data[f.key] || (
                            <span className="text-muted/40">—</span>
                          )}
                        </span>
                        {err && (
                          <span className="block text-xs text-red-500">
                            {err}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">
                    {hasError ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded px-3 py-1 text-muted hover:bg-surface disabled:opacity-40">
            {t("bulk_import.preview.prev")}
          </button>
          <span className="text-muted">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded px-3 py-1 text-muted hover:bg-surface disabled:opacity-40">
            {t("bulk_import.preview.next")}
          </button>
        </div>
      )}
    </div>
  );
};
