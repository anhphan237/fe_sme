import { Avatar, Empty, Skeleton, Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import { useLocale } from "@/i18n";
import { apiDocReadList } from "@/api/document/editor.api";
import type { DocReadListItem } from "@/interface/document/editor";

interface DocReadListPanelProps {
  documentId: string;
  limit?: number;
}

const getAckTime = (item: DocReadListItem) => {
  return item.acknowledgedAt ?? item.ackedAt ?? null;
};

const getDisplayName = (item: DocReadListItem) => {
  return item.fullName || item.email || item.userId;
};

export default function DocReadListPanel({
  documentId,
  limit = 50,
}: DocReadListPanelProps) {
  const { t } = useLocale();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["doc-read-list", documentId, limit],
    queryFn: () => apiDocReadList(documentId, limit),
    enabled: Boolean(documentId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const items = data?.items ?? [];

  const readCount = items.filter((item) => item.readAt).length;
  const ackCount = items.filter((item) => getAckTime(item)).length;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-stroke bg-white px-3 py-3"
          >
            <Skeleton active avatar paragraph={{ rows: 1 }} title={false} />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stroke bg-slate-50 px-4 py-8">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-sm text-muted">
              {t("document.reads.empty")}
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-stroke bg-slate-50 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <EyeOutlined />
            {t("document.reads.total_read")}
          </div>
          <p className="mt-1 text-xl font-bold text-ink">{readCount}</p>
        </div>

        <div className="rounded-2xl border border-stroke bg-slate-50 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <CheckCircleOutlined />
            {t("document.reads.total_ack")}
          </div>
          <p className="mt-1 text-xl font-bold text-ink">{ackCount}</p>
        </div>
      </div>

      {isFetching && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">
          {t("document.reads.refreshing")}
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const name = getDisplayName(item);
          const ackTime = getAckTime(item);
          const isAck = Boolean(ackTime);
          const isRead = Boolean(item.readAt);

          return (
            <div
              key={item.userId}
              className="flex items-start justify-between gap-3 rounded-2xl border border-stroke bg-white px-3 py-3 shadow-sm"
            >
              <div className="flex min-w-0 items-start gap-3">
                <Avatar size={36} className="shrink-0 bg-brand">
                  {name ? name.charAt(0).toUpperCase() : <UserOutlined />}
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {name || t("document.reads.unknown_user")}
                  </p>

                  {item.email && item.email !== name && (
                    <p className="truncate text-xs text-muted">{item.email}</p>
                  )}

                  <div className="mt-1.5 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <EyeOutlined />
                      <span>
                        {item.readAt
                          ? `${t("document.reads.read_at")}: ${dayjs(
                              item.readAt,
                            ).format("DD/MM/YYYY HH:mm")}`
                          : t("document.reads.not_read_yet")}
                      </span>
                    </div>

                    {ackTime && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircleOutlined />
                        <span>
                          {t("document.reads.ack_at")}:{" "}
                          {dayjs(ackTime).format("DD/MM/YYYY HH:mm")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                {isAck ? (
                  <Tag color="green" className="m-0">
                    {t("document.reads.ack")}
                  </Tag>
                ) : isRead ? (
                  <Tag color="blue" className="m-0">
                    {t("document.reads.read")}
                  </Tag>
                ) : (
                  <Tag icon={<ClockCircleOutlined />} className="m-0">
                    {t("document.reads.pending")}
                  </Tag>
                )}

                {item.status && (
                  <span className="text-[11px] uppercase text-muted">
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}