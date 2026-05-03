import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserX, Mail, Upload } from "lucide-react";
import { Button, Empty, Progress, Select, Skeleton, Tabs, Tag } from "antd";
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
import { AppLoading } from "@/components/page-loading";
import { InstanceStatusBadge } from "./InstanceStatusBadge";
import { StartOnboardingDrawer } from "./StartOnboardingDrawer";
import { EmployeeFormDrawer } from "./management/EmployeeFormDrawer";

import { apiListInstances } from "@/api/onboarding/onboarding.api";
import { apiBulkCreateUsers } from "@/api/identity/identity.api";
import { mapInstance } from "@/utils/mappers/onboarding";
import { useUsersQuery, useDepartmentsQuery } from "@/hooks/adminHooks";

import type { OnboardingInstance, User } from "@/shared/types";
import type {
  BulkImportConfig,
  ImportRowResult,
} from "@/components/bulk-import";

type PageTab = "onboarding" | "management";

type OnboardingStatus = "ALL" | "ACTIVE" | "DONE" | "CANCELLED";

type EmpStatus = "ALL" | "ACTIVE" | "OFFICIAL" | "INACTIVE" | "INVITED";

const ONBOARDING_STATUS_OPTIONS: Array<{
  value: OnboardingStatus;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang onboarding" },
  { value: "DONE", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Tạm dừng" },
];

const EMP_STATUS_OPTIONS: Array<{
  value: EmpStatus;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "OFFICIAL", label: "Chính thức" },
  { value: "INACTIVE", label: "Ngừng hoạt động" },
  { value: "INVITED", label: "Đã mời" },
];

const ONBOARDING_STATUS_FOR_ALL: Array<Exclude<OnboardingStatus, "ALL">> = [
  "ACTIVE",
  "DONE",
  "CANCELLED",
];

const EMP_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "success",
  OFFICIAL: "processing",
  INACTIVE: "error",
  INVITED: "warning",
};

const getText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const normalizeStatus = (status?: string | null): string => {
  const raw = String(status ?? "").trim();
  if (!raw) return "";

  const upper = raw.toUpperCase();

  if (upper === "ACTIVE") return "ACTIVE";
  if (upper === "OFFICIAL") return "OFFICIAL";
  if (upper === "INACTIVE" || upper === "DISABLED") return "INACTIVE";
  if (upper === "INVITED" || upper === "PENDING") return "INVITED";
  if (upper === "DONE" || upper === "COMPLETED") return "DONE";
  if (upper === "CANCELLED" || upper === "CANCELED") return "CANCELLED";

  return upper;
};

const getStatusLabel = (status?: string | null): string => {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "OFFICIAL":
      return "Chính thức";
    case "INACTIVE":
      return "Ngừng hoạt động";
    case "INVITED":
      return "Đã mời";
    case "DONE":
      return "Hoàn thành";
    case "CANCELLED":
      return "Tạm dừng";
    default:
      return status || "—";
  }
};

const getUserId = (user?: User | null): string => {
  if (!user) return "";

  const raw = user as User & {
    id?: string;
    userId?: string;
    user_id?: string;
  };

  return getText(raw.id) || getText(raw.userId) || getText(raw.user_id);
};

const getEmployeeId = (user?: User | null): string => {
  if (!user) return "";

  const raw = user as User & {
    employeeId?: string;
    employee_id?: string;
  };

  return getText(raw.employeeId) || getText(raw.employee_id);
};

const getUserName = (user?: User | null): string => {
  if (!user) return "—";

  const raw = user as User & {
    name?: string;
    fullName?: string;
    full_name?: string;
    employeeName?: string;
    employee_name?: string;
  };

  return (
    getText(raw.name) ||
    getText(raw.fullName) ||
    getText(raw.full_name) ||
    getText(raw.employeeName) ||
    getText(raw.employee_name) ||
    "—"
  );
};

const getUserEmail = (user?: User | null): string => {
  if (!user) return "";

  const raw = user as User & {
    email?: string;
    employeeEmail?: string;
    employee_email?: string;
  };

  return (
    getText(raw.email) ||
    getText(raw.employeeEmail) ||
    getText(raw.employee_email)
  );
};

const getDepartmentName = (user?: User | null): string => {
  if (!user) return "";

  const raw = user as User & {
    department?: string;
    departmentName?: string;
    department_name?: string;
  };

  return (
    getText(raw.department) ||
    getText(raw.departmentName) ||
    getText(raw.department_name)
  );
};

const hasEmployeeRole = (user: User): boolean => {
  const roles = (user.roles ?? []).map((role) => String(role).toUpperCase());
  return roles.includes("EMPLOYEE");
};

function findEmployee(
  instance: Pick<OnboardingInstance, "employeeUserId" | "employeeId">,
  users: User[],
): User | undefined {
  const employeeUserId = String(instance.employeeUserId ?? "").trim();
  const employeeId = String(instance.employeeId ?? "").trim();

  return users.find((user) => {
    const userId = getUserId(user);
    const profileEmployeeId = getEmployeeId(user);

    return (
      userId === employeeUserId ||
      userId === employeeId ||
      profileEmployeeId === employeeId ||
      profileEmployeeId === employeeUserId
    );
  });
}

const extractInstances = (res: unknown): unknown[] => {
  const raw = res as Record<string, unknown>;

  const data =
    (raw?.data as Record<string, unknown> | undefined) ??
    (raw?.result as Record<string, unknown> | undefined) ??
    (raw?.payload as Record<string, unknown> | undefined) ??
    raw;

  const list =
    (data?.instances as unknown[]) ??
    (data?.items as unknown[]) ??
    (data?.list as unknown[]) ??
    (data?.content as unknown[]) ??
    (Array.isArray(data) ? data : []);

  return Array.isArray(list) ? list : [];
};

const loadOnboardingInstances = async (
  statusFilter: OnboardingStatus,
): Promise<OnboardingInstance[]> => {
  if (statusFilter !== "ALL") {
    const res = await apiListInstances({
      status: statusFilter,
    });

    return extractInstances(res).map(mapInstance) as OnboardingInstance[];
  }

  /**
   * BE hiện đang default trả ACTIVE nếu không truyền status.
   * Vì vậy ALL phải gọi riêng ACTIVE / DONE / CANCELLED rồi merge.
   */
  const responses = await Promise.all(
    ONBOARDING_STATUS_FOR_ALL.map((status) =>
      apiListInstances({
        status,
      }),
    ),
  );

  const instanceMap = new Map<string, OnboardingInstance>();

  for (const res of responses) {
    const list = extractInstances(res).map(mapInstance) as OnboardingInstance[];

    for (const instance of list) {
      instanceMap.set(instance.id, instance);
    }
  }

  return Array.from(instanceMap.values());
};

const EmpStatusBadge = ({ status }: { status?: string | null }) => {
  const normalized = normalizeStatus(status);

  return (
    <Tag color={EMP_STATUS_COLOR[normalized] ?? "default"}>
      {getStatusLabel(status)}
    </Tag>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: ReactNode;
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

const Employees = () => {
  const navigate = useNavigate();
  const employeesBasePath = "/onboarding";
  const { t } = useLocale();

  const currentUser = useUserStore((state) => state.currentUser);
  const canStart = canManageOnboarding(currentUser?.roles ?? []);

  const [tab, setTab] = useState<PageTab>("onboarding");

  const [statusFilter, setStatusFilter] =
    useState<OnboardingStatus>("ALL");
  const [onboardingSearch, setOnboardingSearch] = useState("");

  const [empSearch, setEmpSearch] = useState("");
  const [empStatus, setEmpStatus] = useState<EmpStatus>("ALL");
  const [empDept, setEmpDept] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<
    string | null | undefined
  >(undefined);
  const [importOpen, setImportOpen] = useState(false);

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
    error: usersErr,
    isFetching: usersFetching,
    refetch: refetchUsers,
  } = useUsersQuery();

  const {
    data: instances = [],
    isLoading: instancesLoading,
    isError: instancesError,
    error: instancesErr,
    isFetching: instancesFetching,
    refetch: refetchInstances,
  } = useQuery({
    queryKey: ["instances", statusFilter],
    queryFn: () => loadOnboardingInstances(statusFilter),
    enabled: tab === "onboarding",
    refetchOnMount: "always",
  });

  const { data: departments = [] } = useDepartmentsQuery();

  const employeeUsers = useMemo(
    () => users.filter((user) => hasEmployeeRole(user)),
    [users],
  );

  const filteredInstances = useMemo(() => {
    const keyword = onboardingSearch.trim().toLowerCase();

    if (!keyword) return instances;

    return instances.filter((instance) => {
      const employee = findEmployee(instance, users);
      const employeeName = getUserName(employee).toLowerCase();
      const employeeEmail = getUserEmail(employee).toLowerCase();
      const managerName = String(instance.managerName ?? "").toLowerCase();
      const status = String(instance.status ?? "").toLowerCase();
      const startDate = String(instance.startDate ?? "").toLowerCase();

      return (
        employeeName.includes(keyword) ||
        employeeEmail.includes(keyword) ||
        managerName.includes(keyword) ||
        status.includes(keyword) ||
        startDate.includes(keyword)
      );
    });
  }, [instances, users, onboardingSearch]);

  const filteredEmployees = useMemo(() => {
    const keyword = empSearch.trim().toLowerCase();

    return employeeUsers.filter((user) => {
      const userStatus = normalizeStatus(user.status);

      if (empStatus !== "ALL" && userStatus !== empStatus) {
        return false;
      }

      if (empDept && getDepartmentName(user) !== empDept) {
        return false;
      }

      if (keyword) {
        const name = getUserName(user).toLowerCase();
        const email = getUserEmail(user).toLowerCase();

        if (!name.includes(keyword) && !email.includes(keyword)) {
          return false;
        }
      }

      return true;
    });
  }, [employeeUsers, empSearch, empStatus, empDept]);

  const employeeStats = useMemo(
    () => ({
      total: employeeUsers.length,
      active: employeeUsers.filter(
        (user) => normalizeStatus(user.status) === "ACTIVE",
      ).length,
      official: employeeUsers.filter(
        (user) => normalizeStatus(user.status) === "OFFICIAL",
      ).length,
      inactive: employeeUsers.filter(
        (user) => normalizeStatus(user.status) === "INACTIVE",
      ).length,
    }),
    [employeeUsers],
  );

  const onboardingStats = useMemo(
    () => ({
      total: instances.length,
      active: instances.filter(
        (instance) => normalizeStatus(instance.status) === "ACTIVE",
      ).length,
      done: instances.filter(
        (instance) => normalizeStatus(instance.status) === "DONE",
      ).length,
      cancelled: instances.filter(
        (instance) => normalizeStatus(instance.status) === "CANCELLED",
      ).length,
    }),
    [instances],
  );

  const deptOptions = useMemo(
    () => [
      {
        value: "",
        label: t("onboarding.employee.filter.all_dept"),
      },
      ...departments.map((department) => ({
        value: department.name,
        label: department.name,
      })),
    ],
    [departments, t],
  );

  const importConfig: BulkImportConfig = useMemo(
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
        {
          key: "phone",
          label: t("employee.import.field.phone"),
        },
        {
          key: "roleCode",
          label: t("employee.import.field.role"),
        },
        {
          key: "departmentId",
          label: t("employee.import.field.department"),
        },
        {
          key: "jobTitle",
          label: t("employee.import.field.job_title"),
        },
        {
          key: "employeeCode",
          label: t("employee.import.field.employee_code"),
        },
        {
          key: "startDate",
          label: t("employee.import.field.start_date"),
        },
        {
          key: "workLocation",
          label: t("employee.import.field.work_location"),
        },
      ],
    }),
    [t],
  );

  const instanceColumns = useMemo<ColumnsType<OnboardingInstance>>(
    () => [
      {
        title: t("onboarding.employee.col.employee"),
        key: "employee",
        render: (_, instance) => {
          const employee = findEmployee(instance, users);

          const isSelf = Boolean(
            currentUser &&
              (instance.employeeUserId === currentUser.id ||
                instance.employeeId === currentUser.id),
          );

          const fallbackName = isSelf ? currentUser?.name ?? "—" : "—";
          const name =
            getUserName(employee) !== "—" ? getUserName(employee) : fallbackName;
          const initial = name !== "—" ? name.charAt(0).toUpperCase() : "?";

          return (
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {initial}
              </span>

              <button
                type="button"
                className="cursor-pointer font-medium text-blue-600 hover:underline"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`${employeesBasePath}/employees/${instance.id}`);
                }}
              >
                {name}
              </button>
            </span>
          );
        },
      },
      {
        title: t("onboarding.employee.col.role"),
        key: "role",
        render: (_, instance) => {
          const employee = findEmployee(instance, users);

          const isSelf = Boolean(
            currentUser &&
              (instance.employeeUserId === currentUser.id ||
                instance.employeeId === currentUser.id),
          );

          const roles = employee?.roles ?? (isSelf ? currentUser?.roles : undefined);

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
        render: (_, instance) => (
          <span className="text-sm text-muted">
            {instance.startDate || "—"}
          </span>
        ),
      },
      {
        title: t("onboarding.employee.col.progress"),
        key: "progress",
        render: (_, instance) => {
          const percent = instance.progress ?? 0;

          return (
            <span className="flex items-center gap-2">
              <span className="w-24">
                <Progress percent={percent} showInfo={false} size="small" />
              </span>
              <span className="text-sm tabular-nums text-muted">
                {percent}%
              </span>
            </span>
          );
        },
      },
      {
        title: t("onboarding.employee.col.status"),
        key: "status",
        render: (_, instance) => (
          <InstanceStatusBadge status={instance.status} />
        ),
      },
      {
        title: t("onboarding.employee.col.manager"),
        key: "manager",
        render: (_, instance) => (
          <span className="text-sm text-muted">
            {instance.managerName || "—"}
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
        render: (_, user) => {
          const name = getUserName(user);
          const initial = name !== "—" ? name.charAt(0).toUpperCase() : "?";

          return (
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {initial}
              </span>
              <span className="font-medium text-ink">{name}</span>
            </span>
          );
        },
      },
      {
        title: t("auth.email"),
        key: "email",
        render: (_, user) => (
          <span className="flex items-center gap-1.5 text-muted">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="text-sm">{getUserEmail(user) || "—"}</span>
          </span>
        ),
      },
      {
        title: t("onboarding.employee.col.role"),
        key: "role",
        render: (_, user) => {
          const role = getPrimaryRole(user.roles);

          return (
            <span className="text-sm text-muted">
              {ROLE_LABELS[role] ?? role}
            </span>
          );
        },
      },
      {
        title: t("employee.department"),
        key: "department",
        render: (_, user) => (
          <span className="text-sm text-muted">
            {getDepartmentName(user) || "—"}
          </span>
        ),
      },
      {
        title: t("global.status"),
        key: "status",
        render: (_, user) => <EmpStatusBadge status={user.status} />,
      },
    ],
    [t],
  );

  async function handleBulkImport(
    rows: Record<string, string>[],
  ): Promise<ImportRowResult[]> {
    const payload = rows.map((row) => ({
      email: row.email ?? "",
      fullName: row.fullName ?? "",
      phone: row.phone || undefined,
      roleCode: row.roleCode || "EMPLOYEE",
      departmentId: row.departmentId || undefined,
      jobTitle: row.jobTitle || undefined,
      employeeCode: row.employeeCode || undefined,
      startDate: row.startDate || undefined,
      workLocation: row.workLocation || undefined,
    }));

    const res = await apiBulkCreateUsers({
      users: payload,
    });

    const data = (
      res as {
        data?: {
          results?: {
            index: number;
            success: boolean;
            message?: string;
          }[];
        };
      }
    )?.data;

    if (data?.results) {
      return data.results.map((row) => ({
        index: row.index,
        success: row.success,
        message: row.message,
      }));
    }

    return rows.map((_, index) => ({
      index,
      success: true,
    }));
  }

  const hasOnboardingFilter = Boolean(
    onboardingSearch.trim() || statusFilter !== "ALL",
  );

  const resetOnboardingFilter = () => {
    setOnboardingSearch("");
    setStatusFilter("ALL");
  };

  const hasEmpFilter = Boolean(
    empSearch.trim() || empStatus !== "ALL" || empDept,
  );

  const resetEmpFilter = () => {
    setEmpSearch("");
    setEmpStatus("ALL");
    setEmpDept("");
  };

  const isPageFetching =
    (tab === "onboarding" && instancesFetching && !instancesLoading) ||
    (tab === "management" && usersFetching && !usersLoading);

  return (
    <div className="relative flex h-full flex-col p-4">
      {isPageFetching && <AppLoading />}

      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as PageTab)}
        items={[
          {
            key: "onboarding" as PageTab,
            label: t("onboarding.employee.tab.onboarding"),
            children: (
              <div className="flex flex-col">
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard
                    icon={<Users className="h-5 w-5 text-brand" />}
                    label="Tổng onboarding"
                    value={onboardingStats.total}
                    colorClass="bg-brand/10"
                  />
                  <StatCard
                    icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
                    label="Đang onboarding"
                    value={onboardingStats.active}
                    colorClass="bg-emerald-50"
                  />
                  <StatCard
                    icon={<UserCheck className="h-5 w-5 text-blue-600" />}
                    label="Hoàn thành"
                    value={onboardingStats.done}
                    colorClass="bg-blue-50"
                  />
                  <StatCard
                    icon={<UserX className="h-5 w-5 text-red-500" />}
                    label="Tạm dừng"
                    value={onboardingStats.cancelled}
                    colorClass="bg-red-50"
                  />
                </div>

                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Select<OnboardingStatus>
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value)}
                      className="w-44"
                      options={ONBOARDING_STATUS_OPTIONS}
                    />

                    <BaseSearch
                      placeholder={t("onboarding.employee.search_placeholder")}
                      value={onboardingSearch}
                      onChange={(event) =>
                        setOnboardingSearch(event.target.value)
                      }
                      onSearch={(value) => setOnboardingSearch(value ?? "")}
                      allowClear
                      className="w-64"
                    />

                    {hasOnboardingFilter && (
                      <Button
                        type="link"
                        className="px-0 text-brand"
                        onClick={resetOnboardingFilter}
                      >
                        {t("global.reset")}
                      </Button>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {canStart && (
                      <Button
                        type="primary"
                        onClick={() => setDrawerOpen(true)}
                      >
                        {t("onboarding.employee.action.start")}
                      </Button>
                    )}
                  </div>
                </div>

                {instancesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton.Input key={index} active block />
                    ))}
                  </div>
                ) : instancesError ? (
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
                ) : filteredInstances.length === 0 ? (
                  <div className="p-12">
                    {hasOnboardingFilter ? (
                      <Empty
                        description={t("onboarding.employee.empty.filter_desc")}
                      >
                        <Button onClick={resetOnboardingFilter}>
                          {t("global.reset")}
                        </Button>
                      </Empty>
                    ) : (
                      <Empty description={t("onboarding.employee.empty.desc")}>
                        {canStart && (
                          <Button
                            type="primary"
                            onClick={() => setDrawerOpen(true)}
                          >
                            {t("onboarding.employee.action.start")}
                          </Button>
                        )}
                      </Empty>
                    )}
                  </div>
                ) : (
                  <MyTable<OnboardingInstance>
                    dataSource={filteredInstances}
                    columns={instanceColumns}
                    rowKey="id"
                    loading={instancesLoading}
                    onRow={(instance) => ({
                      onClick: () =>
                        navigate(`${employeesBasePath}/employees/${instance.id}`),
                      className: "cursor-pointer",
                    })}
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
                    value={employeeStats.total}
                    colorClass="bg-brand/10"
                  />
                  <StatCard
                    icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
                    label={t("global.active")}
                    value={employeeStats.active}
                    colorClass="bg-emerald-50"
                  />
                  <StatCard
                    icon={<UserCheck className="h-5 w-5 text-blue-600" />}
                    label="Chính thức"
                    value={employeeStats.official}
                    colorClass="bg-blue-50"
                  />
                  <StatCard
                    icon={<UserX className="h-5 w-5 text-red-500" />}
                    label={t("global.inactive")}
                    value={employeeStats.inactive}
                    colorClass="bg-red-50"
                  />
                </div>

                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BaseSearch
                      placeholder={t(
                        "onboarding.employee.filter.search_placeholder",
                      )}
                      value={empSearch}
                      onChange={(event) => setEmpSearch(event.target.value)}
                      onSearch={(value) => setEmpSearch(value ?? "")}
                      allowClear
                      className="w-64"
                    />

                    <Select<EmpStatus>
                      value={empStatus}
                      onChange={setEmpStatus}
                      className="w-44"
                      options={EMP_STATUS_OPTIONS}
                    />

                    <Select
                      value={empDept}
                      onChange={setEmpDept}
                      options={deptOptions}
                      className="w-44"
                    />

                    {hasEmpFilter && (
                      <Button
                        type="link"
                        className="px-0 text-brand"
                        onClick={resetEmpFilter}
                      >
                        {t("global.reset")}
                      </Button>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {canStart && (
                      <>
                        <BaseButton
                          icon={<Upload className="h-4 w-4" />}
                          onClick={() => setImportOpen(true)}
                        >
                          {t("employee.import_csv")}
                        </BaseButton>
                        <Button
                          type="primary"
                          onClick={() => setSelectedUserId(null)}
                        >
                          {t("employee.add")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {usersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton.Input key={index} active block />
                    ))}
                  </div>
                ) : usersError ? (
                  <div className="flex flex-col items-center gap-3 p-12 text-center">
                    <p className="text-sm font-medium text-ink">
                      {usersErr instanceof Error
                        ? usersErr.message
                        : t("onboarding.template.error.something_wrong")}
                    </p>
                    <Button onClick={() => refetchUsers()}>
                      {t("onboarding.template.error.retry")}
                    </Button>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-12">
                    {hasEmpFilter ? (
                      <Empty
                        description={t("onboarding.employee.empty.filter_desc")}
                      >
                        <Button onClick={resetEmpFilter}>
                          {t("global.reset")}
                        </Button>
                      </Empty>
                    ) : (
                      <Empty description={t("onboarding.employee.empty.desc")}>
                        {canStart && (
                          <Button
                            type="primary"
                            onClick={() => setSelectedUserId(null)}
                          >
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
                    rowKey={(user) => getUserId(user) || getEmployeeId(user)}
                    loading={usersLoading}
                    onRow={(user) => ({
                      onClick: () => setSelectedUserId(getUserId(user)),
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
        onCreated={(id) => {
          setDrawerOpen(false);
          refetchInstances();
          navigate(`${employeesBasePath}/employees/${id}`);
        }}
        users={users}
        onViewInstance={(id) => {
          setDrawerOpen(false);
          navigate(`${employeesBasePath}/employees/${id}`);
        }}
      />

      <EmployeeFormDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(undefined)}
        onCreated={() => {
          setSelectedUserId(undefined);
          refetchUsers();
        }}
      />

      <BulkImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          refetchUsers();
        }}
        config={importConfig}
        onSubmit={handleBulkImport}
      />
    </div>
  );
};

export default Employees;