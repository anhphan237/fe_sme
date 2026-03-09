import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { useLocale } from "@/i18n";
import { DEPARTMENT_TYPES } from "../shared";
import { ManagerPicker } from "./ManagerPicker";
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
    <Modal
      open={mode !== null}
      title={mode === "create" ? t("department.new") : t("department.edit")}
      onClose={onClose}>
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
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Engineering"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("department.field.type")}
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            {DEPARTMENT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("global.cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting
              ? t("department.saving")
              : mode === "create"
                ? t("department.create")
                : t("department.save_changes")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
