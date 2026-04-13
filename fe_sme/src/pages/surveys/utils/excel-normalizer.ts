export const normalizeQuestionType = (value?: unknown) => {
  const v = String(value ?? "").toUpperCase();

  if (v === "RATING") return "RATING";
  if (v === "TEXT") return "TEXT";
  if (v === "SINGLE_CHOICE") return "SINGLE_CHOICE";
  if (v === "MULTIPLE_CHOICE") return "MULTIPLE_CHOICE";

  return "TEXT";
};

export const parseOptions = (value: unknown) =>
  String(value ?? "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);

export const toBoolean = (value: unknown, def = false) => {
  const v = String(value ?? "").toLowerCase();
  if (["true", "1", "yes"].includes(v)) return true;
  if (["false", "0", "no"].includes(v)) return false;
  return def;
};

export const toNumber = (value: unknown, def?: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : def;
};