import { Button, Card, Drawer, Empty, Tag, Typography } from "antd";
import { CalendarPlus } from "lucide-react";
import type {
  CompanyEventTemplateDetailResponse,
  CompanyEventTemplateListItem,
} from "../company-event-template.types";
import {
  companyEventTemplateStatusColor,
  companyEventTemplateStatusLabel,
  formatTemplateDateTime,
} from "../event-template.utils";

type Props = {
  open: boolean;
  loading: boolean;
  detail?: CompanyEventTemplateDetailResponse;
  fallbackItem?: CompanyEventTemplateListItem;
  createdByName?: string;
  onClose: () => void;
  onUseTemplate: (eventTemplateId: string) => void;
};

export default function CompanyEventTemplateDetailDrawer({
  open,
  loading,
  detail,
  fallbackItem,
  createdByName,
  onClose,
  onUseTemplate,
}: Props) {
  const template = detail ?? fallbackItem;

  const eventTemplateId = template?.eventTemplateId;
  const name = template?.name || "-";
  const status = template?.status || "-";

  const description = template?.description?.trim() || "Chưa có mô tả.";

  const content = template?.content?.trim() || "-";

  const creator =
    createdByName ||
    template?.createdByName ||
    template?.createdByEmail ||
    template?.createdBy ||
    "-";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Chi tiết mẫu sự kiện"
      width={640}
      extra={
        eventTemplateId ? (
          <Button
            type="primary"
            icon={<CalendarPlus size={14} />}
            disabled={status !== "ACTIVE"}
            onClick={() => onUseTemplate(eventTemplateId)}
          >
            Tạo sự kiện từ mẫu này
          </Button>
        ) : null
      }
    >
      {loading ? (
        <Card loading />
      ) : template ? (
        <div className="space-y-4">
          <Card className="rounded-2xl">
            <Typography.Title level={4} className="!mb-1">
              {name}
            </Typography.Title>

            <Tag color={companyEventTemplateStatusColor(status)}>
              {companyEventTemplateStatusLabel(status)}
            </Tag>

            <div className="mt-4 text-sm text-slate-500">
              Mã mẫu: {eventTemplateId}
            </div>
          </Card>

          <Card title="Mô tả" className="rounded-2xl">
            <Typography.Paragraph className="!mb-0 whitespace-pre-line">
              {description}
            </Typography.Paragraph>
          </Card>

          <Card title="Nội dung chương trình" className="rounded-2xl">
            <Typography.Paragraph className="!mb-0 whitespace-pre-line">
              {content}
            </Typography.Paragraph>
          </Card>

          <Card title="Thông tin tạo" className="rounded-2xl">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Người tạo: </span>
                {creator}
              </div>

              <div>
                <span className="text-slate-500">Ngày tạo: </span>
                {formatTemplateDateTime(template.createdAt)}
              </div>

              <div>
                <span className="text-slate-500">Cập nhật: </span>
                {formatTemplateDateTime(template.updatedAt)}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Empty description="Không có dữ liệu mẫu." />
      )}
    </Drawer>
  );
}