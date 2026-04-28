import { useMemo, useState } from "react";
import { Button, Card, Col, Form, Row, Space, Typography, message } from "antd";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n";
import { apiCreatePlatformTemplate } from "@/api/admin/admin.api";
import { defaultPlatformTemplateValues } from "@/constants/admin-platform";
import PlatformTemplateBasicInfo from "@/layouts/components/admin/PlatformTemplateBasicInfo";
import PlatformTemplateChecklistBuilder from "@/layouts/components/admin/PlatformTemplateChecklistBuilder";
import PlatformTemplateSummaryCard from "@/layouts/components/admin/PlatformTemplateSummaryCard";
import type { PlatformTemplateFormValue } from "@/shared/types";
import { buildCreatePlatformTemplatePayload } from "@/utils/mappers/admin-template";

const { Title, Paragraph } = Typography;

const PlatformTemplates = () => {
  const { t } = useLocale();
  const navigate = useNavigate();

  const [form] = Form.useForm<PlatformTemplateFormValue>();
  const [submitting, setSubmitting] = useState(false);

  const watchedValues = Form.useWatch([], form);

  const summary = useMemo(() => {
    const checklists = watchedValues?.checklists || [];
    const taskCount = checklists.reduce(
      (total, checklist) => total + Number(checklist?.tasks?.length || 0),
      0,
    );

    return {
      checklistCount: checklists.length,
      taskCount,
      status: watchedValues?.status || defaultPlatformTemplateValues.status,
    };
  }, [watchedValues]);

  const handleSubmit = async (values: PlatformTemplateFormValue) => {
    const hasEmptyChecklist = values.checklists?.some(
      (checklist) => !checklist?.tasks?.length,
    );

    if (hasEmptyChecklist) {
      message.warning(t("platform.templates.validation.task_min"));
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildCreatePlatformTemplatePayload(values);
      await apiCreatePlatformTemplate(payload);

      message.success(t("platform.templates.create_success"));
      navigate("/platform/admin/templates");
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : t("platform.templates.create_error"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue(defaultPlatformTemplateValues);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <Button
              type="text"
              icon={<ArrowLeft size={16} />}
              className="mb-3 !px-0"
              onClick={() => navigate("/platform/admin/templates")}
            >
              {t("global.back")}
            </Button>

            <Title level={3} className="!mb-1">
              {t("platform.templates.create_page_title")}
            </Title>

            <Paragraph className="!mb-0 max-w-3xl text-gray-500">
              {t("platform.templates.create_page_subtitle")}
            </Paragraph>
          </div>

          <Space wrap>
            <Button onClick={handleReset}>{t("global.reset")}</Button>
            <Button
              type="primary"
              icon={<Save size={16} />}
              loading={submitting}
              onClick={() => form.submit()}
            >
              {t("platform.templates.create_btn")}
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={17}>
            <Form<PlatformTemplateFormValue>
              form={form}
              layout="vertical"
              initialValues={defaultPlatformTemplateValues}
              onFinish={handleSubmit}
              autoComplete="off"
            >
              <PlatformTemplateBasicInfo />

              <PlatformTemplateChecklistBuilder
                checklistCount={summary.checklistCount}
                taskCount={summary.taskCount}
              />

              <Card className="mt-4 rounded-2xl shadow-sm">
                <div className="flex flex-col justify-end gap-3 md:flex-row">
                  <Button onClick={handleReset}>{t("global.reset")}</Button>

                  <Button
                    type="primary"
                    icon={<Save size={16} />}
                    htmlType="submit"
                    loading={submitting}
                  >
                    {t("platform.templates.create_btn")}
                  </Button>
                </div>
              </Card>
            </Form>
          </Col>

          <Col xs={24} xl={7}>
            <PlatformTemplateSummaryCard
              checklistCount={summary.checklistCount}
              taskCount={summary.taskCount}
              status={summary.status}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PlatformTemplates;
