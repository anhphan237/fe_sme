/** Configuration for a single target field in the import */
export interface ImportFieldConfig {
  /** Internal key used in the mapped data */
  key: string;
  /** Display label shown in the mapper and preview */
  label: string;
  /** Whether the field must have a non-empty value */
  required?: boolean;
  /** Optional per-cell validator. Return an error string, or null if valid */
  validate?: (value: string) => string | null;
}

/** The overall config passed to BulkImportModal */
export interface BulkImportConfig {
  /** Modal title */
  title: string;
  /** Short description shown below the title */
  description?: string;
  /** Target fields the imported file should map to */
  fields: ImportFieldConfig[];
  /** Name suggestion for the downloadable CSV template */
  templateFileName?: string;
}

/** A single validated row ready for submission */
export interface MappedRow {
  /** 0-based index from the source file */
  index: number;
  data: Record<string, string>;
  errors: Record<string, string>;
}

/** Result of a single row from the backend after submission */
export interface ImportRowResult {
  index: number;
  success: boolean;
  message?: string;
}

export type ImportStep = "upload" | "map" | "preview" | "result";
