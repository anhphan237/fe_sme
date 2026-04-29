import { Button, Space, Typography } from "antd";
import { CalendarCheck2, RefreshCw, Sparkles } from "lucide-react";

type Props = {
  loading?: boolean;
  onRefresh: () => void;
};

export default function MyCompanyEventHeader({ loading, onRefresh }: Props) {
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
                Theo dõi các buổi onboarding, chia sẻ nội bộ và xác nhận tham
                gia sau khi sự kiện bắt đầu.
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

            <Button type="primary" icon={<CalendarCheck2 size={16} />}>
              Danh sách sự kiện
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
