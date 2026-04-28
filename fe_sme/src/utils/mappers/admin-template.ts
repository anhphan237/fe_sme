import type { CreatePlatformTemplateRequest } from "@/interface/admin";
import type { PlatformTemplateFormValue } from "@/shared/types";

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
      requireAck: Boolean(task.requireAck),
      requireDoc: Boolean(task.requireDoc),
      requiresManagerApproval: Boolean(task.requiresManagerApproval),
      sortOrder:
        task.sortOrder === undefined || task.sortOrder === null
          ? taskIndex
          : Number(task.sortOrder),
      status: task.status || "ACTIVE",
    })),
  })),
});