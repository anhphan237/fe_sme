import { Button, Card, Col, Row, Typography } from "antd";
import { Link } from "react-router-dom";

const EmployeeHome = () => {
  return (
    <div className="space-y-4 p-6">
      <div>
        <Typography.Title level={3} className="!mb-1">
          Khong gian onboarding cua toi
        </Typography.Title>
        <Typography.Text type="secondary">
          Hoan thanh task, xac nhan tai lieu va gui survey theo tien do
          onboarding.
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={8}>
          <Card title="Task can lam" className="h-full">
            <Typography.Paragraph type="secondary">
              Theo doi checklist va cap nhat trang thai hoan thanh tung task.
            </Typography.Paragraph>
            <Link to="/onboarding/tasks">
              <Button type="primary" block>
                Mo task cua toi
              </Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={8}>
          <Card title="Tai lieu can xac nhan" className="h-full">
            <Typography.Paragraph type="secondary">
              Kiem tra, ky nhan va cap nhat trang thai acknowledgment cho tai
              lieu.
            </Typography.Paragraph>
            <Link to="/documents/acknowledgments">
              <Button block>Mo danh sach tai lieu</Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={8}>
          <Card title="Survey can phan hoi" className="h-full">
            <Typography.Paragraph type="secondary">
              Xem va tra loi cac survey 7/30/60 ngay trong qua trinh onboarding.
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

export default EmployeeHome;
