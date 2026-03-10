import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Input, Select } from "antd";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseButton from "@/components/button";
import { useLocale } from "@/i18n";
import { DEPARTMENT_TYPES } from "../../shared";
import { ManagerPicker } from "../../components/ManagerPicker";
import type { DepartmentItem } from "@/interface/company";

interface FormState {
  name: string;
  type: string;
  managerUserId: string;
}

const INITIAL_FORM: FormState = { name: "", type: "OTHER", managerUserId: "" };

export type DepartmentModalMode = "create" | "edit" | null;

export interface DepartmentFormModalProps {
  mode: DepartmentModalMode;
  department: DepartmentItem | null;
  onClose: () => void;
  onSubmit: (
    mode: "create" | "edit",
    form: FormState,
    departmentId: string | null,
  ) => Promise<void>;
}

export function DepartmentFormModal({
  mode,
  department,
  onClose,
  onSubmit,
}: DepartmentFormModalProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && department) {
      setForm({
        name: department.name,
        type: department.type ?? "OTHER",
        managerUserId: department.managerUserId ?? "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setFormError(null);
  }, [mode, department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    if (!name) {
      setFormError(t("department.error.name_required"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        mode as "create" | "edit",
        { ...form, name },
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

  return (
    <BaseModal
      open={mode !== null}
      title={mode === "create" ? t("department.new") : t("department.edit")}
      onCancel={onClose}
      footer={null}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {formError}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("department.field.name")} <span className="text-red-400">*</span>
          </label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Engineering"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("department.field.type")}
          </label>
          <Select
            className="w-full"
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            options={DEPARTMENT_TYPES.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            <Users className="mr-1 inline h-3.5 w-3.5" />
            {t("department.field.manager")}
          </label>
          <ManagerPicker
            value={form.managerUserId}
            onChange={(id) => setForm((f) => ({ ...f, managerUserId: id }))}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <BaseButton
            htmlType="button"
            onClick={onClose}
            label="global.cancel"
          />
          <BaseButton
            type="primary"
            htmlType="submit"
            disabled={submitting}
            label={
              submitting
                ? "department.saving"
                : mode === "create"
                  ? "department.create"
                  : "department.save_changes"
            }
          />
        </div>
      </form>
    </BaseModal>
  );
}
