import { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { Button, Form, Input, Space } from "antd";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import { useLocale } from "@/i18n";
import { useDepartmentsQuery, useUsersQuery } from "@/hooks/adminHooks";

interface InviteForm {
  email: string;
  name: string;
  roleCode: string;
  departmentId: string;
  managerUserId: string;
  tempPassword: string;
}

type InviteFormFields = Omit<InviteForm, "tempPassword">;

const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "HR", label: "HR" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
  { value: "IT", label: "IT" },
] as const;

const generatePassword = (): string => {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#";
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

export interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: InviteForm) => Promise<void>;
}

export const InviteUserModal = ({
  open,
  onClose,
  onSubmit,
}: InviteUserModalProps) => {
  const { t } = useLocale();
  const [form] = Form.useForm<InviteFormFields>();
  const [tempPassword, setTempPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: departments = [] } = useDepartmentsQuery();
  const { data: users = [] } = useUsersQuery();

  const selectedDeptId = Form.useWatch("departmentId", form);

  const managerOptions = useMemo(() => {
    const filtered = selectedDeptId
      ? users.filter((u) => u.departmentId === selectedDeptId)
      : users;
    return filtered.map((u) => ({ value: u.id, label: u.name || u.email }));
  }, [users, selectedDeptId]);

  // Auto-copy password when modal opens
  useEffect(() => {
    if (!open) return;
    navigator.clipboard
      .writeText(tempPassword)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reset = () => {
    form.resetFields();
    setTempPassword(generatePassword());
    setShowPassword(true);
    setCopied(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRegen = () => {
    const pw = generatePassword();
    setTempPassword(pw);
    navigator.clipboard.writeText(pw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFinish = async (values: InviteFormFields) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ ...values, tempPassword });
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("user.error.invite_failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      title={t("user.invite")}
      onCancel={handleClose}
      footer={null}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ roleCode: "EMPLOYEE" }}
        className="space-y-4">
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

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

        <BaseSelect
          name="roleCode"
          label={t("user.role")}
          options={
            ROLE_OPTIONS as unknown as { value: string; label: string }[]
          }
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

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("user.invite.temp_password")}
          </label>
          <Space.Compact className="w-full">
            <Input
              readOnly
              type={showPassword ? "text" : "password"}
              value={tempPassword}
              className="font-mono text-sm"
            />
            <Button
              icon={
                showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )
              }
              title={
                showPassword ? t("user.invite.hide") : t("user.invite.show")
              }
              onClick={() => setShowPassword((v) => !v)}
            />
            <Button
              icon={<Copy className="h-4 w-4" />}
              title={t("user.invite.copy")}
              onClick={handleCopy}
            />
            <Button
              icon={<RefreshCw className="h-4 w-4" />}
              title={t("user.invite.regen")}
              onClick={handleRegen}
            />
          </Space.Compact>
          {copied && (
            <p className="mt-1 text-xs text-emerald-600">
              {t("user.invite.copied")}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {t("user.invite.password_hint")}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <BaseButton
            htmlType="button"
            onClick={handleClose}
            label="global.cancel"
          />
          <BaseButton
            type="primary"
            htmlType="submit"
            loading={submitting}
            label={submitting ? "user.invite.creating" : "user.invite.create"}
          />
        </div>
      </Form>
    </BaseModal>
  );
};
