import { useMemo, useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { FormInstance } from "antd/es/form";
import type { DefaultOptionType } from "antd/es/select";
import type { UploadFile, UploadProps } from "antd";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  Form,
  Image,
  Input,
  Radio,
  Select,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import { Building2, ImagePlus, Trash2, UploadCloud, Users } from "lucide-react";

import type { CompanyEventTemplateListItem } from "../company-event-template.types";
import type {
  DepartmentOption,
  ParticipantMode,
  PublishCompanyEventFormValues,
  UserOption,
} from "../event.types";

type Props = {
  open: boolean;
  loading: boolean;
  form: FormInstance<PublishCompanyEventFormValues>;
  templateOptions: { label: string; value: string }[];
  selectedTemplate?: CompanyEventTemplateListItem;
  departments: DepartmentOption[];
  users: UserOption[];
  templatesLoading: boolean;
  departmentsLoading: boolean;
  usersLoading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onTemplateChange: (eventTemplateId?: string) => void;
};

const MINUTE_STEP = 5;

const beforeUpload: UploadProps["beforeUpload"] = (file) => {
  const isImage = file.type.startsWith("image/");
  const isLt5Mb = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    message.error("Vui lòng chọn file ảnh");
    return Upload.LIST_IGNORE;
  }

  if (!isLt5Mb) {
    message.error("Ảnh không được vượt quá 5MB");
    return Upload.LIST_IGNORE;
  }

  return false;
};

const disabledBeforeTomorrow = (current?: Dayjs) => {
  const tomorrowStart = dayjs().add(1, "day").startOf("day");

  return Boolean(current && current.isBefore(tomorrowStart, "day"));
};

const disabledEndTime = (current?: Dayjs | null, startAt?: Dayjs) => {
  if (!current || !startAt || !current.isSame(startAt, "day")) {
    return {};
  }

  return {
    disabledHours: () =>
      Array.from({ length: startAt.hour() }, (_, index) => index),

    disabledMinutes: (selectedHour: number) => {
      if (selectedHour !== startAt.hour()) {
        return [];
      }

      return Array.from(
        { length: startAt.minute() + 1 },
        (_, index) => index,
      );
    },
  };
};

const buildGroupedUserOptions = (users: UserOption[]): DefaultOptionType[] => {
  const grouped = new Map<string, UserOption[]>();

  users.forEach((user) => {
    const groupName = user.departmentName || "Chưa có phòng ban";
    const current = grouped.get(groupName) ?? [];
    current.push(user);
    grouped.set(groupName, current);
  });

  return Array.from(grouped.entries()).map(([label, options]) => ({
    label,
    options,
  }));
};

export default function EventPublishDrawer({
  open,
  loading,
  form,
  templateOptions,
  selectedTemplate,
  departments,
  users,
  templatesLoading,
  departmentsLoading,
  usersLoading,
  onClose,
  onSubmit,
  onTemplateChange,
}: Props) {
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const participantMode =
    (Form.useWatch("participantMode", form) as ParticipantMode | undefined) ??
    "DEPARTMENT";

  const eventStartAt = Form.useWatch("eventStartAt", form) as
    | Dayjs
    | undefined;

  const selectedFilterDepartmentIds =
    (Form.useWatch("userDepartmentFilterIds", form) as string[] | undefined) ??
    [];

  const filteredUsers = useMemo(() => {
    if (selectedFilterDepartmentIds.length === 0) {
      return users;
    }

    const filterSet = new Set(selectedFilterDepartmentIds);

    return users.filter((user) => {
      if (!user.departmentId) {
        return false;
      }

      return filterSet.has(user.departmentId);
    });
  }, [selectedFilterDepartmentIds, users]);

  const userOptions = useMemo(
    () => buildGroupedUserOptions(filteredUsers),
    [filteredUsers],
  );

  const resetCoverState = () => {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    setFileList([]);
    setCoverPreviewUrl(undefined);
    form.setFieldValue("coverImageFile", undefined);
    form.setFieldValue("coverImageUrl", undefined);
  };

  const handleClose = () => {
    resetCoverState();
    onClose();
  };

  const handleParticipantModeChange = (mode: ParticipantMode) => {
    form.setFieldValue("participantMode", mode);
    form.setFieldValue("departmentIds", []);
    form.setFieldValue("userIds", []);
    form.setFieldValue("userDepartmentFilterIds", []);
  };

  const handleCoverChange: UploadProps["onChange"] = ({ fileList: nextList }) => {
    const latest = nextList.slice(-1);
    const rawFile = latest[0]?.originFileObj;

    setFileList(latest);

    if (!rawFile) {
      form.setFieldValue("coverImageFile", undefined);
      form.setFieldValue("coverImageUrl", undefined);

      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }

      setCoverPreviewUrl(undefined);
      return;
    }

    form.setFieldValue("coverImageFile", rawFile);
    form.setFieldValue("coverImageUrl", undefined);

    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(rawFile);
    setCoverPreviewUrl(objectUrl);
  };

  const handleRemoveCover = () => {
    resetCoverState();
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Tạo sự kiện chung"
      width={760}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={handleClose}>Hủy</Button>

          <Button type="primary" onClick={onSubmit} loading={loading}>
            Tạo sự kiện
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          participantMode: "DEPARTMENT",
        }}
      >
        <Form.Item
          name="eventTemplateId"
          label="Mẫu nội dung"
          rules={[{ required: true, message: "Vui lòng chọn mẫu nội dung" }]}
        >
          <Select
            showSearch
            allowClear
            loading={templatesLoading}
            placeholder="Chọn mẫu nội dung"
            options={templateOptions}
            optionFilterProp="label"
            onChange={(value) => onTemplateChange(value)}
          />
        </Form.Item>

        {selectedTemplate && (
          <Card
            className="mb-4 rounded-2xl bg-slate-50"
            styles={{ body: { padding: 16 } }}
          >
            <Typography.Text strong>{selectedTemplate.name}</Typography.Text>

            <Typography.Paragraph
              type="secondary"
              className="!mb-0 !mt-2 line-clamp-3 whitespace-pre-line"
            >
              {selectedTemplate.description ||
                selectedTemplate.content ||
                "Không có nội dung mô tả"}
            </Typography.Paragraph>
          </Card>
        )}

        <Form.Item name="coverImageFile" label="Ảnh bìa sự kiện">
          <div className="space-y-3">
            {coverPreviewUrl ? (
              <div className="overflow-hidden rounded-2xl border">
                <Image
                  src={coverPreviewUrl}
                  alt="event-cover"
                  className="max-h-[220px] w-full object-cover"
                  preview={false}
                />

                <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
                  <Typography.Text type="secondary">
                    Ảnh sẽ được upload khi tạo sự kiện
                  </Typography.Text>

                  <Button
                    danger
                    size="small"
                    icon={<Trash2 size={14} />}
                    onClick={handleRemoveCover}
                  >
                    Xóa ảnh
                  </Button>
                </div>
              </div>
            ) : (
              <Upload.Dragger
                accept="image/*"
                maxCount={1}
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleCoverChange}
                showUploadList={false}
              >
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <ImagePlus size={24} />
                  </div>

                  <Typography.Text strong>Chọn ảnh bìa từ máy</Typography.Text>

                  <Typography.Text type="secondary">
                    Hỗ trợ JPG/PNG/WebP, tối đa 5MB
                  </Typography.Text>

                  <Button icon={<UploadCloud size={15} />}>Chọn file</Button>
                </div>
              </Upload.Dragger>
            )}
          </div>
        </Form.Item>

        <Form.Item name="coverImageUrl" hidden>
          <Input />
        </Form.Item>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Form.Item
            name="eventStartAt"
            label="Thời gian bắt đầu"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn thời gian bắt đầu",
              },
            ]}
          >
            <DatePicker
              showTime={{
                format: "HH:mm",
                minuteStep: MINUTE_STEP,
              }}
              showNow={false}
              className="w-full"
              format="DD/MM/YYYY HH:mm"
              placeholder="Chọn ngày giờ bắt đầu"
              disabledDate={disabledBeforeTomorrow}
              onChange={() => {
                const start = form.getFieldValue("eventStartAt") as
                  | Dayjs
                  | undefined;

                const end = form.getFieldValue("eventEndAt") as
                  | Dayjs
                  | undefined;

                if (start && end && !end.isAfter(start)) {
                  form.setFieldValue("eventEndAt", undefined);
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="eventEndAt"
            label="Thời gian kết thúc"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn thời gian kết thúc",
              },
            ]}
          >
            <DatePicker
              showTime={{
                format: "HH:mm",
                minuteStep: MINUTE_STEP,
              }}
              showNow={false}
              className="w-full"
              format="DD/MM/YYYY HH:mm"
              placeholder="Chọn ngày giờ kết thúc"
              disabledDate={(current) => {
                if (!current) return false;

                if (disabledBeforeTomorrow(current)) {
                  return true;
                }

                if (eventStartAt) {
                  return current.isBefore(eventStartAt.startOf("day"), "day");
                }

                return false;
              }}
              disabledTime={(current) => disabledEndTime(current, eventStartAt)}
            />
          </Form.Item>
        </div>

        <Typography.Text type="secondary" className="block text-xs">
          Sự kiện chỉ được lên lịch từ ngày mai trở đi.
        </Typography.Text>

        <Divider />

        <div className="mb-3">
          <Typography.Title level={5} className="!mb-1">
            Người tham gia
          </Typography.Title>
          <Typography.Text type="secondary">
            Chọn một cách mời người tham gia để tránh trùng dữ liệu khi tạo sự
            kiện.
          </Typography.Text>
        </div>

        <Form.Item name="participantMode" className="!mb-4">
          <Radio.Group
            className="grid w-full grid-cols-1 gap-3 md:grid-cols-2"
            value={participantMode}
            onChange={(e) => handleParticipantModeChange(e.target.value)}
          >
            <Radio.Button
              value="DEPARTMENT"
              className="!h-auto rounded-2xl border p-4"
            >
              <div className="flex items-start gap-3">
                <Building2 size={20} className="mt-1" />
                <div>
                  <div className="font-medium">Mời theo phòng ban</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Mời toàn bộ nhân viên của phòng ban được chọn.
                  </div>
                </div>
              </div>
            </Radio.Button>

            <Radio.Button value="USER" className="!h-auto rounded-2xl border p-4">
              <div className="flex items-start gap-3">
                <Users size={20} className="mt-1" />
                <div>
                  <div className="font-medium">Chọn từng nhân viên</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Chỉ mời những nhân viên được chọn trong danh sách.
                  </div>
                </div>
              </div>
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {participantMode === "DEPARTMENT" ? (
          <Card className="rounded-2xl" styles={{ body: { padding: 16 } }}>
            <Form.Item
              name="departmentIds"
              label="Phòng ban tham gia"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn ít nhất một phòng ban",
                },
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                loading={departmentsLoading}
                options={departments}
                placeholder="Chọn phòng ban"
                notFoundContent={
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có phòng ban"
                  />
                }
              />
            </Form.Item>
          </Card>
        ) : (
          <Card className="rounded-2xl" styles={{ body: { padding: 16 } }}>
            <Form.Item
              name="userDepartmentFilterIds"
              label="Lọc nhân viên theo phòng ban"
            >
              <Select
                mode="multiple"
                allowClear
                loading={departmentsLoading}
                options={departments}
                placeholder="Chọn phòng ban để lọc danh sách nhân viên"
                notFoundContent={
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có phòng ban"
                  />
                }
              />
            </Form.Item>

            <Form.Item
              name="userIds"
              label="Nhân viên tham gia"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn ít nhất một nhân viên",
                },
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                showSearch
                loading={usersLoading}
                options={userOptions}
                optionFilterProp="label"
                placeholder="Chọn nhân viên"
                notFoundContent={
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có nhân viên phù hợp"
                  />
                }
              />
            </Form.Item>
          </Card>
        )}
      </Form>
    </Drawer>
  );
}