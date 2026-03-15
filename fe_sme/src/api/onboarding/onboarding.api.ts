import { gatewayRequest } from "../core/gateway";
import type {
  OnboardingTemplateCreateRequest,
  OnboardingTemplateUpdateRequest,
  OnboardingInstanceCreateRequest,
  CompanySetupRequest,
  ListTasksByOnboardingOptions,
} from "@/interface/onboarding";

// ── Templates ──────────────────────────────────────────────

/** com.sme.onboarding.template.list */
export const apiListTemplates = (params?: {
  status?: string;
  search?: string;
}) =>
  gatewayRequest<{ status: string; search?: string }, unknown>(
    "com.sme.onboarding.template.list",
    { status: params?.status ?? "ACTIVE", search: params?.search },
    { flatPayload: true },
  );

/** com.sme.onboarding.template.get */
export const apiGetTemplate = (templateId: string) =>
  gatewayRequest<{ templateId: string }, unknown>(
    "com.sme.onboarding.template.get",
    { templateId },
  );

/** com.sme.onboarding.template.create */
export const apiCreateTemplate = (payload: OnboardingTemplateCreateRequest) =>
  gatewayRequest<OnboardingTemplateCreateRequest, unknown>(
    "com.sme.onboarding.template.create",
    payload,
  );

/** com.sme.onboarding.template.update */
export const apiUpdateTemplate = (payload: OnboardingTemplateUpdateRequest) =>
  gatewayRequest<OnboardingTemplateUpdateRequest, unknown>(
    "com.sme.onboarding.template.update",
    payload,
  );

// ── Instances ───────────────────────────────────────────────

/** com.sme.onboarding.instance.list */
export const apiListInstances = (params?: {
  employeeId?: string;
  status?: string;
}) =>
  gatewayRequest<{ employeeId?: string; status?: string }, unknown>(
    "com.sme.onboarding.instance.list",
    params ?? {},
    { flatPayload: true },
  );

/** com.sme.onboarding.instance.get */
export const apiGetInstance = (instanceId: string) =>
  gatewayRequest<{ instanceId: string }, unknown>(
    "com.sme.onboarding.instance.get",
    { instanceId },
  );

/** com.sme.onboarding.instance.create */
export const apiCreateInstance = (payload: OnboardingInstanceCreateRequest) =>
  gatewayRequest<OnboardingInstanceCreateRequest, unknown>(
    "com.sme.onboarding.instance.create",
    payload,
  );

/** com.sme.onboarding.instance.activate */
export const apiActivateInstance = (instanceId: string, requestNo?: string) =>
  gatewayRequest<{ instanceId: string; requestNo?: string }, unknown>(
    "com.sme.onboarding.instance.activate",
    { instanceId, requestNo },
  );

/** com.sme.onboarding.instance.cancel */
export const apiCancelInstance = (instanceId: string, reason?: string) =>
  gatewayRequest<{ instanceId: string; reason?: string }, unknown>(
    "com.sme.onboarding.instance.cancel",
    { instanceId, reason },
  );

/** com.sme.onboarding.instance.complete */
export const apiCompleteInstance = (instanceId: string) =>
  gatewayRequest<{ instanceId: string }, unknown>(
    "com.sme.onboarding.instance.complete",
    { instanceId },
  );

// ── Tasks ──────────────────────────────────────────────────

/** com.sme.onboarding.task.listByOnboarding */
export const apiListTasks = (
  onboardingId: string,
  options?: ListTasksByOnboardingOptions,
) =>
  gatewayRequest<Record<string, unknown>, unknown>(
    "com.sme.onboarding.task.listByOnboarding",
    {
      onboardingId,
      ...(options?.status && { status: options.status }),
      ...(options?.page != null && { page: options.page }),
      ...(options?.size != null && { size: options.size }),
      ...(options?.sortBy && { sortBy: options.sortBy }),
      ...(options?.sortOrder && { sortOrder: options.sortOrder }),
    },
  );

/** com.sme.onboarding.task.detail */
export const apiGetTaskDetail = (taskId: string) =>
  gatewayRequest<{ taskId: string }, unknown>(
    "com.sme.onboarding.task.detail",
    { taskId },
  );

/** com.sme.onboarding.task.updateStatus */
export const apiUpdateTaskStatus = (taskId: string, status: string) =>
  gatewayRequest<{ taskId: string; status: string }, unknown>(
    "com.sme.onboarding.task.updateStatus",
    { taskId, status },
  );

/** com.sme.onboarding.task.generate */
export const apiGenerateTasks = (
  instanceId: string,
  managerId: string,
  itStaffUserId?: string,
) =>
  gatewayRequest<
    { instanceId: string; managerId: string; itStaffUserId?: string },
    unknown
  >("com.sme.onboarding.task.generate", {
    instanceId,
    managerId,
    itStaffUserId,
  });

/** com.sme.onboarding.task.assign */
export const apiAssignTask = (taskId: string, assigneeUserId: string) =>
  gatewayRequest<{ taskId: string; assigneeUserId: string }, unknown>(
    "com.sme.onboarding.task.assign",
    { taskId, assigneeUserId },
  );

// ── Other ──────────────────────────────────────────────────

/** com.sme.onboarding.company.setup */
export const apiCompanySetup = (payload?: CompanySetupRequest) =>
  gatewayRequest<CompanySetupRequest, unknown>(
    "com.sme.onboarding.company.setup",
    payload ?? {},
  );
