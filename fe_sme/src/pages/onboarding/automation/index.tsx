import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/i18n";
import {
  useAutomationRulesQuery,
  useEmailLogsQuery,
  useToggleAutomationRule,
} from "./hooks";
import { RuleRow } from "./RuleRow";
import { EmailLogRow } from "./EmailLogRow";
import { InlineError } from "./InlineError";

function Automation() {
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
}

export default Automation;
