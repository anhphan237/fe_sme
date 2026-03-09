import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, UserCheck, UserX, Mail } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { apiListDepartments } from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import { mapUser } from "@/utils/mappers/identity";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { useLocale } from "@/i18n";
import { EmployeeFormDrawer } from "./components/EmployeeFormDrawer";
import type { User } from "@/shared/types";
import type { UserListItem } from "@/interface/identity";
import type { DepartmentItem } from "@/interface/company";

// ─── Types ──────────────────────────────────────────────────────────────────

type StatusFilter = "" | "Active" | "Inactive" | "Invited";

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_BADGE_VARIANT = {
  Active: "success",
  Inactive: "danger",
  Invited: "warning",
} as const satisfies Record<string, "success" | "danger" | "warning">;

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const variant =
    STATUS_BADGE_VARIANT[status as keyof typeof STATUS_BADGE_VARIANT] ??
    "default";
  return <Badge variant={variant}>{status}</Badge>;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}

function StatCard({ icon, label, value, colorClass }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={`rounded-xl p-2.5 ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
    </Card>
  );
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: unknown) =>
      extractList<UserListItem | Record<string, unknown>>(
        res,
        "users",
        "items",
      ).map(mapUser) as User[],
  });

const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: unknown) => extractList<DepartmentItem>(res, "items"),
  });

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls =
  "rounded-xl border border-stroke bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

// ─── Main Component ──────────────────────────────────────────────────────────

function EmployeeManagement() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { data: users, isLoading, isError, error, refetch } = useUsersQuery();
  const { data: departments } = useDepartmentsQuery();

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("");
  const [filterDept, setFilterDept] = useState("");

  // undefined = closed | null = create | string = edit
  const [selectedUserId, setSelectedUserId] = useState<
    string | null | undefined
  >(undefined);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      total: users?.length ?? 0,
      active: users?.filter((u) => u.status === "Active").length ?? 0,
      inactive: users?.filter((u) => u.status === "Inactive").length ?? 0,
      invited: users?.filter((u) => u.status === "Invited").length ?? 0,
    }),
    [users],
  );

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!users) return [];
    const keyword = searchText.trim().toLowerCase();
    return users.filter((u) => {
      if (filterStatus && u.status !== filterStatus) return false;
      if (filterDept && u.department !== filterDept) return false;
      if (keyword) {
        const inName = u.name?.toLowerCase().includes(keyword);
        const inEmail = u.email?.toLowerCase().includes(keyword);
        if (!inName && !inEmail) return false;
      }
      return true;
    });
  }, [users, filterStatus, filterDept, searchText]);

  const hasActiveFilter = !!(searchText || filterStatus || filterDept);

  const handleReset = () => {
    setSearchText("");
    setFilterStatus("");
    setFilterDept("");
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderSkeletons = () => (
    <div className="space-y-3 p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center gap-2 p-10 text-sm text-muted">
      <p>
        {error != null && typeof (error as Error).message === "string"
          ? (error as Error).message
          : t("onboarding.template.error.something_wrong")}
      </p>
      <Button
        variant="ghost"
        className="font-semibold text-brand hover:underline"
        onClick={() => refetch()}>
        {t("onboarding.template.error.retry")}
      </Button>
    </div>
  );

  const renderEmpty = () => (
    <div className="p-6">
      {hasActiveFilter ? (
        <EmptyState
          title={t("onboarding.employee.empty.filter_title")}
          description={t("onboarding.employee.empty.filter_desc")}
          actionLabel={t("global.reset")}
          onAction={handleReset}
        />
      ) : (
        <EmptyState
          title={t("onboarding.employee.empty.title")}
          description={t("onboarding.employee.empty.desc")}
          actionLabel={t("employee.add")}
          onAction={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );

  const renderTable = () => (
    <>
      <div className="flex items-center justify-between border-b border-stroke px-4 py-2.5">
        <p className="text-xs text-muted">
          {filtered.length} {t("onboarding.employee.result_count")}
        </p>
      </div>
      <Table>
        <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 w-[220px]">
              {t("onboarding.employee.col.name")}
            </th>
            <th className="px-4 py-3">{t("auth.email")}</th>
            <th className="px-4 py-3 w-[120px]">
              {t("onboarding.employee.col.role")}
            </th>
            <th className="px-4 py-3 w-[160px]">{t("employee.department")}</th>
            <th className="px-4 py-3 w-[110px]">{t("global.status")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => (
            <tr
              key={user.id}
              className="group cursor-pointer border-t border-stroke transition-colors hover:bg-blue-50/40"
              onClick={() => setSelectedUserId(user.id)}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <span className="font-medium text-ink">{user.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-muted">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted">
                {ROLE_LABELS[getPrimaryRole(user.roles)]}
              </td>
              <td className="px-4 py-3 text-sm text-muted">
                {user.department || <span className="text-slate-300">—</span>}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={user.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("onboarding.employee.management.title")}
        subtitle={t("onboarding.employee.management.subtitle")}
        actionLabel={t("employee.add")}
        onAction={() => setSelectedUserId(null)}
      />

      {/* Stats Cards */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-brand" />}
            label={t("onboarding.employee.stat.total")}
            value={stats.total}
            colorClass="bg-brand/10"
          />
          <StatCard
            icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
            label={t("global.active")}
            value={stats.active}
            colorClass="bg-emerald-50"
          />
          <StatCard
            icon={<UserX className="h-5 w-5 text-red-500" />}
            label={t("global.inactive")}
            value={stats.inactive}
            colorClass="bg-red-50"
          />
          <StatCard
            icon={<Mail className="h-5 w-5 text-amber-500" />}
            label={t("onboarding.employee.filter.invited")}
            value={stats.invited}
            colorClass="bg-amber-50"
          />
        </div>
      )}

      {/* Table Card */}
      <Card className="p-0">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-stroke px-4 py-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              className={`${inputCls} w-full pl-9`}
              placeholder={t("onboarding.employee.filter.search_placeholder")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select
            className={inputCls}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}>
            <option value="">
              {t("onboarding.employee.filter.all_status")}
            </option>
            <option value="Active">{t("global.active")}</option>
            <option value="Inactive">{t("global.inactive")}</option>
            <option value="Invited">
              {t("onboarding.employee.filter.invited")}
            </option>
          </select>

          {/* Department filter */}
          <select
            className={inputCls}
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}>
            <option value="">{t("onboarding.employee.filter.all_dept")}</option>
            {departments?.map((d) => (
              <option key={d.departmentId} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {hasActiveFilter && (
            <Button
              variant="ghost"
              className="text-sm font-medium text-brand hover:underline"
              onClick={handleReset}>
              {t("global.reset")}
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading
          ? renderSkeletons()
          : isError
            ? renderError()
            : filtered.length === 0
              ? renderEmpty()
              : renderTable()}
      </Card>

      {/* Drawer */}
      <EmployeeFormDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(undefined)}
        onCreated={(newUserId) => {
          setSelectedUserId(undefined);
          navigate("/onboarding/employees", {
            state: { newEmployeeId: newUserId },
          });
        }}
      />
    </div>
  );
}

export default EmployeeManagement;
