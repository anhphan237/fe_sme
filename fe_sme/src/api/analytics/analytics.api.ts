import { gatewayRequest } from "../core/gateway";

// ── Types ──────────────────────────────────────────────────

export interface CandidateScoreItem {
  rank: number;
  instanceId: string;
  employeeId: string;
  progressPercent: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  lateCompletedTasks: number;
  completionRate: number;
  qualityScore: number;
}

export interface ScoreboardResponse {
  companyId: string;
  templateId: string;
  status: string;
  totalCandidates: number;
  candidates: CandidateScoreItem[];
}

export interface OnboardingSummaryResponse {
  companyId: string;
  totalEmployees: number;
  completedCount: number;
}

export interface OnboardingFunnelResponse {
  companyId: string;
  totalInstances: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  otherCount: number;
}

export interface DepartmentOnboardingStats {
  departmentId: string;
  departmentName: string;
  totalTasks: number;
  completedTasks: number;
}

export interface OnboardingByDepartmentResponse {
  companyId: string;
  departments: DepartmentOnboardingStats[];
}

export interface TaskCompletionResponse {
  companyId: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface ManagerTeamAtRiskItem {
  employeeId?: string;
  employeeName?: string;
  fullName?: string;
  role?: string;
  title?: string;
  daysOverdue?: number;
  overdueDays?: number;
  taskCount?: number;
  overdueTaskCount?: number;
  pendingTaskCount?: number;
}

export interface ManagerTeamSummaryResponse {
  totalMembers?: number;
  activeOnboarding?: number;
  completedOnboarding?: number;
  pendingTasks?: number;
  atRiskEmployees?: ManagerTeamAtRiskItem[];
}

// ── Analytics APIs ─────────────────────────────────────────

/** com.sme.analytics.onboarding.template.scoreboard
 *  Ranks employees on a template by quality score.
 *  qualityScore = completionRate - (overdue×10) - (lateCompleted×5), 0-100
 */
export const apiGetOnboardingScoreboard = (params: {
  companyId?: string;
  templateId: string;
  status?: string;
  limit?: number;
}) =>
  gatewayRequest<typeof params, ScoreboardResponse>(
    "com.sme.analytics.onboarding.template.scoreboard",
    params,
    { flatPayload: true },
  );

/** com.sme.analytics.company.onboarding.summary */
export const apiGetOnboardingSummary = (params?: {
  startDate?: string;
  endDate?: string;
}) =>
  gatewayRequest<Record<string, unknown>, OnboardingSummaryResponse>(
    "com.sme.analytics.company.onboarding.summary",
    params ?? {},
    { flatPayload: true },
  );

/** com.sme.analytics.company.onboarding.funnel */
export const apiGetOnboardingFunnel = (params?: {
  startDate?: string;
  endDate?: string;
}) =>
  gatewayRequest<Record<string, unknown>, OnboardingFunnelResponse>(
    "com.sme.analytics.company.onboarding.funnel",
    params ?? {},
    { flatPayload: true },
  );

/** com.sme.analytics.company.onboarding.byDepartment */
export const apiGetOnboardingByDepartment = (params?: {
  startDate?: string;
  endDate?: string;
}) =>
  gatewayRequest<Record<string, unknown>, OnboardingByDepartmentResponse>(
    "com.sme.analytics.company.onboarding.byDepartment",
    params ?? {},
    { flatPayload: true },
  );

/** com.sme.analytics.company.task.completion */
export const apiGetTaskCompletion = (params?: {
  startDate?: string;
  endDate?: string;
}) =>
  gatewayRequest<Record<string, unknown>, TaskCompletionResponse>(
    "com.sme.analytics.company.task.completion",
    params ?? {},
    { flatPayload: true },
  );

/** com.sme.analytics.manager.team.summary */
export const apiGetManagerTeamSummary = (params?: {
  startDate?: string;
  endDate?: string;
}) =>
  gatewayRequest<Record<string, unknown>, ManagerTeamSummaryResponse>(
    "com.sme.analytics.manager.team.summary",
    params ?? {},
    { flatPayload: true },
  );
