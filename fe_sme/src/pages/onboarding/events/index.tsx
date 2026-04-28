import { useEffect, useMemo, useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Form, message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiCompanyEventAttendanceSummary,
  apiCompanyEventDetail,
  apiCompanyEventList,
  apiCompanyEventPublish,
} from "@/api/onboarding/company-event.api";
import {
  apiCompanyEventTemplateCreate,
  apiCompanyEventTemplateList,
} from "@/api/onboarding/company-event-template.api";
import { apiListDepartments } from "@/api/company/company.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { apiUploadDocumentFile } from "@/api/document/document.api";

import EventPageHeader from "./component/EventPageHeader";
import EventStatsCards from "./component/EventStatsCards";
import EventCalendarSection from "./component/EventCalendarSection";
import EventTimeline from "./component/EventTimeline";
import EventPublishDrawer from "./component/EventPublishDrawer";
import EventDetailModal from "./component/EventDetailModal";
import EventAttendanceModal from "./component/EventAttendanceModal";
import CompanyEventTemplateCreateDrawer from "./component/CompanyEventTemplateCreateDrawer";

import type {
  CompanyEventAttendanceSummaryResponse,
  CompanyEventDetailResponse,
  CompanyEventListResponse,
  CompanyEventPublishRequest,
  PublishCompanyEventFormValues,
} from "./event.types";
import type {
  CompanyEventTemplateCreateRequest,
  CompanyEventTemplateCreateResponse,
  CompanyEventTemplateListResponse,
} from "./company-event-template.types";
import {
  getEventDateKey,
  getTodayEventDateKey,
  groupEventsByDate,
  isFutureEventDate,
  normalizeDepartments,
  normalizeUsers,
  toBackendEventDateTime,
  toEventTime,
} from "./event.utils";

const COMPANY_EVENT_QUERY_KEY = ["company-events"];
const COMPANY_EVENT_TEMPLATE_QUERY_KEY = ["company-event-templates"];

export default function CompanyEventsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [templateForm] = Form.useForm<CompanyEventTemplateCreateRequest>();
  const [publishForm] = Form.useForm<PublishCompanyEventFormValues>();

  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [publishDrawerOpen, setPublishDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Dayjs>(
    dayjs(),
  );
  const [calendarTouched, setCalendarTouched] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const selectedTemplateId = Form.useWatch(
    "eventTemplateId",
    publishForm,
  ) as string | undefined;

  const eventsQuery = useQuery({
    queryKey: COMPANY_EVENT_QUERY_KEY,
    queryFn: () => apiCompanyEventList({}),
  });

  const eventTemplatesQuery = useQuery({
    queryKey: COMPANY_EVENT_TEMPLATE_QUERY_KEY,
    queryFn: () => apiCompanyEventTemplateList({ status: "ACTIVE" }),
  });

  const departmentsQuery = useQuery({
    queryKey: ["event-departments"],
    queryFn: () => apiListDepartments({ status: "ACTIVE" } as never),
  });

  const usersQuery = useQuery({
    queryKey: ["event-users"],
    queryFn: () => apiSearchUsers({ status: "ACTIVE" } as never),
  });

  const detailQuery = useQuery({
    queryKey: ["company-event-detail", selectedEventId],
    queryFn: () =>
      apiCompanyEventDetail({
        eventInstanceId: selectedEventId!,
        includeTasks: true,
      }),
    enabled: Boolean(selectedEventId && detailOpen),
  });

  const attendanceQuery = useQuery({
    queryKey: ["company-event-attendance", selectedEventId],
    queryFn: () =>
      apiCompanyEventAttendanceSummary({
        eventInstanceId: selectedEventId!,
      }),
    enabled: Boolean(selectedEventId && summaryOpen),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (payload: CompanyEventTemplateCreateRequest) =>
      apiCompanyEventTemplateCreate(payload),

    onSuccess: (res: CompanyEventTemplateCreateResponse) => {
      message.success("Tạo mẫu nội dung thành công");

      publishForm.setFieldValue("eventTemplateId", res.eventTemplateId);
      templateForm.resetFields();
      setTemplateDrawerOpen(false);
      setPublishDrawerOpen(true);

      queryClient.invalidateQueries({
        queryKey: COMPANY_EVENT_TEMPLATE_QUERY_KEY,
      });
    },

    onError: (err) => {
      message.error(err instanceof Error ? err.message : "Tạo mẫu thất bại");
    },
  });

  const publishMutation = useMutation({
    mutationFn: (payload: CompanyEventPublishRequest) =>
      apiCompanyEventPublish(payload),

    onSuccess: (res, variables) => {
      message.success(
        `Tạo sự kiện thành công và đã giao ${res.taskCount} task`,
      );

      publishForm.resetFields();
      setPublishDrawerOpen(false);

      const selectedDate = toEventTime(variables.eventAt) ?? dayjs();
      setSelectedCalendarDate(selectedDate);
      setCalendarTouched(true);

      queryClient.invalidateQueries({ queryKey: COMPANY_EVENT_QUERY_KEY });
    },

    onError: (err) => {
      message.error(
        err instanceof Error ? err.message : "Tạo sự kiện thất bại",
      );
    },
  });

  const eventListData = eventsQuery.data as CompanyEventListResponse | undefined;
  const events = eventListData?.items ?? [];

  const eventTemplateListData =
    eventTemplatesQuery.data as CompanyEventTemplateListResponse | undefined;

  const eventTemplates = eventTemplateListData?.items ?? [];

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return undefined;

    return eventTemplates.find(
      (item) => item.eventTemplateId === selectedTemplateId,
    );
  }, [eventTemplates, selectedTemplateId]);

  const departments = useMemo(
    () => normalizeDepartments(departmentsQuery.data),
    [departmentsQuery.data],
  );

  const users = useMemo(
    () => normalizeUsers(usersQuery.data),
    [usersQuery.data],
  );

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aTime = toEventTime(a.eventAt)?.valueOf() ?? 0;
      const bTime = toEventTime(b.eventAt)?.valueOf() ?? 0;

      return aTime - bTime;
    });
  }, [events]);

  const groupedEvents = useMemo(
    () => groupEventsByDate(sortedEvents),
    [sortedEvents],
  );

  const todayCount = useMemo(() => {
    const today = getTodayEventDateKey();

    return events.filter((event) => getEventDateKey(event.eventAt) === today)
      .length;
  }, [events]);

  const upcomingCount = useMemo(() => {
    return events.filter((event) => isFutureEventDate(event.eventAt)).length;
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    const selectedDateKey = selectedCalendarDate.format("YYYY-MM-DD");

    return sortedEvents.filter((event) => {
      return getEventDateKey(event.eventAt) === selectedDateKey;
    });
  }, [selectedCalendarDate, sortedEvents]);

  const templateOptions = useMemo(
    () =>
      eventTemplates.map((item) => ({
        value: item.eventTemplateId,
        label: `${item.name} (${item.eventTemplateId})`,
      })),
    [eventTemplates],
  );

  useEffect(() => {
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return;
    }

    publishForm.setFieldValue("eventTemplateId", templateId);
    setPublishDrawerOpen(true);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("templateId");

    setSearchParams(nextSearchParams, { replace: true });
  }, [publishForm, searchParams, setSearchParams]);

  useEffect(() => {
    if (calendarTouched || sortedEvents.length === 0) {
      return;
    }

    const nearest =
      sortedEvents.find((event) => isFutureEventDate(event.eventAt)) ??
      sortedEvents[0];

    const nearestDate = toEventTime(nearest?.eventAt);

    if (nearestDate) {
      setSelectedCalendarDate(nearestDate);
    }
  }, [calendarTouched, sortedEvents]);

  const openDetail = (eventInstanceId: string) => {
    setSelectedEventId(eventInstanceId);
    setDetailOpen(true);
  };

  const openSummary = (eventInstanceId: string) => {
    setSelectedEventId(eventInstanceId);
    setSummaryOpen(true);
  };

  const handleCreateTemplate = async () => {
    const values = await templateForm.validateFields();

    createTemplateMutation.mutate({
      name: values.name?.trim(),
      description: values.description?.trim(),
      content: values.content?.trim(),
      status: values.status || "ACTIVE",
    });
  };

  const uploadCoverImageByDocumentApi = async (file: File): Promise<string> => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append("name", file.name);
    formData.append("title", file.name);
    formData.append("mediaKind", "IMAGE");
    formData.append("description", "Ảnh bìa sự kiện");

    const uploadResult = await apiUploadDocumentFile(formData);

    if (!uploadResult.fileUrl) {
      throw new Error("Upload ảnh thành công nhưng không nhận được URL");
    }

    return uploadResult.fileUrl;
  };

  const handlePublish = async () => {
    const values = await publishForm.validateFields();

    const startAt = values.eventStartAt;
    const endAt = values.eventEndAt;

    if (!startAt || !endAt) {
      message.error("Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc");
      return;
    }

    const tomorrowStart = dayjs().add(1, "day").startOf("day");

    if (startAt.isBefore(tomorrowStart)) {
      message.error("Chỉ có thể lên lịch sự kiện từ ngày mai trở đi");
      return;
    }

    if (!endAt.isAfter(startAt)) {
      message.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    const participantMode = values.participantMode ?? "DEPARTMENT";

    const departmentIds =
      participantMode === "DEPARTMENT" ? values.departmentIds ?? [] : [];

    const userIds = participantMode === "USER" ? values.userIds ?? [] : [];

    if (participantMode === "DEPARTMENT" && departmentIds.length === 0) {
      message.error("Vui lòng chọn ít nhất một phòng ban");
      return;
    }

    if (participantMode === "USER" && userIds.length === 0) {
      message.error("Vui lòng chọn ít nhất một nhân viên");
      return;
    }

    if (participantMode === "USER") {
      const validUserIdSet = new Set(users.map((user) => user.value));

      const invalidUserIds = userIds.filter(
        (userId) => !validUserIdSet.has(userId),
      );

      if (invalidUserIds.length > 0) {
        message.error(
          `Có nhân viên không hợp lệ hoặc không còn ACTIVE: ${invalidUserIds.join(
            ", ",
          )}`,
        );
        return;
      }
    }

    let coverImageUrl = values.coverImageUrl?.trim();

    try {
      if (values.coverImageFile) {
        setUploadingCover(true);

        coverImageUrl = await uploadCoverImageByDocumentApi(
          values.coverImageFile,
        );

        publishForm.setFieldValue("coverImageUrl", coverImageUrl);
      }

      publishMutation.mutate({
        eventTemplateId: values.eventTemplateId,
        coverImageUrl: coverImageUrl || undefined,
        eventAt: toBackendEventDateTime(startAt),
        eventEndAt: toBackendEventDateTime(endAt),
        departmentIds,
        userIds,
      });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Upload ảnh thất bại");
    } finally {
      setUploadingCover(false);
    }
  };

  const detail = detailQuery.data as CompanyEventDetailResponse | undefined;
  const attendance = attendanceQuery.data as
    | CompanyEventAttendanceSummaryResponse
    | undefined;

  return (
    <div className="space-y-5 p-4 md:p-6">
      <EventPageHeader
        loading={eventsQuery.isFetching}
        onRefresh={() => eventsQuery.refetch()}
        onCreateTemplate={() => setTemplateDrawerOpen(true)}
        onCreateEvent={() => setPublishDrawerOpen(true)}
        onOpenTemplatePage={() => navigate("/onboarding/company-event-templates")}
      />

      <EventStatsCards
        totalEvents={events.length}
        todayCount={todayCount}
        upcomingCount={upcomingCount}
        templateCount={eventTemplateListData?.totalCount ?? eventTemplates.length}
      />

      <EventCalendarSection
        selectedDate={selectedCalendarDate}
        selectedDateEvents={selectedDateEvents}
        onSelectDate={(date) => {
          setCalendarTouched(true);
          setSelectedCalendarDate(date);
        }}
        onDetail={openDetail}
        onSummary={openSummary}
      />

      <EventTimeline
        loading={eventsQuery.isLoading}
        totalCount={eventListData?.totalCount ?? events.length}
        groups={groupedEvents}
        onDetail={openDetail}
        onSummary={openSummary}
      />

      <CompanyEventTemplateCreateDrawer
        open={templateDrawerOpen}
        loading={createTemplateMutation.isPending}
        form={templateForm}
        onClose={() => setTemplateDrawerOpen(false)}
        onSubmit={handleCreateTemplate}
      />

      <EventPublishDrawer
        open={publishDrawerOpen}
        loading={publishMutation.isPending || uploadingCover}
        form={publishForm}
        templateOptions={templateOptions}
        selectedTemplate={selectedTemplate}
        departments={departments}
        users={users}
        templatesLoading={eventTemplatesQuery.isLoading}
        departmentsLoading={departmentsQuery.isLoading}
        usersLoading={usersQuery.isLoading}
        onClose={() => setPublishDrawerOpen(false)}
        onSubmit={handlePublish}
        onTemplateChange={(eventTemplateId) => {
          publishForm.setFieldValue("eventTemplateId", eventTemplateId);
        }}
      />

      <EventDetailModal
        open={detailOpen}
        loading={detailQuery.isLoading}
        detail={detail}
        users={users}
        onClose={() => setDetailOpen(false)}
      />

      <EventAttendanceModal
        open={summaryOpen}
        loading={attendanceQuery.isLoading}
        attendance={attendance}
        onClose={() => setSummaryOpen(false)}
      />
    </div>
  );
}