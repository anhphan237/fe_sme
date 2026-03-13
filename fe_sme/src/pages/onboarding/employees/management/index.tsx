import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserX, Mail, Upload } from "lucide-react";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Skeleton } from "@core/components/ui/Skeleton";
import { EmptyState } from "@core/components/ui/EmptyState";
import { Button } from "@core/components/ui/Button";
import { useLocale } from "@/i18n";
import { useUsersQuery, useDepartmentsQuery } from "./hooks";
import { StatCard } from "./StatCard";
import { FilterToolbar } from "./FilterToolbar";
import { EmployeeTable } from "./EmployeeTable";
import { EmployeeFormDrawer } from "./EmployeeFormDrawer";
import { BulkImportModal } from "@/components/bulk-import";
import { apiBulkCreateUsers } from "@/api/identity/identity.api";
import type {
  BulkImportConfig,
  ImportRowResult,
} from "@/components/bulk-import";
import type { StatusFilter } from "./constants";

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
        <PageHeader
          title={t("onboarding.employee.management.title")}
          subtitle={t("onboarding.employee.management.subtitle")}
        />
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            {t("employee.import_csv")}
          </Button>
          <Button onClick={() => setSelectedUserId(null)}>
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

      <Card className="p-0">
        <FilterToolbar
          searchText={searchText}
          onSearchChange={setSearchText}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterDept={filterDept}
          onDeptChange={setFilterDept}
          departments={departments}
          hasActiveFilter={hasActiveFilter}
          onReset={handleReset}
        />

        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
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
              variant="ghost"
              className="font-semibold text-brand hover:underline"
              onClick={() => refetch()}>
              {t("onboarding.template.error.retry")}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
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
        ) : (
          <EmployeeTable
            users={filtered}
            onSelectUser={(id) => setSelectedUserId(id)}
          />
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
