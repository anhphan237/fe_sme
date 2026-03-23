import { Button, Card, Col, Row, Typography } from "antd";
import { Link } from "react-router-dom";

const ManagerHome = () => {
  return (
    <div className="space-y-4 p-6">
      <div>
        <Typography.Title level={3} className="!mb-1">
          Workspace onboarding cho manager
        </Typography.Title>
        <Typography.Text type="secondary">
          Giam sat onboarding cua team, theo doi tac vu tre han va review ket
          qua danh gia.
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={8}>
          <Card title="Nhan vien dang onboarding" className="h-full">
            <Typography.Paragraph type="secondary">
              Theo doi danh sach thanh vien team, tien do onboarding va trang
              thai instance.
            </Typography.Paragraph>
            <Link to="/onboarding/manager/employees">
              <Button type="primary" block>
                Mo danh sach onboarding
              </Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={8}>
          <Card title="Task cua team" className="h-full">
            <Typography.Paragraph type="secondary">
              Kiem tra task qua han/chua hoan thanh de nhac nho hoac ho tro kip
              thoi.
            </Typography.Paragraph>
            <Link to="/onboarding/manager/tasks">
              <Button block>Mo bang task</Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={8}>
          <Card title="Survey va phan hoi" className="h-full">
            <Typography.Paragraph type="secondary">
              Theo doi survey inbox cua team de nam bat cam nhan trong cac moc
              onboarding.
            </Typography.Paragraph>
            <Link to="/surveys/inbox">
              <Button block>Mo survey inbox</Button>
            </Link>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManagerHome;
