import { readExcelRows } from "../utils/excel-parser";
import { isInstructionRow, isValidQuestionRow } from "../utils/excel-validator";
import {
  normalizeQuestionType,
  parseOptions,
  toBoolean,
  toNumber,
} from "../utils/excel-normalizer";

export const useExcelImport = () => {
  const parseExcelQuestions = async (file: File) => {
    const rows = await readExcelRows(file);

    const result = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (isInstructionRow(row)) {
        if (result.length > 0) break;
        continue;
      }

      if (!isValidQuestionRow(row)) {
        if (result.length > 0) break;
        continue;
      }

      const type = normalizeQuestionType(row.Type);

      result.push({
        content: String(row.Content).trim(),
        type,
        required: toBoolean(row.Required),
        sortOrder: toNumber(row.SortOrder, i + 1),
        dimensionCode: String(row.DimensionCode || "GENERAL"),
        measurable: toBoolean(row.Measurable, type === "RATING"),
        scaleMin: type === "RATING" ? toNumber(row.ScaleMin, 1) : undefined,
        scaleMax: type === "RATING" ? toNumber(row.ScaleMax, 5) : undefined,
        options:
          type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE"
            ? parseOptions(row.Options)
            : [],
      });
    }

    return result;
  };

  return { parseExcelQuestions };
};