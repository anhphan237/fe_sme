import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, RefreshCw, SendHorizonal, Zap } from "lucide-react";
import {
  apiListAutomationRules,
  apiListEmailLogs,
  apiSendTestEmail,
  apiToggleAutomationRule,
} from "@/api/onboarding/automation.api";
import {
  Button,
  Empty,
  Form,
  Input,
  message,
  Select,
  Skeleton,
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
// Template config for the self-test tab
// ---------------------------------------------------------------------------
const TEMPLATES = [
  {
    code: "WELCOME_NEW_EMPLOYEE",
    label: "Welcome New Employee",
    variables: ["employeeName", "companyName", "startDate"],
  },
  {
    code: "PRE_FIRST_DAY",
    label: "Pre First Day",
    variables: ["employeeName", "companyName", "startDate"],
  },
  {
    code: "TASK_REMINDER",
    label: "Task Reminder",
    variables: ["employeeName", "taskTitle", "dueDate"],
  },
];

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
      description={<span className="text-sm text-red-500">{msg}</span>}>
      <Button onClick={onRetry} icon={<RefreshCw className="h-3.5 w-3.5" />}>
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
  const triggerLabel =
    t(`onboarding.automation.rule.trigger.${rule.trigger}`) ?? rule.trigger;
  const channelLabel =
    t(`onboarding.automation.rule.channel.${rule.channel}`) ?? rule.channel;
  const channelColor = rule.channel === "email" ? "blue" : "purple";

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition hover:shadow-sm ${
        rule.enabled
          ? "border-primary/20 bg-primary/5"
          : "border-stroke bg-white opacity-60"
      }`}>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          rule.enabled ? "bg-primary/10" : "bg-slate-100"
        }`}>
        {rule.channel === "email" ? (
          <Mail
            className={`h-4 w-4 ${rule.enabled ? "text-primary" : "text-slate-400"}`}
          />
        ) : (
          <Zap
            className={`h-4 w-4 ${rule.enabled ? "text-primary" : "text-slate-400"}`}
          />
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
  const statusKey = log.status?.toLowerCase() === "sent" ? "sent" : "failed";
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
        <Tag color={statusKey === "sent" ? "success" : "error"}>
          {t(`onboarding.automation.log.status.${statusKey}`)}
        </Tag>
      </td>
    </tr>
  );
};

// ---------------------------------------------------------------------------
// Test Email tab component
// ---------------------------------------------------------------------------
const TestEmailTab = () => {
  const { t } = useLocale();
  const [form] = Form.useForm<{
    templateCode: string;
    toEmail: string;
    [key: string]: string;
  }>();
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof TEMPLATES)[number] | null
  >(null);

  const sendMutation = useMutation({ mutationFn: apiSendTestEmail });

  const handleTemplateChange = (code: string) => {
    const tpl = TEMPLATES.find((t) => t.code === code) ?? null;
    setSelectedTemplate(tpl);
    // Clear old variable fields
    const clearFields: Record<string, string> = {};
    TEMPLATES.forEach((t) =>
      t.variables.forEach((v) => {
        clearFields[v] = "";
      }),
    );
    form.setFieldsValue(clearFields);
  };

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      const { templateCode, toEmail, ...rest } = values;
      const placeholders: Record<string, string> = {};
      if (selectedTemplate) {
        selectedTemplate.variables.forEach((v) => {
          if (rest[v]) placeholders[v] = rest[v];
        });
      }
      await sendMutation.mutateAsync({ templateCode, toEmail, placeholders });
      message.success(t("onboarding.automation.test.success"));
      form.resetFields();
      setSelectedTemplate(null);
    } catch {
      if (sendMutation.isError) {
        message.error(t("onboarding.automation.test.failed"));
      }
    }
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-6">
      <div className="mb-6">
        <Typography.Title level={5} className="!mb-1">
          {t("onboarding.automation.test.title")}
        </Typography.Title>
        <Typography.Text type="secondary" className="text-sm">
          {t("onboarding.automation.test.subtitle")}
        </Typography.Text>
      </div>

      <Form form={form} layout="vertical" className="max-w-lg">
        <Form.Item
          name="templateCode"
          label={t("onboarding.automation.test.template_label")}
          rules={[{ required: true }]}>
          <Select
            placeholder={t("onboarding.automation.test.template_placeholder")}
            onChange={handleTemplateChange}
            options={TEMPLATES.map((tpl) => ({
              value: tpl.code,
              label: tpl.label,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="toEmail"
          label={t("onboarding.automation.test.recipient_label")}
          rules={[
            { required: true },
            { type: "email", message: "Invalid email address" },
          ]}>
          <Input
            placeholder={t("onboarding.automation.test.recipient_placeholder")}
            prefix={<Mail className="h-3.5 w-3.5 text-muted" />}
          />
        </Form.Item>

        {selectedTemplate && (
          <>
            <Typography.Text
              strong
              className="mb-3 block text-sm text-ink/70">
              {t("onboarding.automation.test.variables_label")}
            </Typography.Text>
            {selectedTemplate.variables.map((varName) => (
              <Form.Item
                key={varName}
                name={varName}
                label={
                  <span className="font-mono text-xs text-primary">
                    {`{{${varName}}}`}
                  </span>
                }>
                <Input placeholder={varName} />
              </Form.Item>
            ))}
          </>
        )}

        <Form.Item className="mb-0 mt-2">
          <Button
            type="primary"
            icon={<SendHorizonal className="h-4 w-4" />}
            loading={sendMutation.isPending}
            onClick={handleSend}
            className="flex items-center gap-2">
            {t("onboarding.automation.test.send_btn")}
          </Button>
        </Form.Item>
      </Form>
    </div>
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
      label: (
        <span className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          {t("onboarding.automation.tab.rules")}
        </span>
      ),
      children: (
        <div className="space-y-3">
          {rulesLoading ? (
            <div className="space-y-3">
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
            </div>
          ) : rulesError ? (
            <InlineError
              message={t("onboarding.automation.rule.error")}
              onRetry={refetchRules}
            />
          ) : rules.length > 0 ? (
            rules.map((rule) => (
              <RuleRow
                key={rule.ruleId}
                rule={rule}
                onToggle={handleToggle}
                isToggling={pendingRuleId === rule.ruleId}
              />
            ))
          ) : (
            <div className="rounded-xl border border-stroke bg-white py-12">
              <Empty description={t("onboarding.automation.rule.empty")} />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "logs",
      label: (
        <span className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          {t("onboarding.automation.tab.logs")}
        </span>
      ),
      children: (
        <div className="rounded-xl border border-stroke bg-white p-4">
          {logsLoading ? (
            <div className="space-y-3">
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
            </div>
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
        </div>
      ),
    },
    {
      key: "test",
      label: (
        <span className="flex items-center gap-1.5">
          <SendHorizonal className="h-3.5 w-3.5" />
          {t("onboarding.automation.tab.test")}
        </span>
      ),
      children: <TestEmailTab />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {t("onboarding.automation.page.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("onboarding.automation.page.subtitle")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultActiveKey="rules" items={tabItems} />
    </div>
  );
};

export default Automation;

