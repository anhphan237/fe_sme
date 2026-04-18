import { useEffect, useState } from "react";
import { Drawer, Form } from "antd";
import { Building2, Users } from "lucide-react";
import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import { useLocale } from "@/i18n";
import { DEPARTMENT_TYPES } from "../constants";
import type { DepartmentItem } from "@/interface/company";
import type { User } from "@/shared/types";

interface FormState {
  name: string;
  type: string;
  managerUserId: string | undefined;
}

export type DepartmentDrawerMode = "create" | "edit" | null;

export interface DepartmentFormDrawerProps {
  mode: DepartmentDrawerMode;
  department: DepartmentItem | null;
  users: User[];
  onClose: () => void;
  onSubmit: (
    mode: "create" | "edit",
    form: { name: string; type: string; managerUserId: string },
    departmentId: string | null,
  ) => Promise<void>;
}

const FORM_ID = "department-drawer-form";

const SectionLabel = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => (
  <div className={`mb-3 flex items-center gap-2 ${className ?? ""}`}>
    <span className="text-xs font-semibold uppercase tracking-wider text-[#758BA5]">
      {label}
    </span>
    <div className="h-px flex-1 bg-[#E8EDF3]" />
  </div>
);

export const DepartmentFormDrawer = ({
  mode,
  department,
  users,
  onClose,
  onSubmit,
}: DepartmentFormDrawerProps) => {
  const { t } = useLocale();
  const [form] = Form.useForm<FormState>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && department) {
      form.setFieldsValue({
        name: department.name,
        type: department.type ?? "OTHER",
        managerUserId: department.managerUserId ?? undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ type: "OTHER" });
    }
    setFormError(null);
  }, [mode, department, form]);

  const handleFinish = async (values: FormState) => {
    setFormError(null);
    setSubmitting(true);
    try {
      await onSubmit(
        mode as "create" | "edit",
        {
          name: values.name,
          type: values.type,
          managerUserId: values.managerUserId ?? "",
        },
        department?.departmentId ?? null,
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : t("department.error.operation_failed");
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const managerOptions = users.map((u) => ({
    value: u.id,
    label: u.name || u.email,
  }));

  const footer = (
    <div className="flex justify-end gap-2">
      <BaseButton htmlType="button" onClick={onClose} label="global.cancel" />
      <BaseButton
        type="primary"
        htmlType="submit"
        form={FORM_ID}
        loading={submitting}
        label={
          mode === "create" ? "department.create" : "department.save_changes"
        }
      />
    </div>
  );

  return (
    <Drawer
      open={mode !== null}
      title={mode === "create" ? t("department.new") : t("department.edit")}
      onClose={onClose}
      width={480}
      destroyOnClose
      maskClosable={false}
      footer={footer}>
      {/* Header accent */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-[#E8EDF3] bg-[#F5F8FC] p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3684DB]/10">
          <Building2 className="h-6 w-6 text-[#3684DB]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#223A59]">
            {mode === "edit" && department
              ? department.name
              : t("department.new")}
          </p>
          <p className="mt-0.5 text-xs text-[#758BA5]">
            {mode === "create"
              ? t("department.drawer.hint_create")
              : t("department.drawer.hint_edit")}
          </p>
        </div>
      </div>

      <Form id={FORM_ID} form={form} layout="vertical" onFinish={handleFinish}>
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {formError}
          </div>
        )}

        {/* Section: Basic Information */}
        <SectionLabel label={t("department.section.basic_info")} />

        <BaseInput
          name="name"
          label={t("department.field.name")}
          placeholder="e.g. Engineering"
          autoFocus
          formItemProps={{
            rules: [
              {
                required: true,
                message: t("department.error.name_required"),
              },
            ],
          }}
        />

        <BaseSelect
          name="type"
          label={t("department.field.type")}
          className="w-full"
          options={DEPARTMENT_TYPES.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />

        {/* Section: Management */}
        {/* <SectionLabel
          label={t("department.section.management")}
          className="mt-4"
        /> */}

        {/* <BaseSelect
          name="managerUserId"
          label={
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {t("department.field.manager")}
              {mode === "create" && (
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              )}
            </span>
          }
          className="w-full"
          showSearch
          allowClear={mode === "edit"}
          filterOption={(input, option) =>
            ((option?.label as string) ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          options={managerOptions}
          formItemProps={{
            extra: (
              <span className="text-xs text-[#758BA5]">
                {mode === "edit"
                  ? t("department.drawer.manager_hint_edit")
                  : t("department.drawer.manager_hint")}
              </span>
            ),
            rules: [
              {
                required: mode === "create",
                message: t("department.error.manager_required"),
              },
            ],
          }}
        /> */}
      </Form>
    </Drawer>
  );
};
