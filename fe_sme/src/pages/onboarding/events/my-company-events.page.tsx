import { useEffect, useMemo, useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  Button,
  Calendar,
  Card,
  Col,
  Empty,
  Image,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiCompanyEventAttendanceConfirm,
  apiCompanyEventDetail,
  apiCompanyEventList,
} from "@/api/onboarding/company-event.api";

import MyCompanyEventHeader from "./component/MyCompanyEventHeader";
import MyCompanyEventStatsCards from "./component/MyCompanyEventStatsCards";
import MyCompanyEventDetailModal from "./component/MyCompanyEventDetailModal";

import type {
  CompanyEventAttendanceConfirmRequest,
  CompanyEventAttendanceConfirmResponse,
  CompanyEventDetailResponse,
  CompanyEventListItem,
  CompanyEventListResponse,
} from "./event.types";
import {
  formatDate,
  formatDateTime,
  formatTime,
  getEventDateKey,
  getTodayEventDateKey,
  groupEventsByDate,
  isFutureEventDate,
  statusColor,
  toEventTime,
} from "./event.utils";

const MY_COMPANY_EVENT_QUERY_KEY = ["my-company-events"];

const DONE_STATUSES = new Set(["DONE", "COMPLETED", "SUBMITTED"]);

const normalizeText = (value?: string) => (value ?? "").trim().toLowerCase();
const normalizeStatus = (value?: string) => (value ?? "").trim().toUpperCase();

/**
 * Nếu project của bạn đã có useAuth/useCurrentUser thì dùng hook đó thay helper này.
 * Helper này chỉ là fallback để page chạy được trong nhiều kiểu auth store khác nhau.
 */
const getCurrentUserIdFromStorage = () => {
  const candidates = [
    "user",
    "auth",
    "currentUser",
    "sme-user",
    "sme-auth",
    "persist:auth",
  ];

  for (const key of candidates) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const user = parsed?.user ?? parsed?.currentUser ?? parsed?.profile ?? parsed;
      const userId =
        user?.userId ??
        user?.user_id ??
        user?.id ??
        parsed?.userId ??
        parsed?.user_id ??
        parsed?.id;

      if (typeof userId === "string" && userId.trim()) {
        return userId.trim();
      }
    } catch {
      // ignore invalid localStorage payload
    }
  }

  return undefined;
};

const getEventTitle = (event: CompanyEventListItem) => {
  return event.eventName || event.eventTemplateId || "Sự kiện chung";
};

const getEventDescription = (event: CompanyEventListItem) => {
  return (
    event.eventDescription ||
    event.eventContent ||
    "Sự kiện nội bộ do HR tạo cho nhân sự trong công ty."
  );
};

const isEventConfirmedFromDetail = (
  detail?: CompanyEventDetailResponse,
  currentUserId?: string,
) => {
  const tasks = detail?.tasks ?? [];
  const myTask = currentUserId
    ? tasks.find((task) => task.assignedUserId === currentUserId)
    : tasks.length === 1
      ? tasks[0]
      : undefined;

  if (!myTask) return false;

  return Boolean(
    myTask.completedAt || DONE_STATUSES.has(normalizeStatus(myTask.status)),
  );
};

type EventCardProps = {
  event: CompanyEventListItem;
  confirmed?: boolean;
  onOpen: (eventInstanceId: string) => void;
};

function EventCard({ event, confirmed, onOpen }: EventCardProps) {
  return (
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
              alt={getEventTitle(event)}
              width={120}
              height={86}
              className="rounded-xl object-cover"
              preview={false}
            />
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Text strong className="text-base">
                {getEventTitle(event)}
              </Typography.Text>

              <Tag color={statusColor(event.status)}>{event.status || "-"}</Tag>

              {confirmed && <Tag color="green">Đã xác nhận</Tag>}
            </div>

            <Typography.Paragraph
              type="secondary"
              className="!mb-0 !mt-2 line-clamp-2"
            >
              {getEventDescription(event)}
            </Typography.Paragraph>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {formatDateTime(event.eventAt)}
              </span>

              <span className="inline-flex items-center gap-1">
                <Users size={13} />
                Sự kiện chung
              </span>
            </div>
          </div>
        </div>

        <Space wrap>
          <Button
            type={confirmed ? "default" : "primary"}
            icon={confirmed ? <CheckCircle2 size={14} /> : <Eye size={14} />}
            onClick={() => onOpen(event.eventInstanceId)}
          >
            {confirmed ? "Xem chi tiết" : "Xem & xác nhận"}
          </Button>
        </Space>
      </div>
    </Card>
  );
}

export default function MyCompanyEventsPage() {
  const queryClient = useQueryClient();

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Dayjs>(dayjs());
  const [calendarTouched, setCalendarTouched] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>();
  const [confirmedEventIds, setConfirmedEventIds] = useState<Set<string>>(
    () => new Set(),
  );

  const currentUserId = useMemo(() => getCurrentUserIdFromStorage(), []);

  const eventsQuery = useQuery({
    queryKey: MY_COMPANY_EVENT_QUERY_KEY,
    queryFn: () => apiCompanyEventList({}),
  });

  const detailQuery = useQuery({
    queryKey: ["my-company-event-detail", selectedEventId],
    queryFn: () =>
      apiCompanyEventDetail({
        eventInstanceId: selectedEventId!,
        includeTasks: true,
      }),
    enabled: Boolean(selectedEventId && detailOpen),
  });

  const confirmMutation = useMutation({
    mutationFn: (payload: CompanyEventAttendanceConfirmRequest) =>
      apiCompanyEventAttendanceConfirm(payload),

    onSuccess: (res: CompanyEventAttendanceConfirmResponse, variables) => {
      const eventInstanceId = res.eventInstanceId || variables.eventInstanceId;

      setConfirmedEventIds((prev) => {
        const next = new Set(prev);
        next.add(eventInstanceId);
        return next;
      });

      message.success("Đã xác nhận tham gia sự kiện");

      queryClient.invalidateQueries({ queryKey: MY_COMPANY_EVENT_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: ["my-company-event-detail", eventInstanceId],
      });
    },

    onError: (err) => {
      message.error(
        err instanceof Error ? err.message : "Xác nhận tham gia thất bại",
      );
    },
  });

  const eventListData = eventsQuery.data as CompanyEventListResponse | undefined;
  const events = eventListData?.items ?? [];

  const filteredEvents = useMemo(() => {
    const cleanKeyword = normalizeText(keyword);

    if (!cleanKeyword) return events;

    return events.filter((event) => {
      const text = [
        event.eventName,
        event.eventDescription,
        event.eventContent,
        event.eventTemplateId,
        event.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(cleanKeyword);
    });
  }, [events, keyword]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const aTime = toEventTime(a.eventAt)?.valueOf() ?? 0;
      const bTime = toEventTime(b.eventAt)?.valueOf() ?? 0;
      return aTime - bTime;
    });
  }, [filteredEvents]);

  const groupedEvents = useMemo(() => groupEventsByDate(sortedEvents), [sortedEvents]);

  const todayCount = useMemo(() => {
    const today = getTodayEventDateKey();
    return events.filter((event) => getEventDateKey(event.eventAt) === today).length;
  }, [events]);

  const upcomingCount = useMemo(() => {
    return events.filter((event) => isFutureEventDate(event.eventAt)).length;
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    const selectedDateKey = selectedCalendarDate.format("YYYY-MM-DD");

    return sortedEvents.filter((event) => getEventDateKey(event.eventAt) === selectedDateKey);
  }, [selectedCalendarDate, sortedEvents]);

  const selectedDetail = detailQuery.data as CompanyEventDetailResponse | undefined;
  const selectedDetailConfirmed = isEventConfirmedFromDetail(selectedDetail, currentUserId);
  const selectedLocalConfirmed = selectedEventId
    ? confirmedEventIds.has(selectedEventId)
    : false;

  useEffect(() => {
    if (calendarTouched || sortedEvents.length === 0) return;

    const nearest =
      sortedEvents.find((event) => isFutureEventDate(event.eventAt)) ?? sortedEvents[0];
    const nearestDate = toEventTime(nearest?.eventAt);

    if (nearestDate) {
      setSelectedCalendarDate(nearestDate);
    }
  }, [calendarTouched, sortedEvents]);

  const openDetail = (eventInstanceId: string) => {
    setSelectedEventId(eventInstanceId);
    setDetailOpen(true);
  };

  const handleConfirm = (eventInstanceId: string) => {
    confirmMutation.mutate({ eventInstanceId });
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <MyCompanyEventHeader
        loading={eventsQuery.isFetching}
        onRefresh={() => eventsQuery.refetch()}
      />

      <MyCompanyEventStatsCards
        totalEvents={events.length}
        todayCount={todayCount}
        upcomingCount={upcomingCount}
        confirmedCount={confirmedEventIds.size}
      />

      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography.Title level={4} className="!mb-1">
              Lịch sự kiện chung
            </Typography.Title>
            <Typography.Text type="secondary">
              Employee, Manager và IT chỉ xem sự kiện được mời và xác nhận tham gia.
            </Typography.Text>
          </div>

          <Space wrap>
            <Input
              allowClear
              prefix={<Search size={15} />}
              placeholder="Tìm theo tên hoặc nội dung sự kiện"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onPressEnter={() => setKeyword(keywordInput)}
              className="w-full lg:w-[320px]"
            />
            <Button type="primary" onClick={() => setKeyword(keywordInput)}>
              Tìm kiếm
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card
            className="h-full rounded-2xl"
            title={
              <div className="flex items-center gap-2">
                <CalendarDays size={18} />
                <span>Lịch tháng</span>
              </div>
            }
          >
            <Calendar
              fullscreen={false}
              value={selectedCalendarDate}
              onSelect={(date) => {
                setCalendarTouched(true);
                setSelectedCalendarDate(date);
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={15}>
          <Card
            className="h-full rounded-2xl"
            title={
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>Sự kiện trong ngày</span>
              </div>
            }
            extra={
              <Typography.Text type="secondary">
                {selectedCalendarDate.format("DD/MM/YYYY")}
              </Typography.Text>
            }
          >
            {eventsQuery.isLoading ? (
              <Card loading />
            ) : selectedDateEvents.length === 0 ? (
              <Empty description="Không có sự kiện trong ngày này" />
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <EventCard
                    key={event.eventInstanceId}
                    event={event}
                    confirmed={confirmedEventIds.has(event.eventInstanceId)}
                    onOpen={openDetail}
                  />
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        className="rounded-2xl"
        title={
          <div className="flex items-center gap-2">
            <CalendarDays size={18} />
            <span>Timeline sự kiện</span>
          </div>
        }
        extra={
          <Typography.Text type="secondary">
            {eventListData?.totalCount ?? events.length} sự kiện
          </Typography.Text>
        }
      >
        {eventsQuery.isLoading ? (
          <Card loading />
        ) : groupedEvents.length === 0 ? (
          <Empty description="Chưa có sự kiện chung nào" />
        ) : (
          <div className="space-y-7">
            {groupedEvents.map((group) => (
              <div key={group.dateKey} className="relative">
                <div className="sticky top-0 z-10 mb-3 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm font-medium shadow-sm">
                  <CalendarDays size={15} />
                  {group.dateLabel}
                </div>

                <div className="relative ml-3 border-l border-dashed border-slate-200 pl-5">
                  {group.items.map((event) => (
                    <div key={event.eventInstanceId} className="relative mb-4">
                      <div className="absolute -left-[29px] top-5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow" />
                      <EventCard
                        event={event}
                        confirmed={confirmedEventIds.has(event.eventInstanceId)}
                        onOpen={openDetail}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <MyCompanyEventDetailModal
        open={detailOpen}
        loading={detailQuery.isLoading}
        confirming={confirmMutation.isPending}
        detail={selectedDetail}
        currentUserId={currentUserId}
        localConfirmed={selectedLocalConfirmed || selectedDetailConfirmed}
        onClose={() => setDetailOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
