import { useQuery, useMutation } from "@tanstack/react-query";
import type {
  AutomationRuleResponse,
  EmailLogResponse,
} from "@/interface/onboarding";

// TODO: com.sme.onboarding.automation.* operations are not yet implemented in the backend

export const useAutomationRulesQuery = () =>
  useQuery<AutomationRuleResponse[]>({
    queryKey: ["automation-rules"],
    queryFn: () => Promise.resolve([]),
    initialData: [],
  });

export const useEmailLogsQuery = () =>
  useQuery<EmailLogResponse[]>({
    queryKey: ["email-logs"],
    queryFn: () => Promise.resolve([]),
    initialData: [],
  });

export const useToggleAutomationRule = () =>
  useMutation({
    // TODO: com.sme.onboarding.automation.rule.toggle not yet in backend
    mutationFn: (_: { ruleId: string; enabled: boolean }) => Promise.resolve(),
  });
