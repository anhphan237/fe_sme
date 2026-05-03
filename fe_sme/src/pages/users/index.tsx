import { useMemo, useState } from "react";
import { AlertCircle, Clock, Plus, Upload, UserCheck, UserX, Users } from "lucide-react";
import { clsx } from "clsx";
import { Empty, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import BaseButton from "@/components/button";
import BaseSearch from "@/components/search";
import MyTable from "@/components/table";
import { apiCreateUser, apiDisableUser, apiUpdateUser } from "@/api/identity/identity.api";
import type { CreateUserRequest } from "@/interface/identity";
import { useLocale } from "@/i18n";
import { useDepartmentsQuery, useUsersQuery } from "@/hooks/adminHooks";
import { notify } from "@/utils/notify";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import type { User } from "@/shared/types";
import { UserStatusTag } from "@core/components/Status/StatusTag";
import { ROLE_BADGE_STYLES, ROLE_OPTIONS } from "./constants";
import { InviteUserDrawer, type InviteForm } from "./components/InviteUserDrawer";
import { UserDetailDrawer } from "./components/UserDetailDrawer";
import UserExcelImportModal from "./components/UserExcelImportModal";

const COMPANY_ROLE_OPTIONS = ROLE_OPTIONS.filter((option) => !option.isPlatform);

const STATUS_FILTER_OPTIONS = [
  { value: "Active", labelKey: "user.filter.status_active" },
  { value: "Invited", labelKey: "user.filter.status_invited" },
  { value: "Inactive", labelKey: "user.filter.status_inactive" },
] as const;

const DASH = "—";

const requiresDepartment = (roleCode: string) => {
  const role = roleCode.trim().toUpperCase();
  return role === "EMPLOYEE" || role === "MANAGER";
};

const cleanText = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizeDateForApi = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : undefined;
};

const renderDateCell = (value?: string | null): string => {
  if (!value) return DASH;
  const parsed = dayjs(value);
  if (parsed.isValid()) return parsed.format("YYYY-MM-DD");
  return value.slice(0, 10);
};

const buildCreateUserPayload = (form: InviteForm): CreateUserRequest => {
  const roleCode = form.roleCode.trim().toUpperCase();
  const payload: CreateUserRequest = {
    email: form.email.trim(),
    fullName: form.name.trim(),
    roleCode,
  };

  const password = cleanText(form.password);
  const departmentId = cleanText(form.departmentId);
  const managerUserId = cleanText(form.managerUserId);
  const phone = cleanText(form.phone);
  const jobTitle = cleanText(form.jobTitle);
  const employeeCode = cleanText(form.employeeCode);
  const startDate = normalizeDateForApi(form.startDate);
  const workLocation = cleanText(form.workLocation);

  if (form.createMode === "direct" && password) payload.password = password;
  if (departmentId || requiresDepartment(roleCode)) payload.departmentId = departmentId;
  if (managerUserId) payload.managerUserId = managerUserId;
  if (phone) payload.phone = phone;
  if (jobTitle) payload.jobTitle = jobTitle;
  if (employeeCode) payload.employeeCode = employeeCode;
  if (startDate) payload.startDate = startDate;
  if (workLocation) payload.workLocation = workLocation;

  return payload;
};

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
          {user.phone ? <p className="mt-0.5 text-xs text-[#9BAEC2]">{user.phone}</p> : null}
        </div>
      </div>
    ),
  },
  {
    title: t("user.column.role"),
    key: "role",
    width: 140,
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
      <span className="text-sm text-[#223A59]">{user.department || DASH}</span>
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
    width: 120,
    render: (value: string) => <span className="text-sm text-[#758BA5]">{renderDateCell(value)}</span>,
  },
  {
    title: t("global.action"),
    key: "action",
    align: "right",
    width: 120,
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
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [deptFilter, setDeptFilter] = useState<string | undefined>(undefined);
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [enablingId, setEnablingId] = useState<string | null>(null);

  const { data: users = [], isLoading, isError, refetch } = useUsersQuery();
  const { data: departments = [] } = useDepartmentsQuery();

  const stats = useMemo(() => {
    const byRole = COMPANY_ROLE_OPTIONS.map((option) => ({
      value: option.value,
      labelKey: option.labelKey,
      count: users.filter((user) => getPrimaryRole(user.roles) === option.value).length,
    }));
    return {
      total: users.length,
      active: users.filter((user) => user.status === "Active").length,
      invited: users.filter((user) => user.status === "Invited").length,
      inactive: users.filter((user) => user.status === "Inactive").length,
      byRole,
    };
  }, [users]);

  const query = search.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users
        .filter((user) => {
          if (!query) return true;
          return (
            (user.name ?? "").toLowerCase().includes(query) ||
            (user.email ?? "").toLowerCase().includes(query) ||
            (user.department ?? "").toLowerCase().includes(query) ||
            (user.phone ?? "").toLowerCase().includes(query)
          );
        })
        .filter((user) => !roleFilter || getPrimaryRole(user.roles) === roleFilter)
        .filter((user) => !statusFilter || user.status === statusFilter)
        .filter((user) => !deptFilter || user.departmentId === deptFilter),
    [users, query, roleFilter, statusFilter, deptFilter],
  );

  const hasActiveFilters = Boolean(roleFilter || statusFilter || deptFilter || query);

  const handleInvite = async (form: InviteForm) => {
    await apiCreateUser(buildCreateUserPayload(form));
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

  const userColumns = buildUserColumns({
    t,
    disablingId,
    enablingId,
    onDetail: setDetailUserId,
    onDisable: handleDisable,
    onEnable: handleEnable,
  });

  const emptyState = isError ? (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertCircle aria-hidden="true" className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-slate-700">{t("user.error.load_failed")}</p>
      <BaseButton onClick={() => refetch()} label="user.retry" />
    </div>
  ) : (
    <Empty
      description={
        <div className="mt-2 space-y-1">
          <p className="text-sm font-medium text-slate-700">{t("user.empty_title")}</p>
          <p className="text-xs text-slate-400">{t("user.empty_description")}</p>
        </div>
      }
    />
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <BaseButton
          icon={<Upload className="h-4 w-4" />}
          onClick={() => setImportOpen(true)}
          label="user.import_excel"
        />
        <BaseButton
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setInviteOpen(true)}
          label="user.invite"
        />
      </div>

      {!isLoading && !isError ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{t("user.stats.total")}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="mt-0.5 text-xs text-slate-400">{t("user.stats.members")}</p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-600">{t("user.stats.active")}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                  <UserCheck className="h-3.5 w-3.5 text-green-600" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-green-700">{stats.active}</p>
              <p className="mt-0.5 text-xs text-green-600">
                {stats.total > 0
                  ? `${Math.round((stats.active / stats.total) * 100)}% ${t("user.stats.of_total")}`
                  : DASH}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-600">{t("user.stats.invited")}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-700">{stats.invited}</p>
              <p className="mt-0.5 text-xs text-amber-600">{t("user.stats.pending_activation")}</p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-red-500">{t("user.stats.inactive")}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                  <UserX className="h-3.5 w-3.5 text-red-500" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-red-700">{stats.inactive}</p>
              <p className="mt-0.5 text-xs text-red-500">{t("user.stats.disabled")}</p>
            </div>
          </div>

          {stats.total > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="mr-1 text-xs font-medium text-slate-500">{t("user.stats.by_role")}</span>
              {stats.byRole
                .filter((item) => item.count > 0)
                .map((item) => (
                  <span
                    key={item.value}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      ROLE_BADGE_STYLES[item.value] ?? ROLE_BADGE_STYLES.EMPLOYEE,
                    )}>
                    {t(item.labelKey)}
                    <span className="font-bold">{item.count}</span>
                  </span>
                ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4">
        <BaseSearch
          placeholder={t("user.search_placeholder")}
          allowClear
          className="min-w-48 max-w-80 flex-1"
          onSearch={(value) => setSearch(value ?? "")}
        />
        <Select
          allowClear
          placeholder={t("user.filter.all_roles")}
          className="w-40"
          value={roleFilter}
          onChange={(value) => setRoleFilter(value)}
          options={COMPANY_ROLE_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
        />
        <Select
          allowClear
          placeholder={t("user.filter.all_statuses")}
          className="w-44"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          options={STATUS_FILTER_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
        />
        <Select
          allowClear
          placeholder={t("user.filter.all_departments")}
          className="w-52"
          value={deptFilter}
          onChange={(value) => setDeptFilter(value)}
          options={departments.map((department) => ({
            value: department.departmentId,
            label: department.name,
          }))}
        />
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setRoleFilter(undefined);
              setStatusFilter(undefined);
              setDeptFilter(undefined);
            }}
            className="text-xs text-[#758BA5] underline hover:text-[#3684DB]">
            {t("user.filter.clear")}
          </button>
        ) : null}
        <span className="ml-auto text-xs text-slate-400">
          {filteredUsers.length} / {stats.total}
        </span>
      </div>

      <MyTable
        columns={userColumns}
        dataSource={isError ? [] : filteredUsers}
        rowKey="id"
        wrapClassName="!h-full w-full"
        loading={isLoading}
        pagination={{}}
        locale={{ emptyText: emptyState }}
      />

      <InviteUserDrawer
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
        users={users}
        departments={departments}
      />

      <UserDetailDrawer
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        onUpdated={refetch}
        users={users}
        departments={departments}
      />

      <UserExcelImportModal
        open={importOpen}
        onClose={(shouldRefetch?: boolean) => {
          setImportOpen(false);
          if (shouldRefetch) void refetch();
        }}
      />
    </div>
  );
};

export default AdminUsers;
