import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserX, Mail, Upload } from "lucide-react";
import { Button, Card, Empty, Skeleton, Tag } from "antd";
import BaseSearch from "@/components/search";
import { useLocale } from "@/i18n";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { EmployeeFormDrawer } from "./EmployeeFormDrawer";
import { BulkImportModal } from "@/components/bulk-import";
import {
  apiBulkCreateUsers,
  apiSearchUsers,
} from "@/api/identity/identity.api";
import { apiListDepartments } from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import { mapUser } from "@/utils/mappers/identity";
import type { User } from "@/shared/types";
import type { DepartmentItem } from "@/interface/company";
import type {
  BulkImportConfig,
  ImportRowResult,
} from "@/components/bulk-import";

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = "" | "Active" | "Inactive" | "Invited";

// ── Inline components ─────────────────────────────────────────────────────────

const STATUS_BADGE_VARIANT = {
  Active: "success",
  Inactive: "danger",
  Invited: "warning",
} as const satisfies Record<string, "success" | "danger" | "warning">;

const ANTD_COLOR_MAP: Record<"success" | "danger" | "warning", string> = {
  success: "success",
  danger: "error",
  warning: "warning",
};

const StatusBadge = ({ status }: { status: string }) => {
  const variant =
    STATUS_BADGE_VARIANT[status as keyof typeof STATUS_BADGE_VARIANT];
  const color = variant ? ANTD_COLOR_MAP[variant] : "default";
  return <Tag color={color}>{status}</Tag>;
};

const StatCard = ({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}) => (
  <Card
    styles={{
      body: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem",
      },
    }}>
    <div className={`rounded-xl p-2.5 ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-2xl font-bold text-ink">{value}</p>
    </div>
  </Card>
);

const filterInputCls =
  "rounded-xl border border-stroke bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

// ── Local hooks ───────────────────────────────────────────────────────────────

const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: unknown) =>
      extractList(res as Record<string, unknown>, "users", "items").map((u) =>
        mapUser(u as Record<string, unknown>),
      ) as User[],
  });

const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: unknown) =>
      extractList(res as Record<string, unknown>, "items") as DepartmentItem[],
  });

const EmployeeManagement = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { data: users, isLoading, isError, error, refetch } = useUsersQuery();
  const { data: departments } = useDepartmentsQuery();

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("");
  const [filterDept, setFilterDept] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<
    string | null | undefined
  >(undefined);
  const [importOpen, setImportOpen] = useState(false);

  /* ── Bulk-import config ─────────────────────────────── */
  const importConfig = useMemo<BulkImportConfig>(
    () => ({
      title: t("employee.import.title"),
      description: t("employee.import.description"),
      templateFileName: "employees_template.csv",
      fields: [
        {
          key: "email",
          label: t("employee.import.field.email"),
          required: true,
        },
        {
          key: "fullName",
          label: t("employee.import.field.full_name"),
          required: true,
        },
        { key: "phone", label: t("employee.import.field.phone") },
        { key: "roleCode", label: t("employee.import.field.role") },
        { key: "departmentId", label: t("employee.import.field.department") },
        { key: "jobTitle", label: t("employee.import.field.job_title") },
        {
          key: "employeeCode",
          label: t("employee.import.field.employee_code"),
        },
        { key: "startDate", label: t("employee.import.field.start_date") },
        {
          key: "workLocation",
          label: t("employee.import.field.work_location"),
        },
      ],
    }),
    [t],
  );

  const handleBulkImport = useCallback(
    async (rows: Record<string, string>[]): Promise<ImportRowResult[]> => {
      const users = rows.map((r) => ({
        email: r.email ?? "",
        fullName: r.fullName ?? "",
        phone: r.phone || undefined,
        roleCode: r.roleCode || "EMPLOYEE",
        departmentId: r.departmentId || undefined,
        jobTitle: r.jobTitle || undefined,
        employeeCode: r.employeeCode || undefined,
        startDate: r.startDate || undefined,
        workLocation: r.workLocation || undefined,
      }));

      const res = await apiBulkCreateUsers({ users });
      const data = (
        res as {
          data?: {
            results?: { index: number; success: boolean; message?: string }[];
          };
        }
      )?.data;
      if (data?.results) {
        return data.results.map((r) => ({
          index: r.index,
          success: r.success,
          message: r.message,
        }));
      }
      // Fallback: treat all as successful
      return rows.map((_, i) => ({ index: i, success: true }));
    },
    [],
  );

  const stats = useMemo(
    () => ({
      total: users?.length ?? 0,
      active: users?.filter((u) => u.status === "Active").length ?? 0,
      inactive: users?.filter((u) => u.status === "Inactive").length ?? 0,
      invited: users?.filter((u) => u.status === "Invited").length ?? 0,
    }),
    [users],
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            {t("onboarding.employee.management.title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {t("onboarding.employee.management.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            {t("employee.import_csv")}
          </Button>
          <Button type="primary" onClick={() => setSelectedUserId(null)}>
            {t("employee.add")}
          </Button>
        </div>
      </div>

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

      <Card styles={{ body: { padding: 0 } }}>
        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-stroke px-4 py-3">
          <BaseSearch
            placeholder={t("onboarding.employee.filter.search_placeholder")}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(v) => setSearchText(v ?? "")}
            className="flex-1 min-w-[200px]"
          />
          <select
            className={filterInputCls}
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
          <select
            className={filterInputCls}
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
              type="link"
              className="text-sm font-medium text-brand"
              onClick={handleReset}>
              {t("global.reset")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton.Input key={i} active block />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 p-10 text-sm text-muted">
            <p>
              {error != null && typeof (error as Error).message === "string"
                ? (error as Error).message
                : t("onboarding.template.error.something_wrong")}
            </p>
            <Button
              type="link"
              className="font-semibold"
              onClick={() => refetch()}>
              {t("onboarding.template.error.retry")}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            {hasActiveFilter ? (
              <Empty description={t("onboarding.employee.empty.filter_desc")}>
                <Button onClick={handleReset}>{t("global.reset")}</Button>
              </Empty>
            ) : (
              <Empty description={t("onboarding.employee.empty.desc")}>
                <Button type="primary" onClick={() => setSelectedUserId(null)}>
                  {t("employee.add")}
                </Button>
              </Empty>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-stroke px-4 py-2.5">
              <p className="text-xs text-muted">
                {filtered.length} {t("onboarding.employee.result_count")}
              </p>
            </div>
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 w-[220px]">
                    {t("onboarding.employee.col.name")}
                  </th>
                  <th className="px-4 py-3">{t("auth.email")}</th>
                  <th className="px-4 py-3 w-[120px]">
                    {t("onboarding.employee.col.role")}
                  </th>
                  <th className="px-4 py-3 w-[160px]">
                    {t("employee.department")}
                  </th>
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
                        <span className="font-medium text-ink">
                          {user.name}
                        </span>
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
                      {user.department || (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

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

export default EmployeeManagement;
