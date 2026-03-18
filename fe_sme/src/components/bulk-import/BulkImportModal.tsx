import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import BaseModal from "@core/components/Modal/BaseModal";
import { useLocale } from "@/i18n";
import type { ParsedFile } from "@/utils/csv-parser";
import { autoMapColumns } from "@/utils/csv-parser";
import { FileUploader } from "./FileUploader";
import { ColumnMapper } from "./ColumnMapper";
import { PreviewTable } from "./PreviewTable";
import type {
  BulkImportConfig,
  ImportStep,
  MappedRow,
  ImportRowResult,
} from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  config: BulkImportConfig;
  /** Called with validated rows. Return per-row results from the backend. */
  onSubmit: (rows: Record<string, string>[]) => Promise<ImportRowResult[]>;
}

export const BulkImportModal = ({ open, onClose, config, onSubmit }: Props) => {
  const { t } = useLocale();

  const [step, setStep] = useState<ImportStep>("upload");
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ImportRowResult[]>([]);

  /* ---------- Reset ---------- */
  const reset = useCallback(() => {
    setStep("upload");
    setParsed(null);
    setMapping({});
    setMappedRows([]);
    setSubmitting(false);
    setResults([]);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  /* ---------- Step 1: Upload ---------- */
  const handleParsed = useCallback(
    (result: ParsedFile) => {
      setParsed(result);
      const autoMap = autoMapColumns(
        result.headers,
        config.fields.map((f) => ({ key: f.key, label: f.label })),
      );
      setMapping(autoMap);
      setStep("map");
    },
    [config.fields],
  );

  /* ---------- Step 2 → 3: Map → Preview ---------- */
  const requiredMapped = useMemo(() => {
    return config.fields
      .filter((f) => f.required)
      .every((f) => !!mapping[f.key]);
  }, [config.fields, mapping]);

  const buildPreview = useCallback(() => {
    if (!parsed) return;
    const rows: MappedRow[] = parsed.rows.map((sourceRow, i) => {
      const data: Record<string, string> = {};
      const errors: Record<string, string> = {};

      for (const field of config.fields) {
        const sourceCol = mapping[field.key];
        const value = sourceCol ? (sourceRow[sourceCol] ?? "") : "";
        data[field.key] = value;

        if (field.required && !value) {
          errors[field.key] = t("bulk_import.validation.required");
        } else if (value && field.validate) {
          const err = field.validate(value);
          if (err) errors[field.key] = err;
        }
      }

      return { index: i, data, errors };
    });
    setMappedRows(rows);
    setStep("preview");
  }, [parsed, mapping, config.fields, t]);

  /* ---------- Step 3 → 4: Submit ---------- */
  const validRows = useMemo(
    () => mappedRows.filter((r) => Object.keys(r.errors).length === 0),
    [mappedRows],
  );

  const handleSubmit = useCallback(async () => {
    if (validRows.length === 0) return;
    setSubmitting(true);
    try {
      const payload = validRows.map((r) => r.data);
      const res = await onSubmit(payload);
      setResults(res);
      setStep("result");
    } catch (err) {
      setResults(
        validRows.map((r) => ({
          index: r.index,
          success: false,
          message: err instanceof Error ? err.message : String(err),
        })),
      );
      setStep("result");
    } finally {
      setSubmitting(false);
    }
  }, [validRows, onSubmit]);

  /* ---------- Download CSV template ---------- */
  const downloadTemplate = useCallback(() => {
    const headers = config.fields.map((f) => f.label).join(",");
    const blob = new Blob([headers + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = config.templateFileName ?? "import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [config.fields, config.templateFileName]);

  /* ---------- Result summary ---------- */
  const resultSummary = useMemo(() => {
    const success = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    return { success, failed };
  }, [results]);

  /* ---------- Step bar ---------- */
  const steps: { key: ImportStep; label: string }[] = [
    { key: "upload", label: t("bulk_import.step.upload") },
    { key: "map", label: t("bulk_import.step.map") },
    { key: "preview", label: t("bulk_import.step.preview") },
    { key: "result", label: t("bulk_import.step.result") },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  /* ---------- Footer buttons ---------- */
  const renderFooter = () => {
    const btnBase =
      "rounded-xl px-5 py-2.5 text-sm font-medium transition-colors";
    const btnPrimary = `${btnBase} bg-brand text-white hover:bg-brand/90 disabled:opacity-50`;
    const btnSecondary = `${btnBase} border border-stroke text-ink hover:bg-surface`;

    switch (step) {
      case "upload":
        return null; // FileUploader auto-advances
      case "map":
        return (
          <div className="flex gap-3">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setStep("upload")}>
              {t("bulk_import.btn.back")}
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={!requiredMapped}
              onClick={buildPreview}>
              {t("bulk_import.btn.preview")}
            </button>
          </div>
        );
      case "preview":
        return (
          <div className="flex gap-3">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setStep("map")}>
              {t("bulk_import.btn.back")}
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={validRows.length === 0 || submitting}
              onClick={handleSubmit}>
              {submitting
                ? t("bulk_import.btn.importing")
                : t("bulk_import.btn.import", { count: validRows.length })}
            </button>
          </div>
        );
      case "result":
        return (
          <button type="button" className={btnPrimary} onClick={handleClose}>
            {t("bulk_import.btn.done")}
          </button>
        );
    }
  };

  return (
    <BaseModal
      open={open}
      onCancel={handleClose}
      title={config.title}
      width={720}
      footer={renderFooter()}>
      <div className="space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  i <= stepIndex
                    ? "bg-brand text-white"
                    : "bg-stroke/40 text-muted"
                }`}>
                {i + 1}
              </div>
              <span
                className={`text-xs ${i === stepIndex ? "font-medium text-ink" : "text-muted"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className="mx-2 h-px w-8 bg-stroke" />
              )}
            </div>
          ))}
        </div>

        {/* Description */}
        {step === "upload" && config.description && (
          <p className="text-sm text-muted">{config.description}</p>
        )}

        {/* Download template link */}
        {step === "upload" && (
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-sm text-brand hover:underline">
            <Download className="h-3.5 w-3.5" />
            {t("bulk_import.upload.download_template")}
          </button>
        )}

        {/* Step content */}
        {step === "upload" && <FileUploader onParsed={handleParsed} />}

        {step === "map" && parsed && (
          <ColumnMapper
            sourceHeaders={parsed.headers}
            fields={config.fields}
            mapping={mapping}
            onMappingChange={setMapping}
          />
        )}

        {step === "preview" && (
          <PreviewTable rows={mappedRows} fields={config.fields} />
        )}

        {step === "result" && (
          <div className="space-y-4 text-center py-6">
            <div className="text-4xl">
              {resultSummary.failed === 0 ? "✅" : "⚠️"}
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-ink">
                {t("bulk_import.result.title")}
              </p>
              <p className="text-sm text-green-600">
                {t("bulk_import.result.success", {
                  count: resultSummary.success,
                })}
              </p>
              {resultSummary.failed > 0 && (
                <p className="text-sm text-red-600">
                  {t("bulk_import.result.failed", {
                    count: resultSummary.failed,
                  })}
                </p>
              )}
            </div>

            {/* Failed rows detail */}
            {resultSummary.failed > 0 && (
              <div className="mx-auto max-w-md overflow-hidden rounded-lg border border-red-200 text-left">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-red-50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-700">
                        {t("bulk_import.result.row")}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-700">
                        {t("bulk_import.result.error")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .filter((r) => !r.success)
                      .slice(0, 20)
                      .map((r) => (
                        <tr key={r.index} className="border-t border-red-100">
                          <td className="px-3 py-1.5 text-muted">
                            #{r.index + 1}
                          </td>
                          <td className="px-3 py-1.5 text-red-600">
                            {r.message}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};
