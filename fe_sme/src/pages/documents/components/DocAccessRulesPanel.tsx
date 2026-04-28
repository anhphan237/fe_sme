import { useState } from "react";
import { Button, Tag, Select, Divider, Popconfirm, message, Spin } from "antd";
import {
  LockOutlined,
  PlusOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiDocAccessRuleList,
  apiDocAccessRuleAdd,
  apiDocAccessRuleRemove,
} from "@/api/document/editor.api";
import { useLocale } from "@/i18n";
import type { DocAccessRuleItem } from "@/interface/document/editor";

const ROLE_OPTIONS = [
  { label: "HR", value: "HR" },
  { label: "Manager", value: "MANAGER" },
  { label: "Employee", value: "EMPLOYEE" },
  { label: "Admin", value: "ADMIN" },
];

interface DocAccessRulesPanelProps {
  documentId: string;
  /** When false the panel is read-only (no add/remove buttons). */
  canManage: boolean;
}

export default function DocAccessRulesPanel({
  documentId,
  canManage,
}: DocAccessRulesPanelProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [addMode, setAddMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["doc-access-rules", documentId],
    queryFn: () => apiDocAccessRuleList(documentId),
    enabled: Boolean(documentId),
  });

  const rules: DocAccessRuleItem[] = data?.rules ?? [];

  const addMutation = useMutation({
    mutationFn: (role: string) =>
      apiDocAccessRuleAdd(documentId, { roleId: role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-access-rules", documentId] });
      queryClient.invalidateQueries({ queryKey: ["doc-detail", documentId] });
      setAddMode(false);
      setSelectedRole(undefined);
      message.success(t("document.access.rule_added"));
    },
    onError: () => message.error(t("document.access.rule_add_failed")),
  });

  const removeMutation = useMutation({
    mutationFn: (documentAccessRuleId: string) =>
      apiDocAccessRuleRemove(documentAccessRuleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-access-rules", documentId] });
      queryClient.invalidateQueries({ queryKey: ["doc-detail", documentId] });
      message.success(t("document.access.rule_removed"));
    },
    onError: () => message.error(t("document.access.rule_remove_failed")),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Spin size="small" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LockOutlined className="text-base text-brand" />
          <span className="text-sm font-semibold text-ink">
            {t("document.access.rules")}
          </span>
        </div>
        {canManage && !addMode && (
          <Button
            size="small"
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setAddMode(true)}>
            {t("document.access.add_rule")}
          </Button>
        )}
      </div>

      <Divider className="my-2" />

      {rules.length === 0 ? (
        <div className="rounded-lg bg-slate-50 px-3 py-4 text-center">
          <p className="text-xs text-muted">{t("document.access.no_rules")}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {t("document.access.no_rules_desc")}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {rules.map((rule) => (
            <div
              key={rule.documentAccessRuleId}
              className="flex items-center justify-between gap-2 rounded-lg border border-stroke bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                {rule.roleId ? (
                  <UserOutlined className="text-xs text-brand" />
                ) : (
                  <TeamOutlined className="text-xs text-violet-500" />
                )}
                {rule.roleId && (
                  <Tag color="blue" className="m-0 text-xs">
                    {rule.roleId}
                  </Tag>
                )}
                {rule.departmentId && (
                  <Tag color="purple" className="m-0 text-xs">
                    {rule.departmentId}
                  </Tag>
                )}
              </div>
              {canManage && (
                <Popconfirm
                  title={t("document.access.remove_rule_confirm")}
                  onConfirm={() =>
                    removeMutation.mutate(rule.documentAccessRuleId)
                  }
                  okText={t("document.access.remove_rule")}
                  okButtonProps={{ danger: true }}>
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={removeMutation.isPending}
                  />
                </Popconfirm>
              )}
            </div>
          ))}
        </div>
      )}

      {addMode && canManage && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-brand/40 bg-brand/5 p-2.5">
          <Select
            placeholder={t("document.access.select_role")}
            options={ROLE_OPTIONS}
            value={selectedRole}
            onChange={setSelectedRole}
            className="flex-1"
            size="small"
          />
          <Button
            size="small"
            type="primary"
            loading={addMutation.isPending}
            disabled={!selectedRole}
            onClick={() => selectedRole && addMutation.mutate(selectedRole)}>
            {t("document.access.add_rule")}
          </Button>
          <Button
            size="small"
            onClick={() => {
              setAddMode(false);
              setSelectedRole(undefined);
            }}>
            {t("document.batch.cancel")}
          </Button>
        </div>
      )}
    </div>
  );
}
