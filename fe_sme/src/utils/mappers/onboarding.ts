/**
 * Onboarding module — data mappers (shared by Pages)
 * Transforms raw gateway responses into typed UI models.
 */
import type {
  OnboardingInstance,
  OnboardingTask,
  OnboardingTemplate,
} from "@/shared/types";

// ── Mappers ─────────────────────────────────────────────────

export const mapTemplate = (t: any): OnboardingTemplate => {
  const rawStages = t?.checklists ?? t?.stages;
  return {
    id: t?.templateId ?? t?.id ?? "",
    name: t.name ?? "",
    description: t.description ?? "",
    status: t.status ?? "ACTIVE",
    stages: Array.isArray(rawStages)
      ? rawStages.map((c: any) => ({
          id: c.checklistTemplateId ?? c.id ?? "",
          name: c.name ?? "",
          stageType: c.stageType ?? c.stage_type ?? c.stage ?? undefined,
          tasks: (c.tasks ?? []).map((task: any) => ({
            id: task.taskTemplateId ?? task.id ?? "",
            title: task.name ?? task.title ?? "",
            ownerRole: (task.ownerRefId ?? "HR") as any,
            dueOffset: String(task.dueDaysOffset ?? task.dueOffset ?? 0),
            required: task.requireAck ?? task.required ?? false,
            status: task.status,
            dueDate: task.dueDate,
          })),
        }))
      : [],
    updatedAt: t.updatedAt ?? "",
    companyId: t.companyId ?? null,
  };
};

export const mapInstance = (i: any): OnboardingInstance => ({
  id: i.instanceId ?? i.id ?? "",
  employeeId: i.employeeId ?? "",
  employeeUserId:
    i.employeeUserId ??
    i.employeeUserID ??
    i.employee_user_id ??
    i.userId ??
    i.employee?.userId ??
    null,
  managerUserId: i.managerUserId ?? i.manager_user_id ?? null,
  managerName: i.managerName ?? i.manager_name ?? null,
  templateId: i.templateId ?? "",
  startDate: i.startDate ?? i.createdAt ?? "",
  progress: i.progressPercent ?? i.progress ?? 0,
  status:
    i.status === "DONE" || i.status === "COMPLETED" || i.status === "Completed"
      ? "COMPLETED"
      : i.status === "CANCELLED" ||
          i.status === "CANCELED" ||
          i.status === "Paused" ||
          i.status === "Cancelled"
        ? "CANCELLED"
        : i.status === "DRAFT" || i.status === "Draft"
          ? "DRAFT"
          : "ACTIVE",
  companyId: i.companyId ?? null,
});

export const mapTaskStatus = (
  s: string | undefined,
): "Pending" | "In Progress" | "Done" | undefined => {
  if (!s) return undefined;
  const u = s.toUpperCase();
  if (u === "DONE" || u === "COMPLETED") return "Done";
  if (u === "IN_PROGRESS" || u === "IN PROGRESS") return "In Progress";
  if (u === "TODO" || u === "PENDING" || u === "ASSIGNED") return "Pending";
  return "Pending";
};

export const mapTask = (t: any): OnboardingTask => ({
  id: t.taskId ?? t.id ?? "",
  title: t.title ?? t.name ?? "",
  ownerRole: (t.ownerRefId ?? t.ownerRole ?? "EMPLOYEE") as any,
  dueOffset: String(t.dueDaysOffset ?? t.dueOffset ?? 0),
  required: t.requireAck ?? t.required ?? false,
  status: mapTaskStatus(t.status),
  dueDate: t.dueDate,
  checklistId: t.checklistId ?? undefined,
  checklistName: t.checklistName ?? undefined,
  assignedUserId: t.assignedUserId ?? undefined,
});
