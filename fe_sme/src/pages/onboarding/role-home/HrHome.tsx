import { Alert, Button, Card, Col, Row, Typography } from "antd";
import { Link } from "react-router-dom";

const HrHome = () => {
  return (
    <div className="space-y-4 p-6">
      <div>
        <Typography.Title level={3} className="!mb-1">
          Trung tam dieu hanh onboarding (HR)
        </Typography.Title>
        <Typography.Text type="secondary">
          Khoi tao onboarding, quan ly template, theo doi van hanh va toi uu
          trai nghiem nhan vien moi.
        </Typography.Text>
      </div>

      <Alert
        type="info"
        showIcon
        message="Luu y"
        description="Automation rules/log hien dang phu thuoc mot so API backend dang bo sung."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={8}>
          <Card title="Nhan vien onboarding" className="h-full">
            <Typography.Paragraph type="secondary">
              Tao dot onboarding moi, theo doi tien do va xu ly cac instance
              dang active.
            </Typography.Paragraph>
            <Link to="/onboarding/hr/employees">
              <Button type="primary" block>
                Mo danh sach nhan vien
              </Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={8}>
          <Card title="Template va checklist" className="h-full">
            <Typography.Paragraph type="secondary">
              Quan ly bo template theo phong ban/vi tri de tai su dung cho cac
              dot onboarding.
            </Typography.Paragraph>
            <Link to="/onboarding/hr/templates">
              <Button block>Mo thu vien template</Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={8}>
          <Card title="Tu dong hoa" className="h-full">
            <Typography.Paragraph type="secondary">
              Bat/tat rule gui email-thong bao va theo doi nhat ky gui theo
              trigger onboarding.
            </Typography.Paragraph>
            <Link to="/onboarding/hr/automation">
              <Button block>Mo automation</Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={8}>
          <Card title="Onboarding reports" className="h-full">
            <Typography.Paragraph type="secondary">
              Xem tong hop ket qua survey va chat luong onboarding theo tung
              giai doan.
            </Typography.Paragraph>
            <Link to="/surveys/reports">
              <Button block>Mo bao cao</Button>
            </Link>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HrHome;
