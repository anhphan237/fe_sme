import { STAGE_TAG_COLOR } from "./constants";

export const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStageLabel = (
  name: string,
  t: (key: string) => string,
): { label: string; color: string } => {
  const upper = name.toUpperCase().replace(/\s+/g, "_");
  const label = t(`onboarding.task.stage.${upper}`);
  const validLabel = label.startsWith("onboarding.task.stage.") ? name : label;
  return { label: validLabel, color: STAGE_TAG_COLOR[upper] ?? "default" };
};

export const isTaskOverdue = (dueDate?: string | null): boolean => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};
