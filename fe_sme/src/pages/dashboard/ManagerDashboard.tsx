import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Card,
  DatePicker,
  Empty,
  Progress,
  Select,
  Skeleton,
  Table,
  Tag,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Gauge,
  ListChecks,
  Users,
} from "lucide-react";

import { useUserStore } from "@/stores/user.store";
import {
  apiListInstances,
  apiListTasks,
} from "@/api/onboarding/onboarding.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";
import { AppRouters } from "@/constants/router";
import { useLocale } from "@/i18n";

type UserListItem = {
  userId?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
};

type TrendItem = {
  label: string;
  created: number;
  completed: number;
  cancelled: number;
};

type StatusItem = {
  status: string;
  value: number;
};

type Tone = "teal" | "emerald" | "amber" | "rose" | "indigo" | "slate" | "sky";

const CHART_COLORS = ["#2563eb", "#0f766e", "#f59e0b", "#ef4444", "#8b5cf6"];

const DATE_PRESETS = [
  {
    label: "dashboard.manager.date_preset.this_month",
    fallback: "Tháng này",
    getValue: (): [Dayjs, Dayjs] => [dayjs().startOf("month"), dayjs()],
  },
  {
    label: "dashboard.manager.date_preset.last_month",
    fallback: "Tháng trước",
    getValue: (): [Dayjs, Dayjs] => [
      dayjs().subtract(1, "month").startOf("month"),
      dayjs().subtract(1, "month").endOf("month"),
    ],
  },
  {
    label: "dashboard.manager.date_preset.3_months",
    fallback: "3 tháng gần đây",
    getValue: (): [Dayjs, Dayjs] => [dayjs().subtract(3, "month"), dayjs()],
  },
  {
    label: "dashboard.manager.date_preset.6_months",
    fallback: "6 tháng gần đây",
    getValue: (): [Dayjs, Dayjs] => [dayjs().subtract(6, "month"), dayjs()],
  },
  {
    label: "dashboard.manager.date_preset.this_year",
    fallback: "Năm nay",
    getValue: (): [Dayjs, Dayjs] => [dayjs().startOf("year"), dayjs()],
  },
] as const;

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function getAnyString(obj: unknown, keys: string[]): string | undefined {
  const record = toRecord(obj);

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return undefined;
}

function getAnyNumber(obj: unknown, keys: string[], fallback = 0): number {
  const record = toRecord(obj);

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function normalizePercent(value: unknown, fallback = 0): number {
  const raw = Number(value);
  const safe = Number.isFinite(raw) ? raw : fallback;
  const pct = safe > 0 && safe <= 1 ? safe * 100 : safe;

  return Math.max(0, Math.min(100, Math.round(pct)));
}

function upper(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
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

function normalizeUserListResponse(res: unknown): UserListItem[] {
  if (Array.isArray(res)) return res as UserListItem[];

  const raw = toRecord(res);

  if (Array.isArray(raw.users)) return raw.users as UserListItem[];
  if (Array.isArray(raw.items)) return raw.items as UserListItem[];
  if (Array.isArray(raw.data)) return raw.data as UserListItem[];

  return [];
}

function getCurrentUserId(user: unknown) {
  return getAnyString(user, ["userId", "id", "operatorId"]);
}

function getCurrentUserName(user: unknown) {
  return getAnyString(user, ["fullName", "name", "username", "email"]);
}

function getEmployeeUserId(inst: OnboardingInstance) {
  return getAnyString(inst, [
    "employeeUserId",
    "employeeId",
    "userId",
    "employee_user_id",
  ]);
}

function getEmployeeNameFromInstance(inst: OnboardingInstance) {
  return getAnyString(inst, [
    "employeeName",
    "employeeFullName",
    "fullName",
    "name",
  ]);
}

function getManagerId(inst: OnboardingInstance) {
  return getAnyString(inst, ["managerUserId", "managerId", "manager_id"]);
}

function getManagerName(inst: OnboardingInstance) {
  return getAnyString(inst, ["managerName", "managerFullName"]);
}

function getDepartmentName(inst: OnboardingInstance) {
  return getAnyString(inst, ["departmentName", "employeeDepartmentName"]);
}

function getStartDate(inst: OnboardingInstance) {
  return getAnyString(inst, ["startDate", "startedAt", "createdAt"]);
}

function getDueDate(inst: OnboardingInstance) {
  return getAnyString(inst, [
    "dueDate",
    "deadline",
    "targetDate",
    "expectedEndDate",
  ]);
}

function getProgress(inst: OnboardingInstance) {
  return normalizePercent(
    getAnyNumber(inst, ["progress", "progressPercent"], 0),
  );
}

function getTaskId(task: OnboardingTask) {
  return (
    getAnyString(task, ["id", "taskId", "taskInstanceId"]) ??
    `${getTaskTitle(task)}-${getTaskDueDate(task) ?? "no-due"}`
  );
}

function getTaskTitle(task: OnboardingTask) {
  return getAnyString(task, ["title", "taskName", "name"]) ?? "—";
}

function getTaskStatus(task: OnboardingTask) {
  return getAnyString(task, ["status", "taskStatus"]) ?? "PENDING";
}

function getTaskDueDate(task: OnboardingTask) {
  return getAnyString(task, ["dueDate", "deadline", "scheduledEndAt"]);
}

function isTaskCompleted(task: OnboardingTask) {
  const status = upper(getTaskStatus(task));
  return status === "DONE" || status === "COMPLETED";
}

function isTaskOverdue(task: OnboardingTask) {
  if (isTaskCompleted(task)) return false;

  const dueDate = getTaskDueDate(task);

  if (!dueDate) return false;

  return dayjs(dueDate).isBefore(dayjs(), "day");
}

function isTaskDueSoon(task: OnboardingTask) {
  if (isTaskCompleted(task)) return false;

  const dueDate = getTaskDueDate(task);

  if (!dueDate) return false;

  const due = dayjs(dueDate);

  return (
    due.isSame(dayjs(), "day") ||
    (due.isAfter(dayjs(), "day") && due.diff(dayjs(), "day") <= 7)
  );
}

function isInstanceOverdue(inst: OnboardingInstance) {
  const status = upper(inst.status);

  if (status === "OVERDUE" || status === "RISK") return true;

  if (
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "CANCELED"
  ) {
    return false;
  }

  const dueDate = getDueDate(inst);

  if (!dueDate) return false;

  return dayjs(dueDate).isBefore(dayjs(), "day");
}

function isInstanceDueSoon(inst: OnboardingInstance) {
  const status = upper(inst.status);

  if (
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "CANCELED"
  ) {
    return false;
  }

  const dueDate = getDueDate(inst);

  if (!dueDate) return false;

  const due = dayjs(dueDate);

  return (
    due.isSame(dayjs(), "day") ||
    (due.isAfter(dayjs(), "day") && due.diff(dayjs(), "day") <= 7)
  );
}

function instanceStatusColor(status?: string) {
  switch (upper(status)) {
    case "ACTIVE":
      return "blue";
    case "COMPLETED":
      return "green";
    case "CANCELLED":
    case "CANCELED":
      return "red";
    case "OVERDUE":
    case "RISK":
      return "volcano";
    case "DRAFT":
    default:
      return "default";
  }
}

function taskStatusColor(task: OnboardingTask) {
  if (isTaskCompleted(task)) return "green";
  if (isTaskOverdue(task)) return "red";
  if (isTaskDueSoon(task)) return "gold";

  return "blue";
}

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

function useTasksForInstanceQuery(instanceId?: string) {
  return useQuery({
    queryKey: ["manager-tasks", instanceId ?? ""],
    queryFn: () =>
      apiListTasks(instanceId ?? "", {
        size: 50,
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

function useUserDirectoryQuery(enabled = true) {
  return useQuery({
    queryKey: ["manager-user-directory"],
    queryFn: () => apiSearchUsers(),
    enabled,
    select: normalizeUserListResponse,
  });
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  tone: Tone;
}) {
  const toneClass: Record<Tone, string> = {
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    indigo: "bg-indigo-50 text-indigo-700",
    slate: "bg-slate-50 text-slate-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <Card
      size="small"
      className="overflow-hidden border border-stroke bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${toneClass[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

function ActionItem({
  icon,
  title,
  value,
  tone,
  to,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  tone: "red" | "amber" | "blue" | "slate";
  to?: string;
}) {
  const toneClass = {
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  }[tone];

  const content = (
    <div
      className={`flex items-center justify-between rounded-xl border px-3 py-3 ${toneClass}`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-white/70 p-2">{icon}</div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tabular-nums">{value}</span>
        {to && <ArrowRight className="h-4 w-4" />}
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

function BarValueLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
}) {
  const { x = 0, y = 0, width = 0, value = 0 } = props;

  if (!value) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 4}
      textAnchor="middle"
      fontSize={10}
      fill="#6b7280"
    >
      {value}
    </text>
  );
}

export default function ManagerDashboard() {
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const formatMsg = (
    key: string,
    fallback: string,
    params: Record<string, string | number>,
  ) => {
    let text = tr(key, fallback);

    Object.entries(params).forEach(([k, v]) => {
      text = text.replaceAll(`{${k}}`, String(v));
    });

    return text;
  };

  const currentUserId = getCurrentUserId(currentUser);
  const currentUserName = getCurrentUserName(currentUser);

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const [activePreset, setActivePreset] = useState<string>(
    "dashboard.manager.date_preset.this_month",
  );

  const [statusFilter, setStatusFilter] = useState<string>("");

  const startDate = dateRange[0]?.format("YYYY-MM-DD");
  const endDate = dateRange[1]?.format("YYYY-MM-DD");
  const hasDateRange = Boolean(startDate && endDate);

  function applyPreset(label: string, getValue: () => [Dayjs, Dayjs]) {
    setActivePreset(label);
    setDateRange(getValue());
  }

  const { data: instances = [], isLoading: instancesLoading } =
    useInstancesQuery(true);

  const { data: userDirectory = [] } = useUserDirectoryQuery(true);

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();

    userDirectory.forEach((user) => {
      const userId = user.userId ?? user.id;
      const displayName = user.fullName ?? user.name ?? user.email;

      if (userId && displayName) {
        map.set(userId, displayName);
      }
    });

    return map;
  }, [userDirectory]);

  const resolveEmployeeName = (inst: OnboardingInstance) => {
    const nameFromInstance = getEmployeeNameFromInstance(inst);
    if (nameFromInstance) return nameFromInstance;

    const employeeUserId = getEmployeeUserId(inst);

    if (employeeUserId && userNameById.has(employeeUserId)) {
      return userNameById.get(employeeUserId)!;
    }

    return employeeUserId ?? "—";
  };

  const hasManagerField = useMemo(
    () =>
      instances.some((inst) => {
        return Boolean(getManagerId(inst) || getManagerName(inst));
      }),
    [instances],
  );

  const teamInstances = useMemo(() => {
    return instances.filter((inst) => {
      if (!hasManagerField) return true;

      const managerId = getManagerId(inst);
      const managerName = getManagerName(inst);

      if (managerId && currentUserId) {
        return managerId === currentUserId;
      }

      if (managerName && currentUserName) {
        return (
          managerName.trim().toLowerCase() ===
          currentUserName.trim().toLowerCase()
        );
      }

      return false;
    });
  }, [instances, hasManagerField, currentUserId, currentUserName]);

  const filteredInstances = useMemo(() => {
    return teamInstances.filter((inst) => {
      if (statusFilter && upper(inst.status) !== statusFilter) {
        return false;
      }

      return inRange(parseDate(getStartDate(inst)), startDate, endDate);
    });
  }, [teamInstances, statusFilter, startDate, endDate]);

  const latestInstance = useMemo(() => {
    return [...filteredInstances].sort((a, b) => {
      const aActive = upper(a.status) === "ACTIVE" ? 0 : 1;
      const bActive = upper(b.status) === "ACTIVE" ? 0 : 1;

      if (aActive !== bActive) return aActive - bActive;

      return (getStartDate(b) ?? "").localeCompare(getStartDate(a) ?? "");
    })[0];
  }, [filteredInstances]);

  const { data: tasks = [], isLoading: tasksLoading } =
    useTasksForInstanceQuery(latestInstance?.id);

  const {
    activeCount,
    completedCount,
    cancelledCount,
    riskCount,
    averageProgress,
    overdueInstances,
    dueSoonInstances,
    lowProgressInstances,
    trendData,
    statusData,
    attentionInstances,
    recentInstances,
  } = useMemo(() => {
    let active = 0;
    let completed = 0;
    let cancelled = 0;
    let totalProgress = 0;

    const overdue: OnboardingInstance[] = [];
    const dueSoon: OnboardingInstance[] = [];
    const lowProgress: OnboardingInstance[] = [];

    const trendMap = new Map<
      string,
      { created: number; completed: number; cancelled: number }
    >();

    const statusMap = new Map<string, number>();

    for (const inst of filteredInstances) {
      const status = upper(inst.status);
      const progress = getProgress(inst);
      const start = parseDate(getStartDate(inst));
      const bucket = start ? dayjs(start).format("MM/YYYY") : "—";

      totalProgress += progress;

      const trend = trendMap.get(bucket) ?? {
        created: 0,
        completed: 0,
        cancelled: 0,
      };

      trend.created += 1;

      if (status === "COMPLETED") trend.completed += 1;
      if (status === "CANCELLED" || status === "CANCELED") trend.cancelled += 1;

      trendMap.set(bucket, trend);

      statusMap.set(
        status || "UNKNOWN",
        (statusMap.get(status || "UNKNOWN") ?? 0) + 1,
      );

      if (status === "ACTIVE") active += 1;
      else if (status === "COMPLETED") completed += 1;
      else if (status === "CANCELLED" || status === "CANCELED") cancelled += 1;

      if (isInstanceOverdue(inst)) overdue.push(inst);
      if (isInstanceDueSoon(inst)) dueSoon.push(inst);
      if (status === "ACTIVE" && progress < 30) lowProgress.push(inst);
    }

    const attentionMap = new Map<string, OnboardingInstance>();

    [...overdue, ...dueSoon, ...lowProgress].forEach((item) => {
      if (item.id) attentionMap.set(item.id, item);
    });

    const attention = Array.from(attentionMap.values())
      .sort((a, b) => {
        const aOverdue = isInstanceOverdue(a) ? 0 : 1;
        const bOverdue = isInstanceOverdue(b) ? 0 : 1;

        if (aOverdue !== bOverdue) return aOverdue - bOverdue;

        return getProgress(a) - getProgress(b);
      })
      .slice(0, 8);

    const trendItems: TrendItem[] = Array.from(trendMap.entries())
      .map(([label, value]) => ({
        label,
        created: value.created,
        completed: value.completed,
        cancelled: value.cancelled,
      }))
      .sort((a, b) => {
        const [am, ay] = a.label.split("/").map(Number);
        const [bm, by] = b.label.split("/").map(Number);

        return ay - by || am - bm;
      });

    const statuses: StatusItem[] = Array.from(statusMap.entries()).map(
      ([status, value]) => ({
        status,
        value,
      }),
    );

    return {
      activeCount: active,
      completedCount: completed,
      cancelledCount: cancelled,
      riskCount: attention.length,
      averageProgress:
        filteredInstances.length > 0
          ? Math.round(totalProgress / filteredInstances.length)
          : 0,
      overdueInstances: overdue,
      dueSoonInstances: dueSoon,
      lowProgressInstances: lowProgress,
      trendData: trendItems,
      statusData: statuses,
      attentionInstances: attention,
      recentInstances: [...filteredInstances]
        .sort((a, b) =>
          (getStartDate(b) ?? "").localeCompare(getStartDate(a) ?? ""),
        )
        .slice(0, 8),
    };
  }, [filteredInstances]);

  const pendingTasks = useMemo(
    () => tasks.filter((task) => !isTaskCompleted(task)),
    [tasks],
  );

  const overdueTasks = useMemo(
    () => tasks.filter((task) => isTaskOverdue(task)),
    [tasks],
  );

  const taskCompletionRate =
    tasks.length > 0
      ? Math.round(((tasks.length - pendingTasks.length) / tasks.length) * 100)
      : 0;

  const kpis = [
    {
      label: tr(
        "dashboard.manager.kpi.active_onboarding",
        "Thành viên đang onboarding",
      ),
      value: String(activeCount),
      sub: formatMsg(
        "dashboard.manager.kpi.records_in_period",
        "{count} hồ sơ trong kỳ",
        { count: filteredInstances.length },
      ),
      icon: <Users className="h-4 w-4" />,
      tone: "teal" as const,
    },
    {
      label: tr("dashboard.manager.kpi.completed", "Hoàn thành trong kỳ"),
      value: String(completedCount),
      sub: formatMsg(
        "dashboard.manager.kpi.cancelled",
        "{count} hồ sơ đã huỷ",
        {
          count: cancelledCount,
        },
      ),
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: "emerald" as const,
    },
    {
      label: tr("dashboard.manager.kpi.pending_tasks", "Task cần xử lý"),
      value: String(pendingTasks.length),
      sub: latestInstance
        ? tr("dashboard.manager.kpi.from_latest", "Từ onboarding mới nhất")
        : tr("dashboard.manager.kpi.no_selected", "Chưa có onboarding"),
      icon: <ClipboardCheck className="h-4 w-4" />,
      tone: "amber" as const,
    },
    {
      label: tr("dashboard.manager.kpi.avg_progress", "Tiến độ trung bình"),
      value: `${averageProgress}%`,
      sub: tr(
        "dashboard.manager.kpi.team_progress",
        "Theo nhóm đang phụ trách",
      ),
      icon: <Gauge className="h-4 w-4" />,
      tone: "indigo" as const,
    },
    {
      label: tr("dashboard.manager.kpi.need_attention", "Cần chú ý"),
      value: String(riskCount),
      sub: tr(
        "dashboard.manager.kpi.attention_desc",
        "Quá hạn / sắp hạn / tiến độ thấp",
      ),
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: riskCount > 0 ? ("rose" as const) : ("slate" as const),
    },
  ];

  const recentColumns = [
    {
      title: tr("dashboard.manager.table.employee", "Nhân viên"),
      key: "employee",
      render: (record: OnboardingInstance) => (
        <div>
          <Link
            className="font-medium text-blue-600 hover:underline"
            to={`${AppRouters.ONBOARDING_EMPLOYEES}/${record.id}`}
          >
            {resolveEmployeeName(record)}
          </Link>
          <p className="text-xs text-muted">
            {getDepartmentName(record) || "—"}
          </p>
        </div>
      ),
    },
    {
      title: tr("dashboard.manager.table.status", "Trạng thái"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={instanceStatusColor(status)}>{status || "—"}</Tag>
      ),
    },
    {
      title: tr("dashboard.manager.table.progress", "Tiến độ"),
      key: "progress",
      width: 160,
      render: (record: OnboardingInstance) => (
        <Progress percent={getProgress(record)} size="small" />
      ),
    },
    {
      title: tr("dashboard.manager.table.start_date", "Ngày bắt đầu"),
      key: "startDate",
      width: 140,
      render: (record: OnboardingInstance) => {
        const start = getStartDate(record);
        return start ? dayjs(start).format("DD/MM/YYYY") : "—";
      },
    },
  ];

  const taskColumns = [
    {
      title: tr("dashboard.manager.table.task", "Task"),
      key: "task",
      render: (record: OnboardingTask) => (
        <div>
          <p className="font-medium text-ink">{getTaskTitle(record)}</p>
          {getTaskDueDate(record) && (
            <p className="text-xs text-muted">
              {tr("dashboard.manager.table.due_date", "Hạn")}:{" "}
              {dayjs(getTaskDueDate(record)).format("DD/MM/YYYY")}
            </p>
          )}
        </div>
      ),
    },
    {
      title: tr("dashboard.manager.table.status", "Trạng thái"),
      key: "status",
      width: 130,
      render: (record: OnboardingTask) => (
        <Tag color={taskStatusColor(record)}>{getTaskStatus(record)}</Tag>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink">
          {tr("dashboard.manager.title", "Dashboard Manager")}
        </h1>
        <p className="text-sm text-muted">
          {formatMsg(
            "dashboard.manager.subtitle",
            "Xin chào, {name}! Đây là tổng quan nhóm của bạn.",
            { name: currentUserName ?? "Manager" },
          )}
        </p>
      </div>

      <Card className="border border-stroke bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {tr("dashboard.manager.filter.period", "Khoảng thời gian")}
            </p>
            <div className="flex items-center gap-2">
              <Select
                className="w-40"
                value={activePreset}
                onChange={(value) => {
                  const preset = DATE_PRESETS.find((p) => p.label === value);

                  if (preset) {
                    applyPreset(preset.label, preset.getValue);
                  } else {
                    setActivePreset("dashboard.manager.date_preset.custom");
                  }
                }}
                options={[
                  ...DATE_PRESETS.map((p) => ({
                    value: p.label,
                    label: tr(p.label, p.fallback),
                  })),
                  {
                    value: "dashboard.manager.date_preset.custom",
                    label: tr(
                      "dashboard.manager.date_preset.custom",
                      "Tuỳ chỉnh",
                    ),
                  },
                ]}
              />

              <DatePicker.RangePicker
                value={dateRange}
                format="DD/MM/YYYY"
                onChange={(value) => {
                  setDateRange(value ?? [null, null]);
                  setActivePreset("dashboard.manager.date_preset.custom");
                }}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {tr("dashboard.manager.filter.status", "Trạng thái")}
            </p>
            <Select
              className="w-44"
              value={statusFilter || undefined}
              allowClear
              onChange={(value) => setStatusFilter(value ?? "")}
              options={[
                {
                  value: "DRAFT",
                  label: tr("dashboard.manager.status.draft", "Nháp"),
                },
                {
                  value: "ACTIVE",
                  label: tr(
                    "dashboard.manager.status.active",
                    "Đang onboarding",
                  ),
                },
                {
                  value: "COMPLETED",
                  label: tr("dashboard.manager.status.completed", "Hoàn tất"),
                },
                {
                  value: "CANCELLED",
                  label: tr("dashboard.manager.status.cancelled", "Đã huỷ"),
                },
              ]}
              placeholder={tr(
                "dashboard.manager.filter.all_status",
                "Tất cả trạng thái",
              )}
            />
          </div>
        </div>

        {!hasDateRange && (
          <Alert
            className="mt-3"
            type="info"
            showIcon
            message={tr(
              "dashboard.manager.alert.select_period",
              "Chọn khoảng thời gian để xem thống kê nhóm.",
            )}
          />
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {instancesLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <Card
                key={`kpi-skeleton-${i}`}
                size="small"
                className="border border-stroke bg-white shadow-sm"
              >
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </Card>
            ))
          : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      <Card className="border border-stroke bg-white shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink">
            {tr(
              "dashboard.manager.section.action_center",
              "Trung tâm xử lý của Manager",
            )}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.manager.section.action_center_desc",
              "Các vấn đề cần manager theo dõi và xử lý trong nhóm.",
            )}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActionItem
            icon={<AlertTriangle className="h-4 w-4" />}
            title={tr(
              "dashboard.manager.action.overdue_onboarding",
              "Onboarding quá hạn/rủi ro",
            )}
            value={overdueInstances.length}
            tone={overdueInstances.length > 0 ? "red" : "slate"}
            to={AppRouters.ONBOARDING_EMPLOYEES}
          />

          <ActionItem
            icon={<CalendarClock className="h-4 w-4" />}
            title={tr(
              "dashboard.manager.action.due_soon_onboarding",
              "Onboarding sắp đến hạn",
            )}
            value={dueSoonInstances.length}
            tone={dueSoonInstances.length > 0 ? "amber" : "slate"}
            to={AppRouters.ONBOARDING_EMPLOYEES}
          />

          <ActionItem
            icon={<Gauge className="h-4 w-4" />}
            title={tr("dashboard.manager.action.low_progress", "Tiến độ thấp")}
            value={lowProgressInstances.length}
            tone={lowProgressInstances.length > 0 ? "amber" : "slate"}
            to={AppRouters.ONBOARDING_EMPLOYEES}
          />

          <ActionItem
            icon={<ListChecks className="h-4 w-4" />}
            title={tr("dashboard.manager.action.overdue_tasks", "Task quá hạn")}
            value={overdueTasks.length}
            tone={overdueTasks.length > 0 ? "red" : "slate"}
          />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr(
              "dashboard.manager.section.status_distribution",
              "Trạng thái onboarding nhóm",
            )}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.manager.section.status_distribution_desc",
              "Phân bổ trạng thái onboarding của các nhân viên bạn đang phụ trách.",
            )}
          </p>

          <div className="mt-6 h-64">
            {instancesLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : statusData.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.manager.empty.no_data",
                  "Không có dữ liệu",
                )}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    name={tr("dashboard.manager.chart.count", "Số lượng")}
                    radius={[6, 6, 0, 0]}
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`status-cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                    <LabelList
                      content={(props: any) => <BarValueLabel {...props} />}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr("dashboard.manager.section.trend", "Xu hướng onboarding nhóm")}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.manager.section.trend_desc",
              "Theo dõi số onboarding mới, hoàn tất và huỷ theo thời gian.",
            )}
          </p>

          <div className="mt-6 h-64">
            {instancesLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : trendData.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.manager.empty.no_data",
                  "Không có dữ liệu",
                )}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    name={tr("dashboard.manager.chart.created", "Tạo mới")}
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name={tr("dashboard.manager.chart.completed", "Hoàn tất")}
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cancelled"
                    name={tr("dashboard.manager.chart.cancelled", "Đã huỷ")}
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr(
              "dashboard.manager.section.team_list",
              "Danh sách onboarding nhóm",
            )}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.manager.section.team_list_desc",
              "Các nhân viên đang thuộc phạm vi quản lý của bạn.",
            )}
          </p>

          <div className="mt-4">
            <Table
              dataSource={recentInstances}
              columns={recentColumns}
              rowKey="id"
              loading={instancesLoading}
              pagination={false}
              scroll={{ x: 760 }}
              locale={{
                emptyText: tr(
                  "dashboard.manager.empty.no_team_onboarding",
                  "Không có onboarding trong khoảng thời gian này.",
                ),
              }}
            />
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr("dashboard.manager.section.tasks", "Task cần xử lý")}
          </h2>
          <p className="text-sm text-muted">
            {latestInstance
              ? formatMsg(
                  "dashboard.manager.section.tasks_desc",
                  "Task của onboarding mới nhất: {name}",
                  { name: resolveEmployeeName(latestInstance) },
                )
              : tr(
                  "dashboard.manager.section.tasks_desc_empty",
                  "Chưa có onboarding để hiển thị task.",
                )}
          </p>

          <div className="mt-4">
            {!latestInstance ? (
              <Empty
                description={tr(
                  "dashboard.manager.empty.no_task_source",
                  "Không có onboarding để hiển thị task",
                )}
              />
            ) : tasksLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : pendingTasks.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.manager.empty.no_pending_task",
                  "Không có task nào đang chờ xử lý",
                )}
              />
            ) : (
              <Table
                dataSource={pendingTasks}
                columns={taskColumns}
                rowKey={(record) => getTaskId(record)}
                pagination={false}
                scroll={{ x: 520 }}
              />
            )}

            {latestInstance && tasks.length > 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">
                    {tr(
                      "dashboard.manager.section.task_completion",
                      "Tỷ lệ hoàn thành task",
                    )}
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {taskCompletionRate}%
                  </span>
                </div>
                <Progress percent={taskCompletionRate} />
                <p className="mt-2 text-xs text-muted">
                  {formatMsg(
                    "dashboard.manager.section.task_completion_desc",
                    "{done}/{total} task đã hoàn thành",
                    {
                      done: tasks.length - pendingTasks.length,
                      total: tasks.length,
                    },
                  )}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="border border-orange-200 bg-orange-50/30 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <h2 className="text-base font-semibold text-ink">
            {tr("dashboard.manager.section.attention", "Nhân viên cần chú ý")}
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          {tr(
            "dashboard.manager.section.attention_desc",
            "Ưu tiên các onboarding quá hạn, sắp đến hạn hoặc có tiến độ thấp.",
          )}
        </p>

        <div className="mt-4 space-y-2">
          {instancesLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} title={false} />
          ) : attentionInstances.length === 0 ? (
            <Empty
              description={tr(
                "dashboard.manager.empty.no_attention",
                "Không có nhân viên cần chú ý trong kỳ đã chọn",
              )}
            />
          ) : (
            attentionInstances.map((inst) => (
              <Link
                key={inst.id}
                to={`${AppRouters.ONBOARDING_EMPLOYEES}/${inst.id}`}
              >
                <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-white px-3 py-2.5 transition-colors hover:bg-orange-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {resolveEmployeeName(inst)}
                    </p>
                    <p className="text-xs text-muted">
                      {getDepartmentName(inst) || "—"}
                    </p>
                    <Progress
                      className="mt-1"
                      percent={getProgress(inst)}
                      size="small"
                    />
                  </div>

                  <div className="text-right">
                    {isInstanceOverdue(inst) ? (
                      <Tag color="red">
                        {tr("dashboard.manager.reason.overdue", "Quá hạn")}
                      </Tag>
                    ) : isInstanceDueSoon(inst) ? (
                      <Tag color="gold">
                        {tr("dashboard.manager.reason.due_soon", "Sắp đến hạn")}
                      </Tag>
                    ) : (
                      <Tag color="orange">
                        {tr(
                          "dashboard.manager.reason.low_progress",
                          "Tiến độ thấp",
                        )}
                      </Tag>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
