import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, Search } from "lucide-react";

import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Table } from "@core/components/ui/Table";
import { Button } from "@core/components/ui/Button";
import { EmptyState } from "@core/components/ui/EmptyState";
import { Skeleton } from "@core/components/ui/Skeleton";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import { canManageOnboarding } from "@/shared/rbac";
import { FilterTabs } from "./FilterTabs";
import { InstanceRow } from "./InstanceRow";
import { StartOnboardingDrawer } from "./StartOnboardingDrawer";
import { useInstancesQuery, useUsersQuery } from "./hooks";
import type { StatusFilter } from "./FilterTabs";

// ─── Page ─────────────────────────────────────────────────────────────────────

const Employees = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const canStart = canManageOnboarding(currentUser?.roles ?? []);

  const locationState = location.state as { newEmployeeId?: string } | null;
  const defaultEmployeeId = locationState?.newEmployeeId;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [drawerOpen, setDrawerOpen] = useState(!!defaultEmployeeId);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: instances = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useInstancesQuery({ status: statusFilter });
  const { data: users = [] } = useUsersQuery();

  const filteredInstances = useMemo(() => {
    if (!searchQuery.trim()) return instances;
    const q = searchQuery.toLowerCase();
    return instances.filter((instance) => {
      const user = users.find(
        (u) =>
          u.id === instance.employeeUserId ||
          u.id === instance.employeeId ||
          u.employeeId === instance.employeeId,
      );
      return (user?.name ?? "").toLowerCase().includes(q);
    });
  }, [instances, users, searchQuery]);

  const COL_HEADERS = [
    t("onboarding.employee.col.employee"),
    t("onboarding.employee.col.role"),
    t("onboarding.employee.col.start_date"),
    t("onboarding.employee.col.progress"),
    t("onboarding.employee.col.status"),
    t("onboarding.employee.col.manager"),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("onboarding.employee.title")}
        subtitle={t("onboarding.employee.subtitle")}
        actionLabel={
          canStart ? t("onboarding.employee.action.start") : undefined
        }
        onAction={canStart ? () => setDrawerOpen(true) : undefined}
        extra={
          canStart ? (
            <Button
              variant="secondary"
              onClick={() => navigate("/onboarding/employees/new")}>
              {t("onboarding.employee.action.manage")}
            </Button>
          ) : undefined
        }
      />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b border-stroke px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterTabs value={statusFilter} onChange={setStatusFilter} />
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("onboarding.employee.search_placeholder")}
              className="w-full rounded-lg border border-stroke bg-white py-2 pl-9 pr-3.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-medium text-ink">
              {error instanceof Error
                ? error.message
                : t("onboarding.template.error.something_wrong")}
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              {t("onboarding.template.error.retry")}
            </Button>
          </div>
        ) : filteredInstances.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title={t("onboarding.employee.empty.title")}
              description={t("onboarding.employee.empty.desc")}
              actionLabel={
                canStart && !searchQuery.trim()
                  ? t("onboarding.employee.action.start")
                  : undefined
              }
              onAction={
                canStart && !searchQuery.trim()
                  ? () => setDrawerOpen(true)
                  : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="border-b border-stroke px-4 py-2.5">
              <p className="text-xs text-muted">
                {filteredInstances.length}{" "}
                {t("onboarding.employee.result_count")}
              </p>
            </div>
            <Table>
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  {COL_HEADERS.map((h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInstances.map((instance) => (
                  <InstanceRow
                    key={instance.id}
                    instance={instance}
                    users={users}
                    currentUser={currentUser}
                    onOpen={(id) => navigate(`/onboarding/employees/${id}`)}
                  />
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Card>

      <StartOnboardingDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={(id) => navigate(`/onboarding/employees/${id}`)}
        users={users}
        defaultEmployeeId={defaultEmployeeId}
      />
    </div>
  );
};

export default Employees;
