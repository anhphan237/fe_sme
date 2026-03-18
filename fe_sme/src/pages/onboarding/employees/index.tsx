import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserX, Mail, Upload } from "lucide-react";
import { Button, Empty, Progress, Select, Tabs, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import BaseSearch from "@/components/search";
import BaseButton from "@/components/button";
import MyTable from "@/components/table";
import { BulkImportModal } from "@/components/bulk-import";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import {
  canManageOnboarding,
  ROLE_LABELS,
  getPrimaryRole,
} from "@/shared/rbac";
import { InstanceStatusBadge } from "./InstanceStatusBadge";
import { StartOnboardingDrawer } from "./StartOnboardingDrawer";
import { EmployeeFormDrawer } from "./management/EmployeeFormDrawer";
import { apiListInstances } from "@/api/onboarding/onboarding.api";
import {
  apiSearchUsers,
  apiBulkCreateUsers,
} from "@/api/identity/identity.api";
import { apiListDepartments } from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import { mapInstance } from "@/utils/mappers/onboarding";
import { mapUser } from "@/utils/mappers/identity";
import type { OnboardingInstance, User } from "@/shared/types";
import type { DepartmentItem } from "@/interface/company";
import type {
  BulkImportConfig,
  ImportRowResult,
} from "@/components/bulk-import";

type PageTab = "onboarding" | "management";
type OnboardingStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
type EmpStatus = "" | "Active" | "Inactive" | "Invited";

function findEmployee(
  instance: Pick<OnboardingInstance, "employeeUserId" | "employeeId">,
  users: User[],
): User | undefined {
  return users.find(
    (u) =>
      u.id === instance.employeeUserId ||
      u.id === instance.employeeId ||
      u.employeeId === instance.employeeId,
  );
}

// ── Inline components ─────────────────────────────────────────────────────────

const EMP_STATUS_COLOR: Record<string, string> = {
  Active: "success",
  Inactive: "error",
  Invited: "warning",
};

const EmpStatusBadge = ({ status }: { status: string }) => (
  <Tag color={EMP_STATUS_COLOR[status] ?? "default"}>{status}</Tag>
);

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
  <div className="flex items-center gap-4 rounded-lg border border-stroke bg-white p-4 shadow-sm">
    <div className={`rounded-xl p-2.5 ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-2xl font-bold text-ink">{value}</p>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const Employees = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const canStart = canManageOnboarding(currentUser?.roles ?? []);

  const [tab, setTab] = useState<PageTab>("onboarding");
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus>("ACTIVE");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [onboardingSearch, setOnboardingSearch] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [empStatus, setEmpStatus] = useState<EmpStatus>("");
  const [empDept, setEmpDept] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<
    string | null | undefined
  >(undefined);
  const [importOpen, setImportOpen] = useState(false);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: unknown) =>
      extractList(res as Record<string, unknown>, "users", "items").map((u) =>
        mapUser(u as Record<string, unknown>),
      ) as User[],
  });

  const {
    data: instances = [],
    isLoading: instancesLoading,
    isError: instancesError,
    error: instancesErr,
    refetch: refetchInstances,
  } = useQuery({
    queryKey: ["instances", "", statusFilter],
    queryFn: () => apiListInstances({ status: statusFilter }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: unknown) =>
      extractList(res as Record<string, unknown>, "items") as DepartmentItem[],
  });

  const filteredInstances = useMemo(() => {
    if (!onboardingSearch.trim()) return instances;
    const q = onboardingSearch.toLowerCase();
    return instances.filter((inst) =>
      (findEmployee(inst, users)?.name ?? "").toLowerCase().includes(q),
    );
  }, [instances, users, onboardingSearch]);

  const filteredEmployees = useMemo(() => {
    const keyword = empSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (empStatus && u.status !== empStatus) return false;
      if (empDept && u.department !== empDept) return false;
      if (keyword)
        return (
          u.name?.toLowerCase().includes(keyword) ||
          u.email?.toLowerCase().includes(keyword)
        );
      return true;
    });
  }, [users, empStatus, empDept, empSearch]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "Active").length,
      inactive: users.filter((u) => u.status === "Inactive").length,
      invited: users.filter((u) => u.status === "Invited").length,
    }),
    [users],
  );

  const deptOptions = useMemo(
    () => [
      { value: "", label: t("onboarding.employee.filter.all_dept") },
      ...departments.map((d) => ({ value: d.name, label: d.name })),
    ],
    [departments, t],
  );

  const importConfig: BulkImportConfig = {
    title: t("employee.import.title"),
    description: t("employee.import.description"),
    templateFileName: "employees_template.csv",
    fields: [
      { key: "email", label: t("employee.import.field.email"), required: true },
      {
        key: "fullName",
        label: t("employee.import.field.full_name"),
        required: true,
      },
      { key: "phone", label: t("employee.import.field.phone") },
      { key: "roleCode", label: t("employee.import.field.role") },
      { key: "departmentId", label: t("employee.import.field.department") },
      { key: "jobTitle", label: t("employee.import.field.job_title") },
      { key: "employeeCode", label: t("employee.import.field.employee_code") },
      { key: "startDate", label: t("employee.import.field.start_date") },
      { key: "workLocation", label: t("employee.import.field.work_location") },
    ],
  };

  const instanceColumns = useMemo<ColumnsType<OnboardingInstance>>(
    () => [
      {
        title: t("onboarding.employee.col.employee"),
        key: "employee",
        render: (_, inst) => {
          const emp = findEmployee(inst, users);
          const isSelf = Boolean(
            currentUser &&
            (inst.employeeUserId === currentUser.id ||
              inst.employeeId === currentUser.id),
          );
          const name = emp?.name ?? (isSelf ? (currentUser?.name ?? "-") : "-");
          const initial = name !== "-" ? name.charAt(0).toUpperCase() : "?";
          return (
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {initial}
              </span>
              <button
                type="button"
                className="cursor-pointer font-medium text-blue-600 hover:underline"
                onClick={() => navigate(`/onboarding/employees/${inst.id}`)}>
                {name}
              </button>
            </span>
          );
        },
      },
      {
        title: t("onboarding.employee.col.role"),
        key: "role",
        render: (_, inst) => {
          const emp = findEmployee(inst, users);
          const isSelf = Boolean(
            currentUser &&
            (inst.employeeUserId === currentUser.id ||
              inst.employeeId === currentUser.id),
          );
          const roles = emp?.roles ?? (isSelf ? currentUser?.roles : undefined);
          return (
            <span className="text-sm text-muted">
              {roles ? ROLE_LABELS[getPrimaryRole(roles)] : "—"}
            </span>
          );
        },
      },
      {
        title: t("onboarding.employee.col.start_date"),
        key: "startDate",
        render: (_, inst) => (
          <span className="text-sm text-muted">{inst.startDate || "—"}</span>
        ),
      },
      {
        title: t("onboarding.employee.col.progress"),
        key: "progress",
        render: (_, inst) => (
          <span className="flex items-center gap-2">
            <span className="w-24">
              <Progress
                percent={inst.progress ?? 0}
                showInfo={false}
                size="small"
              />
            </span>
            <span className="text-sm tabular-nums text-muted">
              {inst.progress ?? 0}%
            </span>
          </span>
        ),
      },
      {
        title: t("onboarding.employee.col.status"),
        key: "status",
        render: (_, inst) => <InstanceStatusBadge status={inst.status} />,
      },
      {
        title: t("onboarding.employee.col.manager"),
        key: "manager",
        render: (_, inst) => (
          <span className="text-sm text-muted">
            {findEmployee(inst, users)?.manager || inst.managerName || "—"}
          </span>
        ),
      },
    ],
    [t, users, currentUser, navigate],
  );

  const empColumns = useMemo<ColumnsType<User>>(
    () => [
      {
        title: t("onboarding.employee.col.name"),
        key: "name",
        render: (_, u) => (
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
              {u.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
            <span className="font-medium text-ink">{u.name}</span>
          </span>
        ),
      },
      {
        title: t("auth.email"),
        key: "email",
        render: (_, u) => (
          <span className="flex items-center gap-1.5 text-muted">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="text-sm">{u.email}</span>
          </span>
        ),
      },
      {
        title: t("onboarding.employee.col.role"),
        key: "role",
        render: (_, u) => (
          <span className="text-sm text-muted">
            {ROLE_LABELS[getPrimaryRole(u.roles)]}
          </span>
        ),
      },
      {
        title: t("employee.department"),
        key: "department",
        render: (_, u) => (
          <span className="text-sm text-muted">{u.department || "—"}</span>
        ),
      },
      {
        title: t("global.status"),
        key: "status",
        render: (_, u) => <EmpStatusBadge status={u.status} />,
      },
    ],
    [t],
  );

  async function handleBulkImport(
    rows: Record<string, string>[],
  ): Promise<ImportRowResult[]> {
    const payload = rows.map((r) => ({
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
    const res = await apiBulkCreateUsers({ users: payload });
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
  }

  const hasEmpFilter = !!(empSearch || empStatus || empDept);
  const resetEmpFilter = () => {
    setEmpSearch("");
    setEmpStatus("");
    setEmpDept("");
  };

  return (
    <div className="flex h-full flex-col p-4">
      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as PageTab)}
        items={[
          {
            key: "onboarding" as PageTab,
            label: t("onboarding.employee.tab.onboarding"),
            children: (
              <div className="flex flex-col">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Select<OnboardingStatus>
                      value={statusFilter}
                      onChange={setStatusFilter}
                      className="w-40"
                      options={[
                        {
                          value: "ACTIVE" as OnboardingStatus,
                          label: t("onboarding.employee.filter.active"),
                        },
                        {
                          value: "COMPLETED" as OnboardingStatus,
                          label: t("onboarding.employee.filter.completed"),
                        },
                        {
                          value: "CANCELLED" as OnboardingStatus,
                          label: t("onboarding.employee.filter.paused"),
                        },
                      ]}
                    />
                    <BaseSearch
                      placeholder={t("onboarding.employee.search_placeholder")}
                      onSearch={(v) => setOnboardingSearch(v ?? "")}
                      allowClear
                      className="w-64"
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {canStart && (
                      <Button
                        type="primary"
                        onClick={() => setDrawerOpen(true)}>
                        {t("onboarding.employee.action.start")}
                      </Button>
                    )}
                  </div>
                </div>
                {instancesError ? (
                  <div className="flex flex-col items-center gap-3 p-12 text-center">
                    <p className="text-sm font-medium text-ink">
                      {instancesErr instanceof Error
                        ? instancesErr.message
                        : t("onboarding.template.error.something_wrong")}
                    </p>
                    <Button onClick={() => refetchInstances()}>
                      {t("onboarding.template.error.retry")}
                    </Button>
                  </div>
                ) : !instancesLoading && filteredInstances.length === 0 ? (
                  <div className="p-12">
                    <Empty description={t("onboarding.employee.empty.desc")}>
                      {canStart && !onboardingSearch.trim() && (
                        <Button
                          type="primary"
                          onClick={() => setDrawerOpen(true)}>
                          {t("onboarding.employee.action.start")}
                        </Button>
                      )}
                    </Empty>
                  </div>
                ) : (
                  <MyTable<OnboardingInstance>
                    dataSource={filteredInstances}
                    columns={instanceColumns}
                    rowKey="id"
                    loading={instancesLoading}
                    wrapClassName="!h-full w-full"
                    pagination={{}}
                  />
                )}
              </div>
            ),
          },
          {
            key: "management" as PageTab,
            label: t("onboarding.employee.tab.management"),
            children: (
              <div className="flex flex-col">
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BaseSearch
                      placeholder={t(
                        "onboarding.employee.filter.search_placeholder",
                      )}
                      onSearch={(v) => setEmpSearch(v ?? "")}
                      allowClear
                      className="w-64"
                    />
                    <Select<EmpStatus>
                      value={empStatus}
                      onChange={setEmpStatus}
                      className="w-36"
                      options={[
                        {
                          value: "" as EmpStatus,
                          label: t("onboarding.employee.filter.all_status"),
                        },
                        {
                          value: "Active" as EmpStatus,
                          label: t("global.active"),
                        },
                        {
                          value: "Inactive" as EmpStatus,
                          label: t("global.inactive"),
                        },
                        {
                          value: "Invited" as EmpStatus,
                          label: t("onboarding.employee.filter.invited"),
                        },
                      ]}
                    />
                    <Select
                      value={empDept}
                      onChange={setEmpDept}
                      options={deptOptions}
                      className="w-36"
                    />
                    {hasEmpFilter && (
                      <Button
                        type="link"
                        className="px-0 text-brand"
                        onClick={resetEmpFilter}>
                        {t("global.reset")}
                      </Button>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {canStart && (
                      <>
                        <BaseButton
                          icon={<Upload className="h-4 w-4" />}
                          onClick={() => setImportOpen(true)}>
                          {t("employee.import_csv")}
                        </BaseButton>
                        <Button
                          type="primary"
                          onClick={() => setSelectedUserId(null)}>
                          {t("employee.add")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {filteredEmployees.length === 0 ? (
                  <div className="p-12">
                    {hasEmpFilter ? (
                      <Empty
                        description={t(
                          "onboarding.employee.empty.filter_desc",
                        )}>
                        <Button onClick={resetEmpFilter}>
                          {t("global.reset")}
                        </Button>
                      </Empty>
                    ) : (
                      <Empty description={t("onboarding.employee.empty.desc")}>
                        {canStart && (
                          <Button
                            type="primary"
                            onClick={() => setSelectedUserId(null)}>
                            {t("employee.add")}
                          </Button>
                        )}
                      </Empty>
                    )}
                  </div>
                ) : (
                  <MyTable<User>
                    dataSource={filteredEmployees}
                    columns={empColumns}
                    rowKey="id"
                    loading={usersLoading}
                    onRow={(u) => ({
                      onClick: () => setSelectedUserId(u.id),
                      className: "cursor-pointer",
                    })}
                    wrapClassName="!h-full w-full"
                    pagination={{}}
                  />
                )}
              </div>
            ),
          },
        ]}
      />

      <StartOnboardingDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={(id) => navigate(`/onboarding/employees/${id}`)}
        users={users}
      />
      <EmployeeFormDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(undefined)}
        onCreated={() => setSelectedUserId(undefined)}
      />
      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={importConfig}
        onSubmit={handleBulkImport}
      />
    </div>
  );
};

export default Employees;
