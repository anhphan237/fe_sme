export type Role = 'HR Admin' | 'Manager' | 'Employee' | 'Super Admin'

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
  role: Role
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
}

export interface OnboardingInstance {
  id: string
  employeeId: string
  templateId: string
  startDate: string
  progress: number
  status: 'Active' | 'Completed' | 'Paused'
}

export interface Evaluation {
  id: string
  employeeId: string
  milestone: '7' | '30' | '60'
  rating?: number
  notes?: string
}

export interface Document {
  id: string
  title: string
  tags: string[]
  required: boolean
  updatedAt: string
  folder: string
}

export interface Acknowledgment {
  id: string
  documentId: string
  employeeId: string
  progress: number
  acknowledged: boolean
  timestamp?: string
}

export interface SurveyTemplate {
  id: string
  name: string
  questions: SurveyQuestion[]
  target: '7' | '30' | '60' | 'custom'
  updatedAt: string
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

