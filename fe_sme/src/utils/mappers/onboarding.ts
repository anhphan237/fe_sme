import type {
  OnboardingInstance,
  OnboardingTask,
  OnboardingTemplate,
} from "@/shared/types";

type RawRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawRecord =>
  value !== null && typeof value === "object" ? (value as RawRecord) : {};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

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

const firstBoolean = (
  source: RawRecord,
  keys: readonly string[],
): boolean | undefined => {
  for (const key of keys) {
    const value = asBoolean(source[key]);
    if (value !== undefined) return value;
  }
  return undefined;
};

const stringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
};

const upper = (value: unknown): string => String(value ?? "").toUpperCase();

const normalizeTemplateLevel = (
  value: unknown,
): OnboardingTemplate["level"] | undefined => {
  const normalized = upper(value);
  if (normalized === "PLATFORM") return "PLATFORM";
  if (normalized === "TENANT") return "TENANT";
  return undefined;
};

const resolveOwnerRole = (task: RawRecord): string => {
  const ownerType = upper(task.ownerType);
  if (ownerType === "MANAGER") return "MANAGER";
  if (ownerType === "IT_STAFF") return "IT";
  if (ownerType === "EMPLOYEE") return "EMPLOYEE";
  if (ownerType === "HR") return "HR";
  if (ownerType === "DEPARTMENT") return "DEPARTMENT";
  if (ownerType === "USER") return "HR";

  const ref = upper(task.ownerRefId ?? task.ownerRole);
  if (ref === "MANAGER") return "MANAGER";
  if (ref === "IT" || ref === "IT_STAFF") return "IT";
  if (ref === "EMPLOYEE") return "EMPLOYEE";
  if (ref === "HR") return "HR";
  if (ref === "DEPARTMENT") return "DEPARTMENT";
  return "EMPLOYEE";
};

export const mapTemplate = (value: unknown): OnboardingTemplate => {
  const source = asRecord(value);
  const rawStages = asArray(source.checklists ?? source.stages);

  return {
    id:
      firstString(source, [
        "templateId",
        "onboardingTemplateId",
        "onboarding_template_id",
        "id",
      ]) ?? "",
    name: asString(source.name) ?? "",
    description: asString(source.description) ?? "",
    status: asString(source.status) ?? "DRAFT",
    templateKind:
      firstString(source, ["templateKind", "template_kind"]) ?? "ONBOARDING",
    departmentTypeCode: firstString(source, [
      "departmentTypeCode",
      "department_type_code",
    ]),
    checklistCount: firstNumber(source, [
      "checklistCount",
      "checklist_count",
      "totalChecklists",
      "totalChecklistCount",
      "stageCount",
    ]),
    taskCount: firstNumber(source, [
      "taskCount",
      "task_count",
      "totalTasks",
      "totalTaskCount",
    ]),
    stages: rawStages.map((stageValue, stageIndex) => {
      const stage = asRecord(stageValue);
      return {
        id:
          firstString(stage, [
            "checklistTemplateId",
            "checklist_template_id",
            "id",
          ]) ?? `stage-${stageIndex}`,
        name: asString(stage.name) ?? "",
        stageType: firstString(stage, ["stageType", "stage_type", "stage"]),
        deadlineDays: firstNumber(stage, [
          "deadlineDays",
          "deadline_days",
          "dueDaysOffset",
          "due_days_offset",
        ]),
        tasks: asArray(stage.tasks).map((taskValue, taskIndex) => {
          const task = asRecord(taskValue);
          const dueOffset = firstNumber(task, [
            "dueDaysOffset",
            "due_days_offset",
            "dueOffset",
            "due_offset",
          ]);
          const requireAck =
            firstBoolean(task, ["requireAck", "require_ack", "required"]) ??
            false;

          return {
            id:
              firstString(task, ["taskTemplateId", "task_template_id", "id"]) ??
              `task-${stageIndex}-${taskIndex}`,
            title: firstString(task, ["name", "title"]) ?? "",
            description: asString(task.description) ?? "",
            ownerRole: resolveOwnerRole(task) as OnboardingTask["ownerRole"],
            ownerRefId:
              firstString(task, ["ownerRefId", "owner_ref_id"]) ?? null,
            ownerType: firstString(task, ["ownerType", "owner_type"]),
            responsibleDepartmentIds: stringArray(
              task.responsibleDepartmentIds ?? task.responsible_department_ids,
            ),
            dueOffset: String(dueOffset ?? 0),
            required: requireAck,
            requireAck,
            requireDoc:
              firstBoolean(task, ["requireDoc", "require_doc"]) ?? false,
            requiresManagerApproval:
              firstBoolean(task, [
                "requiresManagerApproval",
                "requires_manager_approval",
              ]) ?? false,
            approverUserId: firstString(task, [
              "approverUserId",
              "approver_user_id",
            ]),
            requiredDocumentIds: stringArray(
              task.requiredDocumentIds ?? task.required_document_ids,
            ),
            status: asString(task.status) as OnboardingTask["status"],
            dueDate: firstString(task, ["dueDate", "due_date"]),
          };
        }),
      };
    }),
    createdAt: firstString(source, ["createdAt", "created_at"]),
    updatedAt:
      firstString(source, ["updatedAt", "updated_at", "createdAt", "created_at"]) ??
      "",
    companyId: firstString(source, ["companyId", "company_id"]) ?? null,
    level: normalizeTemplateLevel(
      source.level ?? source.templateLevel ?? source.template_level,
    ),
  };
};

export const mapInstance = (value: unknown): OnboardingInstance => {
  const source = asRecord(value);
  const employee = asRecord(source.employee);
  const rawStatus = asString(source.status);

  return {
    id: firstString(source, ["instanceId", "id"]) ?? "",
    employeeId: asString(source.employeeId) ?? "",
    employeeName:
      firstString(source, ["employeeName", "employee_name"]) ??
      firstString(employee, ["fullName", "name"]) ??
      null,
    employeeUserId:
      firstString(source, [
        "employeeUserId",
        "employeeUserID",
        "employee_user_id",
        "userId",
      ]) ??
      asString(employee.userId) ??
      null,
    managerUserId: firstString(source, ["managerUserId", "manager_user_id"]) ?? null,
    managerName: firstString(source, ["managerName", "manager_name"]) ?? null,
    templateId: asString(source.templateId) ?? "",
    templateName:
      firstString(source, ["templateName", "template_name"]) ??
      asString(asRecord(source.template).name) ??
      null,
    startDate: firstString(source, ["startDate", "createdAt"]) ?? "",
    progress: firstNumber(source, ["progressPercent", "progress"]) ?? 0,
    status: mapInstanceStatus(rawStatus),
    companyId: firstString(source, ["companyId", "company_id"]) ?? null,
  };
};

const mapInstanceStatus = (
  status: string | undefined,
): OnboardingInstance["status"] => {
  if (status === "DONE" || status === "COMPLETED" || status === "Completed") {
    return "COMPLETED";
  }
  if (
    status === "CANCELLED" ||
    status === "CANCELED" ||
    status === "Paused" ||
    status === "Cancelled"
  ) {
    return "CANCELLED";
  }
  if (status === "DRAFT" || status === "Draft") return "DRAFT";
  return "ACTIVE";
};

export const mapTaskStatus = (
  status: string | undefined,
):
  | "Pending"
  | "In Progress"
  | "Done"
  | "Wait Ack"
  | "Pending Approval"
  | undefined => {
  if (!status) return undefined;
  const normalized = status.toUpperCase();
  if (normalized === "DONE" || normalized === "COMPLETED") return "Done";
  if (normalized === "IN_PROGRESS" || normalized === "IN PROGRESS") {
    return "In Progress";
  }
  if (normalized === "WAIT_ACK") return "Wait Ack";
  if (normalized === "PENDING_APPROVAL") return "Pending Approval";
  if (normalized === "TODO" || normalized === "PENDING" || normalized === "ASSIGNED") {
    return "Pending";
  }
  return "Pending";
};

export const mapTask = (value: unknown): OnboardingTask => {
  const source = asRecord(value);
  const assignedUser = asRecord(source.assignedUser);
  const createdByUser = asRecord(source.createdByUser);
  const reporterUser = asRecord(source.reporterUser);
  const checklist = asRecord(source.checklist);
  const dueOffset = firstNumber(source, ["dueDaysOffset", "dueOffset"]);
  const requireAck = firstBoolean(source, ["requireAck", "required"]) ?? false;

  return {
    id: firstString(source, ["taskId", "id"]) ?? "",
    title: firstString(source, ["title", "name"]) ?? "",
    description: asString(source.description),
    ownerRole: (asString(source.ownerRefId) ??
      asString(source.ownerRole) ??
      "EMPLOYEE") as OnboardingTask["ownerRole"],
    ownerType: asString(source.ownerType),
    responsibleDepartmentIds: stringArray(source.responsibleDepartmentIds),
    dueOffset: String(dueOffset ?? 0),
    required: requireAck,
    requireAck,
    requireDoc: asBoolean(source.requireDoc) ?? false,
    requiresManagerApproval: asBoolean(source.requiresManagerApproval) ?? false,
    requiredDocumentIds: stringArray(source.requiredDocumentIds),
    status: mapTaskStatus(asString(source.status)),
    rawStatus: asString(source.status),
    dueDate: asString(source.dueDate),
    checklistId: asString(source.checklistId),
    checklistName: asString(source.checklistName),
    assignedUserId:
      firstString(source, ["assignedUserId", "assigneeUserId", "assigneeId"]) ??
      asString(assignedUser.userId),
    assignedUserName:
      firstString(source, ["assignedUserName", "assigneeUserName"]) ??
      firstString(assignedUser, ["fullName", "name"]),
    reporterUserId:
      asString(source.reporterUserId) ??
      asString(reporterUser.userId) ??
      asString(createdByUser.userId),
    reporterUserName:
      asString(source.reporterUserName) ??
      firstString(reporterUser, ["fullName", "name"]) ??
      firstString(createdByUser, ["fullName", "name"]),
    overdue: asBoolean(source.overdue) ?? false,
    scheduleStatus: asString(source.scheduleStatus),
    approvalStatus: asString(source.approvalStatus),
    onboardingId:
      firstString(source, ["onboardingId", "onboardingInstanceId", "instanceId"]) ??
      firstString(checklist, ["onboardingId", "instanceId"]),
    assignedDepartmentId: asString(source.assignedDepartmentId),
  };
};
