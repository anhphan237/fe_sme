import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { Input, Select } from "antd";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseButton from "@/components/button";
import { useLocale } from "@/i18n";
import { useDepartmentsQuery } from "../../hooks";
import { ManagerPicker } from "../../components/ManagerPicker";

interface InviteForm {
  email: string;
  name: string;
  roleCode: string;
  departmentId: string;
  managerUserId: string;
  tempPassword: string;
}

const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "HR", label: "HR" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
  { value: "IT", label: "IT" },
] as const;

function generatePassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#";
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

const INITIAL_FORM: InviteForm = {
  email: "",
  name: "",
  roleCode: "EMPLOYEE",
  departmentId: "",
  managerUserId: "",
  tempPassword: generatePassword(),
};

export interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: InviteForm) => Promise<void>;
}

export function InviteUserModal({
  open,
  onClose,
  onSubmit,
}: InviteUserModalProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<InviteForm>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: departments = [] } = useDepartmentsQuery();

  // Auto-copy password when modal opens
  useEffect(() => {
    if (!open) return;
    navigator.clipboard
      .writeText(form.tempPassword)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reset = () => {
    setForm({ ...INITIAL_FORM, tempPassword: generatePassword() });
    setShowPassword(true);
    setCopied(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(form.tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRegen = () => {
    const pw = generatePassword();
    setForm((f) => ({ ...f, tempPassword: pw }));
    navigator.clipboard.writeText(pw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email.trim()) {
      setError(t("user.error.no_email"));
      return;
    }
    if (!form.name.trim()) {
      setError(t("user.error.no_name"));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("user.error.invite_failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field = (value: string, key: keyof InviteForm) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <BaseModal
      open={open}
      title={t("user.invite")}
      onCancel={handleClose}
      footer={null}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("user.email")} <span className="text-red-400">*</span>
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => field(e.target.value, "email")}
              placeholder="employee@company.com"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("user.name")} <span className="text-red-400">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => field(e.target.value, "name")}
              placeholder="Nguyen Van A"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("user.role")}
          </label>
          <Select
            className="w-full"
            value={form.roleCode}
            onChange={(v) => field(v, "roleCode")}
            options={
              ROLE_OPTIONS as unknown as { value: string; label: string }[]
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("user.invite.department_id")}
            </label>
            <Select
              className="w-full"
              showSearch
              allowClear
              value={form.departmentId || undefined}
              onChange={(v) => field(v ?? "", "departmentId")}
              options={departments.map((d) => ({
                value: d.departmentId,
                label: d.name,
              }))}
              placeholder={t("user.invite.department_placeholder")}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("user.invite.manager_id")}
            </label>
            <ManagerPicker
              value={form.managerUserId}
              onChange={(id) => field(id, "managerUserId")}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("user.invite.temp_password")}
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? "text" : "password"}
                readOnly
                value={form.tempPassword}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              title={
                showPassword ? t("user.invite.hide") : t("user.invite.show")
              }
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              title={t("user.invite.copy")}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRegen}
              title={t("user.invite.regen")}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
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
            disabled={submitting}
            label={submitting ? "user.invite.creating" : "user.invite.create"}
          />
        </div>
      </form>
    </BaseModal>
  );
}
