import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Popconfirm,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { Archive, ArrowLeft, Power, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocale } from "@/i18n";
import {
  apiActivatePlatformTemplate,
  apiCreatePlatformTemplate,
  apiDeactivatePlatformTemplate,
  apiDeletePlatformTemplate,
  apiGetPlatformTemplateDetail,
  apiUpdatePlatformTemplate,
} from "@/api/admin/admin.api";
import type { PlatformTemplateFormValue } from "@/shared/types";
import { defaultPlatformTemplateValues } from "@/constants/admin-platform";
import PlatformTemplateBasicInfo from "@/layouts/components/admin/PlatformTemplateBasicInfo";
import PlatformTemplateChecklistBuilder from "@/layouts/components/admin/PlatformTemplateChecklistBuilder";
import PlatformTemplateSummaryCard from "@/layouts/components/admin/PlatformTemplateSummaryCard";
import { mapTemplateDetailToFormValue, buildCreatePlatformTemplatePayload } from "@/utils/mappers/admin-template";


const { Title, Paragraph } = Typography;

const PlatformTemplateCreate = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { templateId } = useParams();

  const isEdit = Boolean(templateId);

  const [form] = Form.useForm<PlatformTemplateFormValue>();
  const [loading, setLoading] = useState(false);
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

  const loadDetail = async () => {
    if (!templateId) return;

    setLoading(true);

    try {
      const detail = await apiGetPlatformTemplateDetail({ templateId });
      form.setFieldsValue(mapTemplateDetailToFormValue(detail));
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t("platform.templates.detail_error"),
      );
      navigate("/platform/admin/templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      loadDetail();
    } else {
      form.setFieldsValue(defaultPlatformTemplateValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

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

      if (isEdit && templateId) {
        await apiUpdatePlatformTemplate({
          templateId,
          ...payload,
        });

        message.success(t("platform.templates.update_success"));
      } else {
        await apiCreatePlatformTemplate(payload);
        message.success(t("platform.templates.create_success"));
      }

      navigate("/platform/admin/templates");
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : isEdit
            ? t("platform.templates.update_error")
            : t("platform.templates.create_error"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async () => {
    if (!templateId) return;

    setSubmitting(true);

    try {
      await apiActivatePlatformTemplate({ templateId });
      message.success(t("platform.templates.activate_success"));
      await loadDetail();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t("platform.templates.activate_error"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!templateId) return;

    setSubmitting(true);

    try {
      await apiDeactivatePlatformTemplate({ templateId });
      message.success(t("platform.templates.deactivate_success"));
      await loadDetail();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t("platform.templates.deactivate_error"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!templateId) return;

    setSubmitting(true);

    try {
      await apiDeletePlatformTemplate({ templateId });
      message.success(t("platform.templates.delete_success"));
      navigate("/platform/admin/templates");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t("platform.templates.delete_error"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isEdit) {
      loadDetail();
    } else {
      form.resetFields();
      form.setFieldsValue(defaultPlatformTemplateValues);
    }
  };

  const currentStatus = String(summary.status || "DRAFT").toUpperCase();

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

            <Space align="center" wrap>
              <Title level={3} className="!mb-1">
                {isEdit
                  ? t("platform.templates.edit_page_title")
                  : t("platform.templates.create_page_title")}
              </Title>

              {isEdit && <Tag color="blue">{currentStatus}</Tag>}
            </Space>

            <Paragraph className="!mb-0 max-w-3xl text-gray-500">
              {isEdit
                ? t("platform.templates.edit_page_subtitle")
                : t("platform.templates.create_page_subtitle")}
            </Paragraph>
          </div>

          <Space wrap>
            <Button onClick={handleReset}>{t("global.reset")}</Button>

            {isEdit && currentStatus === "ACTIVE" && (
              <Button
                icon={<Archive size={16} />}
                loading={submitting}
                onClick={handleDeactivate}
              >
                {t("platform.templates.deactivate")}
              </Button>
            )}

            {isEdit && currentStatus !== "ACTIVE" && (
              <Button
                icon={<Power size={16} />}
                loading={submitting}
                onClick={handleActivate}
              >
                {t("platform.templates.activate")}
              </Button>
            )}

            {isEdit && (
              <Popconfirm
                title={t("platform.templates.delete_confirm")}
                okText={t("global.delete")}
                cancelText={t("global.cancel")}
                onConfirm={handleDelete}
              >
                <Button danger icon={<Trash2 size={16} />} loading={submitting}>
                  {t("global.delete")}
                </Button>
              </Popconfirm>
            )}

            <Button
              type="primary"
              icon={<Save size={16} />}
              loading={submitting}
              onClick={() => form.submit()}
            >
              {isEdit
                ? t("platform.templates.update_btn")
                : t("platform.templates.create_btn")}
            </Button>
          </Space>
        </div>

        {loading ? (
          <Card className="rounded-2xl shadow-sm">
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>
        ) : (
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
                      {isEdit
                        ? t("platform.templates.update_btn")
                        : t("platform.templates.create_btn")}
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
        )}
      </div>
    </div>
  );
};

export default PlatformTemplateCreate;