import { useMemo, useState } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  FileText,
  LayoutList,
  MessageSquare,
  RefreshCw,
  Search,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  Users as UsersIcon,
  X,
  XCircle,
} from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import {
  apiCancelTaskSchedule,
  apiConfirmTaskSchedule,
  apiGetTaskDetailFull,
  apiListInstances,
  apiListTasks,
  apiMarkTaskNoShow,
  apiRescheduleTask,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { canManageOnboarding } from "@/shared/rbac";
import { notify } from "@/utils/notify";
import { useUserNameMap } from "@/utils/resolvers/userResolver";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";
import type { TaskDetailResponse } from "@/interface/onboarding";

dayjs.extend(isoWeek);

const { Text } = Typography;

type GroupMode = "day" | "employee";
type ViewMode = "week" | "upcoming" | "all" | "overdue";
type StatusFilter = "all" | "proposed" | "confirmed" | "unscheduled";
type ViewType = "list" | "calendar";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { color: string; labelKey: string; fallback: string }
> = {
  UNSCHEDULED: {
    color: "default",
    labelKey: "onboarding.schedule.status.unscheduled",
    fallback: "Chưa có lịch",
  },
  PROPOSED: {
    color: "warning",
    labelKey: "onboarding.schedule.status.proposed",
    fallback: "Đề xuất",
  },
  CONFIRMED: {
    color: "processing",
    labelKey: "onboarding.schedule.status.confirmed",
    fallback: "Đã xác nhận",
  },
  RESCHEDULED: {
    color: "gold",
    labelKey: "onboarding.schedule.status.rescheduled",
    fallback: "Dời lịch",
  },
  CANCELLED: {
    color: "default",
    labelKey: "onboarding.schedule.status.cancelled",
    fallback: "Đã huỷ",
  },
  MISSED: {
    color: "error",
    labelKey: "onboarding.schedule.status.missed",
    fallback: "Bỏ lỡ",
  },
};

const TASK_STATUS_COLOR: Record<string, string> = {
  TODO: "default",
  IN_PROGRESS: "processing",
  ASSIGNED: "geekblue",
  WAIT_ACK: "orange",
  PENDING_APPROVAL: "gold",
  DONE: "success",
};

/** Left-border Tailwind class by schedule status */
const SCHEDULE_BORDER_COLOR: Record<string, string> = {
  CONFIRMED: "border-l-blue-500",
  PROPOSED: "border-l-amber-400",
  RESCHEDULED: "border-l-yellow-500",
  CANCELLED: "border-l-gray-400",
  MISSED: "border-l-red-500",
  UNSCHEDULED: "border-l-gray-300",
};

const formatDateTime = (value?: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";

const WEEKDAY_KEYS = [
  "onboarding.schedule.weekday.mon",
  "onboarding.schedule.weekday.tue",
  "onboarding.schedule.weekday.wed",
  "onboarding.schedule.weekday.thu",
  "onboarding.schedule.weekday.fri",
  "onboarding.schedule.weekday.sat",
  "onboarding.schedule.weekday.sun",
] as const;

const MONTH_KEYS = [
  "onboarding.schedule.month.jan",
  "onboarding.schedule.month.feb",
  "onboarding.schedule.month.mar",
  "onboarding.schedule.month.apr",
  "onboarding.schedule.month.may",
  "onboarding.schedule.month.jun",
  "onboarding.schedule.month.jul",
  "onboarding.schedule.month.aug",
  "onboarding.schedule.month.sep",
  "onboarding.schedule.month.oct",
  "onboarding.schedule.month.nov",
  "onboarding.schedule.month.dec",
] as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ScheduledTaskRow {
  task: OnboardingTask;
  instance: OnboardingInstance;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function getTaskDisplayDate(task: OnboardingTask): Dayjs | null {
  if (task.dueDate) return dayjs(task.dueDate);
  return null;
}

// ─────────────────────────────────────────────
// CalTaskCard — compact card used in calendar cells
// ─────────────────────────────────────────────

type ResolveFn = (id: string | null | undefined, fallback?: string) => string;

interface CalTaskCardProps {
  row: ScheduledTaskRow;
  compact?: boolean;
  showEmployee?: boolean;
  onClick: () => void;
  resolveFn: ResolveFn;
}

const CalTaskCard = ({
  row,
  compact,
  showEmployee,
  onClick,
  resolveFn,
}: CalTaskCardProps) => {
  const { task, instance } = row;
  const overdue =
    task.dueDate &&
    new Date(task.dueDate).getTime() < Date.now() &&
    task.rawStatus !== "DONE";
  const borderClass =
    SCHEDULE_BORDER_COLOR[task.scheduleStatus ?? "UNSCHEDULED"] ??
    "border-l-gray-300";
  const hasTime =
    task.dueDate && dayjs(task.dueDate).format("HH:mm") !== "00:00";
  const timeLabel = hasTime ? dayjs(task.dueDate).format("HH:mm") : null;
  const statusColor = TASK_STATUS_COLOR[task.rawStatus ?? "TODO"] ?? "default";

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`mb-0.5 w-full truncate rounded border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-tight transition hover:opacity-80 ${
          overdue
            ? "border-l-red-400 bg-red-50 text-red-700"
            : `${borderClass} bg-blue-50 text-blue-800`
        }`}
        title={task.title}>
        {task.title}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border border-gray-200 border-l-4 bg-white p-2.5 text-left shadow-sm transition hover:shadow-md ${
        overdue ? "border-l-red-400 bg-red-50/40" : borderClass
      }`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="!mb-0.5 truncate text-xs font-semibold leading-snug text-gray-800">
            {task.title}
          </p>
          {timeLabel && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
              <Clock className="h-2.5 w-2.5" />
              {timeLabel}
            </span>
          )}
          {showEmployee && (
            <p className="!mb-0 mt-0.5 truncate text-[10px] text-violet-600">
              <UserRound className="mr-0.5 inline h-2.5 w-2.5" />
              {instance.employeeName ?? resolveFn(instance.employeeUserId ?? instance.employeeId, instance.employeeId)}
            </p>
          )}
          {task.checklistName && (
            <p className="!mb-0 truncate text-[10px] text-gray-400">
              {task.checklistName}
            </p>
          )}
        </div>
        <div className="shrink-0">
          <Tag
            color={statusColor}
            style={{
              margin: 0,
              fontSize: 10,
              lineHeight: "16px",
              padding: "0 4px",
            }}>
            {task.rawStatus ?? "TODO"}
          </Tag>
        </div>
      </div>
    </button>
  );
};

// ─────────────────────────────────────────────
// MonthCalendar
// ─────────────────────────────────────────────

interface MonthCalendarProps {
  calendarRows: Map<string, ScheduledTaskRow[]>;
  anchor: Dayjs;
  showEmployee: boolean;
  onTaskClick: (id: string) => void;
  onAnchorChange: (d: Dayjs) => void;
  selectedDate: Dayjs;
  onSelectDate: (d: Dayjs) => void;
  onExpandDay: (d: Dayjs) => void;
  resolveFn: ResolveFn;
  labels: {
    weekdays: string[];
    monthNames: string[];
    today: string;
    monthTotalSuffix: string;
    scheduledLegend: string;
    overdueLegend: string;
    overflowTasks: string;
  };
}

const MAX_VISIBLE_MONTH = 3;

const MonthCalendar = ({
  calendarRows,
  anchor,
  showEmployee,
  onTaskClick,
  onAnchorChange,
  selectedDate,
  onSelectDate,
  onExpandDay,
  resolveFn,
  labels,
}: MonthCalendarProps) => {
  const today = dayjs();
  const gridStart = anchor.startOf("month").startOf("isoWeek");
  const cells = Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));
  const headerLabel = `${labels.monthNames[anchor.month()] ?? ""} ${anchor.year()}`;
  const monthTotal = cells
    .filter((d) => d.month() === anchor.month())
    .reduce(
      (acc, d) => acc + (calendarRows.get(d.format("YYYY-MM-DD"))?.length ?? 0),
      0,
    );

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Button
            size="small"
            icon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => onAnchorChange(anchor.subtract(1, "month"))}
          />
          <Button
            size="small"
            icon={<ChevronRight className="h-4 w-4" />}
            onClick={() => onAnchorChange(anchor.add(1, "month"))}
          />
          <Button size="small" onClick={() => onAnchorChange(dayjs())}>
            {labels.today}
          </Button>
        </div>
        <div className="text-center">
          <span className="block text-sm font-semibold text-gray-700">
            {headerLabel}
          </span>
          <span className="text-xs text-gray-500">
            {monthTotal} {labels.monthTotalSuffix}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />{" "}
            {labels.scheduledLegend}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />{" "}
            {labels.overdueLegend}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* DoW header */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {labels.weekdays.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-gray-500">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((day) => {
            const key = day.format("YYYY-MM-DD");
            const isToday = day.isSame(today, "day");
            const isCurrent = day.month() === anchor.month();
            const dayTasks = calendarRows.get(key) ?? [];
            const visible = dayTasks.slice(0, MAX_VISIBLE_MONTH);
            const overflow = dayTasks.length - MAX_VISIBLE_MONTH;

            return (
              <div
                key={key}
                className={`min-h-[112px] border-b border-r border-gray-100 p-2 last:border-r-0 ${
                  isToday
                    ? "bg-blue-50/50"
                    : isCurrent
                      ? "bg-white"
                      : "bg-gray-50/60"
                }`}>
                <button
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition hover:bg-blue-100 ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : selectedDate.isSame(day, "day")
                        ? "bg-blue-100 text-blue-700"
                        : isCurrent
                          ? "text-gray-700"
                          : "text-gray-300"
                  }`}>
                  {day.date()}
                </button>
                {visible.map((r) => (
                  <CalTaskCard
                    key={r.task.id}
                    row={r}
                    compact
                    showEmployee={showEmployee}
                    onClick={() => onTaskClick(r.task.id)}
                    resolveFn={resolveFn}
                  />
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={() => onExpandDay(day)}
                    className="mt-0.5 w-full rounded text-center text-[10px] text-blue-600 hover:underline">
                    +{overflow} {labels.overflowTasks}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────

const OnboardingSchedule = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.currentUser);
  const roles = currentUser?.roles ?? [];
  const canManage = canManageOnboarding(roles);
  const isEmployee = roles.includes("EMPLOYEE") && !canManage;

  // ── User name resolver ──
  const { resolveName } = useUserNameMap();

  // ── List state ──
  const [groupMode, setGroupMode] = useState<GroupMode>("day");
  const [view, setView] = useState<ViewMode>("week");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [instanceFilter, setInstanceFilter] = useState<string>("all");

  // ── Calendar state ──
  const [viewType, setViewType] = useState<ViewType>(
    isEmployee ? "calendar" : "list",
  );
  const [calAnchor, setCalAnchor] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  // ── Drawer / modal state ──
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<Dayjs | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [form] = Form.useForm<{
    scheduledStartAt: Dayjs;
    scheduledEndAt?: Dayjs;
    reason?: string;
  }>();
  const [reasonForm] = Form.useForm<{ reason?: string }>();

  // ── Fetch instances ──
  const { data: instances = [], isLoading: loadingInstances } = useQuery({
    queryKey: ["schedule-instances", currentUser?.id ?? "", canManage],
    queryFn: () =>
      canManage
        ? apiListInstances({ status: "ACTIVE" })
        : apiListInstances({ status: "ACTIVE", employeeId: currentUser?.id }),
    enabled: Boolean(currentUser?.id),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

  const scopedInstances = useMemo(() => {
    if (!canManage && isEmployee)
      return instances.filter(
        (i) =>
          i.employeeUserId === currentUser?.id ||
          i.employeeId === currentUser?.id,
      );
    if (roles.includes("MANAGER") && !roles.includes("HR"))
      return instances.filter((i) => i.managerUserId === currentUser?.id);
    return instances;
  }, [instances, canManage, isEmployee, roles, currentUser?.id]);

  // ── Fetch tasks per instance ──
  const taskQueries = useQueries({
    queries: scopedInstances.slice(0, 40).map((instance) => ({
      queryKey: ["schedule-tasks", instance.id],
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

  // ── Task detail ──
  const { data: taskDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["schedule-task-detail", selectedTaskId ?? ""],
    queryFn: () => apiGetTaskDetailFull(selectedTaskId!),
    enabled: Boolean(selectedTaskId),
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      return (r?.task ?? r?.data ?? r?.result ?? r?.payload ?? r) as
        | TaskDetailResponse
        | undefined;
    },
  });

  // ── Build flat rows ──
  const rows = useMemo<ScheduledTaskRow[]>(() => {
    const result: ScheduledTaskRow[] = [];
    scopedInstances.forEach((instance, idx) => {
      const tasks = (taskQueries[idx]?.data ?? []) as OnboardingTask[];
      for (const task of tasks) {
        if (task.rawStatus === "DONE") continue;
        result.push({ task, instance });
      }
    });
    return result;
  }, [scopedInstances, taskQueries]);

  // ── Employee / Instance select options ──
  const employeeOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    for (const inst of scopedInstances) {
      const uid = inst.employeeUserId ?? inst.employeeId;
      if (uid && !seen.has(uid)) {
        seen.add(uid);
        opts.push({
          value: uid,
          label: inst.employeeName ?? resolveName(inst.employeeUserId ?? inst.employeeId, inst.employeeId ?? uid),
        });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [scopedInstances]);

  const instanceOptions = useMemo(() => {
    const base =
      employeeFilter === "all"
        ? scopedInstances
        : scopedInstances.filter(
            (i) =>
              i.employeeUserId === employeeFilter ||
              i.employeeId === employeeFilter,
          );
    return base.map((i) => ({
      value: i.id,
      label:
        [i.templateName, i.startDate ? dayjs(i.startDate).format("DD/MM/YYYY") : null]
          .filter(Boolean)
          .join(" · ") || i.id,
    }));
  }, [scopedInstances, employeeFilter]);

  // ── Scope filter (employee + instance) ──
  const filteredByScope = useMemo(() => {
    if (employeeFilter === "all" && instanceFilter === "all") return rows;
    return rows.filter(({ instance }) => {
      if (instanceFilter !== "all") return instance.id === instanceFilter;
      return (
        instance.employeeUserId === employeeFilter ||
        instance.employeeId === employeeFilter
      );
    });
  }, [rows, employeeFilter, instanceFilter]);

  // ── Time-range filter (list) ──
  const filteredByView = useMemo(() => {
    const now = dayjs();
    const startOfToday = now.startOf("day");
    if (view === "all") return filteredByScope;
    if (view === "overdue")
      return filteredByScope.filter(
        (r) => r.task.dueDate && dayjs(r.task.dueDate).isBefore(startOfToday),
      );
    const end = view === "week" ? now.add(7, "day") : now.add(30, "day");
    return filteredByScope.filter(({ task }) => {
      if (!task.dueDate) return false;
      const d = dayjs(task.dueDate);
      return d.isAfter(startOfToday.subtract(1, "minute")) && d.isBefore(end);
    });
  }, [filteredByScope, view]);

  // ── Status filter (list) ──
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return filteredByView;
    if (statusFilter === "unscheduled")
      return filteredByView.filter((r) =>
        ["TODO", "ASSIGNED"].includes(r.task.rawStatus ?? ""),
      );
    if (statusFilter === "proposed")
      return filteredByView.filter((r) =>
        ["IN_PROGRESS", "WAIT_ACK"].includes(r.task.rawStatus ?? ""),
      );
    if (statusFilter === "confirmed")
      return filteredByView.filter(
        (r) => r.task.rawStatus === "PENDING_APPROVAL",
      );
    return filteredByView;
  }, [filteredByView, statusFilter]);

  // ── Keyword filter (list) ──
  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return filteredByStatus;
    return filteredByStatus.filter(
      ({ task, instance }) =>
        task.title.toLowerCase().includes(q) ||
        (instance.employeeName ?? "").toLowerCase().includes(q) ||
        (task.checklistName ?? "").toLowerCase().includes(q),
    );
  }, [filteredByStatus, keyword]);

  // ── Calendar rows (scope + keyword-filtered, all time) ──
  const calendarFilteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const base = filteredByScope.filter((r) => r.task.rawStatus !== "DONE");
    if (!q) return base;
    return base.filter(
      (r) =>
        r.task.title.toLowerCase().includes(q) ||
        (r.instance.employeeName ?? "").toLowerCase().includes(q) ||
        (r.task.checklistName ?? "").toLowerCase().includes(q),
    );
  }, [filteredByScope, keyword]);

  // ── Calendar date map ──
  const calendarRows = useMemo(() => {
    const map = new Map<string, ScheduledTaskRow[]>();
    for (const row of calendarFilteredRows) {
      const d = getTaskDisplayDate(row.task);
      if (!d) continue;
      const key = d.format("YYYY-MM-DD");
      const bucket = map.get(key) ?? [];
      bucket.push(row);
      map.set(key, bucket);
    }
    for (const bucket of map.values()) {
      bucket.sort(
        (a, b) =>
          new Date(a.task.dueDate ?? "").getTime() -
          new Date(b.task.dueDate ?? "").getTime(),
      );
    }
    return map;
  }, [calendarFilteredRows]);

  // ── Group by day (list) ──
  const groupedByDay = useMemo(() => {
    const groups = new Map<string, ScheduledTaskRow[]>();
    const undated: ScheduledTaskRow[] = [];
    for (const row of filteredRows) {
      if (!row.task.dueDate) {
        undated.push(row);
        continue;
      }
      const key = dayjs(row.task.dueDate).format("YYYY-MM-DD");
      const bucket = groups.get(key) ?? [];
      bucket.push(row);
      groups.set(key, bucket);
    }
    for (const bucket of groups.values())
      bucket.sort(
        (a, b) =>
          new Date(a.task.dueDate!).getTime() -
          new Date(b.task.dueDate!).getTime(),
      );
    return {
      groups,
      sortedKeys: Array.from(groups.keys()).sort(),
      undated,
    };
  }, [filteredRows]);

  // ── Group by employee (list) ──
  const groupedByEmployee = useMemo(() => {
    const groups = new Map<
      string,
      { instance: OnboardingInstance; tasks: ScheduledTaskRow[] }
    >();
    for (const row of filteredRows) {
      const key = row.instance.id;
      const g = groups.get(key) ?? { instance: row.instance, tasks: [] };
      g.tasks.push(row);
      groups.set(key, g);
    }
    for (const g of groups.values())
      g.tasks.sort((a, b) => {
        const ad = a.task.dueDate
          ? new Date(a.task.dueDate).getTime()
          : Infinity;
        const bd = b.task.dueDate
          ? new Date(b.task.dueDate).getTime()
          : Infinity;
        return ad - bd;
      });
    return Array.from(groups.values()).sort(
      (a, b) => b.tasks.length - a.tasks.length,
    );
  }, [filteredRows]);

  // ── Stats ──
  const stats = useMemo(() => {
    const now = Date.now();
    const total = rows.length;
    const today = rows.filter(
      (r) => r.task.dueDate && dayjs(r.task.dueDate).isSame(dayjs(), "day"),
    ).length;
    const overdue = rows.filter(
      (r) =>
        r.task.dueDate &&
        new Date(r.task.dueDate).getTime() < now &&
        r.task.rawStatus !== "DONE",
    ).length;
    const pendingApproval = rows.filter(
      (r) => r.task.rawStatus === "PENDING_APPROVAL",
    ).length;
    const monthStart = calAnchor.startOf("month");
    const monthEnd = monthStart.add(1, "month");
    const thisMonthCount = calendarFilteredRows.filter((r) => {
      const d = getTaskDisplayDate(r.task);
      return (
        d && d.isAfter(monthStart.subtract(1, "ms")) && d.isBefore(monthEnd)
      );
    }).length;
    const scheduledCount = calendarFilteredRows.filter((r) =>
      ["CONFIRMED", "PROPOSED", "RESCHEDULED"].includes(
        r.task.scheduleStatus ?? "",
      ),
    ).length;
    return {
      total,
      today,
      overdue,
      pendingApproval,
      thisMonthCount,
      scheduledCount,
    };
  }, [rows, calAnchor, calendarFilteredRows]);

  // ── Mutations ──
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["schedule-tasks"] });
    void queryClient.invalidateQueries({
      queryKey: ["schedule-task-detail", selectedTaskId ?? ""],
    });
  };

  const confirmMutation = useMutation({
    mutationFn: (taskId: string) => apiConfirmTaskSchedule({ taskId }),
    onSuccess: () => {
      notify.success(
        t("onboarding.schedule.toast.confirmed") ?? "Đã xác nhận lịch",
      );
      invalidate();
    },
    onError: () =>
      notify.error(
        t("onboarding.schedule.toast.failed") ?? "Thao tác thất bại",
      ),
  });

  const rescheduleMutation = useMutation({
    mutationFn: (payload: {
      taskId: string;
      scheduledStartAt: string;
      scheduledEndAt?: string;
      reason?: string;
    }) => apiRescheduleTask(payload),
    onSuccess: () => {
      notify.success(
        t("onboarding.schedule.toast.rescheduled") ?? "Đã dời lịch",
      );
      setRescheduleOpen(false);
      form.resetFields();
      invalidate();
    },
    onError: () =>
      notify.error(
        t("onboarding.schedule.toast.failed") ?? "Thao tác thất bại",
      ),
  });

  const cancelMutation = useMutation({
    mutationFn: (payload: { taskId: string; reason?: string }) =>
      apiCancelTaskSchedule(payload),
    onSuccess: () => {
      notify.success(t("onboarding.schedule.toast.cancelled") ?? "Đã huỷ lịch");
      setCancelOpen(false);
      reasonForm.resetFields();
      invalidate();
    },
    onError: () =>
      notify.error(
        t("onboarding.schedule.toast.failed") ?? "Thao tác thất bại",
      ),
  });

  const noShowMutation = useMutation({
    mutationFn: (payload: { taskId: string; reason?: string }) =>
      apiMarkTaskNoShow(payload),
    onSuccess: () => {
      notify.success(
        t("onboarding.schedule.toast.no_show") ?? "Đã đánh dấu bỏ lỡ",
      );
      setNoShowOpen(false);
      reasonForm.resetFields();
      invalidate();
    },
    onError: () =>
      notify.error(
        t("onboarding.schedule.toast.failed") ?? "Thao tác thất bại",
      ),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["schedule-instances"] });
    void queryClient.invalidateQueries({ queryKey: ["schedule-tasks"] });
  };

  // ── Inline sub-components ──
  const ScheduleStatusTag = ({ status }: { status?: string }) => {
    const key = (status ?? "UNSCHEDULED").toUpperCase();
    const meta = STATUS_META[key] ?? STATUS_META.UNSCHEDULED;
    return <Tag color={meta.color}>{t(meta.labelKey) ?? meta.fallback}</Tag>;
  };

  const TaskStatusTag = ({ status }: { status?: string }) => {
    if (!status) return null;
    const labelKey = `onboarding.task.status.${status.toLowerCase()}`;
    const label = t(labelKey);
    const display = label.startsWith("onboarding.task.status.")
      ? status
      : label;
    return <Tag color={TASK_STATUS_COLOR[status] ?? "default"}>{display}</Tag>;
  };

  const openReschedule = () => {
    if (!taskDetail) return;
    form.setFieldsValue({
      scheduledStartAt: taskDetail.scheduledStartAt
        ? dayjs(taskDetail.scheduledStartAt)
        : dayjs(),
      scheduledEndAt: taskDetail.scheduledEndAt
        ? dayjs(taskDetail.scheduledEndAt)
        : undefined,
      reason: "",
    });
    setRescheduleOpen(true);
  };

  const submitReschedule = async () => {
    if (!taskDetail) return;
    const values = await form.validateFields();
    rescheduleMutation.mutate({
      taskId: taskDetail.taskId,
      scheduledStartAt: values.scheduledStartAt.toISOString(),
      scheduledEndAt: values.scheduledEndAt?.toISOString(),
      reason: values.reason,
    });
  };

  const isLoading =
    loadingInstances || (scopedInstances.length > 0 && tasksLoading);
  const isCalendarMode = viewType === "calendar";
  const weekdayLabels = WEEKDAY_KEYS.map(
    (k, idx) => t(k) ?? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"][idx],
  );
  const monthLabels = MONTH_KEYS.map((k, idx) => t(k) ?? `Tháng ${idx + 1}`);
  const expandedDayRows = useMemo(
    () =>
      expandedDay
        ? (calendarRows.get(expandedDay.format("YYYY-MM-DD")) ?? [])
        : [],
    [calendarRows, expandedDay],
  );
  const assignedUserName =
    taskDetail?.assignedUser?.fullName ?? taskDetail?.assignedUserName;
  const assignedUserId =
    taskDetail?.assignedUser?.userId ?? taskDetail?.assignedUserId;
  const assignedUserEmail = taskDetail?.assignedUser?.email;
  const scheduledDurationMinutes =
    taskDetail?.scheduledStartAt && taskDetail?.scheduledEndAt
      ? dayjs(taskDetail.scheduledEndAt).diff(
          dayjs(taskDetail.scheduledStartAt),
          "minute",
        )
      : null;
  const scheduledDurationLabel =
    scheduledDurationMinutes && scheduledDurationMinutes > 0
      ? `${Math.floor(scheduledDurationMinutes / 60)}h ${scheduledDurationMinutes % 60}m`
      : null;

  // ── List task row ──
  const TaskRow = ({ task, instance }: ScheduledTaskRow) => {
    const overdue =
      task.dueDate && new Date(task.dueDate).getTime() < Date.now();
    return (
      <button
        type="button"
        onClick={() => setSelectedTaskId(task.id)}
        className={`w-full rounded-lg border p-3 text-left transition hover:border-blue-300 hover:shadow-sm ${
          overdue ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"
        }`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="!mb-1 truncate text-sm font-semibold text-ink">
              {task.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {!isEmployee && (
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-3 w-3" />
                  {instance.employeeName ?? resolveName(instance.employeeUserId ?? instance.employeeId, instance.employeeId)}
                </span>
              )}
              {task.checklistName && (
                <Tag style={{ margin: 0 }}>{task.checklistName}</Tag>
              )}
              {task.dueDate && (
                <span
                  className={
                    overdue
                      ? "inline-flex items-center gap-1 font-medium text-red-500"
                      : "inline-flex items-center gap-1 text-muted"
                  }>
                  <Clock className="h-3 w-3" />
                  {dayjs(task.dueDate).format("DD/MM HH:mm")}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <TaskStatusTag status={task.rawStatus} />
            {task.scheduleStatus && task.scheduleStatus !== "UNSCHEDULED" && (
              <ScheduleStatusTag status={task.scheduleStatus} />
            )}
            {task.requiresManagerApproval && (
              <Tag color="gold" style={{ margin: 0, fontSize: 11 }}>
                {t("onboarding.task.flag.approval_short") ?? "Approval"}
              </Tag>
            )}
          </div>
        </div>
      </button>
    );
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── FILTER BAR ── */}
      {isEmployee ? (
        /* Employee: calendar-first controls */
        <Card styles={{ body: { padding: 16 } }}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
              <CalendarIcon className="h-4 w-4" />
              {t("onboarding.schedule.calendar.month_label") ?? "Lịch tháng"}
            </span>
            <Input
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              prefix={<Search className="h-3.5 w-3.5 text-gray-400" />}
              placeholder={
                t("onboarding.schedule.filter.search_placeholder_short") ??
                "Tìm task / checklist…"
              }
              className="w-64"
            />
            <div className="ml-auto">
              <Button
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={refresh}
                loading={isLoading}
              />
            </div>
          </div>
        </Card>
      ) : (
        /* HR / Manager: list or calendar with full controls */
        <Card styles={{ body: { padding: 16 } }}>
          <div className="flex flex-col gap-3">
            {/* Row 1: View toggle + Employee/Instance selects + Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View type toggle */}
              <Segmented
                value={viewType}
                onChange={(v) => setViewType(v as ViewType)}
                options={[
                  {
                    value: "list",
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <LayoutList className="h-3.5 w-3.5" />
                        {t("onboarding.schedule.view.list") ?? "Danh sách"}
                      </span>
                    ),
                  },
                  {
                    value: "calendar",
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {t("onboarding.schedule.view.calendar") ?? "Lịch"}
                      </span>
                    ),
                  },
                ]}
              />

              {/* Employee Select */}
              <Select
                showSearch
                allowClear
                value={employeeFilter === "all" ? undefined : employeeFilter}
                onChange={(v) => {
                  setEmployeeFilter(v ?? "all");
                  setInstanceFilter("all");
                }}
                placeholder={
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" />
                    {t("onboarding.schedule.filter.employee_placeholder") ?? "Nhân viên"}
                  </span>
                }
                filterOption={(input, opt) =>
                  (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                className="w-52"
                options={employeeOptions}
              />

              {/* Onboarding Instance Select */}
              <Select
                showSearch
                allowClear
                value={instanceFilter === "all" ? undefined : instanceFilter}
                onChange={(v) => setInstanceFilter(v ?? "all")}
                placeholder={
                  <span className="inline-flex items-center gap-1">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {t("onboarding.schedule.filter.instance_placeholder") ?? "Onboarding"}
                  </span>
                }
                filterOption={(input, opt) =>
                  (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                className="w-60"
                options={instanceOptions}
                disabled={instanceOptions.length === 0}
              />

              <Input
                allowClear
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                prefix={<Search className="h-3.5 w-3.5 text-gray-400" />}
                placeholder={
                  t("onboarding.schedule.filter.search_placeholder") ??
                  "Tìm task / nhân viên / checklist…"
                }
                className="w-64"
              />

              <div className="ml-auto flex items-center gap-2">
                {(employeeFilter !== "all" || instanceFilter !== "all") && (
                  <Button
                    size="small"
                    onClick={() => {
                      setEmployeeFilter("all");
                      setInstanceFilter("all");
                    }}>
                    {t("onboarding.schedule.filter.clear") ?? "Xoá bộ lọc"}
                  </Button>
                )}
                <Button
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={refresh}
                  loading={isLoading}
                />
              </div>
            </div>

            {/* Row 2: Time range + Status filter + Group mode (list only) */}
            {!isCalendarMode && (
              <div className="flex flex-wrap items-center gap-3">
                <Segmented
                  value={view}
                  onChange={(v) => setView(v as ViewMode)}
                  options={[
                    {
                      value: "week",
                      label: t("onboarding.schedule.view.week") ?? "Tuần này",
                    },
                    {
                      value: "upcoming",
                      label:
                        t("onboarding.schedule.view.upcoming") ?? "30 ngày tới",
                    },
                    {
                      value: "overdue",
                      label: t("onboarding.schedule.view.overdue") ?? "Quá hạn",
                    },
                    {
                      value: "all",
                      label: t("onboarding.schedule.view.all") ?? "Tất cả",
                    },
                  ]}
                />
                <Select
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as StatusFilter)}
                  className="w-44"
                  options={[
                    {
                      value: "all",
                      label:
                        t("onboarding.schedule.filter.status_all") ??
                        "Mọi trạng thái",
                    },
                    {
                      value: "unscheduled",
                      label:
                        t("onboarding.schedule.filter.status_open") ??
                        "Chưa bắt đầu",
                    },
                    {
                      value: "proposed",
                      label:
                        t("onboarding.schedule.filter.status_in_flight") ??
                        "Đang xử lý",
                    },
                    {
                      value: "confirmed",
                      label:
                        t(
                          "onboarding.schedule.filter.status_pending_approval",
                        ) ?? "Chờ duyệt",
                    },
                  ]}
                />
                <div className="ml-auto">
                  <Segmented
                    value={groupMode}
                    onChange={(v) => setGroupMode(v as GroupMode)}
                    options={[
                      {
                        value: "day",
                        label: (
                          <span className="inline-flex items-center gap-1.5">
                            <LayoutList className="h-3.5 w-3.5" />
                            {t("onboarding.schedule.group.day") ?? "Theo ngày"}
                          </span>
                        ),
                      },
                      {
                        value: "employee",
                        label: (
                          <span className="inline-flex items-center gap-1.5">
                            <UsersIcon className="h-3.5 w-3.5" />
                            {t("onboarding.schedule.group.employee") ?? "Theo NV"}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── STATS BAR ── */}
      {isCalendarMode || isEmployee ? (
        <div className="flex flex-wrap gap-3">
          {[
            {
              icon: <ClipboardList className="h-4 w-4 text-violet-500" />,
              label: t("onboarding.schedule.stat.total_short") ?? "Tổng task",
              value: stats.total,
              cls: "border-gray-200 bg-white",
            },
            {
              icon: <CalendarIcon className="h-4 w-4 text-blue-500" />,
              label: t("onboarding.schedule.stat.this_month") ?? "Tháng này",
              value: stats.thisMonthCount,
              cls: "border-gray-200 bg-white",
            },
            {
              icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
              label:
                t("onboarding.schedule.stat.scheduled_count") ?? "Có lịch hẹn",
              value: stats.scheduledCount,
              cls: "border-gray-200 bg-white",
            },
          ].map(({ icon, label, value, cls }) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm ${cls}`}>
              {icon}
              <span className="text-xs text-gray-500">{label}:</span>
              <span className="text-sm font-bold text-gray-800">{value}</span>
            </div>
          ))}
          {stats.overdue > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 shadow-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">
                {t("onboarding.schedule.stat.overdue") ?? "Quá hạn"}:
              </span>
              <span className="text-sm font-bold text-red-600">
                {stats.overdue}
              </span>
            </div>
          )}
          {stats.pendingApproval > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 shadow-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-600">
                {t("onboarding.schedule.stat.pending_approval") ?? "Chờ duyệt"}:
              </span>
              <span className="text-sm font-bold text-amber-700">
                {stats.pendingApproval}
              </span>
            </div>
          )}
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {[
            {
              icon: <ClipboardList className="h-5 w-5 text-violet-600" />,
              bg: "bg-violet-50",
              label:
                t("onboarding.schedule.stat.total") ?? "Tổng task theo dõi",
              value: stats.total,
            },
            {
              icon: <Clock className="h-5 w-5 text-blue-600" />,
              bg: "bg-blue-50",
              label: t("onboarding.schedule.stat.due_today") ?? "Hôm nay",
              value: stats.today,
            },
            {
              icon: <CalendarIcon className="h-5 w-5 text-amber-600" />,
              bg: "bg-amber-50",
              label:
                t("onboarding.schedule.stat.pending_approval") ??
                "Chờ phê duyệt",
              value: stats.pendingApproval,
            },
            {
              icon: <XCircle className="h-5 w-5 text-red-500" />,
              bg: "bg-red-50",
              label: t("onboarding.schedule.stat.overdue") ?? "Quá hạn",
              value: stats.overdue,
            },
          ].map(({ icon, bg, label, value }) => (
            <Col xs={12} md={6} key={label}>
              <Card styles={{ body: { padding: 16 } }}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${bg}`}>{icon}</div>
                  <div>
                    <Text type="secondary" className="text-xs">
                      {label}
                    </Text>
                    <p className="!mb-0 text-2xl font-bold text-ink">{value}</p>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ── MAIN CONTENT ── */}
      {isLoading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : isCalendarMode || isEmployee ? (
        <div className="space-y-4">
          <MonthCalendar
            calendarRows={calendarRows}
            anchor={calAnchor}
            showEmployee={canManage}
            onTaskClick={setSelectedTaskId}
            onAnchorChange={setCalAnchor}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onExpandDay={(d) => {
              setSelectedDate(d);
              setExpandedDay(d);
            }}
            resolveFn={resolveName}
            labels={{
              weekdays: weekdayLabels,
              monthNames: monthLabels,
              today: t("onboarding.schedule.action.today") ?? "Hôm nay",
              monthTotalSuffix:
                t("onboarding.schedule.calendar.month_total_suffix") ??
                "công việc trong tháng",
              scheduledLegend:
                t("onboarding.schedule.calendar.legend.scheduled") ?? "Có lịch",
              overdueLegend:
                t("onboarding.schedule.calendar.legend.overdue") ?? "Quá hạn",
              overflowTasks:
                t("onboarding.schedule.calendar.overflow_tasks") ?? "công việc",
            }}
          />
          <Card styles={{ body: { padding: 12 } }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="!mb-0 text-sm font-semibold text-gray-700">
                {(t("onboarding.schedule.calendar.selected_day") ??
                  "Công việc ngày") + ` ${selectedDate.format("DD/MM/YYYY")}`}
              </p>
              <Tag color="blue">
                {
                  (calendarRows.get(selectedDate.format("YYYY-MM-DD")) ?? [])
                    .length
                }
              </Tag>
            </div>
            {(calendarRows.get(selectedDate.format("YYYY-MM-DD")) ?? [])
              .length === 0 ? (
              <Empty
                description={
                  t("onboarding.schedule.calendar.selected_day_empty") ??
                  "Không có công việc trong ngày đã chọn"
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className="space-y-2">
                {(
                  calendarRows.get(selectedDate.format("YYYY-MM-DD")) ?? []
                ).map((r) => (
                  <TaskRow key={r.task.id} {...r} />
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : filteredRows.length === 0 ? (
        <Card>
          <Empty
            description={
              t("onboarding.schedule.empty") ??
              "Không có task nào theo bộ lọc hiện tại"
            }
          />
        </Card>
      ) : groupMode === "day" ? (
        <div className="space-y-4">
          {groupedByDay.sortedKeys.map((day) => {
            const bucket = groupedByDay.groups.get(day) ?? [];
            const djs = dayjs(day);
            const isToday = djs.isSame(dayjs(), "day");
            const isPast = djs.isBefore(dayjs(), "day");
            return (
              <Card
                key={day}
                title={
                  <div className="flex items-center gap-2">
                    <CalendarIcon
                      className={`h-4 w-4 ${isToday ? "text-emerald-500" : isPast ? "text-red-500" : "text-blue-500"}`}
                    />
                    <span className="text-sm font-semibold">
                      {djs.format("dddd, DD/MM/YYYY")}
                    </span>
                    {isToday && (
                      <Tag color="success">
                        {t("onboarding.schedule.badge.today") ?? "Hôm nay"}
                      </Tag>
                    )}
                    {isPast && !isToday && (
                      <Tag color="red">
                        {t("onboarding.schedule.stat.overdue") ?? "Quá hạn"}
                      </Tag>
                    )}
                    <Tag color="blue">{bucket.length}</Tag>
                  </div>
                }
                styles={{ body: { padding: 12 } }}>
                <div className="space-y-2">
                  {bucket.map((r) => (
                    <TaskRow key={r.task.id} {...r} />
                  ))}
                </div>
              </Card>
            );
          })}
          {groupedByDay.undated.length > 0 &&
            (view === "all" || view === "overdue") && (
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      {t("onboarding.schedule.no_due_date") ?? "Chưa có hạn"}
                    </span>
                    <Tag>{groupedByDay.undated.length}</Tag>
                  </div>
                }
                styles={{ body: { padding: 12 } }}>
                <div className="space-y-2">
                  {groupedByDay.undated.map((r) => (
                    <TaskRow key={r.task.id} {...r} />
                  ))}
                </div>
              </Card>
            )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByEmployee.map(({ instance, tasks }) => {
            const hasOverdue = tasks.some(
              (r) =>
                r.task.dueDate &&
                new Date(r.task.dueDate).getTime() < Date.now(),
            );
            return (
              <Card
                key={instance.id}
                className={`border-l-4 ${hasOverdue ? "border-l-red-400" : "border-l-blue-400"}`}
                title={
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {(instance.employeeName ??
                        resolveName(instance.employeeUserId ?? instance.employeeId, instance.employeeId) ??
                        "?")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="!mb-0 text-sm font-semibold text-ink">
                        {instance.employeeName ?? resolveName(instance.employeeUserId ?? instance.employeeId, instance.employeeId) ?? "—"}
                      </p>
                      {instance.templateName && (
                        <p className="!mb-0 text-xs text-muted">
                          {instance.templateName}
                        </p>
                      )}
                    </div>
                    <Tag color="blue">{tasks.length}</Tag>
                    {hasOverdue && (
                      <Tag color="red">
                        {t("onboarding.schedule.stat.overdue") ?? "Quá hạn"}
                      </Tag>
                    )}
                  </div>
                }
                styles={{ body: { padding: 12 } }}>
                <div className="space-y-2">
                  {tasks.map((r) => (
                    <TaskRow key={r.task.id} {...r} />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(expandedDay)}
        title={`${t("onboarding.schedule.calendar.more_tasks_title") ?? "Danh sách công việc"} ${expandedDay?.format("DD/MM/YYYY") ?? ""}`}
        onCancel={() => setExpandedDay(null)}
        footer={null}>
        {expandedDayRows.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              t("onboarding.schedule.calendar.selected_day_empty") ??
              "Không có công việc trong ngày đã chọn"
            }
          />
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {expandedDayRows.map(({ task, instance }) => (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setExpandedDay(null);
                }}
                className="w-full rounded-lg border border-gray-200 p-3 text-left transition hover:border-blue-300 hover:shadow-sm">
                <p className="!mb-1 truncate text-sm font-semibold text-ink">
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3 w-3" />
                    {instance.employeeName ?? resolveName(instance.employeeUserId ?? instance.employeeId, instance.employeeId)}
                  </span>
                  {task.checklistName && (
                    <Tag style={{ margin: 0 }}>{task.checklistName}</Tag>
                  )}
                  {task.dueDate && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dayjs(task.dueDate).format("DD/MM HH:mm")}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* ── DETAIL DRAWER ── */}
      <Drawer
        open={Boolean(selectedTaskId)}
        width={560}
        onClose={() => setSelectedTaskId(null)}
        title={
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-violet-500" />
            <span className="truncate">
              {taskDetail?.title ??
                t("onboarding.schedule.drawer.title") ??
                "Chi tiết lịch"}
            </span>
          </div>
        }>
        {loadingDetail ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : !taskDetail ? (
          <Empty
            description={
              t("onboarding.task.detail.not_found") ?? "Không tìm thấy task"
            }
          />
        ) : (
          <div className="space-y-4">
            {/* ── Status badges ── */}
            <div className="flex flex-wrap items-center gap-2">
              <ScheduleStatusTag
                status={taskDetail.scheduleStatus ?? "UNSCHEDULED"}
              />
              <TaskStatusTag status={taskDetail.status} />
              {taskDetail.overdue && (
                <Tag color="error">
                  {t("onboarding.task.stat.overdue") ?? "Quá hạn"}
                </Tag>
              )}
              {taskDetail.dueInHours != null && taskDetail.dueInHours <= 24 && !taskDetail.overdue && (
                <Tag color="warning">
                  {`Còn ${taskDetail.dueInHours}h`}
                </Tag>
              )}
            </div>

            {/* ── Description ── */}
            {taskDetail.description && (
              <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.task.field.description") ?? "Mô tả"}
                </Text>
                <p className="!mb-0 mt-1 whitespace-pre-line text-sm text-gray-700">
                  {taskDetail.description}
                </p>
              </div>
            )}

            {/* ── Schedule times ── */}
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <div className="rounded-lg border border-gray-200 p-3">
                  <Text type="secondary" className="text-xs">
                    {t("onboarding.schedule.field.start") ?? "Bắt đầu"}
                  </Text>
                  <p className="!mb-0 mt-1 text-sm font-medium">
                    {formatDateTime(taskDetail.scheduledStartAt)}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className="rounded-lg border border-gray-200 p-3">
                  <Text type="secondary" className="text-xs">
                    {t("onboarding.schedule.field.end") ?? "Kết thúc"}
                  </Text>
                  <p className="!mb-0 mt-1 text-sm font-medium">
                    {formatDateTime(taskDetail.scheduledEndAt)}
                  </p>
                </div>
              </Col>
              {scheduledDurationLabel && (
                <Col span={12}>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <Text type="secondary" className="text-xs">
                      {t("onboarding.schedule.field.duration") ?? "Thời lượng"}
                    </Text>
                    <p className="!mb-0 mt-1 text-sm font-medium">
                      {scheduledDurationLabel}
                    </p>
                  </div>
                </Col>
              )}
              {taskDetail.dueDate && (
                <Col span={12}>
                  <div className={`rounded-lg border p-3 ${taskDetail.overdue ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
                    <Text type="secondary" className="text-xs">
                      {t("onboarding.schedule.field.due_date") ?? "Hạn"}
                    </Text>
                    <p className={`!mb-0 mt-1 text-sm font-medium ${taskDetail.overdue ? "text-red-600" : ""}`}>
                      {dayjs(taskDetail.dueDate).format("DD/MM/YYYY HH:mm")}
                    </p>
                  </div>
                </Col>
              )}
            </Row>

            {/* ── Checklist / Stage ── */}
            {(taskDetail.checklistName || taskDetail.checklist?.stage) && (
              <div className="rounded-lg border border-gray-200 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.task.field.checklist") ?? "Giai đoạn"}
                </Text>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {taskDetail.checklistName && (
                    <span className="text-sm font-medium text-gray-800">
                      {taskDetail.checklistName}
                    </span>
                  )}
                  {taskDetail.checklist?.stage && (
                    <Tag color="geekblue" style={{ margin: 0 }}>
                      {taskDetail.checklist.stage}
                    </Tag>
                  )}
                </div>
              </div>
            )}

            {/* ── Assignee + Department ── */}
            {(assignedUserName || assignedUserId || assignedUserEmail || taskDetail.assignedDepartment) && (
              <div className="rounded-lg border border-gray-200 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.task.field.assignee") ?? "Người / Bộ phận thực hiện"}
                </Text>
                {(assignedUserName || assignedUserId) && (
                  <p className="!mb-0 mt-1 flex items-center gap-1 text-sm font-medium">
                    <UserRound className="h-3.5 w-3.5 text-gray-400" />
                    {assignedUserName ?? resolveName(assignedUserId)}
                  </p>
                )}
                {assignedUserEmail && (
                  <p className="!mb-0 mt-0.5 text-xs text-gray-500">
                    {assignedUserEmail}
                  </p>
                )}
                {taskDetail.assignedDepartment && (
                  <p className="!mb-0 mt-0.5 text-xs text-gray-500">
                    {(t("onboarding.task.field.department") ?? "Bộ phận") + ": "}
                    <span className="font-medium">
                      {taskDetail.assignedDepartment.name ?? taskDetail.assignedDepartment.departmentId}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* ── Completion requirements ── */}
            {(taskDetail.requireAck ||
              taskDetail.requireDoc ||
              taskDetail.requiresManagerApproval) && (
              <div className="rounded-lg border border-gray-200 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.task.prereq.section_title") ??
                    "Điều kiện hoàn thành"}
                </Text>
                <div className="mt-2 flex flex-wrap gap-2">
                  {taskDetail.requireAck && (
                    <Tag color="geekblue">
                      {t("onboarding.task.flag.requires_ack") ?? "Cần xác nhận"}
                    </Tag>
                  )}
                  {taskDetail.requireDoc && (
                    <Tag color="purple">
                      {t("onboarding.task.flag.requires_doc") ??
                        "Cần đính kèm tài liệu"}
                    </Tag>
                  )}
                  {taskDetail.requiresManagerApproval && (
                    <Tag color="gold">
                      {t("onboarding.task.flag.requires_approval") ??
                        "Cần phê duyệt"}
                    </Tag>
                  )}
                </div>
              </div>
            )}

            {/* ── Acknowledgment ── */}
            {taskDetail.requireAck && (taskDetail.acknowledgedAt || taskDetail.acknowledgedBy) && (
              <div className="rounded-lg border border-geekblue-200 bg-blue-50/30 p-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  <Text type="secondary" className="text-xs">
                    {t("onboarding.task.ack.section_title") ?? "Đã xác nhận"}
                  </Text>
                </div>
                {taskDetail.acknowledgedBy && (
                  <p className="!mb-0 mt-1 text-sm font-medium text-gray-800">
                    {resolveName(taskDetail.acknowledgedBy)}
                  </p>
                )}
                {taskDetail.acknowledgedAt && (
                  <p className="!mb-0 mt-0.5 text-xs text-gray-500">
                    {formatDateTime(taskDetail.acknowledgedAt)}
                  </p>
                )}
              </div>
            )}

            {/* ── Approval ── */}
            {taskDetail.approvalStatus && taskDetail.approvalStatus !== "NONE" && (
              <div className={`rounded-lg border p-3 ${
                taskDetail.approvalStatus === "APPROVED"
                  ? "border-emerald-200 bg-emerald-50/30"
                  : taskDetail.approvalStatus === "REJECTED"
                    ? "border-red-200 bg-red-50/30"
                    : "border-amber-200 bg-amber-50/30"
              }`}>
                <div className="flex items-center gap-1.5">
                  {taskDetail.approvalStatus === "APPROVED" ? (
                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : taskDetail.approvalStatus === "REJECTED" ? (
                    <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <Text type="secondary" className="text-xs">
                    {t("onboarding.task.approval.section_title") ?? "Phê duyệt"}
                  </Text>
                  <Tag
                    color={
                      taskDetail.approvalStatus === "APPROVED"
                        ? "success"
                        : taskDetail.approvalStatus === "REJECTED"
                          ? "error"
                          : "warning"
                    }
                    style={{ margin: 0, fontSize: 11 }}>
                    {taskDetail.approvalStatus}
                  </Tag>
                </div>
                {taskDetail.approvedBy && (
                  <p className="!mb-0 mt-1 text-sm font-medium text-gray-800">
                    {resolveName(taskDetail.approvedBy)}
                  </p>
                )}
                {taskDetail.approvedAt && (
                  <p className="!mb-0 mt-0.5 text-xs text-gray-500">
                    {formatDateTime(taskDetail.approvedAt)}
                  </p>
                )}
                {taskDetail.rejectionReason && (
                  <p className="!mb-0 mt-1 text-sm text-red-600">
                    {taskDetail.rejectionReason}
                  </p>
                )}
              </div>
            )}

            {/* ── Schedule history ── */}
            {(taskDetail.scheduleProposedBy ||
              taskDetail.scheduleConfirmedBy ||
              taskDetail.scheduleProposedAt ||
              taskDetail.scheduleConfirmedAt) && (
              <div className="rounded-lg border border-gray-200 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.task.schedule.section_title") ?? "Lịch sử lịch hẹn"}
                </Text>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  {taskDetail.scheduleProposedBy && (
                    <p className="!mb-0">
                      <span className="text-gray-500">
                        {t("onboarding.task.schedule.field.proposed_by") ?? "Đề xuất bởi"}:{" "}
                      </span>
                      <span className="font-medium">{resolveName(taskDetail.scheduleProposedBy)}</span>
                      {taskDetail.scheduleProposedAt && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({formatDateTime(taskDetail.scheduleProposedAt)})
                        </span>
                      )}
                    </p>
                  )}
                  {taskDetail.scheduleConfirmedBy && (
                    <p className="!mb-0">
                      <span className="text-gray-500">
                        {t("onboarding.task.schedule.field.confirmed_by") ?? "Xác nhận bởi"}:{" "}
                      </span>
                      <span className="font-medium">{resolveName(taskDetail.scheduleConfirmedBy)}</span>
                      {taskDetail.scheduleConfirmedAt && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({formatDateTime(taskDetail.scheduleConfirmedAt)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Timestamps ── */}
            <Row gutter={[12, 12]}>
              {taskDetail.createdAt && (
                <Col span={12}>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <Text type="secondary" className="text-xs">
                      {t("onboarding.task.field.created_at") ?? "Ngày tạo"}
                    </Text>
                    <p className="!mb-0 mt-1 text-sm font-medium">
                      {formatDateTime(taskDetail.createdAt)}
                    </p>
                  </div>
                </Col>
              )}
              {taskDetail.updatedAt && (
                <Col span={12}>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <Text type="secondary" className="text-xs">
                      {t("onboarding.task.field.updated_at") ?? "Cập nhật lần cuối"}
                    </Text>
                    <p className="!mb-0 mt-1 text-sm font-medium">
                      {formatDateTime(taskDetail.updatedAt)}
                    </p>
                  </div>
                </Col>
              )}
              {taskDetail.completedAt && (
                <Col span={12}>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/20 p-3">
                    <Text type="secondary" className="text-xs">
                      {t("onboarding.task.field.completed_at") ?? "Ngày hoàn thành"}
                    </Text>
                    <p className="!mb-0 mt-1 text-sm font-medium text-emerald-700">
                      {formatDateTime(taskDetail.completedAt)}
                    </p>
                  </div>
                </Col>
              )}
            </Row>

            {/* ── Required documents list ── */}
            {(taskDetail.requiredDocuments?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-500" />
                  <Text type="secondary" className="text-xs">
                    {t("onboarding.task.detail.required_docs") ?? "Tài liệu yêu cầu"}
                  </Text>
                  <Tag style={{ margin: 0, fontSize: 11 }}>
                    {taskDetail.requiredDocuments!.length}
                  </Tag>
                </div>
                <div className="space-y-1">
                  {taskDetail.requiredDocuments!.map((doc) => (
                    <div
                      key={doc.documentId}
                      className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1.5 text-sm">
                      <FileText className="h-3 w-3 shrink-0 text-gray-400" />
                      <span className="truncate text-gray-700">{doc.title ?? doc.documentId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Attachments list ── */}
            {(taskDetail.attachments?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5 text-blue-500" />
                  <Text type="secondary" className="text-xs">
                    {t("onboarding.task.detail.attachments") ?? "Tệp đính kèm"}
                  </Text>
                  <Tag style={{ margin: 0, fontSize: 11 }}>
                    {taskDetail.attachments!.length}
                  </Tag>
                </div>
                <div className="space-y-1">
                  {taskDetail.attachments!.map((att) => (
                    <a
                      key={att.attachmentId}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md bg-blue-50 px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-100 hover:underline">
                      <Download className="h-3 w-3 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{att.fileName}</span>
                      {att.fileSizeBytes && (
                        <span className="shrink-0 text-[10px] text-blue-400">
                          {(att.fileSizeBytes / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Reschedule / Cancel / No-show reasons ── */}
            {taskDetail.scheduleRescheduleReason && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.schedule.field.reschedule_reason") ?? "Lý do dời lịch"}
                </Text>
                <p className="!mb-0 mt-1 text-sm">
                  {taskDetail.scheduleRescheduleReason}
                </p>
              </div>
            )}

            {taskDetail.scheduleCancelReason && (
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.schedule.field.cancel_reason") ?? "Lý do huỷ"}
                </Text>
                <p className="!mb-0 mt-1 text-sm">
                  {taskDetail.scheduleCancelReason}
                </p>
              </div>
            )}

            {taskDetail.scheduleNoShowReason && (
              <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.schedule.field.no_show_reason") ?? "Lý do bỏ lỡ"}
                </Text>
                <p className="!mb-0 mt-1 text-sm">
                  {taskDetail.scheduleNoShowReason}
                </p>
              </div>
            )}

            {/* ── Comments (recent 5) ── */}
            {(taskDetail.comments?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                  <Text type="secondary" className="text-xs">
                    {t("onboarding.task.comments.title") ?? "Bình luận"}
                  </Text>
                  <Tag style={{ margin: 0, fontSize: 11 }}>
                    {taskDetail.comments!.length}
                  </Tag>
                </div>
                <div className="space-y-2">
                  {taskDetail.comments!.slice(0, 5).map((c) => (
                    <div key={c.commentId} className="rounded-md bg-gray-50 p-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <UserRound className="h-3 w-3" />
                        <span className="font-medium text-gray-700">
                          {c.authorName ?? c.createdByName ?? resolveName(c.authorId)}
                        </span>
                        <span className="ml-auto">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="!mb-0 mt-1 text-xs text-gray-700">
                        {c.content ?? c.message}
                      </p>
                    </div>
                  ))}
                  {taskDetail.comments!.length > 5 && (
                    <p className="!mb-0 text-center text-xs text-gray-400">
                      {`+${taskDetail.comments!.length - 5} bình luận khác`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Activity logs (recent 5) ── */}
            {(taskDetail.activityLogs?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
                  <Text type="secondary" className="text-xs">
                    {t("onboarding.task.activity.section_title") ?? "Lịch sử hoạt động"}
                  </Text>
                  <Tag style={{ margin: 0, fontSize: 11 }}>
                    {taskDetail.activityLogs!.length}
                  </Tag>
                </div>
                <div className="space-y-1.5">
                  {taskDetail.activityLogs!.slice(0, 5).map((log) => (
                    <div
                      key={log.logId}
                      className="flex items-start gap-2 rounded-md bg-gray-50 px-2 py-1.5">
                      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-gray-700">
                          {log.action}
                        </span>
                        {(log.oldValue || log.newValue) && (
                          <span className="ml-1 text-[10px] text-gray-400">
                            {log.oldValue && `${log.oldValue} → `}
                            {log.newValue}
                          </span>
                        )}
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
                          {(log.actorName || log.actorUserId) && (
                            <span>{log.actorName ?? resolveName(log.actorUserId)}</span>
                          )}
                          <span>{formatDateTime(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {taskDetail.activityLogs!.length > 5 && (
                    <p className="!mb-0 text-center text-xs text-gray-400">
                      {`+${taskDetail.activityLogs!.length - 5} hoạt động khác`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Actions — HR/Manager only ── */}
            {canManage && (
              <div className="flex flex-wrap gap-2 pt-2">
                {taskDetail.scheduleStatus === "PROPOSED" && (
                  <Button
                    type="primary"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    loading={confirmMutation.isPending}
                    onClick={() => confirmMutation.mutate(taskDetail.taskId)}>
                    {t("onboarding.schedule.action.confirm") ?? "Xác nhận"}
                  </Button>
                )}
                <Button
                  icon={<CalendarIcon className="h-4 w-4" />}
                  onClick={openReschedule}>
                  {t("onboarding.schedule.action.reschedule") ?? "Dời lịch"}
                </Button>
                <Button
                  danger
                  icon={<X className="h-4 w-4" />}
                  onClick={() => setCancelOpen(true)}>
                  {t("onboarding.schedule.action.cancel") ?? "Huỷ lịch"}
                </Button>
                <Button
                  icon={<XCircle className="h-4 w-4" />}
                  onClick={() => setNoShowOpen(true)}>
                  {t("onboarding.schedule.action.mark_no_show") ?? "Bỏ lỡ"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── RESCHEDULE MODAL ── */}
      <Modal
        open={rescheduleOpen}
        title={t("onboarding.schedule.reschedule.title") ?? "Dời lịch hẹn"}
        onCancel={() => setRescheduleOpen(false)}
        onOk={submitReschedule}
        okButtonProps={{ loading: rescheduleMutation.isPending }}
        okText={t("onboarding.schedule.action.reschedule") ?? "Dời lịch"}
        cancelText={t("global.cancel_action") ?? "Huỷ"}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="scheduledStartAt"
            label={t("onboarding.schedule.field.start") ?? "Bắt đầu"}
            rules={[{ required: true }]}>
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item
            name="scheduledEndAt"
            label={t("onboarding.schedule.field.end") ?? "Kết thúc"}>
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item
            name="reason"
            label={t("onboarding.schedule.field.reason") ?? "Lý do"}>
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── CANCEL MODAL ── */}
      <Modal
        open={cancelOpen}
        title={t("onboarding.schedule.cancel.title") ?? "Huỷ lịch hẹn"}
        onCancel={() => setCancelOpen(false)}
        okButtonProps={{ danger: true, loading: cancelMutation.isPending }}
        okText={t("onboarding.schedule.action.cancel") ?? "Huỷ lịch"}
        cancelText={t("global.cancel_action") ?? "Đóng"}
        onOk={async () => {
          if (!taskDetail) return;
          const v = await reasonForm.validateFields();
          cancelMutation.mutate({
            taskId: taskDetail.taskId,
            reason: v.reason,
          });
        }}>
        <Form form={reasonForm} layout="vertical">
          <Form.Item
            name="reason"
            label={t("onboarding.schedule.field.reason") ?? "Lý do"}>
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── NO-SHOW MODAL ── */}
      <Modal
        open={noShowOpen}
        title={t("onboarding.schedule.no_show.title") ?? "Đánh dấu bỏ lỡ"}
        onCancel={() => setNoShowOpen(false)}
        okButtonProps={{ loading: noShowMutation.isPending }}
        okText={t("onboarding.schedule.action.mark_no_show") ?? "Bỏ lỡ"}
        cancelText={t("global.cancel_action") ?? "Đóng"}
        onOk={async () => {
          if (!taskDetail) return;
          const v = await reasonForm.validateFields();
          noShowMutation.mutate({
            taskId: taskDetail.taskId,
            reason: v.reason,
          });
        }}>
        <Form form={reasonForm} layout="vertical">
          <Form.Item
            name="reason"
            label={t("onboarding.schedule.field.reason") ?? "Lý do"}>
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OnboardingSchedule;
