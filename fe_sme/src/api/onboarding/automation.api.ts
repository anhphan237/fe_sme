import { gatewayRequest } from "../core/gateway";
import type {
  AutomationRuleListResponse,
  AutomationRuleResponse,
  AutomationRuleToggleRequest,
  EmailLogListResponse,
  EmailLogResponse,
} from "@/interface/onboarding";

/** com.sme.automation.rule.list */
export const apiListAutomationRules = (): Promise<AutomationRuleResponse[]> =>
  gatewayRequest<Record<string, never>, AutomationRuleListResponse>(
    "com.sme.automation.rule.list",
    {},
  ).then((res) => (res as AutomationRuleListResponse).rules ?? []);

/** com.sme.automation.rule.toggle */
export const apiToggleAutomationRule = (
  payload: AutomationRuleToggleRequest,
): Promise<void> =>
  gatewayRequest<AutomationRuleToggleRequest, unknown>(
    "com.sme.automation.rule.toggle",
    payload,
  ).then(() => undefined);

/** com.sme.automation.email.log.list */
export const apiListEmailLogs = (): Promise<EmailLogResponse[]> =>
  gatewayRequest<Record<string, never>, EmailLogListResponse>(
    "com.sme.automation.email.log.list",
    {},
  ).then((res) => (res as EmailLogListResponse).logs ?? []);
