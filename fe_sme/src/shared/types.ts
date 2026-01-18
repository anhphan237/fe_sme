export type Role =
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_MANAGER'
  | 'PLATFORM_STAFF'
  | 'COMPANY_ADMIN'
  | 'HR'
  | 'MANAGER'
  | 'EMPLOYEE'

export interface Tenant {
  id: string
  name: string
  industry: string
  size: string
  plan: string
}

export interface User {
  id: string
  name: string
  email: string
  roles: Role[]
  companyId: string | null
  department: string
  status: 'Active' | 'Invited' | 'Inactive'
  manager?: string
  createdAt: string
}

export interface RoleDefinition {
  id: string
  name: Role
  permissions: string[]
}

export interface OnboardingStage {
  id: string
  name: string
  tasks: OnboardingTask[]
}

export interface OnboardingTask {
  id: string
  title: string
  ownerRole: Role
  dueOffset: string
  required: boolean
  status?: 'Pending' | 'In Progress' | 'Done'
  dueDate?: string
}

export interface OnboardingComment {
  id: string
  taskId: string
  author: string
  message: string
  createdAt: string
}

export interface OnboardingTemplate {
  id: string
  name: string
  description: string
  stages: OnboardingStage[]
  updatedAt: string
  companyId?: string | null
}

export interface OnboardingInstance {
  id: string
  employeeId: string
  templateId: string
  startDate: string
  progress: number
  status: 'Active' | 'Completed' | 'Paused'
  companyId?: string | null
}

export interface Evaluation {
  id: string
  employeeId: string
  milestone: '7' | '30' | '60'
  rating?: number
  notes?: string
  companyId?: string | null
}

export interface EmployeeProfile {
  id: string
  userId: string
  companyId: string
  departmentId: string
  managerUserId?: string
  title: string
  startDate: string
}

export interface Department {
  id: string
  companyId: string
  name: string
}

export interface ChecklistTemplate {
  id: string
  companyId: string
  name: string
  description?: string
}

export interface TaskTemplate {
  id: string
  companyId: string
  title: string
  ownerRole: Role
  dueOffset: string
}

export interface ChecklistInstance {
  id: string
  companyId: string
  onboardingInstanceId: string
  checklistTemplateId: string
  status: 'Pending' | 'In Progress' | 'Done'
}

export interface TaskInstance {
  id: string
  companyId: string
  onboardingInstanceId: string
  taskTemplateId: string
  assignedUserId: string
  status: 'Pending' | 'In Progress' | 'Done'
}

export interface TaskComment {
  id: string
  taskInstanceId: string
  authorId: string
  message: string
  createdAt: string
}

export interface TaskAttachment {
  id: string
  taskInstanceId: string
  filename: string
  url: string
}

export interface AutomationRule {
  id: string
  companyId: string
  name: string
  trigger: string
  channel: 'email' | 'notification'
  enabled: boolean
}

export interface EmailLog {
  id: string
  companyId: string
  subject: string
  status: 'Sent' | 'Failed'
  sentAt: string
}

export interface Notification {
  id: string
  companyId: string
  title: string
  body: string
  createdAt: string
}

export interface Document {
  id: string
  title: string
  tags: string[]
  required: boolean
  updatedAt: string
  folder: string
  companyId?: string | null
}

export interface DocumentCategory {
  id: string
  companyId: string
  name: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: string
  createdAt: string
}

export interface DocumentAccessRule {
  id: string
  documentId: string
  role: Role
}

export interface Acknowledgment {
  id: string
  documentId: string
  employeeId: string
  progress: number
  acknowledged: boolean
  timestamp?: string
  companyId?: string | null
}

export interface SurveyTemplate {
  id: string
  name: string
  questions: SurveyQuestion[]
  target: '7' | '30' | '60' | 'custom'
  updatedAt: string
  companyId?: string | null
}

export interface SurveyQuestion {
  id: string
  type: 'rating' | 'multiple' | 'text'
  label: string
  options?: string[]
}

export interface SurveyInstance {
  id: string
  employeeId: string
  templateId: string
  dueDate: string
  status: 'Pending' | 'Completed'
  companyId?: string | null
  targetResponderType?: 'MANAGER' | 'EMPLOYEE'
}

export interface SurveyResponse {
  id: string
  surveyId: string
  answers: Record<string, string | number>
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
}

export interface BillingPlan {
  id: string
  name: string
  price: string
  limits: string
  features: string[]
  current?: boolean
}

export interface Invoice {
  id: string
  amount: string
  status: 'Paid' | 'Open' | 'Overdue'
  date: string
  companyId?: string | null
}

export interface UsageMetric {
  label: string
  used: number
  limit: number
}

export interface KnowledgeBaseArticle {
  id: string
  title: string
  content: string
  tags: string[]
  companyId?: string | null
}

export interface Tag {
  id: string
  name: string
}

export interface KbArticleTag {
  id: string
  articleId: string
  tagId: string
}

export interface DiscountCode {
  id: string
  code: string
  amount: string
  status: 'Active' | 'Expired'
}

export interface FinanceSnapshot {
  month: string
  mrr: number
  churn: number
}

export interface AuthTokenPayload {
  user_id: string
  company_id: string | null
  roles: Role[]
}
