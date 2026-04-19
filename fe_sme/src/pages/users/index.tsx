import { useCallback, useMemo, useState } from "react";
import {
  AlertCircle,
  Clock,
  Plus,
  Upload,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { clsx } from "clsx";
import { Empty, Select, Tag } from "antd";
import { notify } from "@/utils/notify";
import MyTable from "@/components/table";
import type { ColumnsType } from "antd/es/table";
import BaseSearch from "@/components/search";
import BaseButton from "@/components/button";
import {
  apiCreateUser,
  apiDisableUser,
  apiUpdateUser,
} from "@/api/identity/identity.api";
import { useLocale } from "@/i18n";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { ROLE_OPTIONS, ROLE_BADGE_STYLES } from "./constants";
import { useUsersQuery, useDepartmentsQuery } from "@/hooks/adminHooks";
import { UserStatusTag } from "@core/components/Status/StatusTag";
import {
  InviteUserDrawer,
  type InviteForm,
} from "./components/InviteUserDrawer";
import { UserDetailDrawer } from "./components/UserDetailDrawer";
import { BulkImportModal } from "@/components/bulk-import";
import { apiBulkCreateUsers } from "@/api/identity/identity.api";
import type {
  BulkImportConfig,
  ImportRowResult,
} from "@/components/bulk-import";
import type { User } from "@/shared/types";

const COMPANY_ROLE_OPTIONS = ROLE_OPTIONS.filter((o) => !o.isPlatform);

const STATUS_FILTER_OPTIONS = [
  { value: "Active", labelKey: "user.filter.status_active" },
  { value: "Invited", labelKey: "user.filter.status_invited" },
  { value: "Inactive", labelKey: "user.filter.status_inactive" },
];

const buildUserColumns = ({
  t,
  disablingId,
  enablingId,
  onDetail,
  onDisable,
  onEnable,
}: {
  t: (key: string, opts?: Record<string, unknown>) => string;
  disablingId: string | null;
  enablingId: string | null;
  onDetail: (id: string) => void;
  onDisable: (id: string) => void;
  onEnable: (id: string) => void;
}): ColumnsType<User> => [
  {
    title: t("user.column.name"),
    dataIndex: "name",
    key: "name",
    render: (_: unknown, user: User) => (
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3684DB]/10 text-sm font-semibold text-[#3684DB]">
          {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onDetail(user.id)}
            className="max-w-full truncate text-left font-medium text-[#223A59] transition-colors hover:text-[#3684DB] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3684DB]">
            {user.name || user.email}
          </button>
          <p className="mt-0.5 truncate text-xs text-[#758BA5]">{user.email}</p>
          {user.phone && (
            <p className="mt-0.5 text-xs text-[#9BAEC2]">{user.phone}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    title: t("user.column.role"),
    key: "role",
    width: 130,
    render: (_: unknown, user: User) => {
      const primaryRole = getPrimaryRole(user.roles);
      return (
        <Tag
          className={clsx(
            "text-xs",
            ROLE_BADGE_STYLES[primaryRole] ?? ROLE_BADGE_STYLES.EMPLOYEE,
          )}>
          {ROLE_LABELS[primaryRole]}
        </Tag>
      );
    },
  },
  {
    title: t("user.column.department"),
    key: "department",
    render: (_: unknown, user: User) => (
      <div className="min-w-0">
        <span className="block truncate text-sm text-[#223A59]">
          {user.department || <span className="text-[#758BA5]">&mdash;</span>}
        </span>
      </div>
    ),
  },
  {
    title: t("user.column.manager"),
    key: "manager",
    render: (_: unknown, user: User) =>
      user.manager ? (
        <span className="text-sm text-[#223A59]">{user.manager}</span>
      ) : (
        <span className="text-[#758BA5]">&mdash;</span>
      ),
  },
  {
    title: t("user.column.status"),
    dataIndex: "status",
    key: "status",
    width: 130,
    render: (status: User["status"]) => <UserStatusTag status={status} />,
  },
  {
    title: t("user.column.created"),
    dataIndex: "createdAt",
    key: "createdAt",
    width: 110,
    render: (v: string) => (
      <span className="text-sm text-[#758BA5]">{v?.slice(0, 10) ?? "—"}</span>
    ),
  },
  {
    title: t("global.action"),
    key: "action",
    align: "right" as const,
    width: 110,
    render: (_: unknown, user: User) =>
      user.status === "Inactive" ? (
        <BaseButton
          size="small"
          loading={enablingId === user.id}
          onClick={() => onEnable(user.id)}
          label="user.enable"
        />
      ) : (
        <BaseButton
          size="small"
          danger
          loading={disablingId === user.id}
          onClick={() => onDisable(user.id)}
          label="user.disable"
        />
      ),
  },
];

const AdminUsers = () => {
  const { t } = useLocale();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [deptFilter, setDeptFilter] = useState<string | undefined>(undefined);
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [enablingId, setEnablingId] = useState<string | null>(null);

  const { data: users, isLoading, isError, refetch } = useUsersQuery();
  const { data: departments = [] } = useDepartmentsQuery();

  const stats = useMemo(() => {
    const all = users ?? [];
    const byRole = COMPANY_ROLE_OPTIONS.map((o) => ({
      value: o.value,
      labelKey: o.labelKey,
      count: all.filter((u) => getPrimaryRole(u.roles) === o.value).length,
    }));
    return {
      total: all.length,
      active: all.filter((u) => u.status === "Active").length,
      invited: all.filter((u) => u.status === "Invited").length,
      inactive: all.filter((u) => u.status === "Inactive").length,
      byRole,
    };
  }, [users]);

  const q = search.trim().toLowerCase();
  const filtered = (users ?? [])
    .filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department ?? "").toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q),
    )
    .filter((u) => !roleFilter || getPrimaryRole(u.roles) === roleFilter)
    .filter((u) => !statusFilter || u.status === statusFilter)
    .filter((u) => !deptFilter || u.departmentId === deptFilter);

  const hasActiveFilters = !!(roleFilter || statusFilter || deptFilter);

  const handleInvite = async (form: InviteForm) => {
    await apiCreateUser({
      email: form.email,
      fullName: form.name,
      roleCode: form.roleCode,
      departmentId: form.departmentId || undefined,
      managerUserId: form.managerUserId || undefined,
      phone: form.phone || undefined,
      jobTitle: form.jobTitle || undefined,
      employeeCode: form.employeeCode || undefined,
      startDate: form.startDate || undefined,
      workLocation: form.workLocation || undefined,
      password:
        form.createMode === "direct" ? form.password || undefined : undefined,
    });
    notify.success(t("user.invite.success", { email: form.email }));
    await refetch();
    setInviteOpen(false);
  };

  const handleDisable = async (userId: string) => {
    setDisablingId(userId);
    try {
      await apiDisableUser(userId);
      notify.success(t("user.disable.success"));
      await refetch();
    } finally {
      setDisablingId(null);
    }
  };

  const handleEnable = async (userId: string) => {
    setEnablingId(userId);
    try {
      await apiUpdateUser({ userId, status: "ACTIVE" });
      notify.success(t("user.enable.success"));
      await refetch();
    } finally {
      setEnablingId(null);
    }
  };

  const importConfig: BulkImportConfig = {
    title: t("user.import.title"),
    description: t("user.import.description"),
    fields: [
      { key: "email", label: t("user.import.field.email"), required: true },
      {
        key: "fullName",
        label: t("user.import.field.full_name"),
        required: true,
      },
      { key: "phone", label: t("user.import.field.phone") },
      { key: "roleCode", label: t("user.import.field.role") },
      { key: "departmentId", label: t("user.import.field.department") },
      { key: "jobTitle", label: t("user.import.field.job_title") },
      { key: "employeeCode", label: t("user.import.field.employee_code") },
      { key: "startDate", label: t("user.import.field.start_date") },
      { key: "workLocation", label: t("user.import.field.work_location") },
    ],
    templateFileName: "users-import-template.csv",
  };

  const handleBulkImport = useCallback(
    async (rows: Record<string, string>[]): Promise<ImportRowResult[]> => {
      const res = await apiBulkCreateUsers({
        users: rows.map((r) => ({
          email: r.email ?? "",
          fullName: r.fullName ?? "",
          phone: r.phone,
          roleCode: r.roleCode,
          departmentId: r.departmentId,
          jobTitle: r.jobTitle,
          employeeCode: r.employeeCode,
          startDate: r.startDate,
          workLocation: r.workLocation,
        })),
      });
      return (res.results ?? []).map((r) => ({
        index: r.index,
        success: r.success,
        message: r.message,
      }));
    },
    [],
  );

  const userColumns = buildUserColumns({
    t,
    disablingId,
    enablingId,
    onDetail: setDetailUserId,
    onDisable: handleDisable,
    onEnable: handleEnable,
  });

  const emptyLocale = isError ? (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertCircle aria-hidden="true" className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-slate-700">
        {t("user.error.load_failed")}
      </p>
      <BaseButton onClick={() => refetch()} label="user.retry" />
    </div>
  ) : (
    <Empty
      description={
        <div className="mt-2 space-y-1">
          <p className="text-sm font-medium text-slate-700">
            {t("user.empty_title")}
          </p>
          <p className="text-xs text-slate-400">
            {t("user.empty_description")}
          </p>
        </div>
      }
    />
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* ── Actions ── */}
      <div className="flex shrink-0 items-center justify-end gap-2">
        {/* <BaseButton
          icon={<Upload className="h-4 w-4" />}
          onClick={() => setImportOpen(true)}
          label="user.import_csv"
        /> */}
        <BaseButton
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setInviteOpen(true)}
          label="user.invite"
        />
      </div>

      {/* ── Stats ── */}
      {!isLoading && !isError && (
        <div className="space-y-3">
          {/* 4 stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Total */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {t("user.stats.total")}
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {stats.total}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {t("user.stats.members")}
              </p>
            </div>

            {/* Active */}
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-600">
                  {t("user.stats.active")}
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                  <UserCheck className="h-3.5 w-3.5 text-green-600" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {stats.active}
              </p>
              <p className="mt-0.5 text-xs text-green-600">
                {stats.total > 0
                  ? `${Math.round((stats.active / stats.total) * 100)}% ${t("user.stats.of_total")}`
                  : "—"}
              </p>
            </div>

            {/* Invited */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-600">
                  {t("user.stats.invited")}
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                {stats.invited}
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                {t("user.stats.pending_activation")}
              </p>
            </div>

            {/* Inactive */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-red-500">
                  {t("user.stats.inactive")}
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                  <UserX className="h-3.5 w-3.5 text-red-500" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-red-700">
                {stats.inactive}
              </p>
              <p className="mt-0.5 text-xs text-red-500">
                {t("user.stats.disabled")}
              </p>
            </div>
          </div>

          {/* Role distribution */}
          {stats.total > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3">
              <span className="mr-1 text-xs font-medium text-slate-400">
                {t("user.stats.by_role")}
              </span>
              {stats.byRole
                .filter((r) => r.count > 0)
                .map((r) => (
                  <span
                    key={r.value}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      ROLE_BADGE_STYLES[r.value] ?? ROLE_BADGE_STYLES.EMPLOYEE,
                    )}>
                    {t(r.labelKey)}
                    <span className="font-bold">{r.count}</span>
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── Filter toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <BaseSearch
          placeholder={t("user.search_placeholder")}
          allowClear
          className="min-w-48 max-w-72 flex-1"
          onSearch={(val) => setSearch(val ?? "")}
        />
        <Select
          allowClear
          placeholder={t("user.filter.all_roles")}
          className="w-40"
          value={roleFilter}
          onChange={(v) => setRoleFilter(v)}
          options={COMPANY_ROLE_OPTIONS.map((o) => ({
            value: o.value,
            label: t(o.labelKey),
          }))}
        />
        <Select
          allowClear
          placeholder={t("user.filter.all_statuses")}
          className="w-44"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={STATUS_FILTER_OPTIONS.map((o) => ({
            value: o.value,
            label: t(o.labelKey),
          }))}
        />
        <Select
          allowClear
          placeholder={t("user.filter.all_departments")}
          className="w-48"
          value={deptFilter}
          onChange={(v) => setDeptFilter(v)}
          options={departments.map((d) => ({
            value: d.departmentId,
            label: d.name,
          }))}
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setRoleFilter(undefined);
              setStatusFilter(undefined);
              setDeptFilter(undefined);
            }}
            className="text-xs text-[#758BA5] underline hover:text-[#3684DB]">
            {t("user.filter.clear")}
          </button>
        )}
        {(hasActiveFilters || q) && (
          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} / {stats.total}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <MyTable
        columns={userColumns}
        dataSource={isError ? [] : filtered}
        rowKey="id"
        wrapClassName="!h-full w-full"
        loading={isLoading}
        pagination={{}}
        locale={{ emptyText: emptyLocale }}
      />

      <InviteUserDrawer
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
        users={users ?? []}
        departments={departments}
      />
      <UserDetailDrawer
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        onUpdated={refetch}
        users={users ?? []}
        departments={departments}
      />
      <BulkImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          refetch();
        }}
        config={importConfig}
        onSubmit={handleBulkImport}
      />
    </div>
  );
};

export default AdminUsers;
