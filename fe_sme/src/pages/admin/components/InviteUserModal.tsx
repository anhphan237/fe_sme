import { useState, useRef, useEffect, useMemo } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Search,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { useLocale } from "@/i18n";
import { apiListDepartments } from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import type { DepartmentItem } from "@/interface/company";

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

interface DepartmentSelectProps {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

function DepartmentSelect({
  value,
  onChange,
  placeholder,
}: DepartmentSelectProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: unknown) => extractList<DepartmentItem>(res, "items"),
  });

  const selected = useMemo(
    () => departments.find((d) => d.departmentId === value),
    [departments, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(q));
  }, [departments, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className={clsx(
          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100",
          open ? "border-indigo-400" : "border-slate-200",
        )}>
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected
            ? selected.name
            : (placeholder ?? t("user.invite.department_placeholder"))}
        </span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("department.search_placeholder")}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <ul className="max-h-44 overflow-auto py-1">
            {value && (
              <li
                role="option"
                className="cursor-pointer px-3 py-2 text-sm text-slate-400 hover:bg-slate-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange("");
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
              filtered.map((d) => (
                <li
                  key={d.departmentId}
                  role="option"
                  className={clsx(
                    "cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50",
                    d.departmentId === value &&
                      "bg-indigo-50 font-medium text-indigo-700",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(d.departmentId);
                    setOpen(false);
                  }}>
                  {d.name}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
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
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setForm({ ...INITIAL_FORM, tempPassword: generatePassword() });
    setShowPassword(false);
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
    <Modal open={open} title={t("user.invite")} onClose={handleClose}>
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
            <input
              type="email"
              value={form.email}
              onChange={(e) => field(e.target.value, "email")}
              placeholder="employee@company.com"
              autoFocus
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("user.name")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => field(e.target.value, "name")}
              placeholder="Nguyen Van A"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("user.role")}
          </label>
          <select
            value={form.roleCode}
            onChange={(e) => field(e.target.value, "roleCode")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("user.invite.department_id")}
            </label>
            <DepartmentSelect
              value={form.departmentId}
              onChange={(id) => field(id, "departmentId")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("user.invite.manager_id")}
            </label>
            <input
              type="text"
              value={form.managerUserId}
              onChange={(e) => field(e.target.value, "managerUserId")}
              placeholder="manager-uuid"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
              onClick={() => field(generatePassword(), "tempPassword")}
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
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t("global.cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? t("user.invite.creating") : t("user.invite.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
