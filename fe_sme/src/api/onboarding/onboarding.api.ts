import { gatewayRequest } from "../core/gateway";
import type {
  OnboardingTemplateCreateRequest,
  OnboardingTemplateUpdateRequest,
  OnboardingInstanceCreateRequest,
  OnboardingInstanceActivateRequest,
  CompanySetupRequest,
  ListTasksByOnboardingOptions,
  OnboardingTaskAcknowledgeRequest,
  OnboardingTaskApproveRequest,
  OnboardingTaskRejectRequest,
  TaskAttachmentAddRequest,
  TaskAttachmentAddResponse,
  ListTasksByAssigneeOptions,
  TaskTimelineRequest,
  TaskScheduleProposeRequest,
  TaskScheduleConfirmRequest,
  TaskScheduleRescheduleRequest,
  TaskScheduleCancelRequest,
  TaskScheduleMarkNoShowRequest,
  TaskScheduleResponse,
  TaskDetailResponse,
  TaskLibraryListResponse,
  TaskLibraryImportResponse,
  OnboardingTemplateGetResponse,
  CommentTreeResponse,
  TaskScheduleCalendarRequest,
  TaskScheduleCalendarResponse,
  OnboardingTemplateCloneRequest,
  OnboardingTemplateCloneResponse,
} from "@/interface/onboarding";

// ── Templates ──────────────────────────────────────────────

/** com.sme.onboarding.template.list */
export const apiListTemplates = (params?: {
  status?: string;
  search?: string;
}) =>
  gatewayRequest<{ status: string; search?: string }, unknown>(
    "com.sme.onboarding.template.list",
    { status: params?.status ?? "ACTIVE", search: params?.search },
    { flatPayload: true },
  );

/** com.sme.onboarding.template.get */
export const apiGetTemplate = (templateId: string) =>
  gatewayRequest<{ templateId: string }, unknown>(
    "com.sme.onboarding.template.get",
    { templateId },
  );

/** com.sme.onboarding.template.create */
export const apiCreateTemplate = (payload: OnboardingTemplateCreateRequest) =>
  gatewayRequest<OnboardingTemplateCreateRequest, unknown>(
    "com.sme.onboarding.template.create",
    payload,
  );

/** com.sme.onboarding.template.update */
export const apiUpdateTemplate = (payload: OnboardingTemplateUpdateRequest) =>
  gatewayRequest<OnboardingTemplateUpdateRequest, unknown>(
    "com.sme.onboarding.template.update",
    payload,
  );

/** com.sme.onboarding.template.clone
 *  Clone a template by ID; the new template will be in DRAFT status with the given name.
 */
export const apiCloneTemplate = (payload: OnboardingTemplateCloneRequest) =>
  gatewayRequest<
    OnboardingTemplateCloneRequest,
    OnboardingTemplateCloneResponse
  >("com.sme.onboarding.template.clone", payload);
export const apiGenerateTemplateWithAI = (payload: {
  industry: string;
  companySize: string;
  jobRole: string;
}) =>
  gatewayRequest<
    typeof payload,
    {
      templateId: string;
      name: string;
      totalChecklists: number;
      totalTasks: number;
    }
  >("com.sme.onboarding.template.ai.generate", payload);

// ── Instances ───────────────────────────────────────────────

/** com.sme.onboarding.instance.list */
export const apiListInstances = (params?: {
  employeeId?: string;
  status?: string;
}) =>
  gatewayRequest<{ employeeId?: string; status?: string }, unknown>(
    "com.sme.onboarding.instance.list",
    params ?? {},
    { flatPayload: true },
  );

/** com.sme.onboarding.instance.get */
export const apiGetInstance = (instanceId: string) =>
  gatewayRequest<{ instanceId: string }, unknown>(
    "com.sme.onboarding.instance.get",
    { instanceId },
  );

/** com.sme.onboarding.instance.create */
export const apiCreateInstance = (payload: OnboardingInstanceCreateRequest) =>
  gatewayRequest<OnboardingInstanceCreateRequest, unknown>(
    "com.sme.onboarding.instance.create",
    payload,
  );

/** com.sme.onboarding.instance.activate
 *  @param payload.expectedStartDate — optional override for task dueDate calculation
 *    (tasks: dueDate = expectedStartDate + dueDaysOffset). Defaults to instance startDate.
 */
export const apiActivateInstance = (
  payload: OnboardingInstanceActivateRequest,
) =>
  gatewayRequest<OnboardingInstanceActivateRequest, unknown>(
    "com.sme.onboarding.instance.activate",
    payload,
  );

/** com.sme.onboarding.instance.cancel */
export const apiCancelInstance = (instanceId: string, reason?: string) =>
  gatewayRequest<{ instanceId: string; reason?: string }, unknown>(
    "com.sme.onboarding.instance.cancel",
    { instanceId, reason },
  );

/** com.sme.onboarding.instance.complete */
export const apiCompleteInstance = (instanceId: string) =>
  gatewayRequest<{ instanceId: string }, unknown>(
    "com.sme.onboarding.instance.complete",
    { instanceId },
  );

// ── Tasks ──────────────────────────────────────────────────

/** com.sme.onboarding.task.listByOnboarding */
export const apiListTasks = (
  onboardingId: string,
  options?: ListTasksByOnboardingOptions,
) =>
  gatewayRequest<Record<string, unknown>, unknown>(
    "com.sme.onboarding.task.listByOnboarding",
    {
      onboardingId,
      ...(options?.status && { status: options.status }),
      ...(options?.page != null && { page: options.page }),
      ...(options?.size != null && { size: options.size }),
      ...(options?.sortBy && { sortBy: options.sortBy }),
      ...(options?.sortOrder && { sortOrder: options.sortOrder }),
    },
  );

/** com.sme.onboarding.task.detail */
export const apiGetTaskDetail = (taskId: string) =>
  gatewayRequest<{ taskId: string }, unknown>(
    "com.sme.onboarding.task.detail",
    { taskId },
  );

/** com.sme.onboarding.task.updateStatus */
export const apiUpdateTaskStatus = (taskId: string, status: string) =>
  gatewayRequest<{ taskId: string; status: string }, unknown>(
    "com.sme.onboarding.task.updateStatus",
    { taskId, status },
  );

/** com.sme.onboarding.task.generate */
export const apiGenerateTasks = (
  instanceId: string,
  managerId: string,
  itStaffUserId?: string,
) =>
  gatewayRequest<
    { instanceId: string; managerId: string; itStaffUserId?: string },
    unknown
  >("com.sme.onboarding.task.generate", {
    instanceId,
    managerId,
    itStaffUserId,
  });

/** com.sme.onboarding.task.assign */
export const apiAssignTask = (taskId: string, assigneeUserId: string) =>
  gatewayRequest<{ taskId: string; assigneeUserId: string }, unknown>(
    "com.sme.onboarding.task.assign",
    { taskId, assigneeUserId },
  );

// ── Other ──────────────────────────────────────────────────

/** com.sme.onboarding.company.setup */
export const apiCompanySetup = (payload?: CompanySetupRequest) =>
  gatewayRequest<CompanySetupRequest, unknown>(
    "com.sme.onboarding.company.setup",
    payload ?? {},
  );

// ── Task Comments ──────────────────────────────────────────

/** com.sme.onboarding.task.comment.list */
export const apiListTaskComments = (taskId: string) =>
  gatewayRequest<{ taskId: string }, unknown>(
    "com.sme.onboarding.task.comment.list",
    { taskId },
  );

/** com.sme.onboarding.task.comment.tree
 *  Returns the full comment tree (nested parent-child structure).
 *  Prefer this over comment.list when rendering threaded replies.
 */
export const apiGetTaskCommentTree = (taskId: string) =>
  gatewayRequest<{ taskId: string }, CommentTreeResponse>(
    "com.sme.onboarding.task.comment.tree",
    { taskId },
  );

/** com.sme.onboarding.task.comment.add
 *  @param payload.parentCommentId — omit for a top-level comment, provide to reply to an existing comment
 */
export const apiAddTaskComment = (payload: {
  taskId: string;
  content: string;
  parentCommentId?: string;
}) =>
  gatewayRequest<typeof payload, { commentId: string }>(
    "com.sme.onboarding.task.comment.add",
    payload,
  );

// ── Task Actions (Acknowledge / Approve / Reject) ──────────

/** com.sme.onboarding.task.acknowledge
 *  Employee acknowledges receipt of task (requireAck=true flow).
 *  Status → WAIT_ACK; employee must then call updateStatus(DONE) to complete.
 */
export const apiAcknowledgeTask = (payload: OnboardingTaskAcknowledgeRequest) =>
  gatewayRequest<OnboardingTaskAcknowledgeRequest, unknown>(
    "com.sme.onboarding.task.acknowledge",
    payload,
  );

/** com.sme.onboarding.task.approve
 *  Manager/HR approves a PENDING_APPROVAL task → DONE.
 *  Only designated approver or line manager can call this.
 */
export const apiApproveTask = (payload: OnboardingTaskApproveRequest) =>
  gatewayRequest<OnboardingTaskApproveRequest, unknown>(
    "com.sme.onboarding.task.approve",
    payload,
  );

/** com.sme.onboarding.task.reject
 *  Manager/HR rejects a PENDING_APPROVAL task → TODO.
 *  Optional reason is sent back to employee.
 */
export const apiRejectTask = (payload: OnboardingTaskRejectRequest) =>
  gatewayRequest<OnboardingTaskRejectRequest, unknown>(
    "com.sme.onboarding.task.reject",
    payload,
  );

/** com.sme.onboarding.task.attachment.add
 *  Add a file attachment to a task (evidence of completion).
 */
export const apiAddTaskAttachment = (payload: TaskAttachmentAddRequest) =>
  gatewayRequest<TaskAttachmentAddRequest, TaskAttachmentAddResponse>(
    "com.sme.onboarding.task.attachment.add",
    payload,
  );

// ── Task Views (Assignee / Timeline) ──────────────────────

/** com.sme.onboarding.task.listByAssignee
 *  Lists all tasks assigned to the current user (employee/manager self-view).
 */
export const apiListTasksByAssignee = (options?: ListTasksByAssigneeOptions) =>
  gatewayRequest<Record<string, unknown>, unknown>(
    "com.sme.onboarding.task.listByAssignee",
    {
      ...(options?.status && { status: options.status }),
      ...(options?.page != null && { page: options.page }),
      ...(options?.size != null && { size: options.size }),
      ...(options?.sortBy && { sortBy: options.sortBy }),
      ...(options?.sortOrder && { sortOrder: options.sortOrder }),
    },
  );

/** com.sme.onboarding.task.timelineByOnboarding
 *  Returns tasks grouped by assignee for a timeline/Gantt view.
 *  HR/Manager use to track full team progress.
 */
export const apiGetTaskTimeline = (payload: TaskTimelineRequest) =>
  gatewayRequest<TaskTimelineRequest, unknown>(
    "com.sme.onboarding.task.timelineByOnboarding",
    payload,
  );

// ── Task Schedule Operations ──────────────────────────────

/** com.sme.onboarding.task.schedule.propose
 *  Employee or IT staff proposes a schedule → PROPOSED.
 *  Manager/HR must confirm before the task can be completed.
 */
export const apiProposeTaskSchedule = (payload: TaskScheduleProposeRequest) =>
  gatewayRequest<TaskScheduleProposeRequest, TaskScheduleResponse>(
    "com.sme.onboarding.task.schedule.propose",
    payload,
  );

/** com.sme.onboarding.task.schedule.confirm
 *  Manager/HR confirms a PROPOSED schedule → CONFIRMED.
 *  Proposer cannot self-confirm unless they have HR/MANAGER role.
 */
export const apiConfirmTaskSchedule = (payload: TaskScheduleConfirmRequest) =>
  gatewayRequest<TaskScheduleConfirmRequest, TaskScheduleResponse>(
    "com.sme.onboarding.task.schedule.confirm",
    payload,
  );

/** com.sme.onboarding.task.schedule.reschedule
 *  Change a CONFIRMED schedule → RESCHEDULED.
 *  Notifies the other party.
 */
export const apiRescheduleTask = (payload: TaskScheduleRescheduleRequest) =>
  gatewayRequest<TaskScheduleRescheduleRequest, TaskScheduleResponse>(
    "com.sme.onboarding.task.schedule.reschedule",
    payload,
  );

/** com.sme.onboarding.task.schedule.cancel
 *  Cancel a schedule → CANCELLED.
 *  Task reverts to needing rescheduling.
 */
export const apiCancelTaskSchedule = (payload: TaskScheduleCancelRequest) =>
  gatewayRequest<TaskScheduleCancelRequest, TaskScheduleResponse>(
    "com.sme.onboarding.task.schedule.cancel",
    payload,
  );

/** com.sme.onboarding.task.schedule.markNoShow
 *  Mark that the scheduled session was missed → MISSED.
 *  Triggers TASK_SCHEDULE_NO_SHOW_CANDIDATE notification to both parties.
 */
export const apiMarkTaskNoShow = (payload: TaskScheduleMarkNoShowRequest) =>
  gatewayRequest<TaskScheduleMarkNoShowRequest, TaskScheduleResponse>(
    "com.sme.onboarding.task.schedule.markNoShow",
    payload,
  );

/** com.sme.onboarding.task.detail (override — returns full typed response) */
export const apiGetTaskDetailFull = (
  taskId: string,
  options?: {
    includeComments?: boolean;
    includeAttachments?: boolean;
    includeActivityLogs?: boolean;
  },
) =>
  gatewayRequest<Record<string, unknown>, TaskDetailResponse>(
    "com.sme.onboarding.task.detail",
    {
      taskId,
      includeComments: options?.includeComments ?? true,
      includeAttachments: options?.includeAttachments ?? true,
      includeActivityLogs: options?.includeActivityLogs ?? false,
    },
  );

// ── Schedule Calendar ──────────────────────────────────────

/** com.sme.onboarding.task.schedule.list
 *  Queries all scheduled tasks for a user within a time range.
 *  Replaces per-instance task queries for the schedule/calendar view.
 *  @param payload.userId — omit for self-view (current user)
 *  @param payload.fromTime — ISO UTC string (start of calendar range)
 *  @param payload.toTime   — ISO UTC string (end of calendar range)
 */
export const apiQueryTaskScheduleCalendar = (
  payload: TaskScheduleCalendarRequest,
) =>
  gatewayRequest<TaskScheduleCalendarRequest, TaskScheduleCalendarResponse>(
    "com.sme.onboarding.task.schedule.list",
    payload,
  );

// ── Task Libraries (REST — direct, not gateway) ─────────────
// Endpoints: GET/POST /api/v1/task-libraries/*

const _TASK_LIB_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const _getTaskLibBase = (): string =>
  import.meta.env.DEV && _TASK_LIB_BASE_URL
    ? ""
    : _TASK_LIB_BASE_URL.replace(/\/$/, "");

const _taskLibHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function _taskLibFetch<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      ((json as Record<string, unknown>).message as string) ??
        ((json as Record<string, unknown>).errorCode as string) ??
        `Error ${res.status}`,
    );
  return (
    (json as Record<string, unknown>).data !== undefined
      ? (json as Record<string, unknown>).data
      : json
  ) as T;
}

/** GET /api/v1/task-libraries */
export const apiListTaskLibraries = (params?: {
  status?: string;
  page?: number;
  size?: number;
}) => {
  const p = new URLSearchParams();
  if (params?.status) p.set("status", params.status);
  if (params?.page != null) p.set("page", String(params.page));
  if (params?.size != null) p.set("size", String(params.size));
  const qs = p.toString() ? `?${p.toString()}` : "";
  return fetch(`${_getTaskLibBase()}/api/v1/task-libraries${qs}`, {
    headers: _taskLibHeaders(),
  }).then((r) => _taskLibFetch<TaskLibraryListResponse>(r));
};

/** GET /api/v1/task-libraries/{templateId} */
export const apiGetTaskLibrary = (templateId: string) =>
  fetch(`${_getTaskLibBase()}/api/v1/task-libraries/${templateId}`, {
    headers: _taskLibHeaders(),
  }).then((r) => _taskLibFetch<OnboardingTemplateGetResponse>(r));

/** GET /api/v1/task-libraries/excel-template — triggers browser download */
export const apiDownloadTaskLibraryTemplate = async (): Promise<void> => {
  const res = await fetch(
    `${_getTaskLibBase()}/api/v1/task-libraries/excel-template`,
    { headers: _taskLibHeaders() },
  );
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "task-library-template.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
};

/** POST /api/v1/task-libraries/import-excel (multipart/form-data) */
export const apiImportTaskLibraryExcel = (formData: FormData) =>
  fetch(`${_getTaskLibBase()}/api/v1/task-libraries/import-excel`, {
    method: "POST",
    headers: _taskLibHeaders(),
    body: formData,
  }).then((r) => _taskLibFetch<TaskLibraryImportResponse>(r));
