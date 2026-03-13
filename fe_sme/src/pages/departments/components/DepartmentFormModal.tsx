import { useEffect, useState } from "react";
import { Form } from "antd";
import { Users } from "lucide-react";
import BaseModal from "@core/components/Modal/BaseModal";
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

export type DepartmentModalMode = "create" | "edit" | null;

export interface DepartmentFormModalProps {
  mode: DepartmentModalMode;
  department: DepartmentItem | null;
  users: User[];
  onClose: () => void;
  onSubmit: (
    mode: "create" | "edit",
    form: { name: string; type: string; managerUserId: string },
    departmentId: string | null,
  ) => Promise<void>;
}

export const DepartmentFormModal = ({
  mode,
  department,
  users,
  onClose,
  onSubmit,
}: DepartmentFormModalProps) => {
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

  return (
    <BaseModal
      open={mode !== null}
      title={mode === "create" ? t("department.new") : t("department.edit")}
      onCancel={onClose}
      footer={null}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {formError}
          </div>
        )}

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

        <BaseSelect
          name="managerUserId"
          label={
            <span>
              <Users className="mr-1 inline h-3.5 w-3.5" />
              {t("department.field.manager")}
            </span>
          }
          className="w-full"
          showSearch
          allowClear
          filterOption={(input, option) =>
            ((option?.label as string) ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          options={managerOptions}
        />

        <div className="flex justify-end gap-2 pt-1">
          <BaseButton
            htmlType="button"
            onClick={onClose}
            label="global.cancel"
          />
          <BaseButton
            type="primary"
            htmlType="submit"
            loading={submitting}
            label={
              submitting
                ? "department.saving"
                : mode === "create"
                  ? "department.create"
                  : "department.save_changes"
            }
          />
        </div>
      </Form>
    </BaseModal>
  );
};
