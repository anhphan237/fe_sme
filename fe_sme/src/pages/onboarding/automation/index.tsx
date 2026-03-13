import { useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Mail,
  Zap,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Tabs } from "@core/components/ui/Tabs";
import { Skeleton } from "@core/components/ui/Skeleton";
import { EmptyState } from "@core/components/ui/EmptyState";
import { Button } from "@core/components/ui/Button";
import { Pill } from "@core/components/ui/Pill";
import { useToast } from "@core/components/ui/Toast";
import { useLocale } from "@/i18n";
import type {
  AutomationRuleResponse,
  EmailLogResponse,
} from "@/interface/onboarding";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TRIGGER_LABELS: Record<string, string> = {
  INSTANCE_ACTIVATED: "Instance activated",
  INSTANCE_COMPLETED: "Instance completed",
  INSTANCE_CANCELLED: "Instance cancelled",
  TASK_DUE: "Task due",
  TASK_COMPLETED: "Task completed",
  EVALUATION_DAY_7: "Evaluation Day 7",
  EVALUATION_DAY_30: "Evaluation Day 30",
  EVALUATION_DAY_60: "Evaluation Day 60",
  WELCOME: "Welcome",
  REMINDER: "Reminder",
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  notification: "Notification",
};

// ---------------------------------------------------------------------------
// TODO stubs â€” backend not yet implemented
// ---------------------------------------------------------------------------
const useAutomationRulesQuery = () =>
  useQuery<AutomationRuleResponse[]>({
    queryKey: ["automation-rules"],
    queryFn: () => Promise.resolve([]),
    initialData: [],
  });

const useEmailLogsQuery = () =>
  useQuery<EmailLogResponse[]>({
    queryKey: ["email-logs"],
    queryFn: () => Promise.resolve([]),
    initialData: [],
  });

const useToggleAutomationRule = () =>
  useMutation({
    mutationFn: (_: { ruleId: string; enabled: boolean }) => Promise.resolve(),
  });

// ---------------------------------------------------------------------------
// Inline sub-components
// ---------------------------------------------------------------------------
const InlineError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <p className="text-sm font-medium text-ink">{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        {t("onboarding.template.error.retry")}
      </Button>
    </div>
  );
};

const RuleRow = ({
  rule,
  onToggle,
  isToggling,
}: {
  rule: AutomationRuleResponse;
  onToggle: (ruleId: string, currentEnabled: boolean) => void;
  isToggling: boolean;
}) => {
  const { t } = useLocale();
  const channelCls =
    rule.channel === "email"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";
  const triggerLabel = TRIGGER_LABELS[rule.trigger] ?? rule.trigger;
  const channelLabel = CHANNEL_LABELS[rule.channel] ?? rule.channel;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-stroke bg-white px-5 py-4 transition hover:shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
        {rule.channel === "email" ? (
          <Mail className="h-4 w-4 text-slate-500" />
        ) : (
          <Zap className="h-4 w-4 text-slate-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{rule.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {t("onboarding.automation.rule.trigger_label")}: {triggerLabel}
        </p>
      </div>
      <Pill className={channelCls}>{channelLabel}</Pill>
      <button
        type="button"
        onClick={() => onToggle(rule.ruleId, rule.enabled)}
        disabled={isToggling}
        aria-label={
          rule.enabled
            ? t("onboarding.automation.rule.disable")
            : t("onboarding.automation.rule.enable")
        }
        className="shrink-0 text-muted transition hover:text-brand disabled:opacity-50">
        {rule.enabled ? (
          <ToggleRight className="h-7 w-7 text-emerald-500" />
        ) : (
          <ToggleLeft className="h-7 w-7" />
        )}
      </button>
    </div>
  );
};

const EmailLogRow = ({ log }: { log: EmailLogResponse }) => {
  const { t } = useLocale();
  const statusCls =
    log.status === "Sent"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-red-50 text-red-600";

  return (
    <tr className="border-b border-stroke last:border-0 hover:bg-slate-50/60">
      <td className="py-3 pr-4 text-sm text-ink">{log.subject}</td>
      <td className="py-3 pr-4 text-sm text-muted">
        {log.recipientEmail ?? "â€”"}
      </td>
      <td className="py-3 pr-4 text-sm text-muted">
        {log.sentAt ? log.sentAt.slice(0, 16).replace("T", " ") : "â€”"}
      </td>
      <td className="py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCls}`}>
          {t(`onboarding.automation.log.status.${log.status.toLowerCase()}`)}
        </span>
      </td>
    </tr>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const Automation = () => {
  const { t } = useLocale();
  const toast = useToast();
  const [tab, setTab] = useState("rules");
  const [pendingRuleId, setPendingRuleId] = useState<string | null>(null);

  const {
    data: rules = [],
    isLoading: rulesLoading,
    isError: rulesError,
    refetch: refetchRules,
  } = useAutomationRulesQuery();

  const {
    data: logs = [],
    isLoading: logsLoading,
    isError: logsError,
    refetch: refetchLogs,
  } = useEmailLogsQuery();

  const toggleRule = useToggleAutomationRule();

  const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
    setPendingRuleId(ruleId);
    try {
      await toggleRule.mutateAsync({ ruleId, enabled: !currentEnabled });
      toast(t("onboarding.automation.rule.toast.toggled"));
    } catch {
      toast(t("onboarding.automation.rule.toast.failed"));
    } finally {
      setPendingRuleId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("onboarding.automation.page.title")}
        subtitle={t("onboarding.automation.page.subtitle")}
      />

      {/* Coming-soon notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-700">
          {t("onboarding.automation.notice.coming_soon")}
        </p>
      </div>

      <Tabs
        items={[
          { label: t("onboarding.automation.tab.rules"), value: "rules" },
          { label: t("onboarding.automation.tab.logs"), value: "logs" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "rules" && (
        <Card>
          {rulesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : rulesError ? (
            <InlineError
              message={t("onboarding.automation.rule.error")}
              onRetry={() => refetchRules()}
            />
          ) : rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule) => (
                <RuleRow
                  key={rule.ruleId}
                  rule={rule}
                  onToggle={handleToggle}
                  isToggling={pendingRuleId === rule.ruleId}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("onboarding.automation.rule.empty_title")}
              description={t("onboarding.automation.rule.empty")}
            />
          )}
        </Card>
      )}

      {tab === "logs" && (
        <Card>
          {logsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : logsError ? (
            <InlineError
              message={t("onboarding.automation.log.error")}
              onRetry={() => refetchLogs()}
            />
          ) : logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stroke text-left">
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted">
                      {t("onboarding.automation.log.col.subject")}
                    </th>
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted">
                      {t("onboarding.automation.log.col.recipient")}
                    </th>
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted">
                      {t("onboarding.automation.log.col.sent_at")}
                    </th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      {t("global.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <EmailLogRow key={log.logId} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title={t("onboarding.automation.log.empty_title")}
              description={t("onboarding.automation.log.empty")}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default Automation;
