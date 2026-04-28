import { Button, Space, Typography } from "antd";
import { FileText, Plus, RefreshCw } from "lucide-react";

type Props = {
  loading?: boolean;
  onRefresh: () => void;
  onCreate: () => void;
};

export default function CompanyEventTemplateHeader({
  loading,
  onRefresh,
  onCreate,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <FileText size={14} />
              Mẫu nội dung sự kiện
            </div>

            <Typography.Title level={3} className="!mb-1">
              Mẫu sự kiện nội bộ
            </Typography.Title>

            <Typography.Text type="secondary">
              Quản lý các mẫu nội dung dùng để tạo sự kiện chung, onboarding,
              giới thiệu công ty hoặc các buổi chia sẻ nội bộ.
            </Typography.Text>
          </div>

          <Space wrap>
            <Button
              icon={<RefreshCw size={16} />}
              onClick={onRefresh}
              loading={loading}
            >
              Làm mới
            </Button>

            <Button type="primary" icon={<Plus size={16} />} onClick={onCreate}>
              Tạo mẫu mới
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
