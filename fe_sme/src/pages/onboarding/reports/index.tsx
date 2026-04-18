import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Segmented,
  Select,
  Skeleton,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs, { type Dayjs } from "dayjs";
import {
  apiListInstances,
  apiListTasks,
  apiListTemplates,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import { useLocale } from "@/i18n";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";
import type { OnboardingTemplateSummary } from "@/interface/onboarding";

const { Text } = Typography;
const { RangePicker } = DatePicker;

type RangePreset = "7d" | "30d" | "90d" | "all";

type TemplateItem = Pick<
  OnboardingTemplateSummary,
  "templateId" | "name" | "status"
>;

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#3b82f6",
  COMPLETED: "#10b981",
  DRAFT: "#f59e0b",
  CANCELLED: "#ef4444",
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};

const StatCard = ({
  icon,
  label,
  value,
  hint,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  colorClass: string;
}) => (
  <Card styles={{ body: { padding: 16 } }}>
    <div className="flex items-start gap-3">
      <div className={`rounded-lg p-2 ${colorClass}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <Text type="secondary" className="text-xs">
          {label}
        </Text>
        <p className="!mb-0 text-2xl font-bold text-ink">{value}</p>
        {hint && (
          <Text type="secondary" className="text-[11px]">
            {hint}
          </Text>
        )}
      </div>
    </div>
  </Card>
);

const OnboardingReports = () => {
  const { t } = useLocale();

  const [preset, setPreset] = useState<RangePreset>("30d");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [templateFilter, setTemplateFilter] = useState<string>("");

  // Derived time range
  const [from, to] = useMemo<[Dayjs, Dayjs]>(() => {
    if (range && range[0] && range[1]) return [range[0], range[1]];
    const now = dayjs();
    if (preset === "7d") return [now.subtract(7, "day"), now];
    if (preset === "30d") return [now.subtract(30, "day"), now];
    if (preset === "90d") return [now.subtract(90, "day"), now];
    return [dayjs("2000-01-01"), now]; // "all"
  }, [preset, range]);

  // ── Fetch data ──────────────────────────────────────────────
  const { data: templates = [] } = useQuery({
    queryKey: ["onboarding-report-templates"],
    queryFn: () => apiListTemplates({ status: "ACTIVE" }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
      ) as TemplateItem[],
  });

  const { data: instances = [], isLoading: loadingInstances } = useQuery({
    queryKey: ["onboarding-report-instances"],
    queryFn: () => apiListInstances({}),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

  const filteredInstances = useMemo(() => {
    return instances.filter((i) => {
      const start = i.startDate ? dayjs(i.startDate) : null;
      if (start && (start.isBefore(from) || start.isAfter(to))) return false;
      if (templateFilter && i.templateId !== templateFilter) return false;
      return true;
    });
  }, [instances, from, to, templateFilter]);

  // Fetch tasks for filteredInstances (capped at 40 to limit request fan-out)
  const taskQueries = useQueries({
    queries: filteredInstances.slice(0, 40).map((instance) => ({
      queryKey: ["onboarding-report-tasks", instance.id],
      queryFn: () => apiListTasks(instance.id),
      enabled: Boolean(instance.id),
      select: (res: unknown) =>
        extractList(
          res as Record<string, unknown>,
          "tasks",
          "content",
          "items",
          "list",
        ).map(mapTask) as OnboardingTask[],
    })),
  });

  const tasksLoading = taskQueries.some((q) => q.isLoading);
  const allTasks = useMemo<OnboardingTask[]>(
    () => taskQueries.flatMap((q) => (q.data ?? []) as OnboardingTask[]),
    [taskQueries],
  );

  // ── Aggregations ────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredInstances.length;
    const active = filteredInstances.filter((i) => i.status === "ACTIVE").length;
    const completed = filteredInstances.filter(
      (i) => i.status === "COMPLETED",
    ).length;
    const cancelled = filteredInstances.filter(
      (i) => i.status === "CANCELLED",
    ).length;
    const draft = filteredInstances.filter((i) => i.status === "DRAFT").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgProgress =
      total > 0
        ? Math.round(
            filteredInstances.reduce((s, i) => s + (i.progress ?? 0), 0) /
              total,
          )
        : 0;

    const now = Date.now();
    const overdueTasks = allTasks.filter(
      (task) =>
        task.rawStatus !== "DONE" &&
        task.dueDate &&
        new Date(task.dueDate).getTime() < now,
    ).length;
    const doneTasks = allTasks.filter((t) => t.rawStatus === "DONE").length;
    const pendingApproval = allTasks.filter(
      (t) => t.rawStatus === "PENDING_APPROVAL",
    ).length;
    return {
      total,
      active,
      completed,
      cancelled,
      draft,
      completionRate,
      avgProgress,
      overdueTasks,
      doneTasks,
      pendingApproval,
      totalTasks: allTasks.length,
    };
  }, [filteredInstances, allTasks]);

  // Status distribution for pie chart
  const statusPieData = useMemo(
    () =>
      [
        {
          name: t("onboarding.status.active") ?? "Active",
          value: stats.active,
          key: "ACTIVE",
        },
        {
          name: t("onboarding.status.completed") ?? "Completed",
          value: stats.completed,
          key: "COMPLETED",
        },
        {
          name: t("onboarding.reports.status.draft") ?? "Draft",
          value: stats.draft,
          key: "DRAFT",
        },
        {
          name: t("onboarding.status.cancelled") ?? "Cancelled",
          value: stats.cancelled,
          key: "CANCELLED",
        },
      ].filter((d) => d.value > 0),
    [stats, t],
  );

  // Instances per template (top 6)
  const perTemplateData = useMemo(() => {
    const templateName = new Map<string, string>();
    templates.forEach((tpl) => templateName.set(tpl.templateId, tpl.name));

    const buckets = new Map<
      string,
      { name: string; total: number; done: number; cancelled: number }
    >();
    for (const i of filteredInstances) {
      const key = i.templateId || "unknown";
      const displayName =
        templateName.get(key) ?? i.templateName ?? i.templateId ?? "—";
      const b = buckets.get(key) ?? {
        name: displayName,
        total: 0,
        done: 0,
        cancelled: 0,
      };
      b.total += 1;
      if (i.status === "COMPLETED") b.done += 1;
      if (i.status === "CANCELLED") b.cancelled += 1;
      buckets.set(key, b);
    }
    return Array.from(buckets.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filteredInstances, templates]);

  // Started per week trend
  const trendData = useMemo(() => {
    const buckets = new Map<string, { started: number; completed: number }>();
    for (const i of filteredInstances) {
      if (!i.startDate) continue;
      const key = dayjs(i.startDate).startOf("week").format("YYYY-MM-DD");
      const b = buckets.get(key) ?? { started: 0, completed: 0 };
      b.started += 1;
      if (i.status === "COMPLETED") b.completed += 1;
      buckets.set(key, b);
    }
    return Array.from(buckets.entries())
      .map(([week, v]) => ({
        week: dayjs(week).format("DD/MM"),
        weekKey: week,
        ...v,
      }))
      .sort((a, b) => (a.weekKey < b.weekKey ? -1 : 1));
  }, [filteredInstances]);

  // Top overdue tasks (titles grouped)
  const bottleneckTasks = useMemo(() => {
    const now = Date.now();
    const overdue = allTasks.filter(
      (task) =>
        task.rawStatus !== "DONE" &&
        task.dueDate &&
        new Date(task.dueDate).getTime() < now,
    );
    const byTitle = new Map<
      string,
      { title: string; count: number; checklists: Set<string> }
    >();
    for (const task of overdue) {
      const key = task.title;
      const b = byTitle.get(key) ?? {
        title: task.title,
        count: 0,
        checklists: new Set<string>(),
      };
      b.count += 1;
      if (task.checklistName) b.checklists.add(task.checklistName);
      byTitle.set(key, b);
    }
    return Array.from(byTitle.values())
      .map((v) => ({
        title: v.title,
        count: v.count,
        checklist: Array.from(v.checklists).join(", "),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allTasks]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <Card styles={{ body: { padding: 16 } }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span>
              {t("onboarding.reports.filter.label") ?? "Khoảng thời gian"}
            </span>
          </div>
          <Segmented
            value={range ? "custom" : preset}
            onChange={(v) => {
              if (v !== "custom") {
                setRange(null);
                setPreset(v as RangePreset);
              }
            }}
            options={[
              { label: t("onboarding.reports.range.7d") ?? "7d", value: "7d" },
              { label: t("onboarding.reports.range.30d") ?? "30d", value: "30d" },
              { label: t("onboarding.reports.range.90d") ?? "90d", value: "90d" },
              { label: t("onboarding.reports.range.all") ?? "All", value: "all" },
            ]}
          />
          <RangePicker
            value={range ?? undefined}
            onChange={(v) =>
              setRange(v as [Dayjs | null, Dayjs | null] | null)
            }
            allowClear
          />
          <Select
            className="w-60"
            value={templateFilter || undefined}
            onChange={(v) => setTemplateFilter(v ?? "")}
            allowClear
            onClear={() => setTemplateFilter("")}
            placeholder={
              t("onboarding.reports.filter.all_templates") ?? "Tất cả mẫu"
            }
            options={templates.map((tpl) => ({
              value: tpl.templateId,
              label: tpl.name,
            }))}
          />
          <div className="ml-auto flex items-center gap-1 text-xs text-muted">
            <span>
              {dayjs(from).format("DD/MM/YYYY")} — {dayjs(to).format("DD/MM/YYYY")}
            </span>
          </div>
        </div>
      </Card>

      {/* Top stats row (instances) */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <StatCard
            icon={<Users className="h-5 w-5 text-blue-600" />}
            label={t("onboarding.reports.stat.total") ?? "Tổng lượt onboard"}
            value={stats.total}
            hint={
              stats.active > 0
                ? `${stats.active} ${t("onboarding.status.active").toLowerCase()}`
                : undefined
            }
            colorClass="bg-blue-50"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            label={
              t("onboarding.reports.stat.completion_rate") ?? "Tỉ lệ hoàn thành"
            }
            value={`${stats.completionRate}%`}
            hint={stats.total > 0 ? `${stats.completed}/${stats.total}` : "—"}
            colorClass="bg-emerald-50"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            icon={<Activity className="h-5 w-5 text-violet-600" />}
            label={
              t("onboarding.reports.stat.avg_progress") ?? "Tiến độ trung bình"
            }
            value={`${stats.avgProgress}%`}
            colorClass="bg-violet-50"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            label={
              t("onboarding.reports.stat.overdue_tasks") ?? "Task quá hạn"
            }
            value={stats.overdueTasks}
            hint={
              stats.totalTasks > 0
                ? `${t("onboarding.reports.stat.of_tasks") ?? "trên"} ${stats.totalTasks}`
                : undefined
            }
            colorClass="bg-red-50"
          />
        </Col>
      </Row>

      {/* Secondary stats row (tasks) */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <StatCard
            icon={<ClipboardList className="h-5 w-5 text-sky-600" />}
            label={t("onboarding.reports.stat.total_tasks") ?? "Tổng task"}
            value={stats.totalTasks}
            colorClass="bg-sky-50"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            label={t("onboarding.reports.stat.done_tasks") ?? "Task đã hoàn thành"}
            value={stats.doneTasks}
            colorClass="bg-emerald-50"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            label={
              t("onboarding.reports.stat.pending_approval") ??
              "Chờ phê duyệt"
            }
            value={stats.pendingApproval}
            colorClass="bg-amber-50"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            icon={<Timer className="h-5 w-5 text-rose-500" />}
            label={t("onboarding.reports.stat.cancelled") ?? "Huỷ"}
            value={stats.cancelled}
            colorClass="bg-rose-50"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Status distribution pie */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                {t("onboarding.reports.chart.status_distribution") ??
                  "Phân bổ trạng thái"}
              </span>
            }
            styles={{ body: { padding: 16 } }}>
            {loadingInstances ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : statusPieData.length === 0 ? (
              <Empty
                description={t("onboarding.reports.empty") ?? "Chưa có dữ liệu"}
              />
            ) : (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}>
                      {statusPieData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={STATUS_COLORS[entry.key] ?? "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Trend line */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <span className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                {t("onboarding.reports.chart.trend") ??
                  "Onboard mới theo tuần"}
              </span>
            }
            styles={{ body: { padding: 16 } }}>
            {loadingInstances ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : trendData.length === 0 ? (
              <Empty
                description={t("onboarding.reports.empty") ?? "Chưa có dữ liệu"}
              />
            ) : (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="started"
                      name={
                        t("onboarding.reports.chart.total_started") ??
                        "Đã bắt đầu"
                      }
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name={
                        t("onboarding.reports.chart.completed") ?? "Hoàn thành"
                      }
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Per-template bar */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-violet-500" />
                {t("onboarding.reports.chart.per_template") ??
                  "Lượt onboard theo mẫu"}
              </span>
            }
            styles={{ body: { padding: 16 } }}>
            {loadingInstances ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : perTemplateData.length === 0 ? (
              <Empty
                description={t("onboarding.reports.empty") ?? "Chưa có dữ liệu"}
              />
            ) : (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={perTemplateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar
                      dataKey="total"
                      name={
                        t("onboarding.reports.chart.total_started") ??
                        "Đã bắt đầu"
                      }
                      fill="#60a5fa"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="done"
                      name={
                        t("onboarding.reports.chart.completed") ?? "Hoàn thành"
                      }
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="cancelled"
                      name={t("onboarding.reports.chart.cancelled") ?? "Huỷ"}
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Recently completed */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-emerald-500" />
                {t("onboarding.reports.chart.recent_completed") ??
                  "Hoàn thành gần đây"}
              </span>
            }
            styles={{ body: { padding: 12 } }}>
            {loadingInstances ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <Table
                dataSource={filteredInstances
                  .filter((i) => i.status === "COMPLETED")
                  .sort(
                    (a, b) =>
                      new Date(b.startDate).getTime() -
                      new Date(a.startDate).getTime(),
                  )
                  .slice(0, 8)}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: t("onboarding.reports.col.employee") ?? "Nhân viên",
                    key: "employee",
                    render: (_, row: OnboardingInstance) =>
                      row.employeeName ?? row.employeeId ?? "—",
                  },
                  {
                    title: t("onboarding.reports.col.template") ?? "Mẫu",
                    key: "template",
                    render: (_, row: OnboardingInstance) =>
                      row.templateName ?? "—",
                  },
                  {
                    title: t("onboarding.reports.col.start_date") ?? "Bắt đầu",
                    dataIndex: "startDate",
                    key: "startDate",
                    render: (v?: string) => formatDate(v),
                  },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Bottleneck tasks */}
      <Card
        title={
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="h-4 w-4 text-amber-500" />
            {t("onboarding.reports.chart.bottleneck") ??
              "Task gây chậm tiến độ"}
          </span>
        }
        styles={{ body: { padding: 12 } }}>
        {tasksLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : bottleneckTasks.length === 0 ? (
          <Empty
            description={
              t("onboarding.reports.bottleneck_empty") ??
              "Không có task quá hạn trong khoảng này"
            }
          />
        ) : (
          <Table
            dataSource={bottleneckTasks}
            rowKey="title"
            size="small"
            pagination={false}
            columns={[
              {
                title: t("onboarding.reports.col.task_title") ?? "Tên task",
                dataIndex: "title",
                key: "title",
              },
              {
                title: t("onboarding.reports.col.checklist") ?? "Giai đoạn",
                dataIndex: "checklist",
                key: "checklist",
                render: (v?: string) =>
                  v ? v.split(", ").map((name) => (
                    <Tag key={name}>{name}</Tag>
                  )) : <span className="text-muted">—</span>,
              },
              {
                title:
                  t("onboarding.reports.col.overdue_count") ?? "Số lượt quá hạn",
                dataIndex: "count",
                key: "count",
                width: 140,
                render: (count: number) => <Tag color="red">{count}</Tag>,
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default OnboardingReports;
