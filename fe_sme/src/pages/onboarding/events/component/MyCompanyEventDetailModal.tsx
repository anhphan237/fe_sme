import dayjs from "dayjs";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Image,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import { CalendarClock, CheckCircle2, Clock, Info, XCircle } from "lucide-react";

import type {
  CompanyEventDetailResponse,
  CompanyEventTaskItem,
} from "../event.types";
import {
  formatDateTime,
  getSourceTypeLabelKey,
  getStatusLabelKey,
  statusColor,
  toEventTime,
} from "../event.utils";

type Props = {
  open: boolean;
  loading: boolean;
  confirming: boolean;
  detail?: CompanyEventDetailResponse;
  currentUserId?: string;
  localConfirmed?: boolean;
  onClose: () => void;
  onConfirm: (eventInstanceId: string) => void;
};

const DONE_STATUSES = new Set(["DONE", "COMPLETED", "SUBMITTED"]);
const BLOCK_CONFIRM_STATUSES = new Set([
  "CANCELLED",
  "CANCELED",
  "INACTIVE",
  "FAILED",
  "EXPIRED",
]);

const normalizeStatus = (status?: string) => (status ?? "").trim().toUpperCase();

const findMyTask = (
  tasks: CompanyEventTaskItem[] | undefined,
  currentUserId?: string,
) => {
  if (!tasks || tasks.length === 0) return undefined;

  if (currentUserId) {
    return tasks.find((task) => task.assignedUserId === currentUserId);
  }

  /**
   * Với page Employee/Manager/IT, BE có thể trả về duy nhất task của user hiện tại.
   * Fallback này giúp vẫn hiển thị đúng trạng thái khi chưa lấy được currentUserId từ auth store.
   */
  if (tasks.length === 1) {
    return tasks[0];
  }

  return undefined;
};

const getTemplateTitle = (detail?: CompanyEventDetailResponse) => {
  return detail?.eventTemplate?.name || detail?.eventTemplateId || "-";
};

const getTemplateContent = (detail?: CompanyEventDetailResponse) => {
  return (
    detail?.eventTemplate?.content ||
    detail?.eventTemplate?.description ||
    "Chưa có nội dung chi tiết."
  );
};

export default function MyCompanyEventDetailModal({
  open,
  loading,
  confirming,
  detail,
  currentUserId,
  localConfirmed,
  onClose,
  onConfirm,
}: Props) {
  const myTask = findMyTask(detail?.tasks, currentUserId);
  const taskStatus = normalizeStatus(myTask?.status);
  const eventStatus = normalizeStatus(detail?.status);
  const eventStartAt = toEventTime(detail?.eventAt);
  const eventEndAt = toEventTime(detail?.eventEndAt);

  const hasStarted = eventStartAt
    ? !eventStartAt.isAfter(dayjs())
    : true;

  const isBlocked = BLOCK_CONFIRM_STATUSES.has(eventStatus);
  const alreadyConfirmed = Boolean(
    localConfirmed || DONE_STATUSES.has(taskStatus) || myTask?.completedAt,
  );

  const canConfirm = Boolean(detail?.eventInstanceId) && hasStarted && !isBlocked && !alreadyConfirmed;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Chi tiết sự kiện chung"
      width={860}
      footer={
        <Space wrap>
          <Button onClick={onClose}>Đóng</Button>

          {alreadyConfirmed ? (
            <Button type="primary" icon={<CheckCircle2 size={16} />} disabled>
              Đã xác nhận tham gia
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckCircle2 size={16} />}
              loading={confirming}
              disabled={!canConfirm}
              onClick={() => {
                if (detail?.eventInstanceId) {
                  onConfirm(detail.eventInstanceId);
                }
              }}
            >
              Xác nhận đã tham gia
            </Button>
          )}
        </Space>
      }
    >
      {loading ? (
        <Card loading />
      ) : detail ? (
        <div className="space-y-4">
          {detail.coverImageUrl && (
            <Image
              src={detail.coverImageUrl}
              alt="event-cover"
              className="max-h-[260px] w-full rounded-2xl object-cover"
              preview
            />
          )}

          {!hasStarted && !alreadyConfirmed && (
            <Alert
              type="info"
              showIcon
              icon={<CalendarClock size={17} />}
              message="Chưa thể xác nhận tham gia"
              description="Bạn chỉ có thể xác nhận sau khi sự kiện bắt đầu để tránh xác nhận nhầm trước lịch."
            />
          )}

          {isBlocked && (
            <Alert
              type="error"
              showIcon
              icon={<XCircle size={17} />}
              message="Sự kiện không còn khả dụng"
              description="Sự kiện đã bị hủy, hết hạn hoặc không còn hoạt động nên không thể xác nhận tham gia."
            />
          )}

          {alreadyConfirmed && (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircle2 size={17} />}
              message="Bạn đã xác nhận tham gia sự kiện này"
              description={
                myTask?.completedAt
                  ? `Thời điểm xác nhận: ${formatDateTime(myTask.completedAt)}`
                  : "Trạng thái tham gia đã được ghi nhận trong hệ thống."
              }
            />
          )}

          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Mã sự kiện" span={2}>
              {detail.eventInstanceId}
            </Descriptions.Item>

            <Descriptions.Item label="Tên sự kiện" span={2}>
              <Typography.Text strong>{getTemplateTitle(detail)}</Typography.Text>
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColor(detail.status)}>
                {getStatusLabelKey(detail.status)
                  .replace("onboarding.events.status.", "")
                  .replaceAll("_", " ")}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Nguồn mời">
              {getSourceTypeLabelKey(detail.sourceType)
                .replace("onboarding.events.source_type.", "")
                .replaceAll("_", " ")}
            </Descriptions.Item>

            <Descriptions.Item label="Bắt đầu">
              <span className="inline-flex items-center gap-1">
                <Clock size={14} />
                {eventStartAt ? eventStartAt.format("DD/MM/YYYY HH:mm") : "-"}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Kết thúc">
              {eventEndAt ? eventEndAt.format("DD/MM/YYYY HH:mm") : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái của tôi" span={2}>
              {alreadyConfirmed ? (
                <Tag color="green">Đã xác nhận</Tag>
              ) : (
                <Tag color="gold">Chưa xác nhận</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>

          <Card
            className="rounded-2xl"
            title={
              <div className="flex items-center gap-2">
                <Info size={17} />
                Nội dung sự kiện
              </div>
            }
          >
            <Typography.Paragraph className="!mb-0 whitespace-pre-line">
              {getTemplateContent(detail)}
            </Typography.Paragraph>
          </Card>
        </div>
      ) : (
        <Empty description="Không tìm thấy thông tin sự kiện" />
      )}
    </Modal>
  );
}
