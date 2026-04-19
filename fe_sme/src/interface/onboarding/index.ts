// ============================================================
// Onboarding Module Interfaces
// Maps to BE: modules/onboarding
// Operations: com.sme.onboarding.*
// ============================================================

// ---------------------------
// Onboarding Template
// ---------------------------

/** Item inside OnboardingTemplateCreateRequest.checklists[].tasks[] */
export interface TaskTemplateCreateItem {
  /** BE field is `title` — must NOT be sent as `name` or task is silently skipped */
  title: string;
  /**
   * BE's OnboardingTaskGenerateProcessor.applyOwnerAssignment resolves:
   *   USER | DEPARTMENT | EMPLOYEE | MANAGER | IT_STAFF
   * Any other value leaves the task unassigned.
   */
  ownerType?: string;
  /** Only meaningful for USER (userId) or DEPARTMENT (deptId). Null otherwise. */
  ownerRefId?: string | null;
  dueDaysOffset?: number;
  requireAck?: boolean;
  requireDoc?: boolean;
  requiresManagerApproval?: boolean;
  /** Designated approver user ID — overrides default manager when requiresManagerApproval=true */
  approverUserId?: string | null;
  /** Document template IDs required for this task (used when requireDoc=true) */
  requiredDocumentIds?: string[];
  description?: string;
  sortOrder?: number;
  /** ACTIVE | INACTIVE | DRAFT */
  status?: string;
}

/** Item inside OnboardingTemplateCreateRequest.checklists[] */
export interface ChecklistTemplateCreateItem {
  name: string;
  /** BE stage type: PRE_BOARDING | DAY_1 | DAY_7 | DAY_30 | DAY_60 */
  stage?: string;
  /** Deadline in days from onboarding start date */
  deadlineDays?: number;
  sortOrder?: number;
  /** ACTIVE | INACTIVE | DRAFT */
  status?: string;
  tasks: TaskTemplateCreateItem[];
}

/**
 * Item inside OnboardingTemplateUpdateRequest.checklists[].tasks[]
 * - `taskTemplateId` = null → BE creates a new task
 * - `taskTemplateId` = existing ID → BE updates that task
 * - Omitting a task from the array → BE deletes it (tree sync)
 */
export interface TaskTemplateUpdateItem extends TaskTemplateCreateItem {
  taskTemplateId?: string | null;
}

/**
 * Item inside OnboardingTemplateUpdateRequest.checklists[]
 * - `checklistTemplateId` = null → BE creates a new checklist
 * - `checklistTemplateId` = existing ID → BE updates that checklist
 * - Omitting a checklist from the array → BE deletes it (tree sync)
 */
export interface ChecklistTemplateUpdateItem {
  checklistTemplateId?: string | null;
  name: string;
  /** BE stage type: PRE_BOARDING | DAY_1 | DAY_7 | DAY_30 | DAY_60 */
  stage?: string;
  /** Deadline in days from onboarding start date */
  deadlineDays?: number;
  sortOrder?: number;
  /** ACTIVE | INACTIVE | DRAFT */
  status?: string;
  tasks: TaskTemplateUpdateItem[];
}

/** com.sme.onboarding.template.create */
export interface OnboardingTemplateCreateRequest {
  name: string;
  description?: string;
  /** default: ACTIVE */
  status?: string;
  createdBy?: string;
  /** TASK_LIBRARY | CUSTOM */
  templateKind?: string;
  departmentTypeCode?: string;
  checklists?: ChecklistTemplateCreateItem[];
}

/** com.sme.onboarding.template.update — supports full tree sync */
export interface OnboardingTemplateUpdateRequest {
  templateId: string;
  name?: string;
  description?: string;
  status?: string;
  checklists?: ChecklistTemplateUpdateItem[];
}

/** com.sme.onboarding.template.get */
export interface OnboardingTemplateGetRequest {
  templateId: string;
}

/** com.sme.onboarding.template.list */
export interface OnboardingTemplateListRequest {
  status?: string;
}

/** Minimal template summary in list */
export interface OnboardingTemplateSummary {
  templateId: string;
  name: string;
  status: string;
}

/** Detailed task in a checklist */
export interface TaskTemplateDetail {
  taskTemplateId: string;
  checklistTemplateId?: string;
  /** BE returns `title`; mapper also checks `name` as fallback */
  title?: string;
  name: string;
  /** String for flexibility — may be a userId (USER), deptId (DEPARTMENT), a role code (legacy), or null. */
  ownerRefId?: string | null;
  ownerType?: string;
  dueDaysOffset: number;
  requireAck: boolean;
  requireDoc?: boolean;
  requiresManagerApproval?: boolean;
  /** Designated approver user ID — overrides default manager when requiresManagerApproval=true */
  approverUserId?: string;
  /** Document template IDs required for this task */
  requiredDocumentIds?: string[];
  description?: string;
  sortOrder?: number;
  /** Response uses orderNo; sortOrder used for create/update */
  orderNo?: number;
  /** ACTIVE | INACTIVE | DRAFT */
  status?: string;
}

/** Detailed checklist in a template */
export interface ChecklistTemplateDetail {
  checklistTemplateId: string;
  name: string;
  /** BE stage type: PRE_BOARDING | DAY_1 | DAY_7 | DAY_30 | DAY_60 */
  stage?: string;
  /** Deadline in days from onboarding start date */
  deadlineDays?: number;
  sortOrder?: number;
  /** Response uses orderNo; sortOrder used for create/update */
  orderNo?: number;
  /** ACTIVE | INACTIVE | DRAFT */
  status?: string;
  tasks: TaskTemplateDetail[];
}

/** com.sme.onboarding.template.get → full response */
export interface OnboardingTemplateGetResponse {
  templateId: string;
  name: string;
  description: string;
  status: string;
  /** TASK_LIBRARY | CUSTOM */
  templateKind?: string;
  departmentTypeCode?: string;
  checklists: ChecklistTemplateDetail[];
  /** Standalone tasks not tied to a checklist */
  baselineTasks?: TaskTemplateDetail[];
  updatedAt?: string;
}

/** com.sme.onboarding.template.list → response data */
export interface OnboardingTemplateListResponse {
  templates: OnboardingTemplateSummary[];
}

/** com.sme.onboarding.template.create/update → response data */
export interface OnboardingTemplateResponse {
  templateId: string;
  name: string;
  status: string;
  /** TASK_LIBRARY | CUSTOM */
  templateKind?: string;
  departmentTypeCode?: string;
}

// ---------------------------
// Onboarding Instance
// ---------------------------

/** com.sme.onboarding.company.setup */
export interface CompanySetupRequest {
  templateId?: string;
  [key: string]: unknown;
}

/** com.sme.onboarding.instance.create */
export interface OnboardingInstanceCreateRequest {
  templateId: string;
  employeeId: string;
  /** Optional — for assignee resolution */
  managerId?: string;
  /** Optional — for IT staff task assignment */
  itStaffUserId?: string;
  /** Optional — desired onboarding start date (ISO date string) */
  startDate?: string;
  /** Idempotency key */
  requestNo?: string;
}

/** com.sme.onboarding.instance.activate */
export interface OnboardingInstanceActivateRequest {
  instanceId: string;
}

/** com.sme.onboarding.instance.cancel */
export interface OnboardingInstanceCancelRequest {
  instanceId: string;
  reason?: string;
}

/** com.sme.onboarding.instance.complete */
export interface OnboardingInstanceCompleteRequest {
  instanceId: string;
}

/** com.sme.onboarding.instance.get */
export interface OnboardingInstanceGetRequest {
  instanceId: string;
}

/** com.sme.onboarding.instance.list */
export interface OnboardingInstanceListRequest {
  status?: string;
  employeeId?: string;
}

/** Minimal instance response */
export interface OnboardingInstanceResponse {
  instanceId: string;
  status: string;
}

/** Full instance detail */
export interface OnboardingInstanceDetailResponse {
  instanceId: string;
  templateId: string;
  employeeId: string;
  employeeUserId: string | null;
  managerUserId: string | null;
  managerName: string | null;
  status: string;
  progress: number;
  startDate: string;
  companyId?: string | null;
}

/** com.sme.onboarding.instance.list → response data */
export interface OnboardingInstanceListResponse {
  items: OnboardingInstanceDetailResponse[];
}

// ---------------------------
// Onboarding Task
// ---------------------------

/** com.sme.onboarding.task.generate */
export interface OnboardingTaskGenerateRequest {
  instanceId: string;
  /** Used for tasks with ownerType=MANAGER */
  managerId?: string;
  /** Used for tasks with ownerType=IT_STAFF */
  itStaffUserId?: string;
}

/** com.sme.onboarding.task.assign */
export interface OnboardingTaskAssignRequest {
  taskId: string;
  assigneeUserId: string;
}

/** com.sme.onboarding.task.updateStatus */
export interface OnboardingTaskUpdateStatusRequest {
  taskId: string;
  /** BE statuses — Employee cannot use DONE if requiresManagerApproval=true; use PENDING_APPROVAL instead */
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "ASSIGNED"
    | "WAIT_ACK"
    | "PENDING_APPROVAL"
    | "DONE";
}

/** com.sme.onboarding.task.acknowledge */
export interface OnboardingTaskAcknowledgeRequest {
  taskId: string;
}

/** com.sme.onboarding.task.approve */
export interface OnboardingTaskApproveRequest {
  taskId: string;
}

/** com.sme.onboarding.task.reject */
export interface OnboardingTaskRejectRequest {
  taskId: string;
  /** Reason shown to employee on rejection */
  reason?: string;
}

/** com.sme.onboarding.task.attachment.add */
export interface TaskAttachmentAddRequest {
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSizeBytes?: number;
}

/** com.sme.onboarding.task.attachment.add → response */
export interface TaskAttachmentAddResponse {
  attachmentId: string;
}

/** com.sme.onboarding.task.listByAssignee — query options */
export interface ListTasksByAssigneeOptions {
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

/** com.sme.onboarding.task.timelineByOnboarding */
export interface TaskTimelineRequest {
  onboardingId: string;
  /** Include DONE tasks (default: false → actionable work view only) */
  includeDone?: boolean;
}

// ---------------------------
// Task Schedule
// ---------------------------

/** com.sme.onboarding.task.schedule.propose */
export interface TaskScheduleProposeRequest {
  taskId: string;
  /** ISO datetime string */
  scheduledStartAt: string;
  /** ISO datetime string — must be after scheduledStartAt */
  scheduledEndAt?: string;
}

/** com.sme.onboarding.task.schedule.confirm */
export interface TaskScheduleConfirmRequest {
  taskId: string;
}

/** com.sme.onboarding.task.schedule.reschedule */
export interface TaskScheduleRescheduleRequest {
  taskId: string;
  scheduledStartAt: string;
  scheduledEndAt?: string;
  reason?: string;
}

/** com.sme.onboarding.task.schedule.cancel */
export interface TaskScheduleCancelRequest {
  taskId: string;
  reason?: string;
}

/** com.sme.onboarding.task.schedule.markNoShow */
export interface TaskScheduleMarkNoShowRequest {
  taskId: string;
  reason?: string;
}

/** Response for all schedule operations */
export interface TaskScheduleResponse {
  taskId: string;
  scheduleStatus:
    | "UNSCHEDULED"
    | "PROPOSED"
    | "CONFIRMED"
    | "RESCHEDULED"
    | "CANCELLED"
    | "MISSED";
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  scheduleProposedBy?: string;
  scheduleProposedAt?: string;
  scheduleConfirmedBy?: string;
  scheduleConfirmedAt?: string;
  scheduleRescheduleReason?: string;
  scheduleCancelReason?: string;
  scheduleNoShowReason?: string;
}

// ---------------------------
// Task Detail (full)
// ---------------------------

/** Nested checklist info in task detail response */
export interface TaskDetailChecklistInfo {
  checklistId: string;
  name?: string;
  /** PRE_BOARDING | DAY_1 | DAY_7 | DAY_30 | DAY_60 */
  stage?: string;
  onboardingId?: string;
}

/** Nested user info in task detail response */
export interface TaskDetailUserInfo {
  userId: string;
  fullName?: string;
  email?: string;
}

/** Nested department info in task detail response */
export interface TaskDetailDepartmentInfo {
  departmentId: string;
  name?: string;
}

/** Required document reference in task detail */
export interface RequiredDocumentItem {
  documentId: string;
  title?: string;
}

/** Attachment in task detail */
export interface TaskAttachmentItem {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSizeBytes?: number;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt?: string;
}

/** Activity log entry in task detail */
export interface TaskActivityLogItem {
  logId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  actorUserId?: string;
  actorName?: string;
  createdAt: string;
}

/** com.sme.onboarding.task.detail → full response */
export interface TaskDetailResponse {
  taskId: string;
  title: string;
  description?: string;
  status: OnboardingTaskUpdateStatusRequest["status"];
  dueDate?: string;
  dueInHours?: number;
  overdue?: boolean;
  dueCategory?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  // Assignee (flat fields — BE may also return nested assignedUser)
  assignedUserId?: string;
  assignedUserName?: string;
  // Checklist (flat fields — BE may also return nested checklist)
  checklistId?: string;
  checklistName?: string;
  // Acknowledgment
  requireAck: boolean;
  requireDoc?: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  // Approval
  requiresManagerApproval: boolean;
  approvalStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  approverUserId?: string;
  // Schedule
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  scheduleStatus?: TaskScheduleResponse["scheduleStatus"];
  scheduleProposedBy?: string;
  scheduleProposedAt?: string;
  scheduleConfirmedBy?: string;
  scheduleConfirmedAt?: string;
  scheduleRescheduleReason?: string;
  scheduleCancelReason?: string;
  scheduleNoShowReason?: string;
  // Nested objects returned by BE
  checklist?: TaskDetailChecklistInfo;
  assignedUser?: TaskDetailUserInfo;
  createdByUser?: TaskDetailUserInfo;
  assignedDepartment?: TaskDetailDepartmentInfo;
  requiredDocuments?: RequiredDocumentItem[];
  // Collections
  comments?: CommentResponse[];
  attachments?: TaskAttachmentItem[];
  activityLogs?: TaskActivityLogItem[];
}

/** com.sme.onboarding.task.listByOnboarding — query options */
export interface ListTasksByOnboardingOptions {
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

/** com.sme.onboarding.task.listByOnboarding */
export interface TaskListByOnboardingRequest {
  /** BE field name is `onboardingId` — NOT `instanceId` */
  onboardingId: string;
  status?: string;
}

/** Single task in response */
export interface OnboardingTaskResponse {
  taskId: string;
  assigneeUserId: string;
  status: string;
  title?: string;
  dueDate?: string;
}

/** com.sme.onboarding.task.listByOnboarding → response data */
export interface TaskListByOnboardingResponse {
  tasks: OnboardingTaskResponse[];
}

/** com.sme.onboarding.task.generate → response data */
export interface OnboardingTaskGenerationResponse {
  generated: number;
  tasks: OnboardingTaskResponse[];
}

// ---------------------------
// Onboarding Evaluation
// ---------------------------

/** com.sme.onboarding.evaluation.create */
export interface EvaluationCreateRequest {
  instanceId: string;
  milestone: "7" | "30" | "60";
  rating: number;
  notes?: string;
}

/** com.sme.onboarding.evaluation.list */
export interface EvaluationListRequest {
  instanceId: string;
}

/** Single evaluation in response */
export interface EvaluationResponse {
  evaluationId: string;
  instanceId: string;
  milestone: "7" | "30" | "60";
  rating: number;
  notes?: string;
  createdAt?: string;
}

/** com.sme.onboarding.evaluation.list → response data */
export interface EvaluationListResponse {
  evaluations: EvaluationResponse[];
}

// ---------------------------
// Task Comments
// ---------------------------

/** com.sme.onboarding.task.comment.list */
export interface CommentListRequest {
  taskId: string;
}

/** com.sme.onboarding.task.comment.add */
export interface CommentAddRequest {
  taskId: string;
  message: string;
}

/** Single comment in response */
export interface CommentResponse {
  commentId: string;
  taskId: string;
  authorId: string;
  authorName?: string;
  message: string;
  createdAt: string;
}

/** com.sme.onboarding.task.comment.list → response data */
export interface CommentListResponse {
  comments: CommentResponse[];
}

// ---------------------------
// Task Library
// ---------------------------

/** Single item in GET /api/v1/task-libraries response */
export interface TaskLibraryItem {
  templateId: string;
  name: string;
  status: string;
  departmentTypeCode?: string;
  departmentTypeName?: string;
}

/** GET /api/v1/task-libraries → response data */
export interface TaskLibraryListResponse {
  items: TaskLibraryItem[];
  totalCount: number;
  page: number;
  size: number;
}

/** POST /api/v1/task-libraries/import-excel → response data */
export interface TaskLibraryImportResponse {
  templateId: string;
  departmentTypeCode: string;
  created: boolean;
  totalRows: number;
  importedTasks: number;
}
