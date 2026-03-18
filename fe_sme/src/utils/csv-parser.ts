import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
}

const MAX_ROWS = 5000;

function normalizeRows(
  raw: Record<string, unknown>[],
  headers: string[],
): Record<string, string>[] {
  return raw.slice(0, MAX_ROWS).map((row) => {
    const normalized: Record<string, string> = {};
    for (const h of headers) {
      const val = row[h];
      normalized[h] = val == null ? "" : String(val).trim();
    }
    return normalized;
  });
}

export function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        if (!headers.length) {
          reject(new Error("CSV file has no headers"));
          return;
        }
        resolve({
          headers,
          rows: normalizeRows(results.data, headers),
          fileName: file.name,
        });
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}

export function parseExcel(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        if (!sheet) {
          reject(new Error("Excel file has no sheets"));
          return;
        }
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
        });
        const headers = Object.keys(json[0] ?? {});
        if (!headers.length) {
          reject(new Error("Excel file has no headers"));
          return;
        }
        resolve({
          headers,
          rows: normalizeRows(json, headers),
          fileName: file.name,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCSV(file);
  if (ext === "xlsx" || ext === "xls") return parseExcel(file);
  throw new Error(`Unsupported file type: .${ext}`);
}

/** Best-effort auto-map source headers to target field keys */
export function autoMapColumns(
  sourceHeaders: string[],
  targetKeys: { key: string; label: string }[],
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const target of targetKeys) {
    const keyLower = target.key.toLowerCase().replace(/[_\s-]/g, "");
    const labelLower = target.label.toLowerCase().replace(/[_\s-]/g, "");

    const match = sourceHeaders.find((h) => {
      const hLower = h.toLowerCase().replace(/[_\s-]/g, "");
      return (
        hLower === keyLower ||
        hLower === labelLower ||
        hLower.includes(keyLower) ||
        keyLower.includes(hLower)
      );
    });

    if (match) mapping[target.key] = match;
  }

  return mapping;
}
