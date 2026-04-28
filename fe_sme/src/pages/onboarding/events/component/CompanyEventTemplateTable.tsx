import { Button, Empty, Space, Table, Tag, Typography } from "antd";
import { CalendarPlus, Copy, Eye } from "lucide-react";
import type { CompanyEventTemplateListItem } from "../company-event-template.types";
import {
  companyEventTemplateStatusColor,
  companyEventTemplateStatusLabel,
  formatTemplateDateTime,
} from "../event-template.utils";

type Props = {
  loading: boolean;
  data: CompanyEventTemplateListItem[];
  onView: (eventTemplateId: string) => void;
  onCopy: (eventTemplateId: string) => void;
  onUseTemplate: (eventTemplateId: string) => void;
};

export default function CompanyEventTemplateTable({
  loading,
  data,
  onView,
  onCopy,
  onUseTemplate,
}: Props) {
  return (
    <Table<CompanyEventTemplateListItem>
      rowKey="eventTemplateId"
      loading={loading}
      dataSource={data}
      pagination={{ pageSize: 8 }}
      locale={{
        emptyText: <Empty description="Chưa có mẫu sự kiện nào." />,
      }}
      columns={[
        {
          title: "Tên mẫu",
          dataIndex: "name",
          render: (value, record) => (
            <div>
              <Typography.Text strong>{value}</Typography.Text>
              <div className="mt-1 text-xs text-slate-500">
                {record.eventTemplateId}
              </div>
            </div>
          ),
        },
        {
          title: "Mô tả",
          dataIndex: "description",
          render: (value) => (
            <Typography.Paragraph
              className="!mb-0 line-clamp-2"
              type="secondary"
            >
              {value || "Chưa có mô tả."}
            </Typography.Paragraph>
          ),
        },
        {
          title: "Nội dung tóm tắt",
          dataIndex: "description",
          render: (value, record) => (
            <Typography.Paragraph
              className="!mb-0 line-clamp-2"
              type="secondary"
            >
              {value || record.content || "Chưa có nội dung."}
            </Typography.Paragraph>
          ),
        },
        {
          title: "Trạng thái",
          dataIndex: "status",
          width: 150,
          render: (value) => (
            <Tag color={companyEventTemplateStatusColor(value)}>
              {companyEventTemplateStatusLabel(value)}
            </Tag>
          ),
        },
        {
          title: "Ngày tạo",
          dataIndex: "createdAt",
          width: 170,
          render: formatTemplateDateTime,
        },
        {
          title: "Thao tác",
          width: 300,
          render: (_, record) => (
            <Space wrap>
              <Button
                icon={<Eye size={14} />}
                onClick={() => onView(record.eventTemplateId)}
              >
                Xem
              </Button>

              <Button
                icon={<Copy size={14} />}
                onClick={() => onCopy(record.eventTemplateId)}
              >
                Copy mã
              </Button>

              <Button
                type="primary"
                icon={<CalendarPlus size={14} />}
                disabled={record.status !== "ACTIVE"}
                onClick={() => onUseTemplate(record.eventTemplateId)}
              >
                Tạo sự kiện
              </Button>
            </Space>
          ),
        },
      ]}
    />
  );
}
