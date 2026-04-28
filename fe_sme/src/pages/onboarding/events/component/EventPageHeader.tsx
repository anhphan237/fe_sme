import { Button, Space, Typography } from "antd";
import { FileText, Plus, RefreshCw, Send, Sparkles } from "lucide-react";

type Props = {
  loading?: boolean;
  onRefresh: () => void;
  onCreateTemplate: () => void;
  onCreateEvent: () => void;
  onOpenTemplatePage: () => void;
};

export default function EventPageHeader({
  loading,
  onRefresh,
  onCreateTemplate,
  onCreateEvent,
  onOpenTemplatePage,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <Sparkles size={14} />
              Sự kiện nội bộ
            </div>

            <div>
              <Typography.Title level={3} className="!mb-1">
                Sự kiện chung của công ty
              </Typography.Title>

              <Typography.Text type="secondary">
                HR tạo và quản lý các buổi onboarding, giới thiệu hoặc chia sẻ
                chung cho nhân viên trong công ty.
              </Typography.Text>
            </div>
          </div>

          <Space wrap>
            <Button
              icon={<RefreshCw size={16} />}
              onClick={onRefresh}
              loading={loading}
            >
              Làm mới
            </Button>

            <Button icon={<FileText size={16} />} onClick={onOpenTemplatePage}>
              Mẫu sự kiện
            </Button>

            <Button icon={<Plus size={16} />} onClick={onCreateTemplate}>
              Tạo mẫu nhanh
            </Button>

            <Button
              type="primary"
              icon={<Send size={16} />}
              onClick={onCreateEvent}
            >
              Tạo sự kiện
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
