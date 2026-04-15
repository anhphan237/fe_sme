import * as XLSX from "xlsx";

export type ParsedExcelQuestion = {
  content: string;
  type: "RATING" | "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  required: boolean;
  sortOrder: number;
  dimensionCode: string;
  measurable: boolean;
  scaleMin?: number;
  scaleMax?: number;
  options?: string[];
};

export const normalizeQuestionType = (
  value?: unknown,
): ParsedExcelQuestion["type"] => {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();

  if (v === "RATING" || v === "ĐÁNH GIÁ") return "RATING";
  if (v === "TEXT" || v === "TỰ LUẬN") return "TEXT";
  if (v === "SINGLE_CHOICE" || v === "MỘT LỰA CHỌN") return "SINGLE_CHOICE";
  if (v === "MULTIPLE_CHOICE" || v === "NHIỀU LỰA CHỌN") {
    return "MULTIPLE_CHOICE";
  }

  return "TEXT";
};

export const isSupportedQuestionType = (value?: unknown) => {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();

  return (
    v === "RATING" ||
    v === "TEXT" ||
    v === "SINGLE_CHOICE" ||
    v === "MULTIPLE_CHOICE" ||
    v === "ĐÁNH GIÁ" ||
    v === "TỰ LUẬN" ||
    v === "MỘT LỰA CHỌN" ||
    v === "NHIỀU LỰA CHỌN"
  );
};

export const toBoolean = (value: unknown, defaultValue = false) => {
  if (typeof value === "boolean") return value;

  const v = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["true", "1", "yes", "y", "x"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;

  return defaultValue;
};

export const toNumber = (value: unknown, defaultValue?: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
};

export const parseOptions = (value: unknown) =>
  String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

export const isInstructionRow = (row: Record<string, unknown>) => {
  const content = String(row.Content ?? "")
    .trim()
    .toLowerCase();
  const type = String(row.Type ?? "")
    .trim()
    .toUpperCase();

  if (!content && !type) return true;

  if (content.includes("huong dan nhap file")) return true;
  if (content.includes("hướng dẫn nhập file")) return true;

  if (/^\d+\)/.test(content)) return true;

  if (
    content.includes("sheet dau tien") ||
    content.includes("sheet đầu tiên") ||
    content.includes("header dung thu tu") ||
    content.includes("header đúng thứ tự") ||
    content.includes("type hop le") ||
    content.includes("type hợp lệ") ||
    content.includes("rating bat buoc") ||
    content.includes("rating bắt buộc") ||
    content.includes("single_choice") ||
    content.includes("multiple_choice") ||
    content.includes("text de trong") ||
    content.includes("text để trống")
  ) {
    return true;
  }

  return false;
};

export const parseExcelQuestionsFromFile = async (
  file: File,
): Promise<ParsedExcelQuestion[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Excel file is empty");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error("Cannot read first worksheet");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  const parsed: ParsedExcelQuestion[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    const content = String(row.Content ?? "").trim();
    const rawType = String(row.Type ?? "").trim();

    if (!content && !rawType) {
      continue;
    }

    if (isInstructionRow(row)) {
      if (parsed.length > 0) break;
      continue;
    }

    if (!content) {
      if (parsed.length > 0) break;
      continue;
    }

    if (!rawType || !isSupportedQuestionType(rawType)) {
      if (parsed.length > 0) break;
      continue;
    }

    const type = normalizeQuestionType(rawType);

    parsed.push({
      content,
      type,
      required: toBoolean(row.Required, false),
      sortOrder: toNumber(row.SortOrder, parsed.length + 1) ?? parsed.length + 1,
      dimensionCode:
        String(row.DimensionCode ?? "GENERAL")
          .trim()
          .toUpperCase() || "GENERAL",
      measurable: toBoolean(row.Measurable, type === "RATING"),
      scaleMin: type === "RATING" ? toNumber(row.ScaleMin, 1) : undefined,
      scaleMax: type === "RATING" ? toNumber(row.ScaleMax, 5) : undefined,
      options:
        type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE"
          ? parseOptions(row.Options)
          : [],
    });
  }

  return parsed.filter((item) => item.content);
};