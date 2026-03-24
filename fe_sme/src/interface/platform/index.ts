// ============================================================
// Platform Admin Module Interfaces
// Maps to BE: modules/platform (new - to be implemented)
// Operations: com.sme.platform.*
// Access: ADMIN + STAFF roles only
// ============================================================

// ---------------------------
// Platform Dashboard Overview
// ---------------------------

/** com.sme.platform.dashboard.overview */
export interface PlatformDashboardOverviewRequest {
  startDate: string;
  endDate: string;
}

export interface PlatformDashboardOverviewResponse {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  totalOnboardingInstances: number;
  activeOnboardingInstances: number;
  completedOnboardingInstances: number;
  platformCompletionRate: number;
  atRiskCount: number;
  [key: string]: unknown;
}

// ---------------------------
// Company Management
// ---------------------------

/** com.sme.platform.company.list */
export interface PlatformCompanyListRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  plan?: string;
  status?: string;
}

export interface PlatformCompanyItem {
  companyId: string;
  name: string;
  industry: string;
  size: string;
  plan: string;
  status: string;
  activeOnboardings: number;
  completionRate: number;
  createdAt: string;
}

export interface PlatformCompanyListResponse {
  items: PlatformCompanyItem[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

/** com.sme.platform.company.get */
export interface PlatformCompanyGetRequest {
  companyId: string;
}

export interface PlatformCompanyDetailResponse {
  companyId: string;
  name: string;
  industry: string;
  size: string;
  plan: string;
  status: string;
  adminEmail: string;
  createdAt: string;
  // Onboarding stats
  totalOnboardings: number;
  activeOnboardings: number;
  completedOnboardings: number;
  cancelledOnboardings: number;
  completionRate: number;
  // Task stats
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  // Department breakdown
  departments: PlatformCompanyDepartmentStat[];
  [key: string]: unknown;
}

export interface PlatformCompanyDepartmentStat {
  departmentId: string;
  departmentName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

// ---------------------------
// Onboarding Monitor (cross-company)
// ---------------------------

/** com.sme.platform.onboarding.overview */
export interface PlatformOnboardingOverviewRequest {
  startDate: string;
  endDate: string;
  page?: number;
  pageSize?: number;
}

export interface PlatformOnboardingCompanyStat {
  companyId: string;
  companyName: string;
  totalInstances: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  completionRate: number;
  atRisk: boolean;
}

export interface PlatformOnboardingOverviewResponse {
  totalInstances: number;
  activeInstances: number;
  completedInstances: number;
  cancelledInstances: number;
  overallCompletionRate: number;
  atRiskCount: number;
  companies: PlatformOnboardingCompanyStat[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

// ---------------------------
// Platform Templates (global shared library)
// ---------------------------

/** com.sme.platform.template.list */
export interface PlatformTemplateListRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface PlatformTemplateItem {
  templateId: string;
  name: string;
  description: string;
  status: string;
  checklistCount: number;
  taskCount: number;
  usedByCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTemplateListResponse {
  items: PlatformTemplateItem[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

/** com.sme.platform.template.create */
export interface PlatformTemplateCreateRequest {
  name: string;
  description?: string;
}

/** com.sme.platform.template.update */
export interface PlatformTemplateUpdateRequest {
  templateId: string;
  name?: string;
  description?: string;
}

/** com.sme.platform.template.publish */
export interface PlatformTemplatePublishRequest {
  templateId: string;
}

/** com.sme.platform.template.archive */
export interface PlatformTemplateArchiveRequest {
  templateId: string;
}
