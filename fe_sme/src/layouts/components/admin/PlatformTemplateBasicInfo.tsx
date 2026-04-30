import { Card, Col, Form, Input, Row, Select, Typography } from "antd";
import { useMemo } from "react";
import { useLocale } from "@/i18n";
import { templateStatusOptions } from "@/constants/admin-platform";


const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const PlatformTemplateBasicInfo = () => {
  const { t } = useLocale();

  const statusOptions = useMemo(
    () =>
      templateStatusOptions.map((item) => ({
        label: t(item.labelKey),
        value: item.value,
      })),
    [t],
  );

  return (
    <Card
      title={
        <div>
          <Text strong>{t("platform.templates.basic_info")}</Text>
          <Paragraph className="!mb-0 !mt-1 text-sm text-gray-500">
            {t("platform.templates.basic_info_desc")}
          </Paragraph>
        </div>
      }
      className="rounded-2xl shadow-sm"
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="name"
            label={t("platform.templates.field_name")}
            rules={[
              {
                required: true,
                message: t("platform.templates.validation.name_required"),
              },
              {
                max: 255,
                message: t("platform.templates.validation.name_max"),
              },
            ]}
          >
            <Input placeholder={t("platform.templates.field_name_placeholder")} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="status"
            label={t("global.status")}
            rules={[
              {
                required: true,
                message: t("platform.templates.validation.status_required"),
              },
            ]}
          >
            <Select options={statusOptions} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="departmentTypeCode"
            label={t("platform.templates.department_type")}
          >
            <Input placeholder={t("platform.templates.department_type_placeholder")} />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="description" label={t("platform.templates.field_description")}>
            <TextArea
              rows={4}
              placeholder={t("platform.templates.field_description_placeholder")}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="templateKind" hidden>
        <Input />
      </Form.Item>
    </Card>
  );
};

export default PlatformTemplateBasicInfo;