import type { FormInstance } from "antd/es/form";
import { Alert, Button, Drawer, Form, Input, Select, Space } from "antd";
import type { OnboardingEventTemplateCreateRequest } from "@/interface/onboarding";

type Props = {
  open: boolean;
  loading: boolean;
  form: FormInstance<OnboardingEventTemplateCreateRequest>;
  onClose: () => void;
  onSubmit: () => void;
};

export default function EventTemplateDrawer({
  open,
  loading,
  form,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Tạo mẫu nội dung sự kiện"
      width={560}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>

          <Button type="primary" onClick={onSubmit} loading={loading}>
            Tạo mẫu
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ status: "ACTIVE" }}>
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Tạo mẫu nội dung để dùng khi tạo sự kiện"
          description="Ví dụ: onboarding đầu tuần, giới thiệu công ty, buổi chia sẻ nội bộ..."
        />

        <Form.Item
          name="name"
          label="Tên mẫu"
          rules={[{ required: true, message: "Vui lòng nhập tên mẫu" }]}
        >
          <Input placeholder="Ví dụ: Buổi giới thiệu nhân viên mới" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả ngắn">
          <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về buổi này" />
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung chính"
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
        >
          <Input.TextArea
            rows={7}
            placeholder={`- Giới thiệu công ty
- Văn hóa doanh nghiệp
- Quy định cơ bản
- Giới thiệu bộ phận
- Hỏi đáp`}
          />
        </Form.Item>

        <Form.Item name="status" label="Trạng thái">
          <Select
            options={[
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "DRAFT", label: "DRAFT" },
              { value: "INACTIVE", label: "INACTIVE" },
            ]}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}