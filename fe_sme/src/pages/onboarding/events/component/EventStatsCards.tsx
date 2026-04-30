import { Card, Col, Row, Statistic } from "antd";
import { CalendarDays, Clock, Copy, UserCheck } from "lucide-react";

type Props = {
  totalEvents: number;
  todayCount: number;
  upcomingCount: number;
  templateCount: number;
};

export default function EventStatsCards({
  totalEvents,
  todayCount,
  upcomingCount,
  templateCount,
}: Props) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12} xl={6}>
        <Card className="h-full rounded-2xl">
          <Statistic
            title="Tổng sự kiện"
            value={totalEvents}
            prefix={<CalendarDays size={18} />}
          />
        </Card>
      </Col>

      <Col xs={24} md={12} xl={6}>
        <Card className="h-full rounded-2xl">
          <Statistic
            title="Diễn ra hôm nay"
            value={todayCount}
            prefix={<Clock size={18} />}
          />
        </Card>
      </Col>

      <Col xs={24} md={12} xl={6}>
        <Card className="h-full rounded-2xl">
          <Statistic
            title="Sắp diễn ra"
            value={upcomingCount}
            prefix={<UserCheck size={18} />}
          />
        </Card>
      </Col>

      <Col xs={24} md={12} xl={6}>
        <Card className="h-full rounded-2xl">
          <Statistic
            title="Mẫu sự kiện"
            value={templateCount}
            prefix={<Copy size={18} />}
          />
        </Card>
      </Col>
    </Row>
  );
}
