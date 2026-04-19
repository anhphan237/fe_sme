import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  DatePicker,
  Progress,
  Select,
  Skeleton,
  Tag,
  Tooltip as AntTooltip,
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
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Star,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useUserStore } from "@/stores/user.store";
import {
  apiGetCompanyOnboardingByDepartment,
  apiGetCompanyOnboardingFunnel,
  apiGetCompanyOnboardingSummary,
  apiGetCompanyTaskCompletion,
} from "@/api/admin/admin.api";
import { apiListInstances } from "@/api/onboarding/onboarding.api";
import { apiGetSurveyAnalyticsReport } from "@/api/survey/survey.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance } from "@/utils/mappers/onboarding";
import { useUserNameMap } from "@/utils/resolvers/userResolver";
import type { OnboardingInstance } from "@/shared/types";
import { AppRouters } from "@/constants/router";
import { useLocale } from "@/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

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

type SurveyAnalytics = {
  sentCount?: number;
  submittedCount?: number;
  responseRate?: number;
  overallSatisfactionScore?: number;
  stageTrends?: Array<{
    stage: string;
    submittedCount: number;
    averageOverall: number;
  }>;
  timeTrends?: Array<{
    bucket: string;
    submittedCount: number;
    averageScore: number;
  }>;
  dimensionStats?: Array<{
    dimensionCode: string;
    questionCount: number;
    responseCount: number;
    averageScore: number;
  }>;
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

type StageVolume = { stage: string; value: number };

// ── Constants ─────────────────────────────────────────────────────────────────

const FUNNEL_COLORS = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"];
const SURVEY_COLORS = ["#6366f1", "#a78bfa", "#c4b5fd", "#818cf8", "#4f46e5"];
const STAGE_LABELS: Record<string, string> = {
  PRE_BOARDING: "dashboard.hr.stage.pre_boarding",
  DAY_1: "dashboard.hr.stage.day_1",
  DAY_7: "dashboard.hr.stage.day_7",
  DAY_30: "dashboard.hr.stage.day_30",
  DAY_60: "dashboard.hr.stage.day_60",
};

const DATE_PRESETS = [
  {
    label: "dashboard.hr.date_preset.this_month",
    getValue: (): [Dayjs, Dayjs] => [dayjs().startOf("month"), dayjs()],
  },
  {
    label: "dashboard.hr.date_preset.last_month",
    getValue: (): [Dayjs, Dayjs] => [
      dayjs().subtract(1, "month").startOf("month"),
      dayjs().subtract(1, "month").endOf("month"),
    ],
  },
  {
    label: "dashboard.hr.date_preset.3_months",
    getValue: (): [Dayjs, Dayjs] => [dayjs().subtract(3, "month"), dayjs()],
  },
  {
    label: "dashboard.hr.date_preset.6_months",
    getValue: (): [Dayjs, Dayjs] => [dayjs().subtract(6, "month"), dayjs()],
  },
  {
    label: "dashboard.hr.date_preset.this_year",
    getValue: (): [Dayjs, Dayjs] => [dayjs().startOf("year"), dayjs()],
  },
] as const;

// ── Query hooks ────────────────────────────────────────────────────────────────

function useInstancesQuery(filters?: { status?: string }, enabled = true) {
  return useQuery({
    queryKey: ["hr-instances", filters?.status ?? ""],
    queryFn: () => apiListInstances({ status: filters?.status }),
    enabled,
    select: (res: unknown) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
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

function useSurveyAnalyticsQuery(
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["hr-survey-analytics", startDate ?? "", endDate ?? ""],
    queryFn: () => apiGetSurveyAnalyticsReport({ startDate, endDate }),
    enabled: enabled && Boolean(startDate) && Boolean(endDate),
    select: (res: unknown) => res as SurveyAnalytics,
  });
}

function useEmployeeListQuery(enabled = true) {
  return useQuery({
    queryKey: ["hr-employees"],
    queryFn: () => apiSearchUsers(),
    enabled,
    select: (res: unknown) => {
      const raw = res as Record<string, unknown>;
      const arr: UserListItem[] =
        (raw?.users as UserListItem[]) ?? (Array.isArray(raw) ? raw : []);
      return arr;
    },
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
  icon: React.ReactNode;
  tone:
    | "teal"
    | "emerald"
    | "amber"
    | "indigo"
    | "violet"
    | "purple"
    | "rose"
    | "sky";
}) {
  const toneClass: Record<typeof tone, string> = {
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700",
    violet: "bg-violet-50 text-violet-700",
    purple: "bg-purple-50 text-purple-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
  };
  return (
    <Card
      size="small"
      className="overflow-hidden border border-stroke bg-white shadow-sm transition-shadow hover:shadow-md">
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

/** Thẻ hiển thị instance cần chú ý (progress thấp) */
function AttentionCard({
  inst,
  resolveName,
}: {
  inst: OnboardingInstance;
  resolveName: (id: string | null | undefined, fallback?: string) => string;
}) {
  const progress = inst.progress ?? 0;
  const progressColor =
    progress < 10 ? "exception" : progress < 30 ? "active" : "normal";
  const displayName =
    inst.employeeName ||
    resolveName(inst.employeeUserId, inst.employeeId || "—");
  return (
    <Link to={`${AppRouters.ONBOARDING_EMPLOYEES}/${inst.id}`}>
      <div className="flex items-center gap-3 rounded-lg border border-stroke bg-white px-3 py-2.5 transition-colors hover:border-amber-300 hover:bg-amber-50/40">
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-ink">{displayName}</p>
          {inst.managerName && (
            <p className="truncate text-xs text-muted">{inst.managerName}</p>
          )}
          <Progress
            percent={progress}
            size="small"
            status={progressColor}
            className="mt-1"
          />
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
      </div>
    </Link>
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
    case "DRAFT":
    default:
      return "default";
  }
}

function DeptCompletionLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
  index?: number;
  data?: DashboardDepartmentStat[];
}) {
  const { x = 0, y = 0, width = 0, index = 0, data = [] } = props;
  const stat = data[index];
  if (!stat || stat.totalTasks === 0) return null;
  const pct = Math.round((stat.completedTasks / stat.totalTasks) * 100);
  return (
    <text
      x={x + width / 2}
      y={y - 4}
      textAnchor="middle"
      fontSize={10}
      fill="#6b7280">
      {pct}%
    </text>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function HRDashboard() {
  const { t } = useLocale();
  const currentTenant = useUserStore((s) => s.currentTenant);
  const currentUser = useUserStore((s) => s.currentUser);
  const companyId = currentTenant?.id ?? currentUser?.companyId ?? undefined;

  // Default: this month
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [activePreset, setActivePreset] = useState<string>(
    "dashboard.hr.date_preset.this_month",
  );
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  const startDate = dateRange[0]?.format("YYYY-MM-DD");
  const endDate = dateRange[1]?.format("YYYY-MM-DD");
  const hasDateRange = Boolean(startDate && endDate);
  const analyticsEnabled = Boolean(companyId) && hasDateRange;

  function applyPreset(label: string, getValue: () => [Dayjs, Dayjs]) {
    setActivePreset(label);
    setDateRange(getValue());
  }

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: instances = [], isLoading: instancesLoading } =
    useInstancesQuery(
      statusFilter ? { status: statusFilter } : undefined,
      true,
    );

  const filteredInstances = useMemo(
    () =>
      instances.filter((inst) =>
        inRange(parseDate(inst.startDate), startDate, endDate),
      ),
    [instances, startDate, endDate],
  );

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

  const { data: surveyAnalytics, isLoading: surveyLoading } =
    useSurveyAnalyticsQuery(startDate, endDate, analyticsEnabled);

  const { data: employeeList = [], isLoading: employeeLoading } =
    useEmployeeListQuery(true);

  const { resolveName } = useUserNameMap();

  // ── Data derivation ──────────────────────────────────────────────────────
  const summary = (summaryRaw ?? {}) as DashboardSummary;
  const funnel = (funnelRaw ?? {}) as DashboardFunnel;
  const taskCompletion = (taskCompletionRaw ?? {}) as DashboardTaskCompletion;
  const byDepartment = (byDepartmentRaw ?? { departments: [] }) as {
    departments?: DashboardDepartmentStat[];
  };

  const activeInstances = filteredInstances.filter(
    (it) => it.status === "ACTIVE",
  ).length;
  const completedInstances = filteredInstances.filter(
    (it) => it.status === "COMPLETED",
  ).length;

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
  const completionRate =
    completionRateRaw > 0 && completionRateRaw <= 1
      ? Math.round(completionRateRaw * 100)
      : Math.round(completionRateRaw);

  // ── Survey metrics ────────────────────────────────────────────────────────
  const surveySentCount = surveyAnalytics?.sentCount ?? 0;
  const surveySubmittedCount = surveyAnalytics?.submittedCount ?? 0;
  const surveyResponseRate = surveyAnalytics?.responseRate
    ? Math.round(
        surveyAnalytics.responseRate <= 1
          ? surveyAnalytics.responseRate * 100
          : surveyAnalytics.responseRate,
      )
    : surveySentCount > 0
      ? Math.round((surveySubmittedCount / surveySentCount) * 100)
      : 0;
  const satisfactionScore = surveyAnalytics?.overallSatisfactionScore ?? 0;

  // ── Survey stage trend data ───────────────────────────────────────────────
  const stageTrendData = useMemo(
    () =>
      (surveyAnalytics?.stageTrends ?? []).map((s) => ({
        stage: t(STAGE_LABELS[s.stage] ?? s.stage),
        "Phản hồi": s.submittedCount,
        "Điểm TB": Number(s.averageOverall.toFixed(2)),
      })),
    [surveyAnalytics],
  );

  // ── Survey time trend data ────────────────────────────────────────────────
  const surveyTimeTrendData = useMemo(
    () =>
      (surveyAnalytics?.timeTrends ?? []).map((t) => ({
        label: t.bucket,
        "Phản hồi": t.submittedCount,
        "Điểm TB": Number(t.averageScore.toFixed(2)),
      })),
    [surveyAnalytics],
  );

  // ── Employee stats ────────────────────────────────────────────────────────
  const activeEmployees = employeeList.filter(
    (u) => u.status?.toUpperCase() === "ACTIVE",
  ).length;
  const inactiveEmployees = employeeList.filter(
    (u) => u.status?.toUpperCase() !== "ACTIVE",
  ).length;

  const roleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    employeeList.forEach((u) => {
      (u.roles ?? []).forEach((r) => {
        counts[r] = (counts[r] ?? 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }, [employeeList]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpisRow1 = [
    {
      label: t("dashboard.hr.kpi.active_onboarding"),
      value: String(summaryActive),
      icon: <Users className="h-4 w-4" />,
      tone: "teal" as const,
    },
    {
      label: t("dashboard.hr.kpi.completed"),
      value: String(summaryCompleted),
      sub: hasDateRange ? t("dashboard.hr.kpi.in_period") : undefined,
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: "emerald" as const,
    },
    {
      label: t("dashboard.hr.kpi.pending_tasks"),
      value: String(completionPending),
      icon: <ClipboardList className="h-4 w-4" />,
      tone: "amber" as const,
    },
    {
      label: t("dashboard.hr.kpi.completion_rate"),
      value: `${completionRate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      tone: "indigo" as const,
    },
    {
      label: t("dashboard.hr.kpi.total_employees"),
      value:
        totalEmployees !== null
          ? String(totalEmployees)
          : String(employeeList.length || "—"),
      sub: hasDateRange
        ? t("dashboard.hr.kpi.in_selected_period")
        : t("dashboard.hr.kpi.select_period_hint"),
      icon: <UserCheck className="h-4 w-4" />,
      tone: "violet" as const,
    },
  ];

  const kpisRow2 = [
    {
      label: t("dashboard.hr.kpi.surveys_sent"),
      value: surveySentCount > 0 ? String(surveySentCount) : "—",
      sub: hasDateRange ? t("dashboard.hr.kpi.in_period") : undefined,
      icon: <MessageSquare className="h-4 w-4" />,
      tone: "sky" as const,
    },
    {
      label: t("dashboard.hr.kpi.response_rate"),
      value: surveySentCount > 0 ? `${surveyResponseRate}%` : "—",
      sub:
        surveySentCount > 0
          ? `${surveySubmittedCount}/${surveySentCount} ${t("dashboard.hr.kpi.responses")}`
          : undefined,
      icon: <TrendingUp className="h-4 w-4" />,
      tone: "purple" as const,
    },
    {
      label: t("dashboard.hr.kpi.satisfaction_score"),
      value: satisfactionScore > 0 ? satisfactionScore.toFixed(1) : "—",
      sub: satisfactionScore > 0 ? "/ 5.0" : undefined,
      icon: <Star className="h-4 w-4" />,
      tone: "rose" as const,
    },
  ];

  // ── Funnel BarChart data ──────────────────────────────────────────────────
  const funnelData: StageVolume[] = [
    {
      stage: t("dashboard.hr.status.active"),
      value: Number(funnel.activeCount ?? activeInstances),
    },
    {
      stage: t("dashboard.hr.status.completed"),
      value: Number(funnel.completedCount ?? completedInstances),
    },
    {
      stage: t("dashboard.hr.status.cancelled"),
      value: Number(
        funnel.cancelledCount ??
          filteredInstances.filter((x) => x.status === "CANCELLED").length,
      ),
    },
    {
      stage: t("dashboard.hr.status.draft"),
      value: Number(
        funnel.otherCount ??
          filteredInstances.filter((x) => x.status === "DRAFT").length,
      ),
    },
  ].filter((s) => s.value > 0);

  // ── Trend data (instances by month) ──────────────────────────────────────
  const trendData = useMemo(() => {
    const bucket = new Map<string, number>();
    filteredInstances.forEach((item) => {
      const parsed = parseDate(item.startDate);
      if (!parsed) return;
      const key = dayjs(parsed).format("MM/YYYY");
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    });
    return Array.from(bucket.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }, [filteredInstances]);

  // ── Department data ───────────────────────────────────────────────────────
  const departmentStats = (byDepartment.departments ?? []).filter((item) =>
    departmentFilter ? item.departmentId === departmentFilter : true,
  );

  const departmentOptions = (byDepartment.departments ?? []).map((item) => ({
    value: item.departmentId,
    label: item.departmentName,
  }));

  // ── Attention needed — ACTIVE instances with progress < 30% ──────────────
  const attentionInstances = useMemo(
    () =>
      filteredInstances
        .filter((i) => i.status === "ACTIVE" && (i.progress ?? 0) < 30)
        .sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0))
        .slice(0, 8),
    [filteredInstances],
  );

  // ── Recent table ─────────────────────────────────────────────────────────
  const recentInstances = useMemo(
    () =>
      [...filteredInstances]
        .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
        .slice(0, 10),
    [filteredInstances],
  );

  const isKpiLoading = summaryLoading || taskCompletionLoading;
  const isProgressLoading = instancesLoading || funnelLoading;

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <Card className="border border-stroke bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {t("dashboard.hr.filter.time_range")}
            </p>
            <div className="flex items-center gap-2">
              <Select
                className="w-36"
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
                    label: t(p.label),
                  })),
                  {
                    value: "dashboard.hr.date_preset.custom",
                    label: t("dashboard.hr.date_preset.custom"),
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
              {t("dashboard.hr.filter.status")}
            </p>
            <Select
              className="w-44"
              value={statusFilter || undefined}
              allowClear
              onChange={(value) => setStatusFilter(value ?? "")}
              options={[
                { value: "DRAFT", label: t("dashboard.hr.status.draft") },
                { value: "ACTIVE", label: t("dashboard.hr.status.active") },
                {
                  value: "COMPLETED",
                  label: t("dashboard.hr.status.completed"),
                },
                {
                  value: "CANCELLED",
                  label: t("dashboard.hr.status.cancelled"),
                },
              ]}
              placeholder={t("dashboard.hr.filter.status_placeholder")}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">
              {t("dashboard.hr.filter.department")}
            </p>
            <Select
              className="w-44"
              value={departmentFilter || undefined}
              allowClear
              options={departmentOptions}
              onChange={(value) => setDepartmentFilter(value ?? "")}
              placeholder={t("dashboard.hr.filter.department_placeholder")}
              disabled={!hasDateRange}
            />
          </div>
        </div>
      </Card>

      {/* KPI Row 1 — Onboarding KPIs */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("dashboard.hr.section.onboarding")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {isKpiLoading || employeeLoading
            ? Array.from({ length: 5 }, (_, i) => (
                <Card
                  key={`kpi-sk-${i}`}
                  size="small"
                  className="border border-stroke bg-white shadow-sm">
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </Card>
              ))
            : kpisRow1.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      </div>

      {/* KPI Row 2 — Survey KPIs */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("dashboard.hr.section.employee_survey")}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {surveyLoading
            ? Array.from({ length: 3 }, (_, i) => (
                <Card
                  key={`survey-kpi-sk-${i}`}
                  size="small"
                  className="border border-stroke bg-white shadow-sm">
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </Card>
              ))
            : kpisRow2.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      </div>

      {/* Trạng thái onboarding */}
      <Card className="border border-stroke bg-white shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          {t("dashboard.hr.section.onboarding_progress")}
        </h2>
        <p className="text-sm text-muted">
          {t("dashboard.hr.section.onboarding_progress_desc")}
        </p>
        <div className="mt-6 h-64">
          {isProgressLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          ) : funnelData.length === 0 ? (
            <p className="text-sm text-muted">
              {t("dashboard.hr.msg.no_data_in_period")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  name={t("dashboard.hr.chart.quantity")}
                  radius={[6, 6, 0, 0]}>
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

      {/* Department stats + Attention needed */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Department bar chart */}
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.hr.section.department_stats")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.hr.section.department_stats_desc")}
          </p>
          <div className="mt-6 h-72">
            {!hasDateRange ? (
              <p className="text-sm text-muted">
                {t("dashboard.hr.msg.select_period")}
              </p>
            ) : byDepartmentLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : departmentStats.length === 0 ? (
              <p className="text-sm text-muted">
                {t("dashboard.hr.msg.no_department_data")}
              </p>
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
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="totalTasks"
                    name={t("dashboard.hr.chart.total_tasks")}
                    fill="#60a5fa"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completedTasks"
                    name={t("dashboard.hr.chart.completed")}
                    fill="#0f766e"
                    radius={[4, 4, 0, 0]}>
                    <LabelList
                      content={(props: any) => (
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

        {/* Attention needed panel */}
        <Card className="border border-stroke bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold text-ink">
              {t("dashboard.hr.section.attention")}
            </h2>
          </div>
          <p className="text-sm text-muted">
            {t("dashboard.hr.section.attention_desc")}
          </p>
          <div className="mt-4 space-y-2">
            {!hasDateRange ? (
              <p className="text-sm text-muted">
                {t("dashboard.hr.msg.select_period_short")}
              </p>
            ) : instancesLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} title={false} />
            ) : attentionInstances.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium text-ink">
                  {t("dashboard.hr.msg.all_ok")}
                </p>
                <p className="text-xs text-muted">
                  {t("dashboard.hr.msg.none_below_30")}
                </p>
              </div>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {attentionInstances.map((inst) => (
                  <AttentionCard
                    key={inst.id}
                    inst={inst}
                    resolveName={resolveName}
                  />
                ))}
              </div>
            )}
          </div>
          {attentionInstances.length > 0 && (
            <div className="mt-3 border-t border-stroke pt-2">
              <Link
                to={AppRouters.ONBOARDING_EMPLOYEES}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                {t("dashboard.hr.action.view_all_employees")}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Survey Insights */}
      <div
        className={`grid gap-4 ${surveyTimeTrendData.length > 0 ? "lg:grid-cols-2" : ""}`}>
        {/* Survey Stage Trends */}
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.hr.section.survey_stage")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.hr.section.survey_stage_desc")}
          </p>
          <div className="mt-4 h-64">
            {surveyLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : stageTrendData.length === 0 ? (
              <p className="text-sm text-muted">
                {hasDateRange
                  ? t("dashboard.hr.msg.no_survey_data")
                  : t("dashboard.hr.msg.select_period_short")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 5]}
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="Phản hồi"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}>
                    {stageTrendData.map((_, i) => (
                      <Cell
                        key={`stage-cell-${i}`}
                        fill={SURVEY_COLORS[i % SURVEY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Điểm TB"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Survey time trend */}
        {surveyTimeTrendData.length > 0 && (
          <Card className="border border-stroke bg-white shadow-sm">
            <h2 className="text-base font-semibold text-ink">
              {t("dashboard.hr.section.survey_time")}
            </h2>
            <p className="text-sm text-muted">
              {t("dashboard.hr.section.survey_time_desc")}
            </p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={surveyTimeTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 5]}
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Phản hồi"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Điểm TB"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Team Overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Employee status stats */}
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.hr.section.team_overview")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.hr.section.team_overview_desc")}
          </p>
          {employeeLoading ? (
            <Skeleton
              active
              paragraph={{ rows: 4 }}
              title={false}
              className="mt-4"
            />
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-stroke bg-emerald-50/50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-ink">
                    {t("dashboard.hr.employee.active")}
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
                    {t("dashboard.hr.employee.inactive")}
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
                    {t("dashboard.hr.employee.total")}
                  </span>
                </div>
                <span className="text-base font-bold text-teal-700">
                  {employeeList.length}
                </span>
              </div>
              <div className="mt-2 border-t border-stroke pt-2 text-right">
                <Link
                  to={AppRouters.ADMIN_USERS}
                  className="flex items-center justify-end gap-1 text-xs font-medium text-blue-600 hover:underline">
                  {t("dashboard.hr.action.manage_employees")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Role breakdown chart */}
        <Card className="border border-stroke bg-white shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.hr.section.role_distribution")}
          </h2>
          <p className="text-sm text-muted">
            {t("dashboard.hr.section.role_distribution_desc")}
          </p>
          <div className="mt-4 h-60">
            {employeeLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} title={false} />
            ) : roleBreakdown.length === 0 ? (
              <p className="text-sm text-muted">
                {t("dashboard.hr.msg.no_data")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={roleBreakdown}
                  layout="vertical"
                  margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="role"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="Nhân viên" radius={[0, 4, 4, 0]}>
                    {roleBreakdown.map((_, i) => (
                      <Cell
                        key={`role-cell-${i}`}
                        fill={SURVEY_COLORS[i % SURVEY_COLORS.length]}
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

      {/* Onboarding Trend — full width */}
      <Card className="border border-stroke bg-white shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          {t("dashboard.hr.section.onboarding_trend")}
        </h2>
        <p className="text-sm text-muted">
          {t("dashboard.hr.section.onboarding_trend_desc")}
        </p>
        <div className="mt-6 h-64">
          {instancesLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          ) : trendData.length === 0 ? (
            <p className="text-sm text-muted">
              {hasDateRange
                ? t("dashboard.hr.msg.no_trend_data")
                : t("dashboard.hr.msg.select_period_trend")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={t("dashboard.hr.chart.onboarding_count")}
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Recent Onboardings Table */}
      <Card className="border border-stroke bg-white shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">
              {t("dashboard.hr.section.recent_onboardings")}
            </h2>
            <p className="text-sm text-muted">
              {t("dashboard.hr.section.recent_onboardings_desc")}
            </p>
          </div>
          <Link
            to={AppRouters.ONBOARDING_EMPLOYEES}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
            {t("dashboard.hr.action.view_all")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {instancesLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          ) : recentInstances.length === 0 ? (
            <p className="py-4 text-sm text-muted">
              {hasDateRange
                ? t("dashboard.hr.msg.no_onboarding_in_period")
                : t("dashboard.hr.msg.select_period_list")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left text-xs font-semibold uppercase text-muted">
                  <th className="pb-3 pr-4">
                    {t("dashboard.hr.table.employee")}
                  </th>
                  <th className="pb-3 pr-4">
                    {t("dashboard.hr.table.manager")}
                  </th>
                  <th className="pb-3 pr-4">
                    {t("dashboard.hr.table.start_date")}
                  </th>
                  <th className="pb-3 pr-4">
                    {t("dashboard.hr.table.status")}
                  </th>
                  <th className="pb-3 pr-4">
                    {t("dashboard.hr.table.progress")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentInstances.map((inst) => (
                  <tr
                    key={inst.id}
                    className="border-b border-stroke/50 last:border-0">
                    <td className="py-3 pr-4 font-medium">
                      <Link
                        to={`${AppRouters.ONBOARDING_EMPLOYEES}/${inst.id}`}
                        className="text-blue-600 hover:underline">
                        {inst.employeeName ||
                          resolveName(
                            inst.employeeUserId,
                            inst.employeeId || "—",
                          )}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {(() => {
                        const managerDisplay =
                          inst.managerName ||
                          resolveName(inst.managerUserId, "—");
                        return (
                          <AntTooltip title={managerDisplay}>
                            <span className="max-w-[120px] truncate block">
                              {managerDisplay}
                            </span>
                          </AntTooltip>
                        );
                      })()}
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {inst.startDate
                        ? dayjs(inst.startDate).format("DD/MM/YYYY")
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Tag color={instanceStatusColor(inst.status)}>
                        {inst.status ?? "—"}
                      </Tag>
                    </td>
                    <td className="py-3 pr-4 min-w-[100px]">
                      <Progress
                        percent={inst.progress ?? 0}
                        size="small"
                        showInfo={false}
                        strokeColor={
                          (inst.progress ?? 0) >= 70
                            ? "#0f766e"
                            : (inst.progress ?? 0) >= 30
                              ? "#2563eb"
                              : "#f59e0b"
                        }
                      />
                      <span className="text-xs text-muted">
                        {inst.progress ?? 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
