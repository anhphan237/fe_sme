import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserX, Mail, Upload } from "lucide-react";
import { Button, Card, Empty, Select, Skeleton, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import BaseSearch from "@/components/search";
import MyTable from "@/components/table";
import { useLocale } from "@/i18n";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { EmployeeFormDrawer } from "./EmployeeFormDrawer";
import { BulkImportModal } from "@/components/bulk-import";
import { AppLoading } from "@/components/page-loading";
import { apiBulkCreateUsers } from "@/api/identity/identity.api";
import { useUsersQuery, useDepartmentsQuery } from "@/hooks/adminHooks";
import type { User } from "@/shared/types";
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

// ── Page ──────────────────────────────────────────────────────────────────────

const EmployeeManagement = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const {
    data: users,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useUsersQuery();
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

  const deptOptions = useMemo(
    () => [
      { value: "", label: t("onboarding.employee.filter.all_dept") },
      ...(departments ?? []).map((d) => ({ value: d.name, label: d.name })),
    ],
    [departments, t],
  );

  const columns = useMemo<ColumnsType<User>>(
    () => [
      {
        title: t("onboarding.employee.col.name"),
        key: "name",
        render: (_, user) => (
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
            <span className="font-medium text-ink">{user.name}</span>
          </span>
        ),
      },
      {
        title: t("auth.email"),
        key: "email",
        render: (_, user) => (
          <span className="flex items-center gap-1.5 text-muted">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="text-sm">{user.email}</span>
          </span>
        ),
      },
      {
        title: t("onboarding.employee.col.role"),
        key: "role",
        render: (_, user) => (
          <span className="text-sm text-muted">
            {ROLE_LABELS[getPrimaryRole(user.roles)]}
          </span>
        ),
      },
      {
        title: t("employee.department"),
        key: "department",
        render: (_, user) => (
          <span className="text-sm text-muted">
            {user.department || <span className="text-slate-300">—</span>}
          </span>
        ),
      },
      {
        title: t("global.status"),
        key: "status",
        render: (_, user) => <StatusBadge status={user.status} />,
      },
    ],
    [t],
  );

  return (
    <div className="relative space-y-6">
      {isFetching && !isLoading && <AppLoading />}
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

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <BaseSearch
          placeholder={t("onboarding.employee.filter.search_placeholder")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(v) => setSearchText(v ?? "")}
          className="w-64"
        />
        <Select<StatusFilter>
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-36"
          options={[
            {
              value: "" as StatusFilter,
              label: t("onboarding.employee.filter.all_status"),
            },
            { value: "Active" as StatusFilter, label: t("global.active") },
            {
              value: "Inactive" as StatusFilter,
              label: t("global.inactive"),
            },
            {
              value: "Invited" as StatusFilter,
              label: t("onboarding.employee.filter.invited"),
            },
          ]}
        />
        <Select
          value={filterDept}
          onChange={setFilterDept}
          options={deptOptions}
          className="w-36"
        />
        {hasActiveFilter && (
          <Button
            type="link"
            className="text-sm font-medium text-brand"
            onClick={handleReset}>
            {t("global.reset")}
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
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
        <div style={{ height: 520 }}>
          <MyTable<User>
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            onRow={(user) => ({
              onClick: () => setSelectedUserId(user.id),
              className: "cursor-pointer",
            })}
            pagination={{}}
          />
        </div>
      )}

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
