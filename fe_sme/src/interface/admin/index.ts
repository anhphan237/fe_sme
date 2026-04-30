// ============================================================
// Admin Module Interfaces
// Maps to BE: modules/analytics, admin endpoints
// Operations: com.sme.analytics.*
// ============================================================

// ---------------------------
// Company Onboarding Analytics
// ---------------------------

/** com.sme.analytics.company.onboarding.summary */
export interface CompanyOnboardingSummaryRequest {
  companyId: string;
  startDate: string;
  endDate: string;
}

export interface CompanyOnboardingSummaryResponse {
  companyId: string;
  totalEmployees: number;
  completedCount: number;
  [key: string]: unknown;
}

/** com.sme.analytics.company.onboarding.funnel */
export interface CompanyOnboardingFunnelRequest {
  companyId: string;
  startDate: string;
  endDate: string;
}

export interface CompanyOnboardingFunnelResponse {
  companyId: string;
  totalInstances: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  otherCount: number;
  [key: string]: unknown;
}

/** com.sme.analytics.company.onboarding.byDepartment */
export interface CompanyOnboardingByDepartmentRequest {
  companyId: string;
  startDate: string;
  endDate: string;
}

export interface CompanyOnboardingDepartmentStat {
  departmentId: string;
  departmentName: string;
  totalTasks: number;
  completedTasks: number;
}

export interface CompanyOnboardingByDepartmentResponse {
  companyId: string;
  departments: CompanyOnboardingDepartmentStat[];
  [key: string]: unknown;
}

/** com.sme.analytics.company.task.completion */
export interface CompanyTaskCompletionRequest {
  companyId: string;
  startDate: string;
  endDate: string;
}

export interface CompanyTaskCompletionResponse {
  companyId: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  [key: string]: unknown;
}

// ============================================================
// Platform Global Onboarding Template
// ============================================================

export type PlatformTemplateStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type PlatformTemplateKind = "ONBOARDING";
export type PlatformTemplateStage =
  | "PREBOARDING"
  | "FIRST_DAY"
  | "WEEK1"
  | "MONTH1"
  | "MONTH2"
  | "CUSTOM";

export type PlatformTemplateItemStatus = "ACTIVE" | "INACTIVE";

export interface PlatformTemplateTaskCreateItem {
  title: string;
  description?: string;
  ownerType?: string;
  ownerRefId?: string | null;
  dueDaysOffset?: number | null;
  requireAck: boolean;
  requireDoc: boolean;
  requiredDocumentIds?: string[];
  requiresManagerApproval: boolean;
  approverUserId?: string | null;
  sortOrder: number;
  status: PlatformTemplateItemStatus;
}

export interface PlatformTemplateChecklistCreateItem {
  name: string;
  stage: PlatformTemplateStage;
  deadlineDays: number;
  sortOrder: number;
  status: PlatformTemplateItemStatus;
  tasks: PlatformTemplateTaskCreateItem[];
}

export interface CreatePlatformTemplateRequest {
  name: string;
  description?: string;
  status: PlatformTemplateStatus;
  createdBy?: string;
  templateKind: PlatformTemplateKind;
  departmentTypeCode?: string;
  checklists: PlatformTemplateChecklistCreateItem[];
}

export interface CreatePlatformTemplateResponse {
  templateId: string;
  name: string;
  status: PlatformTemplateStatus | string;
  templateKind: string;
  departmentTypeCode?: string;
  level?: string;
}

export interface PlatformTemplateListRequest {
  keyword?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface PlatformTemplateListItem {
  templateId: string;
  name: string;
  description?: string;
  status: PlatformTemplateStatus | string;
  templateKind?: string;
  departmentTypeCode?: string;
  level?: string;
  checklistCount?: number;
  taskCount?: number;
  usedByCompanyCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListPlatformTemplateResponse {
  items: PlatformTemplateListItem[];
  total: number;
  page?: number;
  size?: number;
}

export interface PlatformTemplateDetailRequest {
  templateId: string;
}

export interface PlatformTemplateDetailTask {
  checklistTemplateId?: string;
  taskTemplateId: string;
  title: string;
  description?: string;
  ownerType?: string;
  ownerRefId?: string | null;
  dueDaysOffset?: number | null;
  requireAck: boolean;
  requireDoc: boolean;
  requiredDocumentIds?: string[];
  requiresManagerApproval: boolean;
  approverUserId?: string | null;
  sortOrder: number;
  status: string;
}

export interface PlatformTemplateDetailChecklist {
  checklistTemplateId: string;
  name: string;
  stage: PlatformTemplateStage | string;
  deadlineDays: number;
  sortOrder: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  tasks: PlatformTemplateDetailTask[];
}

export interface PlatformTemplateDetailResponse {
  templateId: string;
  name: string;
  description?: string;
  status: PlatformTemplateStatus | string;
  templateKind: string;
  departmentTypeCode?: string;
  level?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  checklistCount?: number;
  taskCount?: number;
  usedByCompanyCount?: number;
  checklists: PlatformTemplateDetailChecklist[];
}

export interface UpdatePlatformTemplateRequest extends CreatePlatformTemplateRequest {
  templateId: string;
}

export interface ActivatePlatformTemplateRequest {
  templateId: string;
}

export interface DeactivatePlatformTemplateRequest {
  templateId: string;
}

export interface DeletePlatformTemplateRequest {
  templateId: string;
}

export interface DeletePlatformTemplateResponse {
  templateId: string;
  deleted: boolean;
}