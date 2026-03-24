import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Badge, Card, DatePicker, Skeleton, Tag } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { useUserStore } from "@/stores/user.store";
import { apiGetCompanyOnboardingByDepartment } from "@/api/admin/admin.api";
import {
  apiListInstances,
  apiListTasks,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type DashboardDepartmentStat = {
  departmentId: string;
  departmentName: string;
  totalTasks: number;
  completedTasks: number;
};

// ── Mock data — replace with com.sme.analytics.manager.team.summary ──────────

const MOCK_AT_RISK = [
  {
    name: "Nguyễn Văn A",
    role: "Software Engineer",
    daysOverdue: 5,
    taskCount: 3,
  },
  {
    name: "Trần Thị B",
    role: "Business Analyst",
    daysOverdue: 3,
    taskCount: 1,
  },
];

// ── Query hooks ────────────────────────────────────────────────────────────────

function useInstancesQuery(enabled = true) {
  return useQuery({
    queryKey: ["manager-instances"],
    queryFn: () => apiListInstances({}),
    enabled,
    select: (res: unknown) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
  });
}

function useByDepartmentQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "manager-by-dept",
      companyId ?? "",
      startDate ?? "",
      endDate ?? "",
    ],
    queryFn: () =>
      apiGetCompanyOnboardingByDepartment({
        companyId: companyId ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      }),
    enabled:
      enabled && Boolean(companyId) && Boolean(startDate) && Boolean(endDate),
  });
}

function useTasksForInstanceQuery(instanceId?: string) {
  return useQuery({
    queryKey: ["manager-tasks", instanceId ?? ""],
    queryFn: () =>
      apiListTasks(instanceId ?? "", {
        size: 20,
        sortBy: "due_date",
        sortOrder: "ASC",
      }),
    enabled: Boolean(instanceId),
    select: (res: unknown) =>
      extractList(res, "tasks", "items", "list").map(
        mapTask,
      ) as OnboardingTask[],
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone,
  isMock,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone: "teal" | "emerald" | "amber" | "rose";
  isMock?: boolean;
}) {
  const toneClass: Record<typeof tone, string> = {
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <Card
      size="small"
      className="overflow-hidden border border-stroke bg-white shadow-sm transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
          {isMock && (
            <span className="mt-1 inline-block text-[10px] text-orange-400">
              ⏳ Chờ API BE
            </span>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${toneClass[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inRange(date: Date | null, start?: string, end?: string) {
  if (!date) return false;
  if (!start || !end) return true;
  return (
    date >= new Date(`${start}T00:00:00`) && date <= new Date(`${end}T23:59:59`)
  );
}

function instanceStatusColor(status?: string) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "blue";
    case "COMPLETED":
      return "green";
    case "CANCELLED":
      return "red";
    default:
      return "default";
  }
}

function taskStatusColor(status?: string) {
  switch (status) {
    case "Done":
      return "success";
    case "In Progress":
      return "processing";
    case "Pending":
    default:
      return "warning";
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const currentTenant = useUserStore((s) => s.currentTenant);
  const currentUser = useUserStore((s) => s.currentUser);
  const companyId = currentTenant?.id ?? currentUser?.companyId ?? undefined;

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  const startDate = dateRange[0]?.format("YYYY-MM-DD");
  const endDate = dateRange[1]?.format("YYYY-MM-DD");
  const hasDateRange = Boolean(startDate && endDate);
  const analyticsEnabled = Boolean(companyId) && hasDateRange;

  const { data: instances = [], isLoading: instancesLoading } =
    useInstancesQuery(true);

  const filteredInstances = useMemo(
    () =>
      instances.filter((inst) =>
        inRange(parseDate(inst.startDate), startDate, endDate),
      ),
    [instances, startDate, endDate],
  );

  const latestInstance = filteredInstances
    .slice()
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))[0];

  const { data: tasks = [], isLoading: tasksLoading } =
    useTasksForInstanceQuery(latestInstance?.id);

  const { data: byDepartmentRaw, isLoading: byDepartmentLoading } =
    useByDepartmentQuery(companyId, startDate, endDate, analyticsEnabled);

  const byDepartment = (byDepartmentRaw ?? { departments: [] }) as {
    departments?: DashboardDepartmentStat[];
  };

  const activeCount = filteredInstances.filter(
    (i) => i.status === "ACTIVE",
  ).length;
  const completedCount = filteredInstances.filter(
    (i) => i.status === "COMPLETED",
  ).length;

  const pendingTasks = tasks.filter((t) => t.status !== "Done");
  const deptCompletionRate =
    byDepartment.departments && byDepartment.departments.length > 0
      ? Math.round(
          (byDepartment.departments.reduce(
            (acc, d) => acc + d.completedTasks,
            0,
          ) /
            Math.max(
              byDepartment.departments.reduce(
                (acc, d) => acc + d.totalTasks,
                0,
              ),
              1,
            )) *
            100,
        )
      : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Dashboard Manager</h1>
        <p className="text-sm text-muted">
          Xin chào, <span className="font-medium">{currentUser?.name}</span>!
          Đây là tổng quan nhóm của bạn.
        </p>
      </div>

      {/* Filter */}
      <Card className="border border-stroke bg-white shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              Khoảng thời gian
            </p>
            <DatePicker.RangePicker
              className="w-full"
              value={dateRange}
              format="DD/MM/YYYY"
              onChange={(value) => setDateRange(value ?? [null, null])}
            />
          </div>
        </div>
        {!hasDateRange && (
          <Alert
            className="mt-3"
            type="info"
            showIcon
            message="Chọn khoảng thời gian để xem thống kê phòng ban."
          />
        )}
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard
          label="Thành viên đang onboarding"
          value={String(activeCount)}
          sub="trong khoảng thời gian đã chọn"
          icon={<Users className="h-4 w-4" />}
          tone="teal"
        />
        <KpiCard
          label="Hoàn thành trong kỳ"
          value={String(completedCount)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="emerald"
        />
        <KpiCard
          label="Task chờ duyệt của tôi"
          value={String(pendingTasks.length)}
          sub="từ onboarding mới nhất"
          icon={<ClipboardCheck className="h-4 w-4" />}
          tone="amber"
        />
        <KpiCard
          label="Tỉ lệ hoàn thành phòng ban"
          value={
            deptCompletionRate !== null
              ? `${deptCompletionRate}%`
              : hasDateRange
                ? "—"
                : "Chọn ngày"
          }
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="teal"
        />
      </div>

      {/* Team Onboarding List + Tasks */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Team list */}
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            Danh sách onboarding nhóm
          </h2>
          <p className="text-sm text-muted">
            {hasDateRange
              ? "Trong khoảng thời gian đã chọn"
              : "Tất cả onboarding hiện tại"}
          </p>
          <div
            className="mt-4 space-y-2 overflow-y-auto"
            style={{ maxHeight: 340 }}>
            {instancesLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : filteredInstances.length === 0 ? (
              <p className="text-sm text-muted py-4">
                {hasDateRange
                  ? "Không có onboarding nào trong khoảng thời gian này."
                  : "Chọn thời gian hoặc chưa có dữ liệu."}
              </p>
            ) : (
              filteredInstances.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between rounded-lg border border-stroke/60 bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {inst.employeeId ?? "Không rõ"}
                    </p>
                    <p className="text-xs text-muted">
                      Bắt đầu{" "}
                      {inst.startDate
                        ? dayjs(inst.startDate).format("DD/MM/YYYY")
                        : "—"}
                    </p>
                  </div>
                  <Tag color={instanceStatusColor(inst.status)}>
                    {inst.status ?? "—"}
                  </Tag>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Tasks needing attention */}
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">Task cần xử lý</h2>
          <p className="text-sm text-muted">
            Task từ onboarding gần nhất được giao cho bạn
          </p>
          <div
            className="mt-4 space-y-2 overflow-y-auto"
            style={{ maxHeight: 340 }}>
            {!latestInstance ? (
              <p className="text-sm text-muted py-4">
                Không có onboarding nào để hiển thị task.
              </p>
            ) : tasksLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} title={false} />
            ) : pendingTasks.length === 0 ? (
              <p className="text-sm text-muted py-4">
                Không có task nào đang chờ xử lý. 🎉
              </p>
            ) : (
              pendingTasks.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-stroke/60 bg-slate-50 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {task.title ?? "Không có tiêu đề"}
                    </p>
                    {task.dueDate && (
                      <p className="mt-0.5 text-xs text-muted">
                        Hạn: {dayjs(task.dueDate).format("DD/MM/YYYY")}
                      </p>
                    )}
                  </div>
                  <Badge
                    status={
                      taskStatusColor(task.status) as
                        | "success"
                        | "processing"
                        | "warning"
                    }
                    text={
                      <span className="text-xs text-muted">{task.status}</span>
                    }
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Department chart */}
      {hasDateRange && (
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            Tiến độ theo phòng ban
          </h2>
          <p className="text-sm text-muted">
            Tổng task và task hoàn thành theo từng phòng ban
          </p>
          <div className="mt-6 h-72">
            {byDepartmentLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : (byDepartment.departments ?? []).length === 0 ? (
              <p className="text-sm text-muted">Không có dữ liệu phòng ban.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDepartment.departments ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departmentName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="totalTasks"
                    name="Tổng task"
                    fill="#60a5fa"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completedTasks"
                    name="Hoàn thành"
                    fill="#0f766e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      )}

      {/* At-Risk — mock data, awaiting com.sme.analytics.manager.team.summary */}
      <Card className="border border-orange-200 bg-orange-50/30 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <h2 className="text-base font-semibold text-ink">
            Nhân viên cần chú ý
          </h2>
          <span className="ml-auto rounded bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600">
            ⏳ Demo data — Chờ API BE
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Nhân viên có task quá hạn và chưa có tiến triển.
        </p>
        <div className="mt-4 space-y-2">
          {MOCK_AT_RISK.map((emp) => (
            <div
              key={emp.name}
              className="flex items-center justify-between rounded-lg border border-orange-200 bg-white px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-ink">{emp.name}</p>
                <p className="text-xs text-muted">{emp.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-red-500">
                  Quá hạn {emp.daysOverdue} ngày
                </p>
                <p className="text-xs text-muted">
                  {emp.taskCount} task chưa hoàn thành
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
