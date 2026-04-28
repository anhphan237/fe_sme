import { Card, Col, Row, Statistic } from "antd";

type Props = {
  totalCount: number;
  activeCount: number;
  draftCount: number;
  inactiveCount: number;
};

export default function CompanyEventTemplateStats({
  totalCount,
  activeCount,
  draftCount,
  inactiveCount,
}: Props) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={6}>
        <Card className="rounded-2xl">
          <Statistic title="Tổng mẫu" value={totalCount} />
        </Card>
      </Col>

      <Col xs={24} md={6}>
        <Card className="rounded-2xl">
          <Statistic title="Đang hoạt động" value={activeCount} />
        </Card>
      </Col>

      <Col xs={24} md={6}>
        <Card className="rounded-2xl">
          <Statistic title="Bản nháp" value={draftCount} />
        </Card>
      </Col>

      <Col xs={24} md={6}>
        <Card className="rounded-2xl">
          <Statistic title="Ngưng hoạt động" value={inactiveCount} />
        </Card>
      </Col>
    </Row>
  );
}
