import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Empty,
  Popconfirm,
  Select,
  Skeleton,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  DeleteOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useLocale } from "@/i18n";
import {
  apiDocAccessRuleAdd,
  apiDocAccessRuleList,
  apiDocAccessRuleRemove,
} from "@/api/document/editor.api";
import type {
  DocAccessRuleItem,
  DocAccessRuleListResponse,
} from "@/interface/document/editor";

interface DocAccessRulesPanelProps {
  documentId: string;
  canManage: boolean;
}

type RoleOptionValue = "HR" | "MANAGER" | "EMPLOYEE" | "ADMIN";

const ROLE_OPTION_VALUES: RoleOptionValue[] = [
  "HR",
  "MANAGER",
  "EMPLOYEE",
  "ADMIN",
];

const getRulesFromResponse = (
  data: DocAccessRuleListResponse | undefined,
): DocAccessRuleItem[] => {
  if (!data) return [];

  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.rules)) return data.rules;

  return [];
};

const getRuleTitle = (rule: DocAccessRuleItem) => {
  return (
    rule.roleName ||
    rule.roleCode ||
    rule.roleId ||
    rule.departmentName ||
    rule.departmentId ||
    "—"
  );
};

const getRuleType = (rule: DocAccessRuleItem) => {
  if (rule.roleId || rule.roleCode || rule.roleName) return "ROLE";
  if (rule.departmentId || rule.departmentName) return "DEPARTMENT";
  return "UNKNOWN";
};

const getRuleStatusColor = (status?: string) => {
  const normalized = status?.toUpperCase();

  if (normalized === "ACTIVE") return "green";
  if (normalized === "INACTIVE") return "default";
  if (normalized === "ARCHIVED") return "default";

  return "blue";
};

export default function DocAccessRulesPanel({
  documentId,
  canManage,
}: DocAccessRulesPanelProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [addMode, setAddMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleOptionValue | undefined>();

  const roleOptions = useMemo(
    () =>
      ROLE_OPTION_VALUES.map((role) => ({
        value: role,
        label: t(`document.access.role.${role.toLowerCase()}`),
      })),
    [t],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["doc-access-rules", documentId],
    queryFn: () => apiDocAccessRuleList(documentId),
    enabled: Boolean(documentId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const rules = getRulesFromResponse(data);

  const existingRoleSet = useMemo(() => {
    return new Set(
      rules
        .map((rule) => rule.roleCode || rule.roleName || rule.roleId)
        .filter(Boolean)
        .map((value) => String(value).toUpperCase()),
    );
  }, [rules]);

  const selectableRoleOptions = useMemo(() => {
    return roleOptions.map((option) => ({
      ...option,
      disabled: existingRoleSet.has(option.value),
    }));
  }, [existingRoleSet, roleOptions]);

  const addMutation = useMutation({
    mutationFn: (role: RoleOptionValue) =>
      apiDocAccessRuleAdd(documentId, {
        roleId: role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doc-access-rules", documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doc-detail", documentId],
      });

      setAddMode(false);
      setSelectedRole(undefined);
      message.success(t("document.access.rule_added"));
    },
    onError: () => {
      message.error(t("document.access.rule_add_failed"));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (documentAccessRuleId: string) =>
      apiDocAccessRuleRemove(documentAccessRuleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doc-access-rules", documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doc-detail", documentId],
      });

      message.success(t("document.access.rule_removed"));
    },
    onError: () => {
      message.error(t("document.access.rule_remove_failed"));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-stroke bg-white px-3 py-3"
          >
            <Skeleton active paragraph={{ rows: 1 }} title={false} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <LockOutlined className="text-base text-brand" />
            <span className="text-sm font-semibold text-ink">
              {t("document.access.rules")}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-muted">
            {t("document.access.rules_desc")}
          </p>
        </div>

        {canManage && !addMode && (
          <Button
            size="small"
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setAddMode(true)}
          >
            {t("document.access.add_rule")}
          </Button>
        )}
      </div>

      <Divider className="my-2" />

      {!canManage && (
        <Alert
          type="info"
          showIcon
          className="rounded-2xl"
          message={t("document.access.readonly_title")}
          description={t("document.access.readonly_desc")}
        />
      )}

      {isFetching && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">
          {t("document.access.refreshing")}
        </div>
      )}

      {addMode && canManage && (
        <div className="rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand">
            <PlusOutlined />
            {t("document.access.add_rule")}
          </div>

          <div className="flex items-center gap-2">
            <Select
              size="small"
              className="min-w-0 flex-1"
              placeholder={t("document.access.select_role")}
              options={selectableRoleOptions}
              value={selectedRole}
              onChange={(value) => setSelectedRole(value)}
              allowClear
            />

            <Button
              size="small"
              type="primary"
              loading={addMutation.isPending}
              disabled={!selectedRole}
              onClick={() => {
                if (selectedRole) addMutation.mutate(selectedRole);
              }}
            >
              {t("document.access.add")}
            </Button>

            <Button
              size="small"
              onClick={() => {
                setAddMode(false);
                setSelectedRole(undefined);
              }}
            >
              {t("document.common.cancel")}
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted">
            {t("document.access.add_rule_hint")}
          </p>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stroke bg-slate-50 px-4 py-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-sm text-muted">
                {t("document.access.no_rules")}
              </span>
            }
          />

          <p className="mx-auto mt-2 max-w-xs text-center text-xs text-slate-400">
            {t("document.access.no_rules_desc")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const ruleType = getRuleType(rule);
            const title = getRuleTitle(rule);
            const status = rule.status || "ACTIVE";

            return (
              <div
                key={rule.documentAccessRuleId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-stroke bg-white px-3 py-3 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    {ruleType === "ROLE" ? (
                      <UserSwitchOutlined />
                    ) : ruleType === "DEPARTMENT" ? (
                      <TeamOutlined />
                    ) : (
                      <SafetyOutlined />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {title}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {ruleType === "ROLE" && (
                        <Tag color="blue" className="m-0 text-xs">
                          {t("document.access.type.role")}
                        </Tag>
                      )}

                      {ruleType === "DEPARTMENT" && (
                        <Tag color="purple" className="m-0 text-xs">
                          {t("document.access.type.department")}
                        </Tag>
                      )}

                      {rule.roleCode && (
                        <Tag className="m-0 text-xs">{rule.roleCode}</Tag>
                      )}

                      {rule.departmentName && (
                        <Tag className="m-0 text-xs">
                          {rule.departmentName}
                        </Tag>
                      )}

                      <Tag
                        color={getRuleStatusColor(status)}
                        className="m-0 text-xs"
                      >
                        {status}
                      </Tag>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <Tooltip title={t("document.access.remove_rule")}>
                    <Popconfirm
                      title={t("document.access.remove_rule_confirm")}
                      okText={t("document.access.remove_rule")}
                      cancelText={t("document.common.cancel")}
                      okButtonProps={{ danger: true }}
                      onConfirm={() =>
                        removeMutation.mutate(rule.documentAccessRuleId)
                      }
                    >
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={removeMutation.isPending}
                      />
                    </Popconfirm>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}