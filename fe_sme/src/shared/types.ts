export type { Role } from "@/enums/Role";

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
  roles: Role[];
  companyId: string | null;
  department: string;
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
  tasks: OnboardingTask[];
}

export interface OnboardingTask {
  id: string;
  title: string;
  ownerRole: Role;
  dueOffset: string;
  required: boolean;
  status?: "Pending" | "In Progress" | "Done";
  dueDate?: string;
  checklistId?: string;
  checklistName?: string;
  assignedUserId?: string;
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
  stages: OnboardingStage[];
  updatedAt: string;
  companyId?: string | null;
}

export interface OnboardingInstance {
  id: string;
  employeeId: string;
  employeeUserId?: string | null;
  managerUserId?: string | null;
  managerName?: string | null;
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
  price: string;
  priceYearly: string;
  employeeLimit: number;
  limits: string;
  features: string[];
  current?: boolean;
}

export interface Subscription {
  subscriptionId: string;
  planCode: string;
  status: string;
  billingCycle?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  autoRenew?: boolean;
  prorateCreditVnd?: number;
  prorateChargeVnd?: number;
  invoiceId?: string;
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
  label: string;
  used: number;
  limit: number;
  alertLevel?: "NONE" | "APPROACHING" | "EXCEEDED";
  limitPercent?: number;
  month?: string;
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
