import type { Dayjs } from "dayjs";
import {
  Button,
  Calendar,
  Card,
  Col,
  Empty,
  Image,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { CalendarDays, Clock, Eye, Users } from "lucide-react";
import { useLocale } from "@/i18n";
import type { CompanyEventListItem } from "../event.types";
import {
  formatDateTime,
  getSourceTypeLabelKey,
  getStatusLabelKey,
  statusColor,
} from "../event.utils";

type Props = {
  selectedDate: Dayjs;
  selectedDateEvents: CompanyEventListItem[];
  onSelectDate: (date: Dayjs) => void;
  onDetail: (eventInstanceId: string) => void;
  onSummary: (eventInstanceId: string) => void;
};

export default function EventCalendarSection({
  selectedDate,
  selectedDateEvents,
  onSelectDate,
  onDetail,
  onSummary,
}: Props) {
  const { t } = useLocale();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={9}>
        <Card
          className="h-full rounded-2xl"
          title={
            <div className="flex items-center gap-2">
              <CalendarDays size={18} />
              <span>{t("onboarding.events.calendar.title")}</span>
            </div>
          }
        >
          <Calendar
            fullscreen={false}
            value={selectedDate}
            onSelect={onSelectDate}
          />
        </Card>
      </Col>

      <Col xs={24} lg={15}>
        <Card
          className="h-full rounded-2xl"
          title={
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>{t("onboarding.events.calendar.day_events")}</span>
            </div>
          }
          extra={
            <Typography.Text type="secondary">
              {selectedDate.format("DD/MM/YYYY")}
            </Typography.Text>
          }
        >
          {selectedDateEvents.length === 0 ? (
            <Empty description={t("onboarding.events.calendar.empty")} />
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.eventInstanceId}
                  className="rounded-2xl border bg-slate-50 px-4 py-3 transition hover:bg-white hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 gap-3">
                      {event.coverImageUrl && (
                        <Image
                          src={event.coverImageUrl}
                          alt={event.eventName || "event"}
                          width={96}
                          height={72}
                          className="rounded-xl object-cover"
                          preview={false}
                        />
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Typography.Text strong>
                            {event.eventName || event.eventTemplateId}
                          </Typography.Text>

                          <Tag color={statusColor(event.status)}>
                            {t(getStatusLabelKey(event.status))}
                          </Tag>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} />
                            {formatDateTime(event.eventAt)}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Users size={13} />
                            {t(getSourceTypeLabelKey(event.sourceType))}
                          </span>
                        </div>

                        <Typography.Paragraph
                          type="secondary"
                          className="!mb-0 !mt-2 line-clamp-2"
                        >
                          {event.eventDescription ||
                            event.eventContent ||
                            t("onboarding.events.default_description")}
                        </Typography.Paragraph>
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
                </div>
              ))}
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
}