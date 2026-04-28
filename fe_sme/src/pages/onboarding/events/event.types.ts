import type { Dayjs } from "dayjs";
import type { DefaultOptionType } from "antd/es/select";

export type DepartmentOption = {
  label: string;
  value: string;
};

export type UserOption = {
  label: string;
  value: string;
  fullName?: string;
  email?: string;
  departmentId?: string;
  departmentName?: string;
  status?: string;
  roleCode?: string;
};

export type RecordLike = Record<string, unknown>;

export type ParticipantMode = "DEPARTMENT" | "USER";

export type CompanyEventPublishRequest = {
  eventTemplateId: string;
  coverImageUrl?: string;
  eventAt: string;
  eventEndAt?: string;
  departmentIds?: string[];
  userIds?: string[];
};

export type CompanyEventPublishResponse = {
  eventInstanceId: string;
  eventTemplateId: string;
  coverImageUrl?: string;
  eventAt: string;
  eventEndAt?: string;
  taskCount: number;
  participantUserIds: string[];
};

export type CompanyEventTemplateInfo = {
  eventTemplateId: string;
  name: string;
  description?: string;
  content?: string;
  status: string;
};

export type CompanyEventChecklistInfo = {
  checklistId: string;
  name: string;
  stage: string;
  status: string;
  progressPercent: number;
  openAt?: string;
  deadlineAt?: string;
};

export type CompanyEventTaskItem = {
  taskId: string;
  checklistId?: string;
  title?: string;
  description?: string;
  status: string;
  dueDate?: string;
  assignedUserId?: string;
  assignedDepartmentId?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  scheduleStatus?: string;
};

export type CompanyEventDetailRequest = {
  eventInstanceId: string;
  includeTasks?: boolean;
};

export type CompanyEventDetailResponse = {
  eventInstanceId: string;
  eventTemplateId: string;
  coverImageUrl?: string;
  eventAt: string;
  eventEndAt?: string;
  sourceType?: "DEPARTMENT" | "USER_LIST" | "DEPARTMENT_PLUS_USERS" | string;
  sourceDepartmentIds?: string[];
  sourceUserIds?: string[];
  participantUserIds?: string[];
  status: string;
  notifiedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  eventTemplate?: CompanyEventTemplateInfo;
  checklist?: CompanyEventChecklistInfo;
  tasks?: CompanyEventTaskItem[];
};

export type CompanyEventListRequest = {
  status?: string;
  page?: number;
  size?: number;
};

export type CompanyEventListItem = {
  eventInstanceId: string;
  eventTemplateId: string;
  coverImageUrl?: string;
  eventName?: string;
  eventDescription?: string;
  eventContent?: string;
  eventTemplateStatus?: string;
  eventAt: string;
  eventEndAt?: string;
  sourceType?: string;
  status: string;
  notifiedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyEventListResponse = {
  totalCount: number;
  items: CompanyEventListItem[];
};

export type CompanyEventAttendanceSummaryRequest = {
  eventInstanceId: string;
};

export type CompanyEventAttendanceAttendee = {
  userId: string;
  fullName?: string;
  attended: boolean;
  doneTaskCount: number;
  totalTaskCount: number;
};

export type CompanyEventAttendanceSummaryResponse = {
  eventInstanceId: string;
  totalInvited: number;
  attendedCount: number;
  notAttendedCount: number;
  attendanceRate: number;
  attendees: CompanyEventAttendanceAttendee[];
};

export type EventGroup = {
  dateKey: string;
  dateLabel: string;
  items: CompanyEventListItem[];
};

export type PublishCompanyEventFormValues = CompanyEventPublishRequest & {
  eventStartAt?: Dayjs;
  eventEndAt?: Dayjs;

  /**
   * Giữ tạm field cũ để tránh lỗi nếu còn file nào reference.
   * UI mới không dùng field này.
   */
  eventTimeRange?: [Dayjs, Dayjs];

  coverImageFile?: File;

  /**
   * DEPARTMENT:
   * - FE gửi departmentIds
   * - FE gửi userIds = []
   *
   * USER:
   * - FE gửi userIds
   * - FE gửi departmentIds = []
   */
  participantMode?: ParticipantMode;

  /**
   * Chỉ dùng để lọc nhân viên trên FE.
   * Không gửi field này xuống BE.
   */
  userDepartmentFilterIds?: string[];
};

export type CompanyEventTaskRow = NonNullable<
  CompanyEventDetailResponse["tasks"]
>[number];

export type CompanyEventAttendanceRow = NonNullable<
  CompanyEventAttendanceSummaryResponse["attendees"]
>[number];

export type GroupedUserSelectOption = DefaultOptionType;