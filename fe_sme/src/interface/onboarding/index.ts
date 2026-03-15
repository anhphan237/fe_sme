// ============================================================
// Onboarding Module Interfaces
// Maps to BE: modules/onboarding
// Operations: com.sme.onboarding.*
// ============================================================

import type { Role } from "../common";

// ---------------------------
// Onboarding Template
// ---------------------------

/** Item inside OnboardingTemplateCreateRequest.checklists[].tasks[] */
export interface TaskTemplateCreateItem {
  /** BE field is `title` — must NOT be sent as `name` or task is silently skipped */
  title: string;
  /** USER | DEPARTMENT | ROLE */
  ownerType?: string;
  ownerRefId: Role;
  dueDaysOffset?: number;
  requireAck?: boolean;
  description?: string;
  sortOrder?: number;
}

/** Item inside OnboardingTemplateCreateRequest.checklists[] */
export interface ChecklistTemplateCreateItem {
  name: string;
  /** BE stage type: PRE_BOARDING | DAY_1 | DAY_7 | DAY_30 | DAY_60 */
  stage?: string;
  sortOrder?: number;
  tasks: TaskTemplateCreateItem[];
}

/** com.sme.onboarding.template.create */
export interface OnboardingTemplateCreateRequest {
  name: string;
  description?: string;
  /** default: ACTIVE */
  status?: string;
  createdBy?: string;
  checklists?: ChecklistTemplateCreateItem[];
}

/** com.sme.onboarding.template.update */
export interface OnboardingTemplateUpdateRequest {
  templateId: string;
  name?: string;
  description?: string;
  status?: string;
  checklists?: ChecklistTemplateCreateItem[];
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
  /** BE returns `title`; mapper also checks `name` as fallback */
  title?: string;
  name: string;
  ownerRefId: Role;
  ownerType?: string;
  dueDaysOffset: number;
  requireAck: boolean;
  description?: string;
  sortOrder?: number;
}

/** Detailed checklist in a template */
export interface ChecklistTemplateDetail {
  checklistTemplateId: string;
  name: string;
  /** BE stage type: PRE_BOARDING | DAY_1 | DAY_7 | DAY_30 | DAY_60 */
  stage?: string;
  sortOrder?: number;
  tasks: TaskTemplateDetail[];
}

/** com.sme.onboarding.template.get → full response */
export interface OnboardingTemplateGetResponse {
  templateId: string;
  name: string;
  description: string;
  status: string;
  checklists: ChecklistTemplateDetail[];
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
}

/** com.sme.onboarding.task.assign */
export interface OnboardingTaskAssignRequest {
  taskId: string;
  assigneeUserId: string;
}

/** com.sme.onboarding.task.updateStatus */
export interface OnboardingTaskUpdateStatusRequest {
  taskId: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
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
  instanceId: string;
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
// Automation Rules
// ---------------------------

/** com.sme.onboarding.automation.rule.list */
export interface AutomationRuleListRequest {
  companyId?: string;
}

/** Single automation rule */
export interface AutomationRuleResponse {
  ruleId: string;
  name: string;
  trigger: string;
  channel: "email" | "notification";
  enabled: boolean;
}

/** com.sme.onboarding.automation.rule.toggle */
export interface AutomationRuleToggleRequest {
  ruleId: string;
  enabled: boolean;
}

/** com.sme.onboarding.automation.rule.list → response data */
export interface AutomationRuleListResponse {
  rules: AutomationRuleResponse[];
}

// ---------------------------
// Email Logs
// ---------------------------

/** com.sme.onboarding.automation.email.list */
export interface EmailLogListRequest {
  page?: number;
  size?: number;
}

/** Single email log entry */
export interface EmailLogResponse {
  logId: string;
  subject: string;
  recipientEmail?: string;
  status: "Sent" | "Failed";
  sentAt: string;
}

/** com.sme.onboarding.automation.email.list → response data */
export interface EmailLogListResponse {
  logs: EmailLogResponse[];
}
