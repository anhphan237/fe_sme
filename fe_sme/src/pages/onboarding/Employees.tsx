import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pill } from "@/components/ui/Pill";
import { Progress } from "@/components/ui/Progress";
import { useToast } from "@/components/ui/Toast";
import {
  apiListInstances,
  apiCreateInstance,
  apiListTemplates,
  apiActivateInstance,
} from "@/api/onboarding/onboarding.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTemplate } from "@/utils/mappers/onboarding";
import { mapUser } from "@/utils/mappers/identity";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/i18n";
import type {
  OnboardingInstance,
  OnboardingTemplate,
  User,
} from "@/shared/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = "ACTIVE" | "COMPLETED" | "CANCELLED";

const FILTER_OPTIONS: { value: StatusFilter; key: string }[] = [
  { value: "ACTIVE", key: "onboarding.employee.filter.active" },
  { value: "COMPLETED", key: "onboarding.employee.filter.completed" },
  { value: "CANCELLED", key: "onboarding.employee.filter.paused" },
];

// ── Hooks ─────────────────────────────────────────────────────────────────────

const useInstancesQuery = (filters: { employeeId?: string; status: string }) =>
  useQuery({
    queryKey: ["instances", filters.employeeId ?? "", filters.status],
    queryFn: () => apiListInstances(filters),
    select: (res: any) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
  });

const useTemplatesQuery = () =>
  useQuery({
    queryKey: ["templates"],
    queryFn: () => apiListTemplates(),
    select: (res: any) =>
      extractList(res, "templates", "items", "list").map(
        mapTemplate,
      ) as OnboardingTemplate[],
  });

const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: any) =>
      extractList(res, "users", "items").map((u) =>
        mapUser(u as Record<string, unknown>),
      ) as User[],
  });

const useStartInstance = () => useMutation({ mutationFn: apiCreateInstance });

// ── Components ────────────────────────────────────────────────────────────────

function InstanceStatusBadge({ status }: { status: string }) {
  const cls =
    status === "Active" || status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Completed" || status === "COMPLETED"
        ? "bg-slate-100 text-slate-700"
        : "bg-amber-100 text-amber-800";
  return <Pill className={cls}>{status}</Pill>;
}

function FilterTabs({
  value,
  onChange,
  t,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}>
          {t(opt.key)}
        </button>
      ))}
    </div>
  );
}

function InstanceRow({
  instance,
  users,
  currentUser,
  t,
  onOpen,
}: {
  instance: OnboardingInstance;
  users: User[];
  currentUser: any;
  t: (k: string) => string;
  onOpen: (id: string) => void;
}) {
  const isCurrentRow = Boolean(
    currentUser &&
    (instance.employeeUserId === currentUser.id ||
      instance.employeeId === currentUser.id),
  );
  const employee = users.find(
    (u) =>
      u.id === instance.employeeUserId ||
      u.id === instance.employeeId ||
      u.employeeId === instance.employeeId,
  );
  const name =
    employee?.name ?? (isCurrentRow ? currentUser?.name : null) ?? "-";
  const roles =
    employee?.roles ?? (isCurrentRow ? currentUser?.roles : undefined);

  return (
    <tr className="border-t border-stroke hover:bg-slate-50">
      <td className="px-4 py-3 font-medium">{name}</td>
      <td className="px-4 py-3 text-sm text-muted">
        {roles ? ROLE_LABELS[getPrimaryRole(roles)] : "-"}
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {instance.startDate || "-"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-24">
            <Progress value={instance.progress ?? 0} />
          </div>
          <span className="text-sm text-muted">{instance.progress ?? 0}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <InstanceStatusBadge status={instance.status} />
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {employee?.manager || instance.managerName || "—"}
      </td>
      <td className="px-4 py-3">
        <Button variant="ghost" onClick={() => onOpen(instance.id)}>
          {t("onboarding.employee.action.open")}
        </Button>
      </td>
    </tr>
  );
}

function StartOnboardingModal({
  open,
  onClose,
  users,
  templates,
  onConfirm,
  isLoading,
  t,
}: {
  open: boolean;
  onClose: () => void;
  users: User[];
  templates: OnboardingTemplate[];
  onConfirm: (form: {
    employeeId: string;
    templateId: string;
    startDate: string;
  }) => void;
  isLoading: boolean;
  t: (k: string) => string;
}) {
  const [form, setForm] = useState({
    employeeId: "",
    templateId: "",
    startDate: "",
  });
  const patch =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    onConfirm(form);
    setForm({ employeeId: "", templateId: "", startDate: "" });
  };

  return (
    <Modal
      open={open}
      title={t("onboarding.employee.modal.title")}
      onClose={onClose}>
      <div className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">
          {t("onboarding.employee.modal.employee")}
          <select
            className="rounded-lg border border-stroke px-3 py-2 text-sm"
            value={form.employeeId}
            onChange={patch("employeeId")}>
            <option value="">—</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          {t("onboarding.employee.modal.template")}
          <select
            className="rounded-lg border border-stroke px-3 py-2 text-sm"
            value={form.templateId}
            onChange={patch("templateId")}>
            <option value="">—</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          {t("onboarding.employee.modal.start_date")}
          <input
            type="date"
            className="rounded-lg border border-stroke px-3 py-2 text-sm"
            value={form.startDate}
            onChange={patch("startDate")}
          />
        </label>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {t("onboarding.employee.modal.confirm")}
        </Button>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLocale();
  const currentUser = useAppStore((s) => s.currentUser);
  const canStart = Boolean(currentUser?.roles?.includes("HR"));

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: instances = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useInstancesQuery({ status: statusFilter });
  const { data: users = [] } = useUsersQuery();
  const { data: templates = [] } = useTemplatesQuery();
  const startInstance = useStartInstance();

  const handleStart = async (form: {
    employeeId: string;
    templateId: string;
    startDate: string;
  }) => {
    const raw = await startInstance.mutateAsync({
      employeeId: form.employeeId,
      templateId: form.templateId,
    });
    try {
      await apiActivateInstance((raw as any).id, (raw as any).requestNo);
    } catch {
      toast(t("onboarding.employee.toast.activate_failed"));
    }
    queryClient.invalidateQueries({ queryKey: ["instances"] });
    toast(t("onboarding.employee.toast.started"));
    setModalOpen(false);
    navigate(`/onboarding/employees/${(raw as any).id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("onboarding.employee.title")}
        subtitle={t("onboarding.employee.subtitle")}
        actionLabel={
          canStart ? t("onboarding.employee.action.start") : undefined
        }
        onAction={canStart ? () => setModalOpen(true) : undefined}
        extra={
          canStart ? (
            <Button
              variant="secondary"
              onClick={() => navigate("/onboarding/employees/new")}>
              {t("onboarding.employee.action.manage")}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <FilterTabs value={statusFilter} onChange={setStatusFilter} t={t} />
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-muted">
            {error instanceof Error ? error.message : "Something went wrong."}
            <button
              className="ml-1 font-semibold text-foreground"
              onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : instances.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={t("onboarding.employee.empty.title")}
              description={t("onboarding.employee.empty.desc")}
              actionLabel={
                canStart ? t("onboarding.employee.action.start") : undefined
              }
              onAction={canStart ? () => setModalOpen(true) : undefined}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">
                  {t("onboarding.employee.col.employee")}
                </th>
                <th className="px-4 py-3">
                  {t("onboarding.employee.col.role")}
                </th>
                <th className="px-4 py-3">
                  {t("onboarding.employee.col.start_date")}
                </th>
                <th className="px-4 py-3">
                  {t("onboarding.employee.col.progress")}
                </th>
                <th className="px-4 py-3">
                  {t("onboarding.employee.col.status")}
                </th>
                <th className="px-4 py-3">
                  {t("onboarding.employee.col.manager")}
                </th>
                <th className="px-4 py-3">
                  {t("onboarding.employee.col.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance) => (
                <InstanceRow
                  key={instance.id}
                  instance={instance}
                  users={users}
                  currentUser={currentUser}
                  t={t}
                  onOpen={(id) => navigate(`/onboarding/employees/${id}`)}
                />
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <StartOnboardingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        users={users}
        templates={templates}
        onConfirm={handleStart}
        isLoading={startInstance.isPending}
        t={t}
      />
    </div>
  );
}

export default Employees;
