import { Avatar, Badge, Skeleton, Table, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { EyeOutlined, SafetyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { apiDocReadList } from "@/api/document/editor.api";
import { useLocale } from "@/i18n";
import type { DocReadListItem } from "@/interface/document/editor";

interface DocReadListPanelProps {
  documentId: string;
}

export default function DocReadListPanel({ documentId }: DocReadListPanelProps) {
  const { t } = useLocale();

  const { data, isLoading } = useQuery({
    queryKey: ["doc-reads", documentId],
    queryFn: () => apiDocReadList(documentId),
    enabled: Boolean(documentId),
    staleTime: 60_000,
  });

  const items: DocReadListItem[] = data?.items ?? [];
  const readCount = items.filter((r) => r.status === "READ" || r.status === "ACK").length;
  const ackCount = items.filter((r) => r.status === "ACK").length;

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 5 }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 rounded-xl border border-stroke bg-slate-50 px-3 py-2 text-sm">
          <EyeOutlined className="text-brand" />
          <span className="font-semibold text-ink">{readCount}</span>
          <span className="text-muted">{t("document.reads.read")}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-stroke bg-slate-50 px-3 py-2 text-sm">
          <SafetyOutlined className="text-green-600" />
          <span className="font-semibold text-ink">{ackCount}</span>
          <span className="text-muted">{t("document.reads.ack")}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stroke bg-slate-50 py-12">
          <EyeOutlined className="text-4xl text-slate-200" />
          <p className="mt-3 text-sm text-muted">{t("document.reads.empty")}</p>
        </div>
      ) : (
        <Table<DocReadListItem>
          dataSource={items}
          rowKey="userId"
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          columns={[
            {
              title: t("document.reads.user"),
              dataIndex: "fullName",
              render: (name: string, row) => (
                <div className="flex items-center gap-2">
                  <Avatar size={28} className="bg-brand text-xs">
                    {(name ?? row.email)?.[0]?.toUpperCase() ?? "?"}
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-ink">{name || "—"}</div>
                    <div className="text-xs text-muted">{row.email}</div>
                  </div>
                </div>
              ),
            },
            {
              title: t("document.reads.status"),
              dataIndex: "status",
              width: 110,
              render: (status: string) =>
                status === "ACK" ? (
                  <Badge
                    status="success"
                    text={
                      <Tag color="green" className="m-0 text-xs">
                        ACK
                      </Tag>
                    }
                  />
                ) : status === "READ" ? (
                  <Tag color="blue" className="m-0 text-xs">
                    READ
                  </Tag>
                ) : (
                  <Tag className="m-0 text-xs">{status}</Tag>
                ),
            },
            {
              title: t("document.reads.read_at"),
              dataIndex: "readAt",
              width: 140,
              render: (v: string | null) =>
                v ? (
                  <span className="text-xs text-muted">
                    {dayjs(v).format("DD/MM/YYYY HH:mm")}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                ),
            },
            {
              title: t("document.reads.ack_at"),
              dataIndex: "ackedAt",
              width: 140,
              render: (v: string | null) =>
                v ? (
                  <span className="text-xs text-green-600">
                    {dayjs(v).format("DD/MM/YYYY HH:mm")}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                ),
            },
          ]}
        />
      )}
    </div>
  );
}
