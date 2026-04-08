import { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Modal,
  Input,
  notification,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import {
  apiGetPlatformFeedbackList,
  apiResolvePlatformFeedback,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type { PlatformFeedbackItem } from "@/interface/platform";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "blue",
  RESOLVED: "green",
  CLOSED: "default",
};

const STATUS_LABEL_KEY: Record<string, string> = {
  OPEN: "platform.feedback.status_open",
  RESOLVED: "platform.feedback.status_resolved",
  CLOSED: "platform.feedback.status_closed",
};

const PlatformFeedback = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const [resolvingItem, setResolvingItem] =
    useState<PlatformFeedbackItem | null>(null);
  const [resolution, setResolution] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["platform-feedback", page, statusFilter],
    queryFn: () =>
      apiGetPlatformFeedbackList({ page, size: 20, status: statusFilter }),
    select: (res: any) => res?.data ?? res,
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      feedbackId,
      resolution,
    }: {
      feedbackId: string;
      resolution?: string;
    }) => apiResolvePlatformFeedback({ feedbackId, resolution }),
    onSuccess: () => {
      notification.success({ message: t("platform.feedback.resolve_success") });
      queryClient.invalidateQueries({ queryKey: ["platform-feedback"] });
      setResolvingItem(null);
      setResolution("");
    },
    onError: () =>
      notification.error({ message: t("platform.feedback.resolve_error") }),
  });

  const columns = [
    {
      title: t("platform.feedback.col_company"),
      dataIndex: "companyName",
      key: "companyName",
      render: (v: string) => (
        <span className="font-medium text-slate-700">{v}</span>
      ),
    },
    {
      title: t("platform.feedback.col_message"),
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (v: string) => (
        <span className="text-sm text-slate-600">{v}</span>
      ),
    },
    {
      title: t("platform.feedback.col_status"),
      dataIndex: "status",
      key: "status",
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] ?? "default"}>{t(STATUS_LABEL_KEY[v] ?? v)}</Tag>
      ),
    },
    {
      title: t("platform.feedback.col_date"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, record: PlatformFeedbackItem) =>
        record.status === "OPEN" ? (
          <Button
            size="small"
            type="primary"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            onClick={() => setResolvingItem(record)}>
            {t("platform.feedback.resolve")}
          </Button>
        ) : null,
    },
  ];

  const items: PlatformFeedbackItem[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("platform.feedback.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("platform.feedback.subtitle")}
          </p>
        </div>
        <Select
          allowClear
          placeholder={t("platform.feedback.filter_status")}
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={[
            { value: "OPEN", label: t("platform.feedback.status_open") },
            { value: "RESOLVED", label: t("platform.feedback.status_resolved") },
            { value: "CLOSED", label: t("platform.feedback.status_closed") },
          ]}
        />
      </div>

      <Card>
        <Table
          dataSource={items}
          columns={columns}
          rowKey="feedbackId"
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

      <Modal
        open={!!resolvingItem}
        title={t("platform.feedback.resolve_modal_title")}
        onCancel={() => {
          setResolvingItem(null);
          setResolution("");
        }}
        onOk={() =>
          resolveMutation.mutate({
            feedbackId: resolvingItem!.feedbackId,
            resolution: resolution || undefined,
          })
        }
        confirmLoading={resolveMutation.isPending}
        okText={t("platform.feedback.resolve")}
        cancelText={t("global.cancel")}>
        <div className="space-y-4 py-2">
          {resolvingItem && (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {resolvingItem.subject}
            </div>
          )}
          <Input.TextArea
            rows={3}
            placeholder={t("platform.feedback.resolution_placeholder")}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default PlatformFeedback;
