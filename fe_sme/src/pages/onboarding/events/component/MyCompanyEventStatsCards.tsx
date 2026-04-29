import { Card, Col, Row, Statistic } from "antd";
import { CalendarDays, CheckCircle2, Clock, ListChecks } from "lucide-react";

type Props = {
  totalEvents: number;
  todayCount: number;
  upcomingCount: number;
  confirmedCount: number;
};

export default function MyCompanyEventStatsCards({
  totalEvents,
  todayCount,
  upcomingCount,
  confirmedCount,
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
            prefix={<ListChecks size={18} />}
          />
        </Card>
      </Col>

      <Col xs={24} md={12} xl={6}>
        <Card className="h-full rounded-2xl">
          <Statistic
            title="Đã xác nhận"
            value={confirmedCount}
            prefix={<CheckCircle2 size={18} />}
          />
        </Card>
      </Col>
    </Row>
  );
}
