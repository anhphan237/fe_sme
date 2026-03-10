import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserX, Mail } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n";
import { useUsersQuery, useDepartmentsQuery } from "./hooks";
import { StatCard } from "./StatCard";
import { FilterToolbar } from "./FilterToolbar";
import { EmployeeTable } from "./EmployeeTable";
import { EmployeeFormDrawer } from "./EmployeeFormDrawer";
import type { StatusFilter } from "./constants";

function EmployeeManagement() {
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
      <PageHeader
        title={t("onboarding.employee.management.title")}
        subtitle={t("onboarding.employee.management.subtitle")}
        actionLabel={t("employee.add")}
        onAction={() => setSelectedUserId(null)}
      />

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
    </div>
  );
}

export default EmployeeManagement;
