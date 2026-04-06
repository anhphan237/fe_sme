import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  notification,
  Popconfirm,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  apiGetPlatformPlanList,
  apiCreatePlatformPlan,
  apiUpdatePlatformPlan,
  apiDeletePlatformPlan,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type {
  PlatformPlanItem,
  PlatformPlanCreateRequest,
  PlatformPlanUpdateRequest,
} from "@/interface/platform";

type ModalMode = "create" | "edit";

const PlatformPlans = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingPlan, setEditingPlan] = useState<PlatformPlanItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["platform-plans"],
    queryFn: () => apiGetPlatformPlanList(),
    select: (res: any) =>
      (res?.data?.plans ?? res?.plans ?? []) as PlatformPlanItem[],
  });

  const createMutation = useMutation({
    mutationFn: (payload: PlatformPlanCreateRequest) =>
      apiCreatePlatformPlan(payload),
    onSuccess: () => {
      notification.success({ message: t("platform.plans.create_success") });
      queryClient.invalidateQueries({ queryKey: ["platform-plans"] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: () =>
      notification.error({ message: t("platform.plans.create_error") }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: PlatformPlanUpdateRequest) =>
      apiUpdatePlatformPlan(payload),
    onSuccess: () => {
      notification.success({ message: t("platform.plans.update_success") });
      queryClient.invalidateQueries({ queryKey: ["platform-plans"] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: () =>
      notification.error({ message: t("platform.plans.update_error") }),
  });

  const deleteMutation = useMutation({
    mutationFn: (planCode: string) => apiDeletePlatformPlan({ planCode }),
    onSuccess: () => {
      notification.success({ message: t("platform.plans.delete_success") });
      queryClient.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: () =>
      notification.error({ message: t("platform.plans.delete_error") }),
  });

  const openCreate = () => {
    setModalMode("create");
    setEditingPlan(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (plan: PlatformPlanItem) => {
    setModalMode("edit");
    setEditingPlan(plan);
    form.setFieldsValue({
      planCode: plan.planCode,
      name: plan.name,
      price: plan.price,
      billingCycle: plan.billingCycle,
      maxEmployees: plan.maxEmployees,
      features: plan.features?.join(", "),
    });
    setModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    const features =
      (values.features as string)
        ?.split(",")
        .map((f: string) => f.trim())
        .filter(Boolean) ?? [];

    if (modalMode === "create") {
      createMutation.mutate({ ...values, features });
    } else if (editingPlan) {
      updateMutation.mutate({
        planCode: editingPlan.planCode,
        name: values.name,
        price: values.price,
        features,
      });
    }
  };

  const plans: PlatformPlanItem[] = data ?? [];

  const columns = [
    {
      title: t("platform.plans.col_code"),
      dataIndex: "planCode",
      key: "planCode",
      render: (v: string) => (
        <span className="font-mono text-sm font-semibold text-violet-700">
          {v}
        </span>
      ),
    },
    {
      title: t("platform.plans.col_name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("platform.plans.col_price"),
      dataIndex: "price",
      key: "price",
      render: (v: number) => `$${v}`,
    },
    {
      title: t("platform.plans.col_billing"),
      dataIndex: "billingCycle",
      key: "billingCycle",
    },
    {
      title: t("platform.plans.col_max_employees"),
      dataIndex: "maxEmployees",
      key: "maxEmployees",
    },
    {
      title: t("platform.plans.col_features"),
      dataIndex: "features",
      key: "features",
      render: (v: string[]) => (
        <span className="text-sm text-slate-500">{v?.join(", ") ?? "—"}</span>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, record: PlatformPlanItem) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<Pencil className="h-3.5 w-3.5" />}
            onClick={() => openEdit(record)}>
            {t("global.edit")}
          </Button>
          <Popconfirm
            title={t("platform.plans.delete_confirm")}
            onConfirm={() => deleteMutation.mutate(record.planCode)}
            okText={t("global.confirm")}
            cancelText={t("global.cancel")}>
            <Button
              size="small"
              danger
              icon={<Trash2 className="h-3.5 w-3.5" />}
              loading={deleteMutation.isPending}>
              {t("global.delete")}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("platform.plans.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("platform.plans.subtitle")}
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={openCreate}>
          {t("platform.plans.create")}
        </Button>
      </div>

      <Card>
        <Table
          dataSource={plans}
          columns={columns}
          rowKey="planCode"
          loading={isLoading}
          pagination={false}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={
          modalMode === "create"
            ? t("platform.plans.modal_create_title")
            : t("platform.plans.modal_edit_title")
        }
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={modalMode === "create" ? t("global.create") : t("global.save")}
        cancelText={t("global.cancel")}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4">
          {modalMode === "create" && (
            <Form.Item
              name="planCode"
              label={t("platform.plans.field_code")}
              rules={[{ required: true }]}>
              <Input placeholder="BASIC" />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label={t("platform.plans.field_name")}
            rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label={t("platform.plans.field_price")}
            rules={[{ required: true, type: "number", min: 0 }]}>
            <InputNumber min={0} style={{ width: "100%" }} prefix="$" />
          </Form.Item>
          {modalMode === "create" && (
            <>
              <Form.Item
                name="billingCycle"
                label={t("platform.plans.field_billing_cycle")}
                rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "MONTHLY", label: "Monthly" },
                    { value: "YEARLY", label: "Yearly" },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="maxEmployees"
                label={t("platform.plans.field_max_employees")}
                rules={[{ required: true, type: "number", min: 1 }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="features"
            label={t("platform.plans.field_features")}
            extra={t("platform.plans.field_features_hint")}>
            <Input.TextArea rows={2} placeholder="SSO, API Access, Reports" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlatformPlans;
