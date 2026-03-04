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
  const stages = Array.isArray(rawStages)
    ? rawStages.map((c: any) => ({
        id: c.checklistTemplateId ?? c.id ?? "",
        name: c.name ?? "",
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
    : [];
  return {
    id: t?.templateId ?? t?.id ?? "",
    name: t.name ?? "",
    description: t.description ?? "",
    status: t.status ?? "ACTIVE",
    stages,
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
  progress: i.progress ?? 0,
  status:
    i.status === "COMPLETED"
      ? "Completed"
      : i.status === "CANCELLED"
        ? "Paused"
        : "Active",
  companyId: i.companyId ?? null,
});

export const mapTaskStatus = (
  s: string | undefined,
): "Pending" | "In Progress" | "Done" | undefined => {
  if (!s) return undefined;
  const u = s.toUpperCase();
  if (u === "DONE" || u === "COMPLETED") return "Done";
  if (u === "IN_PROGRESS" || u === "IN PROGRESS") return "In Progress";
  return "Pending";
};

export const mapTask = (t: any): OnboardingTask => ({
  id: t.taskId ?? t.id ?? "",
  title: t.name ?? t.title ?? "",
  ownerRole: (t.ownerRefId ?? t.ownerRole ?? "EMPLOYEE") as any,
  dueOffset: String(t.dueDaysOffset ?? t.dueOffset ?? 0),
  required: t.requireAck ?? t.required ?? false,
  status: mapTaskStatus(t.status),
  dueDate: t.dueDate,
});
