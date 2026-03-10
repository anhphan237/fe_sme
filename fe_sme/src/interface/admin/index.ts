// ============================================================
// Admin Module Interfaces
// Maps to BE: modules/analytics, admin endpoints
// Operations: com.sme.analytics.*
// ============================================================

// ---------------------------
// Platform Subscription Metrics
// ---------------------------

/** com.sme.analytics.platform.subscription.metrics */
export interface PlatformSubscriptionMetricsRequest {
  startDate: string;
  endDate: string;
}

// ---------------------------
// Company Onboarding Analytics
// ---------------------------

/** com.sme.analytics.company.onboarding.summary */
export interface CompanyOnboardingSummaryRequest {
  companyId: string;
  startDate?: string;
  endDate?: string;
}

export interface CompanyOnboardingSummaryResponse {
  totalOnboardings: number;
  activeOnboardings: number;
  completedOnboardings: number;
  avgCompletionDays: number;
  [key: string]: unknown;
}

/** com.sme.analytics.company.onboarding.funnel */
export interface CompanyOnboardingFunnelRequest {
  companyId: string;
  startDate?: string;
  endDate?: string;
}

export interface CompanyOnboardingFunnelResponse {
  stages: { stage: string; count: number }[];
  [key: string]: unknown;
}

/** com.sme.analytics.company.onboarding.byDepartment */
export interface CompanyOnboardingByDepartmentRequest {
  companyId: string;
  startDate?: string;
  endDate?: string;
}

export interface CompanyOnboardingByDepartmentResponse {
  departments: { department: string; count: number; avgProgress: number }[];
  [key: string]: unknown;
}

/** com.sme.analytics.company.task.completion */
export interface CompanyTaskCompletionRequest {
  companyId: string;
  startDate?: string;
  endDate?: string;
}

export interface CompanyTaskCompletionResponse {
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  [key: string]: unknown;
}

export interface PlatformSubscriptionMetricsResponse {
  totalSubscriptions: number;
  activeSubscriptions: number;
  mrr: number;
  churn: number;
  [key: string]: unknown;
}
