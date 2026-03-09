import { useState } from "react";
import {
  Zap,
  Mail,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/i18n";
import {
  apiListAutomationRules,
  apiListEmailLogs,
  apiToggleAutomationRule,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import type {
  AutomationRuleResponse,
  EmailLogResponse,
} from "@/interface/onboarding";

// ── Local Hooks ───────────────────────────────────────────────────────────────

const useAutomationRulesQuery = () =>
  useQuery({
    queryKey: ["automation-rules"],
    queryFn: () => apiListAutomationRules(),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "rules",
        "items",
        "list",
      ) as AutomationRuleResponse[],
  });

const useEmailLogsQuery = () =>
  useQuery({
    queryKey: ["email-logs"],
    queryFn: () => apiListEmailLogs(),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "logs",
        "items",
        "list",
      ) as EmailLogResponse[],
  });

const useToggleAutomationRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => apiToggleAutomationRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
    },
  });
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function RuleRow({
  rule,
  onToggle,
  isToggling,
}: {
  rule: AutomationRuleResponse;
  onToggle: (ruleId: string) => void;
  isToggling: boolean;
}) {
  const { t } = useLocale();
  const channelCls =
    rule.channel === "email"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";

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
          {t("onboarding.automation.rule.trigger_label")}: {rule.trigger}
        </p>
      </div>

      <Pill className={channelCls}>{rule.channel}</Pill>

      <button
        type="button"
        onClick={() => onToggle(rule.ruleId)}
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
}

function EmailLogRow({ log }: { log: EmailLogResponse }) {
  const { t } = useLocale();
  const isSent = log.status === "Sent";
  return (
    <tr className="border-b border-stroke last:border-0">
      <td className="py-3 pr-4 text-sm font-medium text-ink">{log.subject}</td>
      <td className="py-3 pr-4 text-sm text-muted">
        {log.recipientEmail ?? "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-muted">{log.sentAt ?? "—"}</td>
      <td className="py-3">
        <Pill
          className={
            isSent
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }>
          {isSent
            ? t("onboarding.automation.log.status_sent")
            : t("onboarding.automation.log.status_failed")}
        </Pill>
      </td>
    </tr>
  );
}

// ── Shared error state ─────────────────────────────────────────────────────────

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
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
}

// ── Page ───────────────────────────────────────────────────────────────────────

function Automation() {
  const { t } = useLocale();
  const toast = useToast();
  const [tab, setTab] = useState("rules");

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

  const handleToggle = async (ruleId: string) => {
    try {
      await toggleRule.mutateAsync(ruleId);
      toast(t("onboarding.automation.rule.toast.toggled"));
    } catch {
      toast(t("onboarding.automation.rule.toast.failed"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("onboarding.automation.page.title")}
        subtitle={t("onboarding.automation.page.subtitle")}
      />

      <Tabs
        items={[
          { label: t("onboarding.automation.tab.rules"), value: "rules" },
          { label: t("onboarding.automation.tab.logs"), value: "logs" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {/* ─── Rules tab ─────────────────────────────────────────────────────── */}
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
                  isToggling={toggleRule.isPending}
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

      {/* ─── Email Logs tab ────────────────────────────────────────────────── */}
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
}

export default Automation;
