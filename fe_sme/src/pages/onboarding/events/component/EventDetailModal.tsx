import {
  Button,
  Card,
  Descriptions,
  Empty,
  Image,
  Modal,
  Table,
  Tag,
  Typography,
} from "antd";
import { CheckCircle2 } from "lucide-react";
import { useLocale } from "@/i18n";
import type {
  CompanyEventDetailResponse,
  CompanyEventTaskRow,
  UserOption,
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
  detail?: CompanyEventDetailResponse;
  users: UserOption[];
  onClose: () => void;
};

const getUserName = (user?: UserOption, fallbackId?: string) => {
  if (!user) return fallbackId || "-";

  return (
    user.fullName ||
    user.label.split(" • ")[0].split(" — ")[0] ||
    fallbackId ||
    "-"
  );
};

const getUserEmail = (user?: UserOption) => {
  if (!user) return "-";

  if (user.email) return user.email;

  const emailFromLabel = user.label.includes(" • ")
    ? user.label.split(" • ")[1]?.split(" — ")[0]
    : undefined;

  return emailFromLabel || "-";
};

const getTaskScheduleRange = (tasks?: CompanyEventTaskRow[]) => {
  const startTimes =
    tasks
      ?.map((task) => toEventTime(task.scheduledStartAt))
      .filter((value): value is NonNullable<typeof value> => Boolean(value)) ??
    [];

  const endTimes =
    tasks
      ?.map((task) => toEventTime(task.scheduledEndAt))
      .filter((value): value is NonNullable<typeof value> => Boolean(value)) ??
    [];

  const minStart =
    startTimes.length > 0
      ? startTimes.reduce((min, current) =>
          current.isBefore(min) ? current : min,
        )
      : undefined;

  const maxEnd =
    endTimes.length > 0
      ? endTimes.reduce((max, current) =>
          current.isAfter(max) ? current : max,
        )
      : undefined;

  return {
    startAt: minStart,
    endAt: maxEnd,
  };
};

const formatEventDayjs = (value?: ReturnType<typeof toEventTime>) => {
  if (!value || !value.isValid()) return "-";

  return value.format("DD/MM/YYYY HH:mm");
};

export default function EventDetailModal({
  open,
  loading,
  detail,
  users,
  onClose,
}: Props) {
  const { t } = useLocale();

  const userMap = new Map(users.map((user) => [user.value, user]));

  const taskRange = getTaskScheduleRange(detail?.tasks);

  /**
   * Ưu tiên task schedule vì các event cũ có thể bị BE lưu eventAt mất giờ.
   */
  const displayStartAt = taskRange.startAt ?? toEventTime(detail?.eventAt);
  const displayEndAt = taskRange.endAt ?? toEventTime(detail?.eventEndAt);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("onboarding.events.detail.title")}
      width={980}
      footer={
        <Button onClick={onClose}>
          {t("onboarding.events.common.close")}
        </Button>
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

          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item
              label={t("onboarding.events.detail.event_id")}
              span={2}
            >
              {detail.eventInstanceId}
            </Descriptions.Item>

            <Descriptions.Item label={t("onboarding.events.detail.template")}>
              {detail.eventTemplate?.name ?? detail.eventTemplateId}
            </Descriptions.Item>

            <Descriptions.Item label={t("onboarding.events.detail.status")}>
              <Tag color={statusColor(detail.status)}>
                {t(getStatusLabelKey(detail.status))}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label={t("onboarding.events.detail.start_at")}>
              {formatEventDayjs(displayStartAt)}
            </Descriptions.Item>

            <Descriptions.Item label={t("onboarding.events.detail.end_at")}>
              {formatEventDayjs(displayEndAt)}
            </Descriptions.Item>

            <Descriptions.Item label={t("onboarding.events.detail.source_type")}>
              {t(getSourceTypeLabelKey(detail.sourceType))}
            </Descriptions.Item>

            <Descriptions.Item label={t("onboarding.events.detail.participants")}>
              {(detail.participantUserIds ?? []).length}
            </Descriptions.Item>

            <Descriptions.Item
              label={t("onboarding.events.detail.content")}
              span={2}
            >
              <Typography.Paragraph className="!mb-0 whitespace-pre-line">
                {detail.eventTemplate?.content || "-"}
              </Typography.Paragraph>
            </Descriptions.Item>
          </Descriptions>

          <Card
            title={
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                {t("onboarding.events.detail.created_tasks")}
              </div>
            }
            size="small"
          >
            <Table<CompanyEventTaskRow>
              rowKey="taskId"
              size="small"
              dataSource={detail.tasks ?? []}
              pagination={{ pageSize: 5 }}
              columns={[
                {
                  title: t("onboarding.events.task.task"),
                  dataIndex: "title",
                  render: (value: string | undefined) => value || "-",
                },
                {
                  title: t("onboarding.events.task.receiver"),
                  dataIndex: "assignedUserId",
                  render: (assignedUserId: string | undefined) => {
                    const user = assignedUserId
                      ? userMap.get(assignedUserId)
                      : undefined;

                    return (
                      <div>
                        <Typography.Text strong>
                          {getUserName(user, assignedUserId)}
                        </Typography.Text>

                        {!user && assignedUserId && (
                          <div className="mt-1 text-xs text-slate-400">
                            {assignedUserId}
                          </div>
                        )}
                      </div>
                    );
                  },
                },
                {
                  title: t("onboarding.events.task.email"),
                  dataIndex: "assignedUserId",
                  render: (assignedUserId: string | undefined) => {
                    const user = assignedUserId
                      ? userMap.get(assignedUserId)
                      : undefined;

                    return getUserEmail(user);
                  },
                },
                {
                  title: t("onboarding.events.task.status"),
                  dataIndex: "status",
                  render: (value: string) => (
                    <Tag color={statusColor(value)}>
                      {t(getStatusLabelKey(value))}
                    </Tag>
                  ),
                },
                {
                  title: t("onboarding.events.task.schedule"),
                  dataIndex: "scheduledStartAt",
                  render: (_: string | undefined, record) =>
                    `${formatDateTime(record.scheduledStartAt)} → ${formatDateTime(
                      record.scheduledEndAt,
                    )}`,
                },
              ]}
            />
          </Card>
        </div>
      ) : (
        <Empty description={t("onboarding.events.detail.empty")} />
      )}
    </Modal>
  );
}