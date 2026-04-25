import { useState, useMemo } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
  notification,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import {
  apiGetPlatformTemplateList,
  apiCreatePlatformTemplate,
  apiUpdatePlatformTemplate,
  apiActivatePlatformTemplate,
  apiArchivePlatformTemplate,
} from "@/api/platform/platform.api";
import MyTable from "@/components/table";
import { useLocale } from "@/i18n";
import type {
  PlatformTemplateItem,
  PlatformTemplateCreateRequest,
  PlatformTemplateUpdateRequest,
} from "@/interface/platform";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalMode = "create" | "edit";
type StatusFilter = "ALL" | "DRAFT" | "ACTIVE" | "ARCHIVED";

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  ACTIVE: "success",
  DRAFT: "default",
  ARCHIVED: "warning",
};

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

// ── Component ─────────────────────────────────────────────────────────────────

const PlatformTemplates = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // ── Filter state ──
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // ── Modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingTemplate, setEditingTemplate] =
    useState<PlatformTemplateItem | null>(null);

  // ── Fetch ──
  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ["platform-templates"],
    queryFn: () => apiGetPlatformTemplateList({ page: 0, size: 200 }),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      return ((r?.items ?? []) as PlatformTemplateItem[]).filter(
        (t) => t.level === "PLATFORM",
      );
    },
  });

  // ── Client-side filtering ──
  const items = useMemo(() => {
    let list = rawItems;
    if (statusFilter !== "ALL")
      list = list.filter((i) => i.status === statusFilter);
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [rawItems, statusFilter, keyword]);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (payload: PlatformTemplateCreateRequest) =>
      apiCreatePlatformTemplate(payload),
    onSuccess: () => {
      notification.success({
        message:
          t("platform.templates.create_success") ?? "Tạo template thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["platform-templates"] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: () =>
      notification.error({
        message:
          t("platform.templates.create_error") ?? "Tạo template thất bại",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: PlatformTemplateUpdateRequest) =>
      apiUpdatePlatformTemplate(payload),
    onSuccess: () => {
      notification.success({
        message:
          t("platform.templates.update_success") ?? "Cập nhật thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["platform-templates"] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: () =>
      notification.error({
        message: t("platform.templates.update_error") ?? "Cập nhật thất bại",
      }),
  });

  const activateMutation = useMutation({
    mutationFn: (templateId: string) =>
      apiActivatePlatformTemplate({ templateId }),
    onSuccess: () => {
      notification.success({
        message:
          t("platform.templates.activate_success") ??
          "Template đã được kích hoạt",
      });
      queryClient.invalidateQueries({ queryKey: ["platform-templates"] });
    },
    onError: () =>
      notification.error({
        message: t("platform.templates.activate_error") ?? "Kích hoạt thất bại",
      }),
  });

  const archiveMutation = useMutation({
    mutationFn: (templateId: string) =>
      apiArchivePlatformTemplate({ templateId }),
    onSuccess: () => {
      notification.success({
        message:
          t("platform.templates.archive_success") ?? "Template đã được lưu trữ",
      });
      queryClient.invalidateQueries({ queryKey: ["platform-templates"] });
    },
    onError: () =>
      notification.error({
        message: t("platform.templates.archive_error") ?? "Lưu trữ thất bại",
      }),
  });

  // ── Handlers ──
  const openCreate = () => {
    setModalMode("create");
    setEditingTemplate(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (tmpl: PlatformTemplateItem) => {
    setModalMode("edit");
    setEditingTemplate(tmpl);
    form.setFieldsValue({
      name: tmpl.name,
      description: tmpl.description,
      templateKind: tmpl.templateKind ?? "ONBOARDING",
    });
    setModalOpen(true);
  };

  const handleSubmit = (values: {
    name: string;
    description?: string;
    templateKind: "ONBOARDING" | "TASK_LIBRARY";
    departmentTypeCode?: string;
  }) => {
    if (modalMode === "create") {
      createMutation.mutate({
        name: values.name,
        description: values.description,
        level: "PLATFORM",
        templateKind: values.templateKind,
        departmentTypeCode: values.departmentTypeCode,
      });
    } else if (editingTemplate) {
      updateMutation.mutate({
        templateId: editingTemplate.templateId,
        name: values.name,
        description: values.description,
      });
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    activateMutation.isPending ||
    archiveMutation.isPending;

  // ── Columns ──
  const columns: ColumnsType<PlatformTemplateItem> = [
    {
      title: t("platform.templates.col.name") ?? "Tên template",
      dataIndex: "name",
      key: "name",
      render: (name: string, record) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50">
            <FileText className="h-4.5 w-4.5 text-purple-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-ink">{name}</span>
              <Tag color="purple" className="!m-0 !text-[10px]">
                PLATFORM
              </Tag>
              {record.templateKind === "TASK_LIBRARY" && (
                <Tag color="blue" className="!m-0 !text-[10px]">
                  TASK LIB
                </Tag>
              )}
            </div>
            {record.description && (
              <Typography.Text
                type="secondary"
                className="!text-xs"
                ellipsis={{ tooltip: record.description }}>
                {record.description}
              </Typography.Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("platform.templates.col.status") ?? "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={statusColor[status] ?? "default"}>{status}</Tag>
      ),
    },
    {
      title: t("platform.templates.col.checklists") ?? "Checklist",
      dataIndex: "checklistCount",
      key: "checklistCount",
      width: 100,
      align: "center" as const,
      render: (v: number) => (
        <span className="text-sm text-gray-600">{v ?? 0}</span>
      ),
    },
    {
      title: t("platform.templates.col.tasks") ?? "Tasks",
      dataIndex: "taskCount",
      key: "taskCount",
      width: 100,
      align: "center" as const,
      render: (v: number) => (
        <span className="text-sm text-gray-600">{v ?? 0}</span>
      ),
    },
    {
      title: t("platform.templates.col.used_by") ?? "Đang dùng",
      dataIndex: "usedByCount",
      key: "usedByCount",
      width: 110,
      align: "center" as const,
      render: (v: number) => (
        <span className="text-sm font-medium text-gray-800">{v ?? 0}</span>
      ),
    },
    {
      title: t("platform.templates.col.actions") ?? "Thao tác",
      key: "actions",
      width: 180,
      align: "right" as const,
      render: (_: unknown, record: PlatformTemplateItem) => (
        <div className="flex items-center justify-end gap-1">
          {/* Edit */}
          <Tooltip title={t("global.edit") ?? "Chỉnh sửa"}>
            <Button
              size="small"
              icon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => openEdit(record)}
              disabled={record.status === "ARCHIVED"}
            />
          </Tooltip>

          {/* Activate (DRAFT → ACTIVE) */}
          {record.status === "DRAFT" && (
            <Tooltip
              title={t("platform.templates.action.activate") ?? "Kích hoạt"}>
              <Popconfirm
                title={
                  t("platform.templates.confirm.activate") ??
                  "Kích hoạt template này? Các tenant sẽ thấy và có thể clone nó."
                }
                onConfirm={() => activateMutation.mutate(record.templateId)}
                okText={t("global.confirm") ?? "Xác nhận"}
                cancelText={t("global.cancel") ?? "Huỷ"}>
                <Button
                  size="small"
                  type="primary"
                  icon={<Zap className="h-3.5 w-3.5" />}
                  loading={activateMutation.isPending}
                />
              </Popconfirm>
            </Tooltip>
          )}

          {/* Deactivate / Archive (ACTIVE → ARCHIVED) */}
          {record.status === "ACTIVE" && (
            <Tooltip
              title={t("platform.templates.action.archive") ?? "Lưu trữ"}>
              <Popconfirm
                title={
                  t("platform.templates.confirm.archive") ??
                  "Lưu trữ template này? Các tenant đang dùng không bị ảnh hưởng."
                }
                onConfirm={() => archiveMutation.mutate(record.templateId)}
                okText={t("global.confirm") ?? "Xác nhận"}
                cancelText={t("global.cancel") ?? "Huỷ"}>
                <Button
                  size="small"
                  danger
                  icon={<Archive className="h-3.5 w-3.5" />}
                  loading={archiveMutation.isPending}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">
            {t("platform.templates.title") ?? "Platform Templates"}
          </h1>
          <p className="text-sm text-gray-500">
            {t("platform.templates.subtitle") ??
              "Quản lý thư viện template dùng chung cho toàn bộ tenant."}
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={openCreate}>
          {t("platform.templates.create_btn") ?? "Tạo template"}
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {[
          {
            label: t("platform.templates.stat.total") ?? "Tổng",
            value: rawItems.length,
            color: "text-gray-700",
          },
          {
            label: "Active",
            value: rawItems.filter((i) => i.status === "ACTIVE").length,
            color: "text-emerald-600",
          },
          {
            label: "Draft",
            value: rawItems.filter((i) => i.status === "DRAFT").length,
            color: "text-gray-500",
          },
          {
            label: "Archived",
            value: rawItems.filter((i) => i.status === "ARCHIVED").length,
            color: "text-orange-500",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-gray-500">{label}:</span>
            <span className={`text-sm font-bold ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <Card styles={{ body: { padding: 0 } }}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
          <Input
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            prefix={<Search className="h-3.5 w-3.5 text-gray-400" />}
            placeholder={
              t("platform.templates.search_placeholder") ??
              "Tìm theo tên, mô tả…"
            }
            className="w-64"
          />
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={STATUS_OPTIONS}
            className="w-36"
          />
          <span className="ml-auto text-xs text-gray-400">
            {items.length} template
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-4">
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        ) : (
          <MyTable<PlatformTemplateItem>
            dataSource={items}
            columns={columns}
            rowKey="templateId"
            pagination={{ pageSize: 20 }}
            loading={isPending}
          />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        title={
          modalMode === "create"
            ? (t("platform.templates.modal.create_title") ??
              "Tạo Platform Template")
            : (t("platform.templates.modal.edit_title") ?? "Chỉnh sửa Template")
        }
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okButtonProps={{
          loading: createMutation.isPending || updateMutation.isPending,
        }}
        okText={
          modalMode === "create"
            ? (t("global.create") ?? "Tạo")
            : (t("global.save") ?? "Lưu")
        }
        cancelText={t("global.cancel") ?? "Huỷ"}
        destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ templateKind: "ONBOARDING" }}>
          <Form.Item
            name="name"
            label={t("platform.templates.field.name") ?? "Tên template"}
            rules={[{ required: true, message: "Vui lòng nhập tên template" }]}>
            <Input
              placeholder={
                t("platform.templates.field.name_placeholder") ??
                "VD: Onboarding nhân sự kỹ thuật"
              }
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={t("platform.templates.field.description") ?? "Mô tả"}>
            <Input.TextArea
              rows={3}
              placeholder={
                t("platform.templates.field.description_placeholder") ??
                "Mô tả ngắn về mục đích và đối tượng áp dụng"
              }
              maxLength={500}
              showCount
            />
          </Form.Item>

          {modalMode === "create" && (
            <>
              <Form.Item
                name="templateKind"
                label={
                  t("platform.templates.field.template_kind") ?? "Loại template"
                }
                rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: "Onboarding", value: "ONBOARDING" },
                    { label: "Task Library", value: "TASK_LIBRARY" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="departmentTypeCode"
                label={
                  t("platform.templates.field.dept_type") ??
                  "Loại phòng ban (tuỳ chọn)"
                }>
                <Input
                  placeholder={
                    t("platform.templates.field.dept_type_placeholder") ??
                    "VD: ENGINEERING, SALES, MARKETING…"
                  }
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default PlatformTemplates;
