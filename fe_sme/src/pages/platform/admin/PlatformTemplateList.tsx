import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ClipboardList,
  FileText,
  Layers3,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n";

import type { PlatformTemplateListItem } from "@/interface/admin";
import { apiListPlatformTemplates } from "@/api/admin/admin.api";

const { Title, Paragraph, Text } = Typography;

const getStatusColor = (status?: string) => {
  const value = String(status || "").toUpperCase();

  if (value === "ACTIVE" || value === "PUBLISHED") return "green";
  if (value === "DRAFT") return "gold";
  if (value === "ARCHIVED") return "default";
  if (value === "INACTIVE") return "red";

  return "blue";
};

const PlatformTemplateList = () => {
  const { t } = useLocale();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<PlatformTemplateListItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const loadTemplates = async () => {
    setLoading(true);

    try {
      const res = await apiListPlatformTemplates({
        status: status === "ALL" ? undefined : status,
        page: 1,
        size: 100,
      });

      setTemplates(res?.items || []);
    } catch {
      message.error(t("platform.templates.load_error"));
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTemplates = useMemo(() => {
    const key = keyword.trim().toLowerCase();

    return templates.filter((item) => {
      const matchKeyword =
        !key ||
        item.name?.toLowerCase().includes(key) ||
        item.description?.toLowerCase().includes(key) ||
        item.departmentTypeCode?.toLowerCase().includes(key);

      const matchStatus =
        status === "ALL" || String(item.status).toUpperCase() === status;

      return matchKeyword && matchStatus;
    });
  }, [templates, keyword, status]);

  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((x) =>
      ["ACTIVE", "PUBLISHED"].includes(String(x.status).toUpperCase()),
    ).length;
    const draft = templates.filter(
      (x) => String(x.status).toUpperCase() === "DRAFT",
    ).length;
    const archived = templates.filter(
      (x) => String(x.status).toUpperCase() === "ARCHIVED",
    ).length;

    return { total, active, draft, archived };
  }, [templates]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <Title level={3} className="!mb-1">
              {t("platform.templates.title")}
            </Title>
            <Paragraph className="!mb-0 max-w-3xl text-gray-500">
              {t("platform.templates.subtitle")}
            </Paragraph>
          </div>

          <Space wrap>
            <Button icon={<RefreshCcw size={16} />} onClick={loadTemplates}>
              {t("global.retry")}
            </Button>

            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => navigate("/platform/admin/templates/new")}
            >
              {t("platform.templates.create_btn")}
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card className="rounded-2xl shadow-sm">
              <Space direction="vertical" size={4}>
                <Text className="text-gray-500">{t("platform.templates.stat_total")}</Text>
                <Text className="text-2xl font-semibold">{stats.total}</Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card className="rounded-2xl shadow-sm">
              <Space direction="vertical" size={4}>
                <Text className="text-gray-500">{t("platform.templates.stat_active")}</Text>
                <Text className="text-2xl font-semibold">{stats.active}</Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card className="rounded-2xl shadow-sm">
              <Space direction="vertical" size={4}>
                <Text className="text-gray-500">{t("platform.templates.stat_draft")}</Text>
                <Text className="text-2xl font-semibold">{stats.draft}</Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card className="rounded-2xl shadow-sm">
              <Space direction="vertical" size={4}>
                <Text className="text-gray-500">{t("platform.templates.stat_archived")}</Text>
                <Text className="text-2xl font-semibold">{stats.archived}</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card className="rounded-2xl shadow-sm">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <Input
              allowClear
              value={keyword}
              prefix={<Search size={16} className="text-gray-400" />}
              placeholder={t("platform.templates.search_placeholder")}
              className="md:max-w-[420px]"
              onChange={(e) => setKeyword(e.target.value)}
            />

            <Select
              value={status}
              className="w-full md:w-[220px]"
              onChange={setStatus}
              options={[
                { label: t("global.all"), value: "ALL" },
                { label: t("platform.templates.status_draft"), value: "DRAFT" },
                { label: t("platform.templates.status_active"), value: "ACTIVE" },
                { label: t("platform.templates.status_archived"), value: "ARCHIVED" },
              ]}
            />
          </div>
        </Card>

        {loading ? (
          <Row gutter={[16, 16]}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Col xs={24} md={12} xl={8} key={index}>
                <Card className="rounded-2xl shadow-sm">
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : filteredTemplates.length === 0 ? (
          <Card className="rounded-2xl shadow-sm">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text strong>{t("platform.templates.empty")}</Text>
                  <Paragraph className="!mb-0 text-gray-500">
                    {t("platform.templates.empty_desc")}
                  </Paragraph>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => navigate("/platform/admin/templates/new")}
              >
                {t("platform.templates.create_btn")}
              </Button>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredTemplates.map((item) => (
              <Col xs={24} md={12} xl={8} key={item.templateId}>
                <Card
                  hoverable
                  className="h-full rounded-2xl shadow-sm transition hover:-translate-y-1"
                  onClick={() =>
                    item.templateId &&
                    navigate(`/platform/admin/templates/${item.templateId}`)
                  }
                >
                  <div className="flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <FileText size={22} />
                        </div>

                        <div className="min-w-0">
                          <Text strong className="block truncate text-base">
                            {item.name || t("platform.templates.untitled")}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {item.departmentTypeCode || t("platform.templates.general")}
                          </Text>
                        </div>
                      </div>

                      <Tag color={getStatusColor(item.status)}>
                        {String(item.status || "DRAFT")}
                      </Tag>
                    </div>

                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      className="!mb-0 min-h-[44px] text-gray-500"
                    >
                      {item.description || t("platform.templates.no_description")}
                    </Paragraph>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <Layers3 size={16} className="mb-1 text-blue-600" />
                        <Text strong>{item.checklistCount ?? 0}</Text>
                        <div className="text-xs text-gray-500">
                          {t("platform.templates.checklists")}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <ClipboardList size={16} className="mb-1 text-green-600" />
                        <Text strong>{item.taskCount ?? 0}</Text>
                        <div className="text-xs text-gray-500">
                          {t("platform.templates.tasks")}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <Text strong>{item.usedByCompanyCount ?? 0}</Text>
                        <div className="mt-1 text-xs text-gray-500">
                          {t("platform.templates.used_by")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                      <Text className="text-xs text-gray-400">
                        {item.updatedAt || item.createdAt || ""}
                      </Text>

                      <Button type="link" className="!px-0">
                        {t("global.detail")}
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default PlatformTemplateList;