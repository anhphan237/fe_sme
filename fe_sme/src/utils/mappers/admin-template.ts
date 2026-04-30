import type {
  CreatePlatformTemplateRequest,
  PlatformTemplateDetailResponse,
  PlatformTemplateStage,
  PlatformTemplateItemStatus,
} from "@/interface/admin";
import type { PlatformTemplateFormValue } from "@/shared/types";


const parseDocumentIds = (text?: string, ids?: string[]) => {
  if (ids?.length) return ids;

  if (!text?.trim()) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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