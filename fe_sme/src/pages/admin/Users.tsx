import { useState, useMemo } from "react";
import { Users as UsersIcon, Search } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import {
  apiCreateUser,
  apiDisableUser,
  apiUpdateUser,
} from "@/api/identity/identity.api";
import { useLocale } from "@/i18n";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { ROLE_BADGE_STYLES, statusVariant } from "./shared";
import { useUsersQuery } from "./hooks";
import { InviteUserModal } from "./components/InviteUserModal";
import { UserDetailModal } from "./components/UserDetailModal";

function AdminUsers() {
  const { t } = useLocale();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [enablingId, setEnablingId] = useState<string | null>(null);

  const { data: users, isLoading, isError, refetch } = useUsersQuery();

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

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
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("user.search_placeholder")}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
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
            <Button variant="secondary" onClick={() => refetch()}>
              {t("user.retry")}
            </Button>
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
          <Table>
            <thead className="bg-slate-50/80 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t("user.column.name")}</th>
                <th className="px-5 py-3.5">{t("user.column.role")}</th>
                <th className="px-5 py-3.5">{t("user.column.department")}</th>
                <th className="px-5 py-3.5">{t("user.column.status")}</th>
                <th className="px-5 py-3.5">{t("user.column.created")}</th>
                <th className="w-20 px-5 py-3.5 text-right">
                  {t("global.action")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => {
                const primaryRole = getPrimaryRole(user.roles);
                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                          {(
                            user.name?.[0] ??
                            user.email?.[0] ??
                            "?"
                          ).toUpperCase()}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setDetailUserId(user.id)}
                            className="text-left font-medium text-slate-900 transition-colors hover:text-indigo-600 hover:underline">
                            {user.name || user.email}
                          </button>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        className={clsx(
                          "text-xs",
                          ROLE_BADGE_STYLES[primaryRole] ??
                            ROLE_BADGE_STYLES.EMPLOYEE,
                        )}>
                        {ROLE_LABELS[primaryRole]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-600">
                        {user.department || (
                          <span className="text-slate-400">â€”</span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={statusVariant(user.status)}
                        className="text-xs">
                        {t(`user.status.${user.status.toLowerCase()}`)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {user.createdAt?.slice(0, 10) ?? "â€”"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {user.status === "Inactive" ? (
                        <button
                          type="button"
                          disabled={enablingId === user.id}
                          onClick={() => handleEnable(user.id)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40">
                          {enablingId === user.id
                            ? t("user.enabling")
                            : t("user.enable")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={disablingId === user.id}
                          onClick={() => handleDisable(user.id)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-40">
                          {disablingId === user.id
                            ? t("user.disabling")
                            : t("user.disable")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
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
