import { useState, useMemo } from "react";
import { UserPlus } from "lucide-react";
import { Drawer, Form } from "antd";
import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import { useLocale } from "@/i18n";
import { ROLE_OPTIONS } from "../constants";
import type { User } from "@/shared/types";
import type { DepartmentItem } from "@/interface/company";

interface InviteForm {
  email: string;
  name: string;
  roleCode: string;
  departmentId: string;
  managerUserId: string;
}

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

const FORM_ID = "invite-user-form";

export interface InviteUserDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: InviteForm) => Promise<void>;
  users: User[];
  departments: DepartmentItem[];
}

export const InviteUserDrawer = ({
  open,
  onClose,
  onSubmit,
  users,
  departments,
}: InviteUserDrawerProps) => {
  const { t } = useLocale();
  const [form] = Form.useForm<InviteForm>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedDeptId = Form.useWatch("departmentId", form);

  const managerOptions = useMemo(() => {
    const filtered = selectedDeptId
      ? users.filter((u) => u.departmentId === selectedDeptId)
      : users;
    return filtered.map((u) => ({ value: u.id, label: u.name || u.email }));
  }, [users, selectedDeptId]);

  const reset = () => {
    form.resetFields();
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFinish = async (values: InviteForm) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("user.error.invite_failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <BaseButton
        htmlType="button"
        onClick={handleClose}
        label="global.cancel"
      />
      <BaseButton
        type="primary"
        htmlType="submit"
        form={FORM_ID}
        loading={submitting}
        label={submitting ? "user.invite.creating" : "user.invite.create"}
      />
    </div>
  );

  return (
    <Drawer
      open={open}
      title={t("user.invite")}
      onClose={handleClose}
      width={520}
      destroyOnClose
      maskClosable={false}
      footer={footer}>
      {/* Header accent */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-[#E8EDF3] bg-[#F5F8FC] p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3684DB]/10">
          <UserPlus className="h-6 w-6 text-[#3684DB]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#223A59]">
            {t("user.invite")}
          </p>
          <p className="mt-0.5 text-xs text-[#758BA5]">
            {t("user.invite.hint")}
          </p>
        </div>
      </div>

      <Form
        id={FORM_ID}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ roleCode: "EMPLOYEE" }}>
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Account */}
        <SectionLabel label={t("user.section.account")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <BaseInput
            name="email"
            label={
              <>
                {t("user.email")} <span className="text-red-400">*</span>
              </>
            }
            type="email"
            placeholder="employee@company.com"
            autoFocus
            formItemProps={{
              rules: [
                { required: true, message: t("user.error.no_email") },
                { type: "email", message: t("user.error.no_email") },
              ],
            }}
          />
          <BaseInput
            name="name"
            label={
              <>
                {t("user.name")} <span className="text-red-400">*</span>
              </>
            }
            placeholder="Nguyen Van A"
            formItemProps={{
              rules: [{ required: true, message: t("user.error.no_name") }],
            }}
          />
        </div>

        {/* Role & Department */}
        <SectionLabel
          label={t("user.section.role_department")}
          className="mt-2"
        />
        <BaseSelect
          name="roleCode"
          label={t("user.role")}
          options={ROLE_OPTIONS as { value: string; label: string }[]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <BaseSelect
            name="departmentId"
            label={t("user.invite.department_id")}
            showSearch
            allowClear
            placeholder={t("user.invite.department_placeholder")}
            options={departments.map((d) => ({
              value: d.departmentId,
              label: d.name,
            }))}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            onChange={() => form.setFieldValue("managerUserId", undefined)}
          />
          <BaseSelect
            name="managerUserId"
            label={t("user.invite.manager_id")}
            showSearch
            allowClear
            options={managerOptions}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </div>

        {/* Email invite info */}
        <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {t("user.invite.email_link_hint")}
        </div>
      </Form>
    </Drawer>
  );
};
