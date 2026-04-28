import { Card, Divider, Space, Steps, Tag, Typography } from "antd";
import { CheckCircle2, ClipboardList, Layers3, Sparkles } from "lucide-react";
import { useLocale } from "@/i18n";

const { Text, Paragraph } = Typography;

interface Props {
  checklistCount: number;
  taskCount: number;
  status?: string;
}

const PlatformTemplateSummaryCard = ({
  checklistCount,
  taskCount,
  status,
}: Props) => {
  const { t } = useLocale();

  return (
    <Card className="sticky top-6 shadow-sm">
      <Space direction="vertical" size={16} className="w-full">
        <div>
          <Space align="center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Sparkles size={20} />
            </div>
            <div>
              <Text strong>{t("platform.templates.summary.title")}</Text>
              <Paragraph className="!mb-0 text-sm text-gray-500">
                {t("platform.templates.summary.desc")}
              </Paragraph>
            </div>
          </Space>
        </div>

        <Divider className="!my-1" />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <Space direction="vertical" size={4}>
              <Layers3 size={18} className="text-blue-600" />
              <Text className="text-2xl font-semibold">{checklistCount}</Text>
              <Text className="text-xs text-gray-500">
                {t("platform.templates.checklists")}
              </Text>
            </Space>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <Space direction="vertical" size={4}>
              <ClipboardList size={18} className="text-green-600" />
              <Text className="text-2xl font-semibold">{taskCount}</Text>
              <Text className="text-xs text-gray-500">
                {t("platform.templates.tasks")}
              </Text>
            </Space>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <Space direction="vertical" size={8}>
            <Text strong>{t("platform.templates.summary.status")}</Text>
            <Tag color={status === "ACTIVE" ? "green" : "gold"}>
              {status === "ACTIVE"
                ? t("platform.templates.status_active")
                : t("platform.templates.status_draft")}
            </Tag>
          </Space>
        </div>

        <Divider className="!my-1" />

        <Steps
          direction="vertical"
          size="small"
          current={1}
          items={[
            {
              title: t("platform.templates.summary.step_design"),
              icon: <ClipboardList size={16} />,
            },
            {
              title: t("platform.templates.summary.step_review"),
              icon: <CheckCircle2 size={16} />,
            },
            {
              title: t("platform.templates.summary.step_publish"),
              icon: <Sparkles size={16} />,
            },
          ]}
        />
      </Space>
    </Card>
  );
};

export default PlatformTemplateSummaryCard;