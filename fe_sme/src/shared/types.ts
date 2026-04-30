import type { Role } from "@/enums/Role";
import type { PlatformTemplateItemStatus, PlatformTemplateStage, PlatformTemplateStatus, PlatformTemplateKind } from "@/interface/admin";
export type { Role };

export interface Tenant {
  id: string;
  name: string;
  industry: string;
  size: string;
  plan: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  roles: Role[];
  companyId: string | null;
  department: string;
  departmentId: string | null;
  status: "Active" | "Invited" | "Inactive";
  employeeId?: string | null;
  managerUserId?: string | null;
  manager?: string;
  createdAt: string;
}

/** Response shape của com.sme.identity.user.get (hiển thị user detail) */
export interface UserDetail {
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: "ACTIVE" | "INVITED" | "DISABLED";
  employeeId: string | null;
  departmentId: string | null;
  employeeCode: string | null;
  employeeName: string | null;
  employeeEmail: string | null;
  employeePhone: string | null;
  jobTitle: string | null;
  managerUserId: string | null;
  startDate: string | null;
  workLocation: string | null;
  employeeStatus: string | null;
}

export interface RoleDefinition {
  id: string;
  name: Role;
  permissions: string[];
}

export interface OnboardingStage {
  id: string;
  name: string;
  stageType?: string;
  /** Deadline in days from onboarding start date */
  deadlineDays?: number;
  tasks: OnboardingTask[];
}

export interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  ownerRole: Role;
  /** BE ownerRefId — holds deptId when ownerRole=DEPARTMENT, userId when ownerType=USER */
  ownerRefId?: string | null;
  /** BE ownerType: USER | DEPARTMENT | EMPLOYEE | MANAGER | IT_STAFF | HR */
  ownerType?: string;
  /** Departments that must confirm this task before completion (from TaskTemplateDepartmentCheckpointEntity) */
  responsibleDepartmentIds?: string[];
  dueOffset: string;
  required: boolean;
  /** requireAck flag: employee must acknowledge before marking DONE */
  requireAck?: boolean;
  /** requireDoc flag: employee must attach a document */
  requireDoc?: boolean;
  /** requiresManagerApproval flag: employee must submit PENDING_APPROVAL; cannot set DONE directly */
  requiresManagerApproval?: boolean;
  /** Designated approver user ID (overrides default manager). Used when requiresManagerApproval=true */
  approverUserId?: string;
  /** IDs of document templates required for this task (used in template context) */
  requiredDocumentIds?: string[];
  /** UI-friendly mapped status */
  status?: "Pending" | "In Progress" | "Done" | "Wait Ack" | "Pending Approval";
  /** Raw API status: TODO | IN_PROGRESS | ASSIGNED | WAIT_ACK | PENDING_APPROVAL | DONE */
  rawStatus?: string;
  dueDate?: string;
  checklistId?: string;
  checklistName?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  /** Whether the task is past its due date and not completed */
  overdue?: boolean;
  /** Raw schedule status from API: UNSCHEDULED | PROPOSED | CONFIRMED | RESCHEDULED | CANCELLED | MISSED */
  scheduleStatus?: string;
  approvalStatus?: string;
  /** Onboarding instance ID this task belongs to (populated from listByAssignee) */
  onboardingId?: string;
  /** Reporter: user who created / assigned this task */
  reporterUserId?: string;
  reporterUserName?: string;
  /** Department assigned to this task (ownerType=DEPARTMENT). From BE: assignedDepartmentId */
  assignedDepartmentId?: string;
}

export interface OnboardingComment {
  id: string;
  taskId: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  status?: string;
  /** PLATFORM = global shared library; TENANT = company-owned template */
  level?: "PLATFORM" | "TENANT";
  stages: OnboardingStage[];
  updatedAt: string;
  companyId?: string | null;
}

export interface OnboardingInstance {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  employeeUserId?: string | null;
  managerUserId?: string | null;
  managerName?: string | null;
  templateName?: string | null;
  templateId: string;
  startDate: string;
  progress: number;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  companyId?: string | null;
}

export interface Evaluation {
  id: string;
  employeeId: string;
  milestone: "7" | "30" | "60";
  rating?: number;
  notes?: string;
  companyId?: string | null;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  companyId: string;
  departmentId: string;
  managerUserId?: string;
  title: string;
  startDate: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  type?: string;
  managerUserId?: string | null;
}

export interface ChecklistTemplate {
  id: string;
  companyId: string;
  name: string;
  description?: string;
}

export interface TaskTemplate {
  id: string;
  companyId: string;
  title: string;
  ownerRole: Role;
  dueOffset: string;
}

export interface ChecklistInstance {
  id: string;
  companyId: string;
  onboardingInstanceId: string;
  checklistTemplateId: string;
  status: "Pending" | "In Progress" | "Done";
}

export interface TaskInstance {
  id: string;
  companyId: string;
  onboardingInstanceId: string;
  taskTemplateId: string;
  assignedUserId: string;
  status: "Pending" | "In Progress" | "Done";
}

export interface TaskComment {
  id: string;
  taskInstanceId: string;
  authorId: string;
  message: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  taskInstanceId: string;
  filename: string;
  url: string;
}

export interface AutomationRule {
  id: string;
  companyId: string;
  name: string;
  trigger: string;
  channel: "email" | "notification";
  enabled: boolean;
}

export interface EmailLog {
  id: string;
  companyId: string;
  subject: string;
  status: "Sent" | "Failed";
  sentAt: string;
}

export interface Notification {
  id: string;
  companyId: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  tags: string[];
  required: boolean;
  updatedAt: string;
  folder: string;
  companyId?: string | null;
}

export interface DocumentCategory {
  id: string;
  companyId: string;
  name: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  createdAt: string;
}

export interface DocumentAccessRule {
  id: string;
  documentId: string;
  role: Role;
}

export interface Acknowledgment {
  id: string;
  documentId: string;
  employeeId: string;
  progress: number;
  acknowledged: boolean;
  timestamp?: string;
  companyId?: string | null;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  questions: SurveyQuestion[];
  target: "7" | "30" | "60" | "custom";
  updatedAt: string;
  companyId?: string | null;
}

export interface SurveyQuestion {
  id: string;
  type: "rating" | "multiple" | "text";
  label: string;
  options?: string[];
}

export interface SurveyInstance {
  id: string;
  employeeId: string;
  templateId: string;
  dueDate: string;
  status: "Pending" | "Completed";
  companyId?: string | null;
  targetResponderType?: "MANAGER" | "EMPLOYEE";
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Record<string, string | number>;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  status: string;

  price: string;
  priceYearly: string;
  priceRaw: number;
  priceYearlyRaw: number;

  employeeLimit: number;
  onboardingTemplateLimit: number;
  eventTemplateLimit: number;
  documentLimit: number;

  storageLimitBytes: number;
  storageLimitMb?: number;
  storageLimitGb?: number;
  storageLimitText?: string;

  limits?: string;
  features: string[];
  current?: boolean;
  recommended?: boolean;
}

export interface Subscription {
  subscriptionId: string;
  planCode: string;
  planName?: string;

  status: string;
  billingCycle?: "MONTHLY" | "YEARLY" | string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  autoRenew?: boolean;

  prorateCreditVnd?: number;
  prorateChargeVnd?: number;
  invoiceId?: string;

  paymentRequired?: boolean;
  paymentInvoiceId?: string | null;
  pendingChangeId?: string | null;
  pendingPlanCode?: string | null;
  pendingBillingCycle?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  amount: string;
  amountRaw: number;
  currency: string;
  status: "Paid" | "Open" | "Overdue" | "Draft" | "Void";
  date: string;
  dueDate?: string;
  companyId?: string | null;
  eInvoiceUrl?: string;
}

export interface UsageMetric {
  key?: string;
  label: string;
  used: number;
  limit: number;

  alertLevel?: string;
  limitPercent?: number;
  percent?: number;
  month?: string;

  unit?: "count" | "bytes" | string;
  unlimited?: boolean;
  status?: "OK" | "WARNING" | "EXCEEDED";
  description?: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  companyId?: string | null;
}

export interface Tag {
  id: string;
  name: string;
}

export interface KbArticleTag {
  id: string;
  articleId: string;
  tagId: string;
}

export interface PaymentIntent {
  id: string;
  paymentTransactionId?: string;
  clientSecret: string;
  gateway?: string;
  amount: number;
  currency: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "processing"
    | "succeeded"
    | "canceled";
  invoiceId: string;
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  amount: string;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
  provider: string;
  createdAt: string;
  companyId?: string | null;
}

export interface PaymentProvider {
  name: string;
  status: "Connected" | "Disconnected";
  accountId?: string;
  lastSync?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  amount: string;
  status: "Active" | "Expired";
}

export interface FinanceSnapshot {
  month: string;
  mrr: number;
  churn: number;
}

export interface AuthTokenPayload {
  user_id: string;
  company_id: string | null;
  roles: Role[];
}
export interface PlatformTemplateTaskForm {
  title: string;
  description?: string;
  requireAck?: boolean;
  requireDoc?: boolean;
  requiresManagerApproval?: boolean;
  sortOrder?: number;
  status?: PlatformTemplateItemStatus;
}

export interface PlatformTemplateChecklistForm {
  name: string;
  stage: PlatformTemplateStage;
  deadlineDays: number;
  sortOrder?: number;
  status?: PlatformTemplateItemStatus;
  tasks: PlatformTemplateTaskForm[];
}

export interface PlatformTemplateFormValue {
  name: string;
  description?: string;
  status: PlatformTemplateStatus;
  templateKind: PlatformTemplateKind;
  departmentTypeCode?: string;
  checklists: PlatformTemplateChecklistForm[];
}

export type FormListField = {
  key: number;
  name: number;
  fieldKey?: number;
};

export interface PlatformTemplateTaskForm {
  title: string;
  description?: string;
  ownerType?: string;
  ownerRefId?: string | null;
  dueDaysOffset?: number | null;
  requireAck?: boolean;
  requireDoc?: boolean;
  requiredDocumentIds?: string[];
  requiredDocumentIdsText?: string;
  requiresManagerApproval?: boolean;
  approverUserId?: string | null;
  sortOrder?: number;
  status?: PlatformTemplateItemStatus;
}

export interface PlatformTemplateChecklistForm {
  name: string;
  stage: PlatformTemplateStage;
  deadlineDays: number;
  sortOrder?: number;
  status?: PlatformTemplateItemStatus;
  tasks: PlatformTemplateTaskForm[];
}

export interface PlatformTemplateFormValue {
  name: string;
  description?: string;
  status: PlatformTemplateStatus;
  templateKind: PlatformTemplateKind;
  departmentTypeCode?: string;
  checklists: PlatformTemplateChecklistForm[];
}