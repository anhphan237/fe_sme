import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
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
  ClipboardList,
  Clock,
  Gauge,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

import { useUserStore } from "@/stores/user.store";
import {
  apiGetCompanyOnboardingByDepartment,
  apiGetCompanyOnboardingFunnel,
  apiGetCompanyOnboardingSummary,
  apiGetCompanyOnboardingTrend,
  apiGetCompanyTaskCompletion,
} from "@/api/admin/admin.api";
import { apiListInstances } from "@/api/onboarding/onboarding.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance } from "@/utils/mappers/onboarding";
import { useUserNameMap } from "@/utils/resolvers/userResolver";
import type { OnboardingInstance } from "@/shared/types";
import { AppRouters } from "@/constants/router";
import { useLocale } from "@/i18n";
import type { CompanyOnboardingTrendGroupBy } from "@/interface/admin";

type DashboardSummary = {
  totalEmployees?: number;
  completedCount?: number;
  totalOnboardings?: number;
  activeOnboardings?: number;
  completedOnboardings?: number;
};

type DashboardFunnel = {
  stages?: Array<{ stage?: string; count?: number }>;
  activeCount?: number;
  completedCount?: number;
  cancelledCount?: number;
  otherCount?: number;
};

type DashboardTaskCompletion = {
  totalTasks?: number;
  completedTasks?: number;
  completionRate?: number;
};

type DashboardDepartmentStat = {
  departmentId: string;
  departmentName: string;
  totalTasks: number;
  completedTasks: number;
};

type UserListItem = {
  userId: string;
  fullName?: string;
  email?: string;
  status?: string;
  roles?: string[];
  departmentName?: string;
  departmentId?: string;
};

type TrendItem = {
  label: string;
  sortValue: number;
  order: number;
  created: number;
  active: number;
  completed: number;
  cancelled: number;
  risk: number;
};

type ManagerBreakdownItem = {
  managerId: string;
  managerName: string;
  total: number;
  active: number;
  completed: number;
  risk: number;
  avgProgress: number;
};

type Tone =
  | "teal"
  | "emerald"
  | "amber"
  | "indigo"
  | "violet"
  | "rose"
  | "sky"
  | "slate";

const FUNNEL_COLORS = ["#2563eb", "#0f766e", "#ef4444", "#94a3b8"];
const CHART_COLORS = ["#2563eb", "#0f766e", "#f59e0b", "#ef4444", "#8b5cf6"];

const DATE_PRESETS = [
  {
    label: "dashboard.hr.date_preset.this_month",
    fallback: "Tháng này",
    getValue: (): [Dayjs, Dayjs] => [dayjs().startOf("month"), dayjs()],
  },
  {
    label: "dashboard.hr.date_preset.last_month",
    fallback: "Tháng trước",
    getValue: (): [Dayjs, Dayjs] => [
      dayjs().subtract(1, "month").startOf("month"),
      dayjs().subtract(1, "month").endOf("month"),
    ],
  },
  {
    label: "dashboard.hr.date_preset.3_months",
    fallback: "3 tháng gần đây",
    getValue: (): [Dayjs, Dayjs] => [dayjs().subtract(3, "month"), dayjs()],
  },
  {
    label: "dashboard.hr.date_preset.6_months",
    fallback: "6 tháng gần đây",
    getValue: (): [Dayjs, Dayjs] => [dayjs().subtract(6, "month"), dayjs()],
  },
  {
    label: "dashboard.hr.date_preset.this_year",
    fallback: "Năm nay",
    getValue: (): [Dayjs, Dayjs] => [dayjs().startOf("year"), dayjs()],
  },
] as const;

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function pickNumber(
  source: Record<string, unknown>,
  keys: string[],
  fallback = 0,
): number {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return fallback;
}

function pickArray<T>(source: Record<string, unknown>, keys: string[]): T[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function normalizePercent(value: unknown, fallback = 0): number {
  const raw = toFiniteNumber(value, fallback);
  const pct = raw > 0 && raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function normalizeSummary(raw: unknown): DashboardSummary {
  const data = toRecord(raw);
  return {
    totalEmployees: pickNumber(data, ["totalEmployees", "employeeCount"]),
    completedCount: pickNumber(data, [
      "completedCount",
      "completedOnboardings",
    ]),
    totalOnboardings: pickNumber(data, ["totalOnboardings", "totalInstances"]),
    activeOnboardings: pickNumber(data, ["activeOnboardings", "activeCount"]),
    completedOnboardings: pickNumber(data, [
      "completedOnboardings",
      "completedCount",
    ]),
  };
}

function normalizeFunnel(raw: unknown): DashboardFunnel {
  const data = toRecord(raw);
  return {
    stages: pickArray<{ stage?: string; count?: number }>(data, ["stages"]),
    activeCount: pickNumber(data, ["activeCount", "activeOnboardings"]),
    completedCount: pickNumber(data, [
      "completedCount",
      "completedOnboardings",
    ]),
    cancelledCount: pickNumber(data, ["cancelledCount", "canceledCount"]),
    otherCount: pickNumber(data, ["otherCount", "draftCount"]),
  };
}

function normalizeTaskCompletion(raw: unknown): DashboardTaskCompletion {
  const data = toRecord(raw);
  return {
    totalTasks: pickNumber(data, ["totalTasks", "taskCount"]),
    completedTasks: pickNumber(data, ["completedTasks", "doneTasks"]),
    completionRate: normalizePercent(data.completionRate, 0),
  };
}

function normalizeByDepartment(raw: unknown): {
  departments: DashboardDepartmentStat[];
} {
  const data = toRecord(raw);

  const departments = pickArray<Record<string, unknown>>(data, [
    "departments",
    "items",
  ])
    .map((item) => ({
      departmentId: String(item.departmentId ?? item.id ?? ""),
      departmentName: String(item.departmentName ?? item.name ?? "—"),
      totalTasks: Math.max(0, toFiniteNumber(item.totalTasks, 0)),
      completedTasks: Math.max(0, toFiniteNumber(item.completedTasks, 0)),
    }))
    .filter((item) => item.departmentId);

  return { departments };
}

function unwrapGatewayData(value: unknown): unknown {
  const record = toRecord(value);

  return "data" in record && record.data !== undefined ? record.data : value;
}

function pickTrendItems(raw: unknown): Record<string, unknown>[] {
  const payload = unwrapGatewayData(raw);

  if (Array.isArray(payload)) return payload as Record<string, unknown>[];

  const data = toRecord(payload);

  return pickArray<Record<string, unknown>>(data, [
    "items",
    "data",
    "trends",
    "buckets",
    "list",
  ]);
}

function pickOptionalTrendNumber(
  source: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const value = source[key];

    if (value === undefined || value === null || value === "") continue;

    return Math.max(0, toFiniteNumber(value, 0));
  }

  return undefined;
}

function getTrendLabelSource(source: Record<string, unknown>) {
  const value =
    source.bucket ??
    source.label ??
    source.date ??
    source.period ??
    source.month ??
    source.week ??
    source.day;

  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function getTrendSortValue(value: string) {
  const text = value.trim();

  const yearMonth = /^(\d{4})-(\d{1,2})$/.exec(text);

  if (yearMonth) {
    return dayjs(
      `${yearMonth[1]}-${yearMonth[2].padStart(2, "0")}-01`,
    ).valueOf();
  }

  const monthYear = /^(\d{1,2})\/(\d{4})$/.exec(text);

  if (monthYear) {
    return dayjs(
      `${monthYear[2]}-${monthYear[1].padStart(2, "0")}-01`,
    ).valueOf();
  }

  const parsed = dayjs(text);

  return parsed.isValid() ? parsed.valueOf() : Number.NaN;
}

function formatTrendLabel(
  value: string,
  groupBy: CompanyOnboardingTrendGroupBy,
) {
  const text = value.trim();

  if (!text) return "—";

  const yearMonth = /^(\d{4})-(\d{1,2})$/.exec(text);
  const parsed = yearMonth
    ? dayjs(`${yearMonth[1]}-${yearMonth[2].padStart(2, "0")}-01`)
    : dayjs(text);

  if (!parsed.isValid()) return text;

  if (groupBy === "DAY") return parsed.format("DD/MM");
  if (groupBy === "MONTH") return parsed.format("MM/YYYY");
  if (groupBy === "YEAR") return parsed.format("YYYY");

  return text;
}

function normalizeTrend(
  raw: unknown,
  groupBy: CompanyOnboardingTrendGroupBy,
): TrendItem[] {
  return pickTrendItems(raw)
    .map((item, order) => {
      const labelSource = getTrendLabelSource(item);
      const created =
        pickOptionalTrendNumber(item, [
          "created",
          "createdCount",
          "new",
          "newCount",
          "newOnboardings",
        ]) ??
        pickOptionalTrendNumber(item, [
          "total",
          "totalCount",
          "totalInstances",
          "onboardingCount",
          "count",
        ]) ??
        0;

      return {
        label: formatTrendLabel(labelSource, groupBy),
        sortValue: getTrendSortValue(labelSource),
        order,
        created,
        active:
          pickOptionalTrendNumber(item, [
            "active",
            "activeCount",
            "activeOnboardings",
          ]) ?? 0,
        completed:
          pickOptionalTrendNumber(item, [
            "completed",
            "completedCount",
            "completedOnboardings",
          ]) ?? 0,
        cancelled:
          pickOptionalTrendNumber(item, [
            "cancelled",
            "cancelledCount",
            "canceled",
            "canceledCount",
            "cancelledOnboardings",
            "canceledOnboardings",
          ]) ?? 0,
        risk:
          pickOptionalTrendNumber(item, [
            "risk",
            "riskCount",
            "overdue",
            "overdueCount",
            "riskOnboardings",
            "overdueOnboardings",
          ]) ?? 0,
      };
    })
    .filter(
      (item) =>
        item.label &&
        item.label !== "—" &&
        item.created +
          item.active +
          item.completed +
          item.cancelled +
          item.risk >
          0,
    )
    .sort((a, b) => {
      if (Number.isFinite(a.sortValue) && Number.isFinite(b.sortValue)) {
        return a.sortValue - b.sortValue;
      }

      return a.order - b.order;
    });
}

function normalizeUserListResponse(res: unknown): UserListItem[] {
  if (Array.isArray(res)) return res as UserListItem[];

  const raw = toRecord(res);

  if (Array.isArray(raw.users)) return raw.users as UserListItem[];
  if (Array.isArray(raw.items)) return raw.items as UserListItem[];

  return [];
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

function upper(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

function getAnyString(obj: unknown, keys: string[]): string | undefined {
  const record = toRecord(obj);

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return undefined;
}

function getDepartmentId(inst: OnboardingInstance) {
  return getAnyString(inst, ["departmentId", "employeeDepartmentId"]);
}

function getDepartmentName(inst: OnboardingInstance) {
  return getAnyString(inst, ["departmentName", "employeeDepartmentName"]);
}

function getManagerId(inst: OnboardingInstance) {
  return getAnyString(inst, ["managerUserId", "managerId"]);
}

function getDueDate(inst: OnboardingInstance) {
  return getAnyString(inst, [
    "dueDate",
    "deadline",
    "targetDate",
    "expectedEndDate",
  ]);
}

function daysBetween(from?: string, to = dayjs()) {
  if (!from) return 0;

  const parsed = dayjs(from);

  if (!parsed.isValid()) return 0;

  return Math.max(0, to.diff(parsed, "day"));
}

function isInstanceOverdue(inst: OnboardingInstance) {
  const status = upper(inst.status);

  if (status === "OVERDUE" || status === "RISK") return true;

  const dueDate = getDueDate(inst);

  if (!dueDate || status === "COMPLETED" || status === "CANCELLED") {
    return false;
  }

  return dayjs(dueDate).isBefore(dayjs(), "day");
}

function isInstanceDueSoon(inst: OnboardingInstance) {
  const status = upper(inst.status);
  const dueDate = getDueDate(inst);

  if (!dueDate || status === "COMPLETED" || status === "CANCELLED") {
    return false;
  }

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

function getTrendGroupBy(
  startDate?: string,
  endDate?: string,
): CompanyOnboardingTrendGroupBy {
  if (!startDate || !endDate) return "MONTH";

  const days = dayjs(endDate).diff(dayjs(startDate), "day");

  if (!Number.isFinite(days)) return "MONTH";
  if (days <= 31) return "DAY";
  if (days <= 120) return "WEEK";

  return "MONTH";
}

function useInstancesQuery(filters?: { status?: string }, enabled = true) {
  return useQuery({
    queryKey: ["hr-instances", filters?.status ?? ""],
    queryFn: () => apiListInstances(filters),
    enabled,
    select: (res: unknown) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
  });
}

function useTrendQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  groupBy: CompanyOnboardingTrendGroupBy = "MONTH",
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "hr-onboarding-trend",
      companyId ?? "",
      startDate ?? "",
      endDate ?? "",
      groupBy,
    ],
    queryFn: () =>
      apiGetCompanyOnboardingTrend({
        companyId: companyId ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        groupBy,
      }),
    enabled:
      enabled && Boolean(companyId) && Boolean(startDate) && Boolean(endDate),
  });
}

function useSummaryQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["hr-summary", companyId ?? "", startDate ?? "", endDate ?? ""],
    queryFn: () =>
      apiGetCompanyOnboardingSummary({
        companyId: companyId ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      }),
    enabled:
      enabled && Boolean(companyId) && Boolean(startDate) && Boolean(endDate),
  });
}

function useFunnelQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["hr-funnel", companyId ?? "", startDate ?? "", endDate ?? ""],
    queryFn: () =>
      apiGetCompanyOnboardingFunnel({
        companyId: companyId ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      }),
    enabled:
      enabled && Boolean(companyId) && Boolean(startDate) && Boolean(endDate),
  });
}

function useTaskCompletionQuery(
  companyId?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "hr-task-completion",
      companyId ?? "",
      startDate ?? "",
      endDate ?? "",
    ],
    queryFn: () =>
      apiGetCompanyTaskCompletion({
        companyId: companyId ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      }),
    enabled:
      enabled && Boolean(companyId) && Boolean(startDate) && Boolean(endDate),
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
      "hr-by-department",
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

function useEmployeeListQuery(enabled = true) {
  return useQuery({
    queryKey: ["hr-employees"],
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
    indigo: "bg-indigo-50 text-indigo-700",
    violet: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    slate: "bg-slate-50 text-slate-700",
  };

  return (
    <Card
      size="small"
      className="overflow-hidden border border-stroke bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
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

function AttentionCard({
  inst,
  resolveName,
  tr,
}: {
  inst: OnboardingInstance;
  resolveName: (id: string | null | undefined, fallback?: string) => string;
  tr: (key: string, fallback: string) => string;
}) {
  const progress = normalizePercent(inst.progress, 0);
  const progressStatus =
    progress < 10 ? "exception" : progress < 30 ? "active" : "normal";

  const displayName =
    inst.employeeName ||
    resolveName(inst.employeeUserId, inst.employeeId || "—");

  const reasons: string[] = [];

  if (isInstanceOverdue(inst)) {
    reasons.push(tr("dashboard.hr.reason.overdue", "Quá hạn"));
  }

  if (isInstanceDueSoon(inst)) {
    reasons.push(tr("dashboard.hr.reason.due_soon", "Sắp đến hạn"));
  }

  if (progress < 30) {
    reasons.push(tr("dashboard.hr.reason.low_progress", "Tiến độ thấp"));
  }

  if (!inst.managerName && !getManagerId(inst)) {
    reasons.push(tr("dashboard.hr.reason.no_manager", "Chưa có quản lý"));
  }

  return (
    <Link to={`${AppRouters.ONBOARDING_EMPLOYEES}/${inst.id}`}>
      <div className="rounded-xl border border-stroke bg-white px-3 py-3 transition-colors hover:border-amber-300 hover:bg-amber-50/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted">
              {inst.managerName ||
                tr("dashboard.hr.reason.no_manager", "Chưa có quản lý")}
              {getDepartmentName(inst) ? ` • ${getDepartmentName(inst)}` : ""}
            </p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
        </div>

        <Progress
          percent={progress}
          size="small"
          status={progressStatus}
          className="mt-2"
        />

        <div className="mt-2 flex flex-wrap gap-1">
          {reasons.slice(0, 3).map((reason) => (
            <Tag
              key={reason}
              color={
                reason.includes("Quá") || reason.includes("Overdue")
                  ? "red"
                  : "gold"
              }
            >
              {reason}
            </Tag>
          ))}
        </div>
      </div>
    </Link>
  );
}

type RechartsCoord = string | number | undefined;

type DeptCompletionLabelProps = {
  x?: RechartsCoord;
  y?: RechartsCoord;
  width?: RechartsCoord;
  value?: string | number;
  index?: string | number;
  data?: DashboardDepartmentStat[];
};

function toChartNumber(value: RechartsCoord, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function DeptCompletionLabel(props: DeptCompletionLabelProps) {
  const { x, y, width, index = 0, data = [] } = props;

  const safeX = toChartNumber(x);
  const safeY = toChartNumber(y);
  const safeWidth = toChartNumber(width);
  const safeIndex = Number(index);

  const stat = data[Number.isFinite(safeIndex) ? safeIndex : 0];

  if (!stat || stat.totalTasks === 0) return null;

  const pct = Math.round((stat.completedTasks / stat.totalTasks) * 100);

  return (
    <text
      x={safeX + safeWidth / 2}
      y={safeY - 4}
      textAnchor="middle"
      fontSize={10}
      fill="#6b7280"
    >
      {pct}%
    </text>
  );
}

export default function HRDashboard() {
  const { t } = useLocale();
  const currentTenant = useUserStore((s) => s.currentTenant);
  const currentUser = useUserStore((s) => s.currentUser);
  const companyId = currentTenant?.id ?? currentUser?.companyId ?? undefined;

  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      return value === key ? fallback : value;
    },
    [t],
  );

  const formatMsg = useCallback(
    (
      key: string,
      fallback: string,
      params: Record<string, string | number>,
    ) => {
      let text = tr(key, fallback);

      Object.entries(params).forEach(([k, v]) => {
        text = text.replaceAll(`{${k}}`, String(v));
      });

      return text;
    },
    [tr],
  );

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const [activePreset, setActivePreset] = useState<string>(
    "dashboard.hr.date_preset.this_month",
  );

  const [recentStatusFilter, setRecentStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  const startDate = dateRange[0]?.format("YYYY-MM-DD");
  const endDate = dateRange[1]?.format("YYYY-MM-DD");
  const hasDateRange = Boolean(startDate && endDate);
  const analyticsEnabled = Boolean(companyId) && hasDateRange;
  const trendGroupBy = getTrendGroupBy(startDate, endDate);

  function applyPreset(label: string, getValue: () => [Dayjs, Dayjs]) {
    setActivePreset(label);
    setDateRange(getValue());
  }

  const { data: instances = [], isLoading: instancesLoading } =
    useInstancesQuery(undefined, true);

  const { data: summaryRaw, isLoading: summaryLoading } = useSummaryQuery(
    companyId,
    startDate,
    endDate,
    analyticsEnabled,
  );

  const { data: funnelRaw, isLoading: funnelLoading } = useFunnelQuery(
    companyId,
    startDate,
    endDate,
    analyticsEnabled,
  );

  const { data: taskCompletionRaw, isLoading: taskCompletionLoading } =
    useTaskCompletionQuery(companyId, startDate, endDate, analyticsEnabled);

  const { data: byDepartmentRaw, isLoading: byDepartmentLoading } =
    useByDepartmentQuery(companyId, startDate, endDate, analyticsEnabled);

  const { data: trendRaw, isLoading: trendLoading } = useTrendQuery(
    companyId,
    startDate,
    endDate,
    trendGroupBy,
    analyticsEnabled,
  );

  const { data: employeeList = [], isLoading: employeeLoading } =
    useEmployeeListQuery(true);

  const { resolveName } = useUserNameMap();

  const summary = normalizeSummary(summaryRaw);
  const funnel = normalizeFunnel(funnelRaw);
  const taskCompletion = normalizeTaskCompletion(taskCompletionRaw);
  const byDepartment = normalizeByDepartment(byDepartmentRaw);
  const trendData = useMemo(
    () => normalizeTrend(trendRaw, trendGroupBy),
    [trendRaw, trendGroupBy],
  );

  const departmentOptions = byDepartment.departments.map((item) => ({
    value: item.departmentId,
    label: item.departmentName,
  }));

  const {
    filteredInstances,
    activeInstances,
    completedInstances,
    cancelledInstances,
    draftInstances,
    overdueInstances,
    dueSoonInstances,
    lowProgressInstances,
    noManagerInstances,
    stalledInstances,
    attentionInstances,
    recentInstances,
    managerBreakdown,
  } = useMemo(() => {
    const filtered: OnboardingInstance[] = [];

    let active = 0;
    let completed = 0;
    let cancelled = 0;
    let draft = 0;

    const overdue: OnboardingInstance[] = [];
    const dueSoon: OnboardingInstance[] = [];
    const lowProgress: OnboardingInstance[] = [];
    const noManager: OnboardingInstance[] = [];
    const stalled: OnboardingInstance[] = [];

    const managerMap = new Map<
      string,
      {
        name: string;
        total: number;
        active: number;
        completed: number;
        risk: number;
        progress: number;
      }
    >();

    for (const inst of instances) {
      const start = parseDate(inst.startDate);

      if (!inRange(start, startDate, endDate)) continue;

      if (departmentFilter && getDepartmentId(inst) !== departmentFilter) {
        continue;
      }

      filtered.push(inst);

      const status = upper(inst.status);
      const progress = normalizePercent(inst.progress, 0);

      if (status === "ACTIVE") active += 1;
      else if (status === "COMPLETED") completed += 1;
      else if (status === "CANCELLED" || status === "CANCELED") cancelled += 1;
      else if (status === "DRAFT") draft += 1;

      if (isInstanceOverdue(inst)) overdue.push(inst);
      if (isInstanceDueSoon(inst)) dueSoon.push(inst);
      if (status === "ACTIVE" && progress < 30) lowProgress.push(inst);

      if (status === "ACTIVE" && !inst.managerName && !getManagerId(inst)) {
        noManager.push(inst);
      }

      if (
        status === "ACTIVE" &&
        daysBetween(inst.startDate) >= 14 &&
        progress < 70
      ) {
        stalled.push(inst);
      }

      const managerId = getManagerId(inst) ?? "UNASSIGNED";
      const managerName =
        inst.managerName ||
        tr("dashboard.hr.reason.no_manager", "Chưa có quản lý");

      const m = managerMap.get(managerId) ?? {
        name: managerName,
        total: 0,
        active: 0,
        completed: 0,
        risk: 0,
        progress: 0,
      };

      m.total += 1;
      m.progress += progress;

      if (status === "ACTIVE") m.active += 1;
      if (status === "COMPLETED") m.completed += 1;
      if (isInstanceOverdue(inst) || progress < 30) m.risk += 1;

      managerMap.set(managerId, m);
    }

    const attentionMap = new Map<string, OnboardingInstance>();

    [...overdue, ...dueSoon, ...lowProgress, ...noManager, ...stalled].forEach(
      (item) => {
        if (item.id) attentionMap.set(item.id, item);
      },
    );

    const attention = Array.from(attentionMap.values())
      .sort((a, b) => {
        const aOverdue = isInstanceOverdue(a) ? 0 : 1;
        const bOverdue = isInstanceOverdue(b) ? 0 : 1;

        if (aOverdue !== bOverdue) return aOverdue - bOverdue;

        return (
          normalizePercent(a.progress, 0) - normalizePercent(b.progress, 0)
        );
      })
      .slice(0, 8);

    const recent = [...filtered]
      .filter(
        (inst) =>
          !recentStatusFilter || upper(inst.status) === recentStatusFilter,
      )
      .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
      .slice(0, 10);

    const managers: ManagerBreakdownItem[] = Array.from(managerMap.entries())
      .map(([managerId, value]) => ({
        managerId,
        managerName: value.name,
        total: value.total,
        active: value.active,
        completed: value.completed,
        risk: value.risk,
        avgProgress:
          value.total > 0 ? Math.round(value.progress / value.total) : 0,
      }))
      .sort((a, b) => b.risk - a.risk || b.active - a.active);

    return {
      filteredInstances: filtered,
      activeInstances: active,
      completedInstances: completed,
      cancelledInstances: cancelled,
      draftInstances: draft,
      overdueInstances: overdue,
      dueSoonInstances: dueSoon,
      lowProgressInstances: lowProgress,
      noManagerInstances: noManager,
      stalledInstances: stalled,
      attentionInstances: attention,
      recentInstances: recent,
      managerBreakdown: managers,
    };
  }, [instances, startDate, endDate, departmentFilter, recentStatusFilter, tr]);

  const summaryActive =
    typeof funnel.activeCount === "number"
      ? funnel.activeCount
      : activeInstances;

  const summaryCompleted =
    typeof summary.completedCount === "number"
      ? summary.completedCount
      : completedInstances;

  const totalEmployees =
    typeof summary.totalEmployees === "number" ? summary.totalEmployees : null;

  const completionTotal =
    typeof taskCompletion.totalTasks === "number"
      ? taskCompletion.totalTasks
      : 0;

  const completionDone =
    typeof taskCompletion.completedTasks === "number"
      ? taskCompletion.completedTasks
      : 0;

  const completionPending = Math.max(completionTotal - completionDone, 0);

  const completionRateRaw =
    typeof taskCompletion.completionRate === "number"
      ? taskCompletion.completionRate
      : completionTotal > 0
        ? Math.round((completionDone / completionTotal) * 100)
        : 0;

  const completionRate = normalizePercent(completionRateRaw, 0);

  const activeEmployees = employeeList.filter(
    (u) => u.status?.toUpperCase() === "ACTIVE",
  ).length;

  const inactiveEmployees = employeeList.filter(
    (u) => u.status?.toUpperCase() !== "ACTIVE",
  ).length;

  const roleBreakdown = (() => {
    const counts: Record<string, number> = {};

    employeeList.forEach((u) => {
      const roles = u.roles?.length ? u.roles : ["UNKNOWN"];

      roles.forEach((r) => {
        counts[r] = (counts[r] ?? 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const funnelData = [
    {
      stage: tr("dashboard.hr.status.active", "Đang onboarding"),
      value: Number(funnel.activeCount ?? activeInstances),
    },
    {
      stage: tr("dashboard.hr.status.completed", "Hoàn tất"),
      value: Number(funnel.completedCount ?? completedInstances),
    },
    {
      stage: tr("dashboard.hr.status.cancelled", "Đã huỷ"),
      value: Number(funnel.cancelledCount ?? cancelledInstances),
    },
    {
      stage: tr("dashboard.hr.status.draft", "Nháp/khác"),
      value: Number(funnel.otherCount ?? draftInstances),
    },
  ].filter((s) => s.value > 0);

  const departmentStats = byDepartment.departments.filter((item) =>
    departmentFilter ? item.departmentId === departmentFilter : true,
  );

  const trendSeries = {
    active: trendData.some((item) => item.active > 0),
    completed: trendData.some((item) => item.completed > 0),
    cancelled: trendData.some((item) => item.cancelled > 0),
    risk: trendData.some((item) => item.risk > 0),
  };

  const kpis = [
    {
      label: tr("dashboard.hr.kpi.active_onboarding", "Đang onboarding"),
      value: String(summaryActive),
      sub: formatMsg(
        "dashboard.hr.kpi.records_in_period",
        "{count} hồ sơ trong kỳ",
        { count: filteredInstances.length },
      ),
      icon: <Users className="h-4 w-4" />,
      tone: "teal" as const,
    },
    {
      label: tr("dashboard.hr.kpi.completed", "Hoàn tất"),
      value: String(summaryCompleted),
      sub: hasDateRange
        ? tr("dashboard.hr.kpi.selected_period", "Theo thời gian đã chọn")
        : undefined,
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: "emerald" as const,
    },
    {
      label: tr("dashboard.hr.kpi.pending_tasks", "Task chưa xong"),
      value: String(completionPending),
      sub: formatMsg(
        "dashboard.hr.kpi.completed_tasks",
        "{done}/{total} task hoàn tất",
        { done: completionDone, total: completionTotal },
      ),
      icon: <ClipboardList className="h-4 w-4" />,
      tone: "amber" as const,
    },
    {
      label: tr(
        "dashboard.hr.kpi.task_completion_rate",
        "Tỷ lệ hoàn thành task",
      ),
      value: `${completionRate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      tone: "indigo" as const,
    },
    {
      label: tr("dashboard.hr.kpi.need_attention", "Cần chú ý"),
      value: String(attentionInstances.length),
      sub: tr(
        "dashboard.hr.kpi.attention_desc",
        "Quá hạn / tiến độ thấp / thiếu quản lý",
      ),
      icon: <AlertTriangle className="h-4 w-4" />,
      tone:
        attentionInstances.length > 0 ? ("rose" as const) : ("slate" as const),
    },
    {
      label: tr("dashboard.hr.kpi.total_employees", "Tổng nhân viên"),
      value:
        totalEmployees !== null
          ? String(totalEmployees)
          : String(employeeList.length || "—"),
      sub: formatMsg(
        "dashboard.hr.kpi.employee_status",
        "{active} đang hoạt động / {inactive} không hoạt động",
        { active: activeEmployees, inactive: inactiveEmployees },
      ),
      icon: <UserCheck className="h-4 w-4" />,
      tone: "violet" as const,
    },
  ];

  const isKpiLoading =
    summaryLoading || taskCompletionLoading || employeeLoading;
  const isProgressLoading = instancesLoading || funnelLoading;
  const isTrendLoading = trendLoading;

  const managerColumns = [
    {
      title: tr("dashboard.hr.table.manager", "Quản lý"),
      dataIndex: "managerName",
      key: "managerName",
      render: (v: string, record: ManagerBreakdownItem) => (
        <div>
          <p className="font-medium text-ink">{v}</p>
          <p className="text-xs text-muted">{record.managerId}</p>
        </div>
      ),
    },
    {
      title: tr("dashboard.hr.table.total", "Tổng"),
      dataIndex: "total",
      key: "total",
      width: 80,
    },
    {
      title: tr("dashboard.hr.table.active", "Đang chạy"),
      dataIndex: "active",
      key: "active",
      width: 100,
    },
    {
      title: tr("dashboard.hr.table.completed", "Hoàn tất"),
      dataIndex: "completed",
      key: "completed",
      width: 90,
    },
    {
      title: tr("dashboard.hr.table.risk", "Rủi ro"),
      dataIndex: "risk",
      key: "risk",
      width: 80,
      render: (v: number) => <Tag color={v > 0 ? "red" : "green"}>{v}</Tag>,
    },
    {
      title: tr("dashboard.hr.table.avg_progress", "Tiến độ TB"),
      dataIndex: "avgProgress",
      key: "avgProgress",
      width: 130,
      render: (v: number) => <Progress percent={v} size="small" />,
    },
  ];

  const recentColumns = [
    {
      title: tr("dashboard.hr.table.employee", "Nhân viên"),
      key: "employee",
      render: (record: OnboardingInstance) => {
        const name =
          record.employeeName ||
          resolveName(record.employeeUserId, record.employeeId || "—");

        return (
          <div>
            <Link
              className="font-medium text-blue-600 hover:underline"
              to={`${AppRouters.ONBOARDING_EMPLOYEES}/${record.id}`}
            >
              {name}
            </Link>
            <p className="text-xs text-muted">
              {getDepartmentName(record) || "—"}
            </p>
          </div>
        );
      },
    },
    {
      title: tr("dashboard.hr.table.manager", "Quản lý"),
      key: "manager",
      render: (record: OnboardingInstance) =>
        record.managerName || getManagerId(record) || "—",
    },
    {
      title: tr("dashboard.hr.table.status", "Trạng thái"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={instanceStatusColor(status)}>{status || "—"}</Tag>
      ),
    },
    {
      title: tr("dashboard.hr.table.progress", "Tiến độ"),
      dataIndex: "progress",
      key: "progress",
      width: 150,
      render: (value: number) => (
        <Progress percent={normalizePercent(value, 0)} size="small" />
      ),
    },
    {
      title: tr("dashboard.hr.table.start_date", "Ngày bắt đầu"),
      dataIndex: "startDate",
      key: "startDate",
      width: 130,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "—",
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="border border-stroke bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {tr("dashboard.hr.filter.period", "Khoảng thời gian")}
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
                    setActivePreset("dashboard.hr.date_preset.custom");
                  }
                }}
                options={[
                  ...DATE_PRESETS.map((p) => ({
                    value: p.label,
                    label: tr(p.label, p.fallback),
                  })),
                  {
                    value: "dashboard.hr.date_preset.custom",
                    label: tr("dashboard.hr.date_preset.custom", "Tuỳ chỉnh"),
                  },
                ]}
              />

              <DatePicker.RangePicker
                value={dateRange}
                format="DD/MM/YYYY"
                onChange={(value) => {
                  setDateRange(value ?? [null, null]);
                  setActivePreset("dashboard.hr.date_preset.custom");
                }}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {tr("dashboard.hr.filter.department", "Phòng ban")}
            </p>

            <Select
              className="w-52"
              value={departmentFilter || undefined}
              allowClear
              options={departmentOptions}
              onChange={(value) => setDepartmentFilter(value ?? "")}
              placeholder={tr(
                "dashboard.hr.filter.all_department",
                "Tất cả phòng ban",
              )}
              disabled={!hasDateRange}
            />
          </div>
        </div>
      </Card>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {tr("dashboard.hr.section.overview", "Tổng quan onboarding")}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {isKpiLoading
            ? Array.from({ length: 6 }, (_, i) => (
                <Card
                  key={`kpi-sk-${i}`}
                  size="small"
                  className="border border-stroke bg-white shadow-sm"
                >
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </Card>
              ))
            : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-stroke bg-white shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-ink">
              {tr("dashboard.hr.section.action_center", "Trung tâm xử lý")}
            </h2>
            <p className="text-sm text-muted">
              {tr(
                "dashboard.hr.section.action_center_desc",
                "Các vấn đề cần xử lý ngay trong quy trình onboarding.",
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <ActionItem
              icon={<AlertTriangle className="h-4 w-4" />}
              title={tr(
                "dashboard.hr.action.overdue",
                "Onboarding quá hạn/rủi ro",
              )}
              value={overdueInstances.length}
              tone={overdueInstances.length > 0 ? "red" : "slate"}
              to={AppRouters.ONBOARDING_EMPLOYEES}
            />

            <ActionItem
              icon={<CalendarClock className="h-4 w-4" />}
              title={tr("dashboard.hr.action.due_soon", "Sắp đến hạn")}
              value={dueSoonInstances.length}
              tone={dueSoonInstances.length > 0 ? "amber" : "slate"}
              to={AppRouters.ONBOARDING_EMPLOYEES}
            />

            <ActionItem
              icon={<Gauge className="h-4 w-4" />}
              title={tr("dashboard.hr.action.low_progress", "Tiến độ thấp")}
              value={lowProgressInstances.length}
              tone={lowProgressInstances.length > 0 ? "amber" : "slate"}
              to={AppRouters.ONBOARDING_EMPLOYEES}
            />

            <ActionItem
              icon={<UserRound className="h-4 w-4" />}
              title={tr("dashboard.hr.action.no_manager", "Chưa gán quản lý")}
              value={noManagerInstances.length}
              tone={noManagerInstances.length > 0 ? "blue" : "slate"}
              to={AppRouters.ONBOARDING_EMPLOYEES}
            />

            <ActionItem
              icon={<Clock className="h-4 w-4" />}
              title={tr("dashboard.hr.action.stalled", "Có dấu hiệu bị kẹt")}
              value={stalledInstances.length}
              tone={stalledInstances.length > 0 ? "amber" : "slate"}
              to={AppRouters.ONBOARDING_EMPLOYEES}
            />
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm xl:col-span-2">
          <h2 className="text-base font-semibold text-ink">
            {tr("dashboard.hr.section.onboarding_trend", "Xu hướng onboarding")}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.hr.section.onboarding_trend_desc",
              "So sánh số onboarding mới, hoàn tất và bị huỷ theo thời gian.",
            )}
          </p>

          <div className="mt-6 h-72">
            {isTrendLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : trendData.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.hr.empty.no_data",
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
                    name={tr("dashboard.hr.chart.created", "Tạo mới")}
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  {trendSeries.active && (
                    <Line
                      type="monotone"
                      dataKey="active"
                      name={tr("dashboard.hr.status.active", "Đang onboarding")}
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                  {trendSeries.completed && (
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name={tr("dashboard.hr.chart.completed", "Hoàn tất")}
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                  {trendSeries.cancelled && (
                    <Line
                      type="monotone"
                      dataKey="cancelled"
                      name={tr("dashboard.hr.chart.cancelled", "Đã huỷ")}
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                  {trendSeries.risk && (
                    <Line
                      type="monotone"
                      dataKey="risk"
                      name={tr("dashboard.hr.table.risk", "Rủi ro")}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr(
              "dashboard.hr.section.status_distribution",
              "Trạng thái onboarding",
            )}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.hr.section.status_distribution_desc",
              "Phân bổ trạng thái onboarding trong khoảng thời gian đã chọn.",
            )}
          </p>

          <div className="mt-6 h-64">
            {isProgressLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : funnelData.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.hr.empty.no_data",
                  "Không có dữ liệu",
                )}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    name={tr("dashboard.hr.chart.count", "Số lượng")}
                    radius={[6, 6, 0, 0]}
                  >
                    {funnelData.map((_, index) => (
                      <Cell
                        key={`funnel-bar-${index}`}
                        fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                      />
                    ))}
                    <LabelList dataKey="value" position="top" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr(
              "dashboard.hr.section.department_task",
              "Hiệu suất task theo phòng ban",
            )}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.hr.section.department_task_desc",
              "Theo dõi số task được giao và số task hoàn thành theo từng phòng ban.",
            )}
          </p>

          <div className="mt-6 h-72">
            {!hasDateRange ? (
              <Empty
                description={tr(
                  "dashboard.hr.empty.select_period",
                  "Chọn khoảng thời gian",
                )}
              />
            ) : byDepartmentLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : departmentStats.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.hr.empty.no_department",
                  "Không có dữ liệu phòng ban",
                )}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="departmentName"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="totalTasks"
                    name={tr("dashboard.hr.chart.total_tasks", "Tổng task")}
                    fill="#60a5fa"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completedTasks"
                    name={tr(
                      "dashboard.hr.chart.completed_tasks",
                      "Hoàn thành",
                    )}
                    fill="#0f766e"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      content={(props) => (
                        <DeptCompletionLabel
                          {...props}
                          data={departmentStats}
                        />
                      )}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr(
              "dashboard.hr.section.task_completion",
              "Tỷ lệ hoàn thành task",
            )}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.hr.section.task_completion_desc",
              "Tổng quan mức độ hoàn thành task onboarding trong kỳ.",
            )}
          </p>

          {taskCompletionLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          ) : (
            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-center">
                <Progress
                  type="circle"
                  percent={completionRate}
                  strokeColor={completionRate >= 70 ? "#0f766e" : "#f59e0b"}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-muted">
                    {tr("dashboard.hr.chart.total_tasks", "Tổng task")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-ink">
                    {completionTotal}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-xs text-emerald-700">
                    {tr("dashboard.hr.chart.completed_tasks", "Hoàn thành")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {completionDone}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-3 text-center">
                  <p className="text-xs text-amber-700">
                    {tr("dashboard.hr.kpi.pending_tasks", "Task chưa xong")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-amber-700">
                    {completionPending}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-stroke bg-white shadow-sm xl:col-span-2">
          <h2 className="text-base font-semibold text-ink">
            {tr(
              "dashboard.hr.section.manager_performance",
              "Hiệu suất theo quản lý",
            )}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.hr.section.manager_performance_desc",
              "HR có thể theo dõi quản lý nào đang có nhiều onboarding rủi ro.",
            )}
          </p>

          <div className="mt-4">
            <Table
              dataSource={managerBreakdown}
              columns={managerColumns}
              rowKey="managerId"
              loading={instancesLoading}
              pagination={false}
              scroll={{ x: 760 }}
              locale={{
                emptyText: tr(
                  "dashboard.hr.empty.no_manager",
                  "Không có dữ liệu quản lý",
                ),
              }}
            />
          </div>
        </Card>

        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr(
              "dashboard.hr.section.attention_employees",
              "Nhân viên cần chú ý",
            )}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.hr.section.attention_employees_desc",
              "Ưu tiên các onboarding quá hạn, thiếu quản lý hoặc tiến độ thấp.",
            )}
          </p>

          <div className="mt-4 space-y-3">
            {instancesLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} title={false} />
            ) : attentionInstances.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.hr.empty.no_attention",
                  "Không có onboarding rủi ro",
                )}
              />
            ) : (
              attentionInstances.map((inst) => (
                <AttentionCard
                  key={inst.id}
                  inst={inst}
                  resolveName={resolveName}
                  tr={tr}
                />
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {tr("dashboard.hr.section.team_overview", "Tổng quan nhân sự")}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.hr.section.team_overview_desc",
              "Tình trạng tài khoản nhân sự trong công ty.",
            )}
          </p>

          {employeeLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} title={false} />
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-stroke bg-emerald-50/50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-ink">
                    {tr("dashboard.hr.team.active", "Đang hoạt động")}
                  </span>
                </div>
                <span className="text-base font-bold text-emerald-700">
                  {activeEmployees}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-stroke bg-gray-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted" />
                  <span className="text-sm text-ink">
                    {tr("dashboard.hr.team.inactive", "Không hoạt động")}
                  </span>
                </div>
                <span className="text-base font-bold text-muted">
                  {inactiveEmployees}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-stroke bg-teal-50/50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-ink">
                    {tr("dashboard.hr.team.total", "Tổng nhân viên")}
                  </span>
                </div>
                <span className="text-base font-bold text-teal-700">
                  {employeeList.length}
                </span>
              </div>

              <div className="mt-2 border-t border-stroke pt-2 text-right">
                <Link
                  to={AppRouters.ADMIN_USERS}
                  className="flex items-center justify-end gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  {tr(
                    "dashboard.hr.team.manage_employees",
                    "Quản lý nhân viên",
                  )}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card className="border border-stroke bg-white shadow-sm xl:col-span-2">
          <h2 className="text-base font-semibold text-ink">
            {tr("dashboard.hr.section.role_breakdown", "Phân bổ vai trò")}
          </h2>
          <p className="text-sm text-muted">
            {tr(
              "dashboard.hr.section.role_breakdown_desc",
              "Số lượng người dùng theo từng vai trò trong công ty.",
            )}
          </p>

          <div className="mt-4 h-60">
            {employeeLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} title={false} />
            ) : roleBreakdown.length === 0 ? (
              <Empty
                description={tr(
                  "dashboard.hr.empty.no_data",
                  "Không có dữ liệu",
                )}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={roleBreakdown}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="role"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name={tr(
                      "dashboard.hr.kpi.total_employees",
                      "Tổng nhân viên",
                    )}
                    radius={[0, 4, 4, 0]}
                  >
                    {roleBreakdown.map((_, i) => (
                      <Cell
                        key={`role-cell-${i}`}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                    <LabelList dataKey="count" position="right" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="border border-stroke bg-white shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">
              {tr(
                "dashboard.hr.section.recent_onboarding",
                "Onboarding gần đây trong kỳ",
              )}
            </h2>
            <p className="text-sm text-muted">
              {tr(
                "dashboard.hr.section.recent_onboarding_desc",
                "Danh sách onboarding mới nhất theo bộ lọc hiện tại.",
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              className="w-44"
              value={recentStatusFilter || undefined}
              allowClear
              onChange={(value) => setRecentStatusFilter(value ?? "")}
              options={[
                {
                  value: "DRAFT",
                  label: tr("dashboard.hr.status.draft", "Nháp/khác"),
                },
                {
                  value: "ACTIVE",
                  label: tr("dashboard.hr.status.active", "Đang onboarding"),
                },
                {
                  value: "COMPLETED",
                  label: tr("dashboard.hr.status.completed", "Hoàn tất"),
                },
                {
                  value: "CANCELLED",
                  label: tr("dashboard.hr.status.cancelled", "Đã huỷ"),
                },
              ]}
              placeholder={tr(
                "dashboard.hr.filter.all_status",
                "Tất cả trạng thái",
              )}
            />

            <Link
              to={AppRouters.ONBOARDING_EMPLOYEES}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
            >
              {tr("dashboard.hr.common.view_all", "Xem tất cả")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <Table
          dataSource={recentInstances}
          columns={recentColumns}
          rowKey="id"
          loading={instancesLoading}
          pagination={false}
          scroll={{ x: 860 }}
          locale={{
            emptyText: tr(
              "dashboard.hr.empty.no_recent",
              "Không có onboarding gần đây",
            ),
          }}
        />
      </Card>
    </div>
  );
}
