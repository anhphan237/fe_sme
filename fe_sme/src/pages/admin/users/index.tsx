import { useState } from "react";
import { Users as UsersIcon } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/ui/Card";
import MyTable from "@/components/table";
import type { ColumnsType } from "antd/es/table";
import { Badge } from "../../../components/ui/Badge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useToast } from "../../../components/ui/Toast";
import BaseSearch from "@/components/search";
import BaseButton from "@/components/button";
import {
  apiCreateUser,
  apiDisableUser,
  apiUpdateUser,
} from "@/api/identity/identity.api";
import { useLocale } from "@/i18n";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { ROLE_BADGE_STYLES, statusVariant } from "../shared";
import { useUsersQuery } from "../hooks";
import { InviteUserModal } from "./components/InviteUserModal";
import { UserDetailModal } from "./components/UserDetailModal";
import type { User } from "@/shared/types";

function buildUserColumns({
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
}): ColumnsType<User> {
  return [
    {
      title: t("user.column.name"),
      dataIndex: "name",
      key: "name",
      render: (_: unknown, user: User) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <button
              type="button"
              onClick={() => onDetail(user.id)}
              className="text-left font-medium text-slate-900 transition-colors hover:text-indigo-600 hover:underline">
              {user.name || user.email}
            </button>
            <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: t("user.column.role"),
      key: "role",
      render: (_: unknown, user: User) => {
        const primaryRole = getPrimaryRole(user.roles);
        return (
          <Badge
            className={clsx(
              "text-xs",
              ROLE_BADGE_STYLES[primaryRole] ?? ROLE_BADGE_STYLES.EMPLOYEE,
            )}>
            {ROLE_LABELS[primaryRole]}
          </Badge>
        );
      },
    },
    {
      title: t("user.column.department"),
      dataIndex: "department",
      key: "department",
      render: (dept: string) => (
        <span className="text-sm text-slate-600">
          {dept || <span className="text-slate-400">&mdash;</span>}
        </span>
      ),
    },
    {
      title: t("user.column.status"),
      dataIndex: "status",
      key: "status",
      render: (status: User["status"]) => (
        <Badge variant={statusVariant(status)} className="text-xs">
          {t(`user.status.${status.toLowerCase()}`)}
        </Badge>
      ),
    },
    {
      title: t("user.column.created"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => (
        <span className="text-sm text-slate-500">{v?.slice(0, 10) ?? "—"}</span>
      ),
    },
    {
      title: t("global.action"),
      key: "action",
      align: "right" as const,
      width: 100,
      render: (_: unknown, user: User) =>
        user.status === "Inactive" ? (
          <button
            type="button"
            disabled={enablingId === user.id}
            onClick={() => onEnable(user.id)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40">
            {enablingId === user.id ? t("user.enabling") : t("user.enable")}
          </button>
        ) : (
          <button
            type="button"
            disabled={disablingId === user.id}
            onClick={() => onDisable(user.id)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-40">
            {disablingId === user.id ? t("user.disabling") : t("user.disable")}
          </button>
        ),
    },
  ];
}

function AdminUsers() {
  const { t } = useLocale();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [enablingId, setEnablingId] = useState<string | null>(null);

  const { data: users, isLoading, isError, refetch } = useUsersQuery();

  const q = search.trim().toLowerCase();
  const filtered = !users
    ? []
    : !q
      ? users
      : users.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.department ?? "").toLowerCase().includes(q),
        );

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
    toast(t("user.invite.success", { email: form.email }));
    await refetch();
    setInviteOpen(false);
  };

  const handleDisable = async (userId: string) => {
    setDisablingId(userId);
    try {
      await apiDisableUser(userId);
      toast(t("user.disable.success"));
      await refetch();
    } finally {
      setDisablingId(null);
    }
  };

  const handleEnable = async (userId: string) => {
    setEnablingId(userId);
    try {
      await apiUpdateUser({ userId, status: "ACTIVE" });
      toast(t("user.enable.success"));
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("user.title")}
        subtitle={t("user.subtitle")}
        actionLabel={t("user.invite")}
        onAction={() => setInviteOpen(true)}
        extra={
          <span className="hidden items-center gap-1.5 text-sm text-slate-500 sm:flex">
            <UsersIcon className="h-4 w-4" />
            {users?.length ?? 0} {t("user.total")}
          </span>
        }
      />

      <Card className="p-0">
        <div className="border-b border-slate-100 px-5 py-3">
          <BaseSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(val) => setSearch(val ?? "")}
            placeholder={t("user.search_placeholder")}
            className="w-full"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-slate-500">
              {t("user.error.load_failed")}
            </p>
            <BaseButton onClick={() => refetch()} label="user.retry" />
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={t("user.empty_title")}
              description={t("user.empty_description")}
              actionLabel={t("user.invite")}
              onAction={() => setInviteOpen(true)}
            />
          </div>
        ) : (
          <MyTable
            columns={userColumns}
            dataSource={filtered}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
      />

      <UserDetailModal
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        onUpdated={refetch}
      />
    </div>
  );
}

export default AdminUsers;
