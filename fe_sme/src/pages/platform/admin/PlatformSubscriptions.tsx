import { useState } from "react";
import { Card, Table, Tag, Button, Select, Modal, notification } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import {
  apiGetPlatformSubscriptionList,
  apiRetryDunning,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type { PlatformSubscriptionItem } from "@/interface/platform";

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green",
  TRIAL: "gold",
  PAST_DUE: "red",
  CANCELLED: "default",
  SUSPENDED: "orange",
};

const PlatformSubscriptions = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["platform-subscriptions", page, statusFilter],
    queryFn: () =>
      apiGetPlatformSubscriptionList({
        page,
        pageSize: 20,
        status: statusFilter,
      }),
    select: (res: any) => res?.data ?? res,
  });

  const retryMutation = useMutation({
    mutationFn: (subscriptionId: string) => apiRetryDunning({ subscriptionId }),
    onSuccess: () => {
      notification.success({
        message: t("platform.subscriptions.retry_success"),
      });
      queryClient.invalidateQueries({ queryKey: ["platform-subscriptions"] });
    },
    onError: () => {
      notification.error({ message: t("platform.subscriptions.retry_error") });
    },
  });

  const handleRetry = (sub: PlatformSubscriptionItem) => {
    Modal.confirm({
      title: t("platform.subscriptions.retry_confirm_title"),
      content: t("platform.subscriptions.retry_confirm_body"),
      okText: t("global.confirm"),
      cancelText: t("global.cancel"),
      onOk: () => retryMutation.mutate(sub.subscriptionId),
    });
  };

  const columns = [
    {
      title: t("platform.subscriptions.col_company"),
      dataIndex: "companyName",
      key: "companyName",
      render: (v: string) => (
        <span className="font-medium text-slate-700">{v}</span>
      ),
    },
    {
      title: t("platform.subscriptions.col_plan"),
      dataIndex: "plan",
      key: "plan",
    },
    {
      title: t("platform.subscriptions.col_status"),
      dataIndex: "status",
      key: "status",
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] ?? "default"}>{v}</Tag>
      ),
    },
    {
      title: t("platform.subscriptions.col_billing"),
      dataIndex: "billingCycle",
      key: "billingCycle",
    },
    {
      title: t("platform.subscriptions.col_renewal"),
      dataIndex: "nextRenewal",
      key: "nextRenewal",
    },
    {
      title: t("platform.subscriptions.col_amount"),
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => `$${v?.toLocaleString() ?? "—"}`,
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, record: PlatformSubscriptionItem) =>
        record.status === "PAST_DUE" ? (
          <Button
            size="small"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            loading={
              retryMutation.isPending &&
              retryMutation.variables === record.subscriptionId
            }
            onClick={() => handleRetry(record)}>
            {t("platform.subscriptions.retry_payment")}
          </Button>
        ) : null,
    },
  ];

  const items: PlatformSubscriptionItem[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("platform.subscriptions.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("platform.subscriptions.subtitle")}
          </p>
        </div>
        <Select
          allowClear
          placeholder={t("platform.subscriptions.filter_status")}
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "TRIAL", label: "Trial" },
            { value: "PAST_DUE", label: "Past Due" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "SUSPENDED", label: "Suspended" },
          ]}
        />
      </div>

      <Card>
        <Table
          dataSource={items}
          columns={columns}
          rowKey="subscriptionId"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
};

export default PlatformSubscriptions;
