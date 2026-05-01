import type {
  CreatePlatformTemplateRequest,
  PlatformTemplateDetailResponse,
  PlatformTemplateListItem,
  ListPlatformTemplateResponse,
  PlatformTemplateStage,
  PlatformTemplateItemStatus,
  PlatformTemplateStatus,
} from "@/interface/admin";
import type { PlatformTemplateFormValue } from "@/shared/types";

type RawRecord = Record<string, unknown>;

const parseDocumentIds = (text?: string, ids?: string[]) => {
  if (ids?.length) return ids;

  if (!text?.trim()) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const asRecord = (value: unknown): RawRecord =>
  value !== null && typeof value === "object" ? (value as RawRecord) : {};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const firstString = (
  source: RawRecord,
  keys: readonly string[],
): string | undefined => {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value !== undefined) return value;
  }
  return undefined;
};

const firstNumber = (
  source: RawRecord,
  keys: readonly string[],
): number | undefined => {
  for (const key of keys) {
    const value = asNumber(source[key]);
    if (value !== undefined) return value;
  }
  return undefined;
};

const toStatus = (value: unknown): PlatformTemplateStatus => {
  const normalized = String(value || "DRAFT").toUpperCase();
  if (
    normalized === "ACTIVE" ||
    normalized === "INACTIVE" ||
    normalized === "ARCHIVED"
  ) {
    return normalized;
  }
  return "DRAFT";
};

const stringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const sortBySortOrder = <T extends { sortOrder?: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));

export const mapPlatformTemplateListItem = (
  value: unknown,
): PlatformTemplateListItem => {
  const source = asRecord(value);

  return {
    templateId: firstString(source, ["templateId", "id"]) ?? "",
    name: asString(source.name) ?? "",
    description: asString(source.description) ?? "",
    status: toStatus(source.status),
    templateKind: asString(source.templateKind) ?? "ONBOARDING",
    departmentTypeCode: asString(source.departmentTypeCode),
    level: "PLATFORM",
    checklistCount: firstNumber(source, ["checklistCount", "checklist_count"]) ?? 0,
    taskCount: firstNumber(source, ["taskCount", "task_count"]) ?? 0,
    usedByCompanyCount:
      firstNumber(source, [
        "usedByCompanyCount",
        "usedByCount",
        "used_by_company_count",
      ]) ?? 0,
    createdAt: firstString(source, ["createdAt", "created_at"]),
    updatedAt: firstString(source, ["updatedAt", "updated_at"]),
  };
};

export const mapPlatformTemplateListResponse = (
  value: unknown,
): ListPlatformTemplateResponse => {
  const source = asRecord(value);
  const items = asArray(source.items).map(mapPlatformTemplateListItem);

  return {
    items,
    total: asNumber(source.total) ?? items.length,
    page: asNumber(source.page),
    size: asNumber(source.size),
  };
};

export const mapPlatformTemplateDetailResponse = (
  value: unknown,
): PlatformTemplateDetailResponse => {
  const source = asRecord(value);
  const rawChecklists = asArray(source.checklists);
  const checklists = sortBySortOrder(
    rawChecklists.map((checklistValue, checklistIndex) => {
      const checklist = asRecord(checklistValue);
      const tasks = sortBySortOrder(
        asArray(checklist.tasks).map((taskValue, taskIndex) => {
          const task = asRecord(taskValue);

          return {
            checklistTemplateId: asString(task.checklistTemplateId),
            taskTemplateId:
              firstString(task, ["taskTemplateId", "id"]) ??
              `task-${checklistIndex}-${taskIndex}`,
            title: asString(task.title) ?? "",
            description: asString(task.description) ?? "",
            ownerType: asString(task.ownerType) ?? "EMPLOYEE",
            ownerRefId: asString(task.ownerRefId) ?? null,
            dueDaysOffset:
              firstNumber(task, ["dueDaysOffset", "due_days_offset"]) ?? 0,
            requireAck: asBoolean(task.requireAck) ?? false,
            requireDoc: asBoolean(task.requireDoc) ?? false,
            requiredDocumentIds: stringArray(task.requiredDocumentIds),
            requiresManagerApproval:
              asBoolean(task.requiresManagerApproval) ?? false,
            approverUserId: asString(task.approverUserId) ?? null,
            sortOrder: firstNumber(task, ["sortOrder", "sort_order"]) ?? taskIndex,
            status: asString(task.status) ?? "ACTIVE",
          };
        }),
      );

      return {
        checklistTemplateId:
          firstString(checklist, ["checklistTemplateId", "id"]) ??
          `checklist-${checklistIndex}`,
        name: asString(checklist.name) ?? "",
        stage: asString(checklist.stage) ?? "CUSTOM",
        deadlineDays:
          firstNumber(checklist, ["deadlineDays", "deadline_days"]) ?? 0,
        sortOrder:
          firstNumber(checklist, ["sortOrder", "sort_order"]) ?? checklistIndex,
        status: asString(checklist.status) ?? "ACTIVE",
        createdAt: firstString(checklist, ["createdAt", "created_at"]),
        updatedAt: firstString(checklist, ["updatedAt", "updated_at"]),
        tasks,
      };
    }),
  );

  return {
    templateId: firstString(source, ["templateId", "id"]) ?? "",
    name: asString(source.name) ?? "",
    description: asString(source.description) ?? "",
    status: toStatus(source.status),
    templateKind: asString(source.templateKind) ?? "ONBOARDING",
    departmentTypeCode: asString(source.departmentTypeCode),
    level: "PLATFORM",
    createdBy: asString(source.createdBy),
    createdAt: firstString(source, ["createdAt", "created_at"]),
    updatedAt: firstString(source, ["updatedAt", "updated_at"]),
    checklistCount:
      firstNumber(source, ["checklistCount", "checklist_count"]) ??
      checklists.length,
    taskCount:
      firstNumber(source, ["taskCount", "task_count"]) ??
      checklists.reduce((total, checklist) => total + checklist.tasks.length, 0),
    usedByCompanyCount:
      firstNumber(source, [
        "usedByCompanyCount",
        "usedByCount",
        "used_by_company_count",
      ]) ?? 0,
    checklists,
  };
};

export const buildCreatePlatformTemplatePayload = (
  values: PlatformTemplateFormValue,
): CreatePlatformTemplateRequest => ({
  name: values.name?.trim(),
  description: values.description?.trim() || undefined,
  status: values.status || "DRAFT",
  createdBy: "ADMIN_PLATFORM",
  templateKind: "ONBOARDING",
  departmentTypeCode: values.departmentTypeCode?.trim() || undefined,
  checklists: (values.checklists || []).map((checklist, checklistIndex) => ({
    name: checklist.name?.trim(),
    stage: checklist.stage,
    deadlineDays: Number(checklist.deadlineDays || 0),
    sortOrder:
      checklist.sortOrder === undefined || checklist.sortOrder === null
        ? checklistIndex
        : Number(checklist.sortOrder),
    status: checklist.status || "ACTIVE",
    tasks: (checklist.tasks || []).map((task, taskIndex) => ({
      title: task.title?.trim(),
      description: task.description?.trim() || undefined,
      ownerType: task.ownerType || "EMPLOYEE",
      ownerRefId: task.ownerRefId || null,
      dueDaysOffset:
        task.dueDaysOffset === undefined || task.dueDaysOffset === null
          ? checklist.deadlineDays ?? 0
          : Number(task.dueDaysOffset),
      requireAck: Boolean(task.requireAck),
      requireDoc: Boolean(task.requireDoc),
      requiredDocumentIds: parseDocumentIds(
        task.requiredDocumentIdsText,
        task.requiredDocumentIds,
      ),
      requiresManagerApproval: Boolean(task.requiresManagerApproval),
      approverUserId: task.approverUserId || null,
      sortOrder:
        task.sortOrder === undefined || task.sortOrder === null
          ? taskIndex
          : Number(task.sortOrder),
      status: task.status || "ACTIVE",
    })),
  })),
});

export const mapTemplateDetailToFormValue = (
  detail: PlatformTemplateDetailResponse,
): PlatformTemplateFormValue => ({
  name: detail.name || "",
  description: detail.description || "",
  status: (detail.status || "DRAFT") as PlatformTemplateFormValue["status"],
  templateKind: "ONBOARDING",
  departmentTypeCode: detail.departmentTypeCode || "GENERAL",
  checklists: (detail.checklists || []).map((checklist, checklistIndex) => ({
    name: checklist.name || "",
    stage: (checklist.stage || "CUSTOM") as PlatformTemplateStage,
    deadlineDays: Number(checklist.deadlineDays || 0),
    sortOrder:
      checklist.sortOrder === undefined || checklist.sortOrder === null
        ? checklistIndex
        : Number(checklist.sortOrder),
    status: ((checklist.status || "ACTIVE") as PlatformTemplateItemStatus),
    tasks: (checklist.tasks || []).map((task, taskIndex) => ({
      title: task.title || "",
      description: task.description || "",
      ownerType: task.ownerType || "EMPLOYEE",
      ownerRefId: task.ownerRefId || null,
      dueDaysOffset: task.dueDaysOffset ?? checklist.deadlineDays ?? 0,
      requireAck: Boolean(task.requireAck),
      requireDoc: Boolean(task.requireDoc),
      requiredDocumentIds: task.requiredDocumentIds || [],
      requiredDocumentIdsText: (task.requiredDocumentIds || []).join(", "),
      requiresManagerApproval: Boolean(task.requiresManagerApproval),
      approverUserId: task.approverUserId || null,
      sortOrder:
        task.sortOrder === undefined || task.sortOrder === null
          ? taskIndex
          : Number(task.sortOrder),
      status: ((task.status || "ACTIVE") as PlatformTemplateItemStatus),
    })),
  })),
});
