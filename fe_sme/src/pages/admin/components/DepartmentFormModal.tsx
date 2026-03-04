import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { clsx } from "clsx";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { useLocale } from "@/i18n";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapUser } from "@/utils/mappers/identity";
import type { User } from "@/shared/types";
import type { UserListItem } from "@/interface/identity";
import type { DepartmentItem } from "@/interface/company";

const DEPARTMENT_TYPES = [
  { value: "IT", label: "IT" },
  { value: "HR", label: "HR" },
  { value: "FCT", label: "Finance" },
  { value: "OPS", label: "Operations" },
  { value: "SLS", label: "Sales" },
  { value: "MKT", label: "Marketing" },
  { value: "GEN", label: "General" },
  { value: "OTHER", label: "Other" },
] as const;

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

interface ManagerPickerProps {
  value: string;
  onChange: (userId: string) => void;
}

function ManagerPicker({ value, onChange }: ManagerPickerProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: unknown) =>
      extractList<UserListItem>(res, "users", "items").map(mapUser) as User[],
  });

  const selectedUser = useMemo(
    () => users.find((u) => u.id === value),
    [users, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={
            open
              ? query
              : selectedUser
                ? `${selectedUser.name || selectedUser.email}`
                : ""
          }
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("department.manager_search_placeholder")}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          autoComplete="off"
        />
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {value && (
            <li
              role="option"
              className="cursor-pointer px-3 py-2 text-sm text-slate-400 hover:bg-slate-50"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange("");
                setQuery("");
                setOpen(false);
              }}>
              {t("department.clear_selection")}
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">
              {t("department.no_matches")}
            </li>
          ) : (
            filtered.map((u) => (
              <li
                key={u.id}
                role="option"
                className={clsx(
                  "cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50",
                  u.id === value && "bg-indigo-50 font-medium text-indigo-700",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(u.id);
                  setQuery("");
                  setOpen(false);
                }}>
                <span className="font-medium">{u.name || u.email}</span>
                <span className="ml-1 text-slate-400">{u.email}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
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
