import {
  Button,
  Card,
  Col,
  Empty,
  Modal,
  Progress,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { useLocale } from "@/i18n";
import type {
  CompanyEventAttendanceRow,
  CompanyEventAttendanceSummaryResponse,
} from "../event.types";

type Props = {
  open: boolean;
  loading: boolean;
  attendance?: CompanyEventAttendanceSummaryResponse;
  onClose: () => void;
};

export default function EventAttendanceModal({
  open,
  loading,
  attendance,
  onClose,
}: Props) {
  const { t } = useLocale();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("onboarding.events.attendance.title")}
      width={840}
      footer={
        <Button onClick={onClose}>
          {t("onboarding.events.common.close")}
        </Button>
      }
    >
      {loading ? (
        <Card loading />
      ) : attendance ? (
        <div className="space-y-4">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card>
                <Statistic
                  title={t("onboarding.events.attendance.invited")}
                  value={attendance.totalInvited}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card>
                <Statistic
                  title={t("onboarding.events.attendance.attended")}
                  value={attendance.attendedCount}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card>
                <Statistic
                  title={t("onboarding.events.attendance.not_attended")}
                  value={attendance.notAttendedCount}
                />
              </Card>
            </Col>
          </Row>

          <Card>
            <Typography.Text strong>
              {t("onboarding.events.attendance.rate")}
            </Typography.Text>

            <Progress
              className="mt-3"
              percent={Math.round((attendance.attendanceRate || 0) * 100)}
            />
          </Card>

          <Table<CompanyEventAttendanceRow>
            rowKey="userId"
            size="small"
            dataSource={attendance.attendees ?? []}
            pagination={{ pageSize: 6 }}
            columns={[
              {
                title: t("onboarding.events.attendance.user"),
                dataIndex: "fullName",
                render: (value: string | undefined, record) =>
                  value || record.userId,
              },
              {
                title: t("onboarding.events.attendance.status"),
                dataIndex: "attended",
                render: (value: boolean) =>
                  value ? (
                    <Tag color="green">
                      {t("onboarding.events.attendance.status_attended")}
                    </Tag>
                  ) : (
                    <Tag color="red">
                      {t("onboarding.events.attendance.status_not_attended")}
                    </Tag>
                  ),
              },
              {
                title: t("onboarding.events.attendance.done_task"),
                dataIndex: "doneTaskCount",
              },
              {
                title: t("onboarding.events.attendance.total_task"),
                dataIndex: "totalTaskCount",
              },
            ]}
          />
        </div>
      ) : (
        <Empty description={t("onboarding.events.attendance.empty")} />
      )}
    </Modal>
  );
}