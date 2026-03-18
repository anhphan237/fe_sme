import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Mail, RefreshCw, Zap } from "lucide-react";
import {
  apiListAutomationRules,
  apiListEmailLogs,
  apiToggleAutomationRule,
} from "@/api/onboarding/automation.api";
import {
  Alert,
  Button,
  Card,
  Empty,
  message,
  Skeleton,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from "antd";
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
// Sub-components
// ---------------------------------------------------------------------------
const InlineError = ({
  message: msg,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => {
  const { t } = useLocale();
  return (
    <Empty
      image={<AlertTriangle className="mx-auto h-10 w-10 text-red-400" />}
      description={<span className="text-sm text-ink">{msg}</span>}>
      <Button onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        {t("onboarding.template.error.retry")}
      </Button>
    </Empty>
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
  const triggerLabel = TRIGGER_LABELS[rule.trigger] ?? rule.trigger;
  const channelLabel = CHANNEL_LABELS[rule.channel] ?? rule.channel;
  const channelColor = rule.channel === "email" ? "blue" : "purple";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-stroke bg-white px-5 py-4 transition hover:shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
        {rule.channel === "email" ? (
          <Mail className="h-4 w-4 text-slate-500" />
        ) : (
          <Zap className="h-4 w-4 text-slate-500" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <Typography.Text strong className="block truncate">
          {rule.name}
        </Typography.Text>
        <Typography.Text type="secondary" className="block truncate text-xs">
          {t("onboarding.automation.rule.trigger_label")}: {triggerLabel}
        </Typography.Text>
      </div>
      <Tag color={channelColor}>{channelLabel}</Tag>
      <Switch
        checked={rule.enabled}
        loading={isToggling}
        onChange={() => onToggle(rule.ruleId, rule.enabled)}
        aria-label={
          rule.enabled
            ? t("onboarding.automation.rule.disable")
            : t("onboarding.automation.rule.enable")
        }
      />
    </div>
  );
};

const EmailLogRow = ({ log }: { log: EmailLogResponse }) => {
  const { t } = useLocale();

  return (
    <tr className="border-b border-stroke last:border-0 hover:bg-slate-50/60">
      <td className="py-3 pr-4 text-sm text-ink">{log.subject}</td>
      <td className="py-3 pr-4 text-sm text-muted">
        {log.recipientEmail ?? "-"}
      </td>
      <td className="py-3 pr-4 text-sm text-muted">
        {log.sentAt ? log.sentAt.slice(0, 16).replace("T", " ") : "-"}
      </td>
      <td className="py-3">
        <Tag color={log.status === "Sent" ? "success" : "error"}>
          {t(`onboarding.automation.log.status.${log.status.toLowerCase()}`)}
        </Tag>
      </td>
    </tr>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const Automation = () => {
  const { t } = useLocale();
  const [pendingRuleId, setPendingRuleId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: rules = [],
    isLoading: rulesLoading,
    isError: rulesError,
    refetch: refetchRules,
  } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: apiListAutomationRules,
  });

  const {
    data: logs = [],
    isLoading: logsLoading,
    isError: logsError,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["automation-email-logs"],
    queryFn: apiListEmailLogs,
  });

  const toggleMutation = useMutation({
    mutationFn: apiToggleAutomationRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
    },
  });

  const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
    setPendingRuleId(ruleId);
    try {
      await toggleMutation.mutateAsync({ ruleId, enabled: !currentEnabled });
      message.success(t("onboarding.automation.rule.toast.toggled"));
    } catch {
      message.error(t("onboarding.automation.rule.toast.failed"));
    } finally {
      setPendingRuleId(null);
    }
  };

  const tabItems = [
    {
      key: "rules",
      label: t("onboarding.automation.tab.rules"),
      children: (
        <Card>
          {rulesLoading ? (
            <Space direction="vertical" size={12} className="w-full">
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
            </Space>
          ) : rulesError ? (
            <InlineError
              message={t("onboarding.automation.rule.error")}
              onRetry={refetchRules}
            />
          ) : rules.length > 0 ? (
            <Space direction="vertical" size={12} className="w-full">
              {rules.map((rule) => (
                <RuleRow
                  key={rule.ruleId}
                  rule={rule}
                  onToggle={handleToggle}
                  isToggling={pendingRuleId === rule.ruleId}
                />
              ))}
            </Space>
          ) : (
            <Empty description={t("onboarding.automation.rule.empty")} />
          )}
        </Card>
      ),
    },
    {
      key: "logs",
      label: t("onboarding.automation.tab.logs"),
      children: (
        <Card>
          {logsLoading ? (
            <Space direction="vertical" size={12} className="w-full">
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
            </Space>
          ) : logsError ? (
            <InlineError
              message={t("onboarding.automation.log.error")}
              onRetry={refetchLogs}
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
            <Empty description={t("onboarding.automation.log.empty")} />
          )}
        </Card>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} className="w-full">
      <Space direction="vertical" size={4}>
        <Typography.Title level={4} className="!mb-0">
          {t("onboarding.automation.page.title")}
        </Typography.Title>
        <Typography.Text type="secondary">
          {t("onboarding.automation.page.subtitle")}
        </Typography.Text>
      </Space>

      <Alert
        type="warning"
        showIcon
        message={t("onboarding.automation.notice.coming_soon")}
      />

      <Tabs defaultActiveKey="rules" items={tabItems} />
    </Space>
  );
};

export default Automation;
