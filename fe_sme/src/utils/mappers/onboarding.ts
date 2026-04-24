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

/**
 * Derive the UI assignee role from BE's ownerType / ownerRefId.
 * BE stores new templates with ownerType ∈ {EMPLOYEE, MANAGER, IT_STAFF, HR,
 * USER, DEPARTMENT}. Legacy templates use ownerType=ROLE + ownerRefId=<role>.
 */
const resolveOwnerRole = (task: any): string => {
  const ownerType = String(task.ownerType ?? "").toUpperCase();
  if (ownerType === "MANAGER") return "MANAGER";
  if (ownerType === "IT_STAFF") return "IT";
  if (ownerType === "EMPLOYEE") return "EMPLOYEE";
  if (ownerType === "HR") return "HR";
  if (ownerType === "DEPARTMENT" || ownerType === "USER") return "HR";
  const ref = String(task.ownerRefId ?? task.ownerRole ?? "").toUpperCase();
  if (ref === "MANAGER") return "MANAGER";
  if (ref === "IT" || ref === "IT_STAFF") return "IT";
  if (ref === "EMPLOYEE") return "EMPLOYEE";
  if (ref === "HR" || ref === "DEPARTMENT") return "HR";
  return "EMPLOYEE";
};

export const mapTemplate = (t: any): OnboardingTemplate => {
  const rawStages = t?.checklists ?? t?.stages;
  return {
    id: t?.templateId ?? t?.id ?? "",
    name: t.name ?? "",
    description: t.description ?? "",
    status: t.status ?? "ACTIVE",
    stages: Array.isArray(rawStages)
      ? rawStages.map((c: any, ci: number) => ({
          id: c.checklistTemplateId ?? c.id ?? `stage-${ci}`,
          name: c.name ?? "",
          stageType: c.stageType ?? c.stage_type ?? c.stage ?? undefined,
          deadlineDays: c.deadlineDays ?? undefined,
          tasks: (c.tasks ?? []).map((task: any, ti: number) => ({
            id: task.taskTemplateId ?? task.id ?? `task-${ci}-${ti}`,
            title: task.name ?? task.title ?? "",
            description: task.description ?? "",
            ownerRole: resolveOwnerRole(task) as any,
            dueOffset: String(task.dueDaysOffset ?? task.dueOffset ?? 0),
            required: task.requireAck ?? task.required ?? false,
            requireAck: Boolean(task.requireAck ?? task.required ?? false),
            requireDoc: Boolean(task.requireDoc ?? false),
            requiresManagerApproval: Boolean(
              task.requiresManagerApproval ?? false,
            ),
            approverUserId: task.approverUserId ?? undefined,
            requiredDocumentIds: task.requiredDocumentIds ?? undefined,
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
  employeeName:
    i.employeeName ??
    i.employee_name ??
    i.employee?.fullName ??
    i.employee?.name ??
    null,
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
  templateName: i.templateName ?? i.template_name ?? i.template?.name ?? null,
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
):
  | "Pending"
  | "In Progress"
  | "Done"
  | "Wait Ack"
  | "Pending Approval"
  | undefined => {
  if (!s) return undefined;
  const u = s.toUpperCase();
  if (u === "DONE" || u === "COMPLETED") return "Done";
  if (u === "IN_PROGRESS" || u === "IN PROGRESS") return "In Progress";
  if (u === "WAIT_ACK") return "Wait Ack";
  if (u === "PENDING_APPROVAL") return "Pending Approval";
  if (u === "TODO" || u === "PENDING" || u === "ASSIGNED") return "Pending";
  return "Pending";
};

export const mapTask = (t: any): OnboardingTask => ({
  id: t.taskId ?? t.id ?? "",
  title: t.title ?? t.name ?? "",
  description: t.description ?? undefined,
  ownerRole: (t.ownerRefId ?? t.ownerRole ?? "EMPLOYEE") as any,
  dueOffset: String(t.dueDaysOffset ?? t.dueOffset ?? 0),
  required: t.requireAck ?? t.required ?? false,
  requireAck: Boolean(t.requireAck ?? t.required ?? false),
  requireDoc: Boolean(t.requireDoc ?? false),
  requiresManagerApproval: Boolean(t.requiresManagerApproval ?? false),
  requiredDocumentIds: Array.isArray(t.requiredDocumentIds)
    ? t.requiredDocumentIds.filter((id: unknown) => typeof id === "string")
    : undefined,
  status: mapTaskStatus(t.status),
  rawStatus: t.status ?? undefined,
  dueDate: t.dueDate,
  checklistId: t.checklistId ?? undefined,
  checklistName: t.checklistName ?? undefined,
  assignedUserId:
    t.assignedUserId ??
    t.assigneeUserId ??
    t.assigneeId ??
    t.assignedUser?.userId ??
    undefined,
  assignedUserName:
    t.assignedUserName ??
    t.assigneeUserName ??
    t.assignedUser?.fullName ??
    t.assignedUser?.name ??
    undefined,
  reporterUserId: t.reporterUserId ?? t.reporterUser?.userId ?? undefined,
  reporterUserName:
    t.reporterUserName ??
    t.reporterUser?.fullName ??
    t.reporterUser?.name ??
    undefined,
  overdue: Boolean(t.overdue ?? false),
  scheduleStatus: t.scheduleStatus ?? undefined,
  approvalStatus: t.approvalStatus ?? undefined,
  onboardingId:
    t.onboardingId ??
    t.onboardingInstanceId ??
    t.instanceId ??
    t.checklist?.onboardingId ??
    t.checklist?.instanceId ??
    undefined,
});
