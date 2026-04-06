import { useCallback, useState } from "react";
import { AlertCircle, Plus, Upload } from "lucide-react";
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
import { InviteUserDrawer } from "./components/InviteUserDrawer";
import { UserDetailDrawer } from "./components/UserDetailDrawer";
import { BulkImportModal } from "@/components/bulk-import";
import { apiBulkCreateUsers } from "@/api/identity/identity.api";
import type {
  BulkImportConfig,
  ImportRowResult,
} from "@/components/bulk-import";
import type { User } from "@/shared/types";

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
}): ColumnsType<User> => {
  return [
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
            <p className="mt-0.5 truncate text-xs text-[#758BA5]">
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: t("user.column.role"),
      key: "role",
      width: 120,
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
      dataIndex: "department",
      key: "department",
      render: (dept: string) => (
        <span className="text-sm text-[#223A59]">
          {dept || <span className="text-[#758BA5]">&mdash;</span>}
        </span>
      ),
    },
    {
      title: t("user.column.status"),
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: User["status"]) => <UserStatusTag status={status} />,
    },
    {
      title: t("user.column.created"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => (
        <span className="text-sm text-[#758BA5]">{v?.slice(0, 10) ?? "—"}</span>
      ),
    },
    {
      title: t("global.action"),
      key: "action",
      align: "right" as const,
      width: 100,
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
};

const AdminUsers = () => {
  const { t } = useLocale();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [enablingId, setEnablingId] = useState<string | null>(null);

  const { data: users, isLoading, isError, refetch } = useUsersQuery();
  const { data: departments = [] } = useDepartmentsQuery();

  const q = search.trim().toLowerCase();
  const filtered = !users
    ? []
    : users
        .filter(
          (u) =>
            !q ||
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.department ?? "").toLowerCase().includes(q),
        )
        .filter(
          (u) => roleFilter === "ALL" || getPrimaryRole(u.roles) === roleFilter,
        )
        .filter((u) => !deptFilter || u.departmentId === deptFilter);

  const handleInvite = async (form: {
    email: string;
    name: string;
    roleCode: string;
    departmentId: string;
    managerUserId: string;
    tempPassword: string;
  }) => {
    await apiCreateUser({
      email: form.email,
      fullName: form.name,
      password: form.tempPassword,
      roleCode: form.roleCode,
      departmentId: form.departmentId || undefined,
      managerUserId: form.managerUserId || undefined,
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
    <div className="flex h-full flex-col p-4">
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <BaseSearch
          placeholder={t("user.search_placeholder")}
          allowClear
          className="max-w-72 flex-1"
          onSearch={(val) => setSearch(val ?? "")}
        />
        <div className="flex shrink-0 items-center gap-2">
          <BaseButton
            icon={<Upload className="h-4 w-4" />}
            onClick={() => setImportOpen(true)}
            label="user.import_csv"
          />
          <BaseButton
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setInviteOpen(true)}
            label="user.invite"
          />
        </div>
      </div>

      {/* Filter row: role tabs + department select */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Role filter chips */}
        <div className="flex items-center gap-1">
          {[{ value: "ALL", label: t("user.filter.all") }, ...ROLE_OPTIONS].map(
            (opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRoleFilter(opt.value)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  roleFilter === opt.value
                    ? "bg-[#3684DB] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}>
                {opt.label}
              </button>
            ),
          )}
        </div>

        {/* Department filter */}
        <Select
          allowClear
          placeholder={t("user.filter.all_departments")}
          className="w-48 text-xs"
          size="small"
          value={deptFilter || undefined}
          onChange={(v) => setDeptFilter(v ?? "")}
          options={departments.map((d) => ({
            value: d.departmentId,
            label: d.name,
          }))}
        />

        {/* Active filter summary */}
        {(roleFilter !== "ALL" || deptFilter) && (
          <button
            type="button"
            onClick={() => {
              setRoleFilter("ALL");
              setDeptFilter("");
            }}
            className="text-xs text-[#758BA5] underline hover:text-[#3684DB]">
            {t("user.filter.clear")}
          </button>
        )}
      </div>
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
