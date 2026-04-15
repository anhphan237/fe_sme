export const isInstructionRow = (row: Record<string, unknown>) => {
  const content = String(row.Content ?? "").toLowerCase();

  if (!content) return true;

  if (content.includes("huong dan")) return true;
  if (content.includes("hướng dẫn")) return true;
  if (/^\d+\)/.test(content)) return true;

  return false;
};

export const isValidQuestionRow = (row: Record<string, unknown>) => {
  return row.Content && row.Type;
};