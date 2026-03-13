import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { useLocale } from "@/i18n";
import type { ParsedFile } from "@/utils/csv-parser";
import { parseFile } from "@/utils/csv-parser";

interface Props {
  onParsed: (result: ParsedFile) => void;
}

const ACCEPT = ".csv,.xlsx,.xls";

export const FileUploader = ({ onParsed }: Props) => {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const handleFile = useCallback(
    async (f: File) => {
      setError(null);
      setFile(f);
      setParsing(true);
      try {
        const result = await parseFile(f);
        if (result.rows.length === 0) {
          setError(t("bulk_import.upload.empty_file"));
          setParsing(false);
          return;
        }
        onParsed(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setParsing(false);
      }
    },
    [onParsed, t],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      e.target.value = "";
    },
    [handleFile],
  );

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer ${
          dragOver
            ? "border-brand bg-brand/5"
            : "border-stroke hover:border-brand/40"
        }`}>
        <Upload className="h-8 w-8 text-muted" />
        <p className="text-sm text-muted">
          {t("bulk_import.upload.drop_hint")}
        </p>
        <p className="text-xs text-muted/60">CSV, XLSX, XLS</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* Selected file info */}
      {file && (
        <div className="flex items-center gap-3 rounded-lg border border-stroke bg-surface px-4 py-3">
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="text-xs text-muted">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {parsing && (
            <span className="text-xs text-muted animate-pulse">
              {t("bulk_import.upload.parsing")}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeFile();
            }}
            className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
