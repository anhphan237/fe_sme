import { gatewayRequest } from "../core/gateway";
import type {
  OnboardingTemplateCreateRequest,
  OnboardingTemplateUpdateRequest,
  OnboardingInstanceCreateRequest,
  CompanySetupRequest,
} from "@/interface/onboarding";

// ── Templates ──────────────────────────────────────────────

/** com.sme.onboarding.template.list */
export const apiListTemplates = (status?: string) =>
  gatewayRequest(
    "com.sme.onboarding.template.list",
    { status: status ?? "ACTIVE" },
    { flatPayload: true },
  );

/** com.sme.onboarding.template.get */
export const apiGetTemplate = (templateId: string) =>
  gatewayRequest("com.sme.onboarding.template.get", { templateId });

/** com.sme.onboarding.template.create */
export const apiCreateTemplate = (payload: OnboardingTemplateCreateRequest) =>
  gatewayRequest("com.sme.onboarding.template.create", payload);

/** com.sme.onboarding.template.update */
export const apiUpdateTemplate = (payload: OnboardingTemplateUpdateRequest) =>
  gatewayRequest("com.sme.onboarding.template.update", payload);

/** com.sme.onboarding.template.delete */
export const apiDeleteTemplate = (templateId: string) =>
  gatewayRequest("com.sme.onboarding.template.delete", { templateId });

// ── Instances ─────────────────────────────────────────────

/** com.sme.onboarding.instance.list */
export const apiListInstances = (params?: {
  employeeId?: string;
  status?: string;
}) =>
  gatewayRequest("com.sme.onboarding.instance.list", params ?? {}, {
    flatPayload: true,
  });

/** com.sme.onboarding.instance.get */
export const apiGetInstance = (instanceId: string) =>
  gatewayRequest("com.sme.onboarding.instance.get", { instanceId });

/** com.sme.onboarding.instance.create */
export const apiCreateInstance = (payload: OnboardingInstanceCreateRequest) =>
  gatewayRequest("com.sme.onboarding.instance.create", payload);

/** com.sme.onboarding.instance.activate */
export const apiActivateInstance = (instanceId: string, requestNo?: string) =>
  gatewayRequest("com.sme.onboarding.instance.activate", {
    instanceId,
    requestNo,
  });

/** com.sme.onboarding.instance.cancel */
export const apiCancelInstance = (instanceId: string, reason?: string) =>
  gatewayRequest("com.sme.onboarding.instance.cancel", { instanceId, reason });

/** com.sme.onboarding.instance.complete */
export const apiCompleteInstance = (instanceId: string) =>
  gatewayRequest("com.sme.onboarding.instance.complete", { instanceId });

// ── Tasks ──────────────────────────────────────────────────

export interface ListTasksByOnboardingOptions {
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

/** com.sme.onboarding.task.listByOnboarding */
export const apiListTasks = (
  onboardingId: string,
  options?: ListTasksByOnboardingOptions,
) =>
  gatewayRequest("com.sme.onboarding.task.listByOnboarding", {
    onboardingId,
    ...(options?.status && { status: options.status }),
    ...(options?.page != null && { page: options.page }),
    ...(options?.size != null && { size: options.size }),
    ...(options?.sortBy && { sortBy: options.sortBy }),
    ...(options?.sortOrder && { sortOrder: options.sortOrder }),
  });

/** com.sme.onboarding.task.updateStatus */
export const apiUpdateTaskStatus = (taskId: string, status: string) =>
  gatewayRequest("com.sme.onboarding.task.updateStatus", { taskId, status });

/** com.sme.onboarding.task.generate */
export const apiGenerateTasks = (
  instanceId: string,
  managerId: string,
  itStaffUserId?: string,
) =>
  gatewayRequest("com.sme.onboarding.task.generate", {
    instanceId,
    managerId,
    itStaffUserId,
  });

/** com.sme.onboarding.task.assign */
export const apiAssignTask = (taskId: string, assigneeUserId: string) =>
  gatewayRequest("com.sme.onboarding.task.assign", { taskId, assigneeUserId });

// ── Other ──────────────────────────────────────────────────

/** com.sme.onboarding.company.setup */
export const apiCompanySetup = (payload?: CompanySetupRequest) =>
  gatewayRequest("com.sme.onboarding.company.setup", payload ?? {});
