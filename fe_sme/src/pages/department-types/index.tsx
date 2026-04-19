import { useState, useMemo } from "react";
import {
  Building2,
  Pencil,
  Plus,
  Search as SearchIcon,
  Trash2,
} from "lucide-react";
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Tag,
  Tooltip,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import {
  apiListDepartmentTypes,
  apiCreateDepartmentType,
  apiUpdateDepartmentType,
  apiDeleteDepartmentType,
} from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import MyTable from "@/components/table";
import type { DepartmentTypeItem } from "@/interface/company";

// ── StatusBadge ───────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useLocale();
  const isActive = status?.toUpperCase() === "ACTIVE";
  return (
    <Tag
      color={isActive ? "success" : "default"}
      className="inline-flex items-center gap-1 !m-0">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {isActive ? t("dept_type.status.active") : t("dept_type.status.inactive")}
    </Tag>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ink" | "brand" | "muted";
}) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </p>
    <p
      className={`mt-1 text-2xl font-semibold leading-tight ${
        tone === "brand"
          ? "text-brand"
          : tone === "muted"
            ? "text-slate-400"
            : "text-ink"
      }`}>
      {value}
    </p>
  </div>
);

// ── DeptTypeFormModal ─────────────────────────────────────────────────────────

type FormMode = "create" | "edit";
type StatusFilter = "ACTIVE" | "INACTIVE" | "";

type DeptTypeFormModalProps = {
  open: boolean;
  mode: FormMode;
  initial?: DepartmentTypeItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

const DeptTypeFormModal = ({
  open,
  mode,
  initial,
  onClose,
  onSuccess,
}: DeptTypeFormModalProps) => {
  const { t } = useLocale();
  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: apiCreateDepartmentType,
    onSuccess: () => {
      message.success(t("dept_type.toast.created"));
      form.resetFields();
      onSuccess();
      onClose();
    },
    onError: () => message.error(t("dept_type.toast.error")),
  });

  const updateMutation = useMutation({
    mutationFn: apiUpdateDepartmentType,
    onSuccess: () => {
      message.success(t("dept_type.toast.updated"));
      onSuccess();
      onClose();
    },
    onError: () => message.error(t("dept_type.toast.error")),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleOk = async () => {
    const values = await form.validateFields();
    const code = (values.code as string).trim().toUpperCase();
    if (mode === "create") {
      createMutation.mutate({
        code,
        name: values.name,
        status: values.status ?? "ACTIVE",
      });
    } else {
      updateMutation.mutate({
        departmentTypeId: initial!.departmentTypeId,
        code,
        name: values.name,
        status: values.status,
      });
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
            <Building2 className="h-4 w-4 text-brand" />
          </div>
          <span>
            {mode === "create"
              ? t("dept_type.form.create_title")
              : t("dept_type.form.edit_title")}
          </span>
        </div>
      }
      onOk={handleOk}
      okText={t("global.save")}
      confirmLoading={isPending}
      afterOpenChange={(vis) => {
        if (vis && initial) {
          form.setFieldsValue({
            code: initial.code,
            name: initial.name,
            status: initial.status,
          });
        }
        if (!vis) form.resetFields();
      }}
      destroyOnClose
      width={480}>
      <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
        <Form.Item
          name="code"
          label={t("dept_type.form.code_label")}
          rules={[
            { required: true },
            {
              pattern: /^[A-Z0-9_]+$/i,
              message: t("dept_type.form.code_hint"),
            },
          ]}
          extra={
            <span className="text-xs text-slate-400">
              {t("dept_type.form.code_hint")}
            </span>
          }>
          <Input
            placeholder={t("dept_type.form.code_placeholder")}
            style={{ textTransform: "uppercase" }}
            onChange={(e) =>
              form.setFieldValue("code", e.target.value.toUpperCase())
            }
          />
        </Form.Item>
        <Form.Item
          name="name"
          label={t("dept_type.form.name_label")}
          rules={[{ required: true }]}>
          <Input placeholder={t("dept_type.form.name_placeholder")} />
        </Form.Item>
        <Form.Item
          name="status"
          label={t("dept_type.form.status_label")}
          initialValue="ACTIVE">
          <Select
            options={[
              { value: "ACTIVE", label: t("dept_type.status.active") },
              { value: "INACTIVE", label: t("dept_type.status.inactive") },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ── DepartmentTypes (page) ────────────────────────────────────────────────────

const DepartmentTypes = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const currentUser = useUserStore((s) => s.currentUser);
  const isHR = ((currentUser?.roles ?? []) as string[]).includes("HR");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<FormMode>("create");
  const [editing, setEditing] = useState<DepartmentTypeItem | null>(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["department-types"],
    queryFn: () => apiListDepartmentTypes(),
  });

  const items = (
    Array.isArray(raw)
      ? raw
      : extractList(raw as unknown as Record<string, unknown>, "items")
  ) as DepartmentTypeItem[];

  const stats = useMemo(() => {
    const active = items.filter(
      (it) => it.status?.toUpperCase() === "ACTIVE",
    ).length;
    return { total: items.length, active, inactive: items.length - active };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter) {
      list = list.filter((it) => it.status?.toUpperCase() === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (it) =>
          it.code.toLowerCase().includes(q) ||
          it.name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, statusFilter, search]);

  const deleteMutation = useMutation({
    mutationFn: apiDeleteDepartmentType,
    onSuccess: () => {
      message.success(t("dept_type.toast.deleted"));
      queryClient.invalidateQueries({ queryKey: ["department-types"] });
    },
    onError: () => message.error(t("dept_type.toast.error")),
  });

  const openCreate = () => {
    setEditing(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEdit = (row: DepartmentTypeItem) => {
    setEditing(row);
    setModalMode("edit");
    setModalOpen(true);
  };

  const columns: ColumnsType<DepartmentTypeItem> = [
    {
      title: t("global.index"),
      key: "index",
      width: 56,
      align: "center" as const,
      render: (_: unknown, __: DepartmentTypeItem, idx: number) => (
        <span className="text-sm text-slate-400">{idx + 1}</span>
      ),
    },
    {
      title: t("dept_type.col.code"),
      dataIndex: "code",
      key: "code",
      width: 150,
      render: (code: string) => (
        <Tag color="blue" className="font-mono font-semibold !m-0">
          {code}
        </Tag>
      ),
    },
    {
      title: t("dept_type.col.name"),
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <span className="font-medium text-slate-800">{name}</span>
        </div>
      ),
    },
    {
      title: t("dept_type.col.status"),
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (s: string) => <StatusBadge status={s} />,
    },
    ...(isHR
      ? ([
          {
            title: t("dept_type.col.actions"),
            key: "actions",
            width: 100,
            align: "center" as const,
            render: (_: unknown, row: DepartmentTypeItem) => (
              <div className="flex items-center justify-center gap-1">
                <Tooltip title={t("global.edit")}>
                  <Button
                    type="text"
                    size="small"
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => openEdit(row)}
                  />
                </Tooltip>
                <Popconfirm
                  title={t("dept_type.delete.confirm", { name: row.name })}
                  description={t("dept_type.delete.warning")}
                  onConfirm={() =>
                    deleteMutation.mutate({
                      departmentTypeId: row.departmentTypeId,
                    })
                  }
                  okButtonProps={{ danger: true }}
                  okText={t("global.delete")}
                  cancelText={t("global.cancel")}>
                  <Tooltip title={t("global.delete")}>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      loading={
                        deleteMutation.isPending &&
                        (
                          deleteMutation.variables as {
                            departmentTypeId: string;
                          }
                        )?.departmentTypeId === row.departmentTypeId
                      }
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            ),
          },
        ] as ColumnsType<DepartmentTypeItem>)
      : []),
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left side */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            prefix={<SearchIcon className="h-3.5 w-3.5 text-slate-400" />}
            placeholder={t("global.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            className="w-64"
          />

          <Select<StatusFilter>
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-40"
            options={[
              { value: "" as StatusFilter, label: t("global.all") },
              { value: "ACTIVE", label: t("dept_type.status.active") },
              { value: "INACTIVE", label: t("dept_type.status.inactive") },
            ]}
          />
        </div>
        {/* Right side */}
        {isHR && (
          <Button
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={openCreate}>
            {t("dept_type.action.add")}
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-16">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium text-slate-700">
                  {t("dept_type.empty.title")}
                </span>
                <span className="text-sm text-slate-400">
                  {t("dept_type.empty.desc")}
                </span>
              </div>
            }
          />
        </div>
      ) : (
        <MyTable<DepartmentTypeItem>
          columns={columns}
          dataSource={filtered}
          rowKey="departmentTypeId"
          pagination={filtered.length > 20 ? { pageSize: 20 } : false}
        />
      )}

      <DeptTypeFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["department-types"] })
        }
      />
    </div>
  );
};

export default DepartmentTypes;
