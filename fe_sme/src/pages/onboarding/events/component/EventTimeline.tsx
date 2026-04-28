import { Button, Card, Empty, Image, Space, Tag, Typography } from "antd";
import { CalendarDays, Clock, Eye, Users } from "lucide-react";
import { useLocale } from "@/i18n";
import type { EventGroup } from "../event.types";
import {
  formatDate,
  formatDateTime,
  formatTime,
  getSourceTypeLabelKey,
  getStatusLabelKey,
  statusColor,
} from "../event.utils";

type Props = {
  loading: boolean;
  totalCount: number;
  groups: EventGroup[];
  onDetail: (eventInstanceId: string) => void;
  onSummary: (eventInstanceId: string) => void;
};

export default function EventTimeline({
  loading,
  totalCount,
  groups,
  onDetail,
  onSummary,
}: Props) {
  const { t } = useLocale();

  return (
    <Card
      className="rounded-2xl"
      title={
        <div className="flex items-center gap-2">
          <CalendarDays size={18} />
          <span>{t("onboarding.events.timeline.title")}</span>
        </div>
      }
      extra={
        <Typography.Text type="secondary">
          {totalCount} {t("onboarding.events.timeline.total_suffix")}
        </Typography.Text>
      }
    >
      {loading ? (
        <Card loading />
      ) : groups.length === 0 ? (
        <Empty description={t("onboarding.events.timeline.empty")} />
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <div key={group.dateKey} className="relative">
              <div className="sticky top-0 z-10 mb-3 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm font-medium shadow-sm">
                <CalendarDays size={15} />
                {group.dateLabel}
              </div>

              <div className="relative ml-3 border-l border-dashed border-slate-200 pl-5">
                {group.items.map((event) => (
                  <div key={event.eventInstanceId} className="relative mb-4">
                    <div className="absolute -left-[29px] top-5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow" />

                    <Card
                      className="rounded-2xl border-slate-200 shadow-sm transition hover:shadow-md"
                      styles={{ body: { padding: 18 } }}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div className="min-w-[80px] rounded-2xl bg-slate-50 px-3 py-3 text-center">
                            <div className="text-lg font-bold text-slate-800">
                              {formatTime(event.eventAt)}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {formatDate(event.eventAt)}
                            </div>
                          </div>

                          {event.coverImageUrl && (
                            <Image
                              src={event.coverImageUrl}
                              alt={event.eventName || "event"}
                              width={120}
                              height={86}
                              className="rounded-xl object-cover"
                              preview={false}
                            />
                          )}

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Typography.Text strong className="text-base">
                                {event.eventName || event.eventTemplateId}
                              </Typography.Text>

                              <Tag color={statusColor(event.status)}>
                                {t(getStatusLabelKey(event.status))}
                              </Tag>

                              <Tag>
                                {t(getSourceTypeLabelKey(event.sourceType))}
                              </Tag>
                            </div>

                            <Typography.Paragraph
                              type="secondary"
                              className="!mb-0 !mt-2 line-clamp-2"
                            >
                              {event.eventDescription ||
                                event.eventContent ||
                                t("onboarding.events.default_description")}
                            </Typography.Paragraph>

                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock size={13} />
                                {formatDateTime(event.eventAt)}
                              </span>

                              <span className="inline-flex items-center gap-1">
                                <Users size={13} />
                                {t(getSourceTypeLabelKey(event.sourceType))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Space wrap>
                          <Button
                            icon={<Eye size={14} />}
                            onClick={() => onDetail(event.eventInstanceId)}
                          >
                            {t("onboarding.events.common.detail")}
                          </Button>

                          <Button
                            icon={<Users size={14} />}
                            onClick={() => onSummary(event.eventInstanceId)}
                          >
                            {t("onboarding.events.participants")}
                          </Button>
                        </Space>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}