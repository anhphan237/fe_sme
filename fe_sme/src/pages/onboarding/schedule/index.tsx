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
  ClipboardList,
  Clock,
  LayoutList,
  RefreshCw,
  Search,
  UserRound,
  Users as UsersIcon,
  X,
  XCircle,
} from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
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
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";
import type { TaskDetailResponse } from "@/interface/onboarding";

const { Text } = Typography;

type GroupMode = "day" | "employee";
type ViewMode = "week" | "upcoming" | "all" | "overdue";
type StatusFilter = "all" | "proposed" | "confirmed" | "unscheduled";

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

const formatDateTime = (value?: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";

interface ScheduledTaskRow {
  task: OnboardingTask;
  instance: OnboardingInstance;
}

const OnboardingSchedule = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.currentUser);
  const roles = currentUser?.roles ?? [];
  const canManage = canManageOnboarding(roles);
  const isEmployee = roles.includes("EMPLOYEE") && !canManage;

  const [groupMode, setGroupMode] = useState<GroupMode>("day");
  const [view, setView] = useState<ViewMode>("week");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [keyword, setKeyword] = useState("");

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [form] = Form.useForm<{
    scheduledStartAt: Dayjs;
    scheduledEndAt?: Dayjs;
    reason?: string;
  }>();
  const [reasonForm] = Form.useForm<{ reason?: string }>();

  // ── Fetch instances (ACTIVE) ──
  const { data: instances = [], isLoading: loadingInstances } = useQuery({
    queryKey: ["schedule-instances", currentUser?.id ?? "", canManage],
    queryFn: () =>
      canManage
        ? apiListInstances({ status: "ACTIVE" })
        : apiListInstances({
            status: "ACTIVE",
            employeeId: currentUser?.id,
          }),
    enabled: Boolean(currentUser?.id),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

  // Manager filter: only their team's instances
  const scopedInstances = useMemo(() => {
    if (!canManage && isEmployee) {
      return instances.filter(
        (i) =>
          i.employeeUserId === currentUser?.id ||
          i.employeeId === currentUser?.id,
      );
    }
    if (roles.includes("MANAGER") && !roles.includes("HR")) {
      return instances.filter((i) => i.managerUserId === currentUser?.id);
    }
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

  // ── Task detail (for drawer) ──
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

  // ── Build rows ──
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

  // Time-range filter
  const filteredByView = useMemo(() => {
    const now = dayjs();
    const startOfToday = now.startOf("day");
    if (view === "all") return rows;
    if (view === "overdue") {
      return rows.filter(
        (r) => r.task.dueDate && dayjs(r.task.dueDate).isBefore(startOfToday),
      );
    }
    const end = view === "week" ? now.add(7, "day") : now.add(30, "day");
    return rows.filter(({ task }) => {
      if (!task.dueDate) return false;
      const d = dayjs(task.dueDate);
      return d.isAfter(startOfToday.subtract(1, "minute")) && d.isBefore(end);
    });
  }, [rows, view]);

  // Status filter
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return filteredByView;
    if (statusFilter === "unscheduled")
      return filteredByView.filter(
        (r) =>
          !r.task.rawStatus ||
          ["TODO", "ASSIGNED"].includes(r.task.rawStatus ?? ""),
      );
    if (statusFilter === "proposed")
      return filteredByView.filter(
        (r) =>
          r.task.rawStatus === "IN_PROGRESS" ||
          r.task.rawStatus === "WAIT_ACK",
      );
    if (statusFilter === "confirmed")
      return filteredByView.filter(
        (r) => r.task.rawStatus === "PENDING_APPROVAL",
      );
    return filteredByView;
  }, [filteredByView, statusFilter]);

  // Keyword filter
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

  // Group by day
  const groupedByDay = useMemo(() => {
    const groups = new Map<string, ScheduledTaskRow[]>();
    const undated: ScheduledTaskRow[] = [];
    for (const row of filteredRows) {
      const dueDate = row.task.dueDate;
      if (!dueDate) {
        undated.push(row);
        continue;
      }
      const key = dayjs(dueDate).format("YYYY-MM-DD");
      const bucket = groups.get(key) ?? [];
      bucket.push(row);
      groups.set(key, bucket);
    }
    for (const bucket of groups.values()) {
      bucket.sort(
        (a, b) =>
          new Date(a.task.dueDate!).getTime() -
          new Date(b.task.dueDate!).getTime(),
      );
    }
    const sortedKeys = Array.from(groups.keys()).sort();
    return { groups, sortedKeys, undated };
  }, [filteredRows]);

  // Group by employee
  const groupedByEmployee = useMemo(() => {
    const groups = new Map<
      string,
      {
        instance: OnboardingInstance;
        tasks: ScheduledTaskRow[];
      }
    >();
    for (const row of filteredRows) {
      const key = row.instance.id;
      const g = groups.get(key) ?? { instance: row.instance, tasks: [] };
      g.tasks.push(row);
      groups.set(key, g);
    }
    for (const g of groups.values()) {
      g.tasks.sort((a, b) => {
        const ad = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Infinity;
        const bd = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Infinity;
        return ad - bd;
      });
    }
    return Array.from(groups.values()).sort(
      (a, b) => b.tasks.length - a.tasks.length,
    );
  }, [filteredRows]);

  const stats = useMemo(() => {
    const now = Date.now();
    const total = rows.length;
    const today = rows.filter(
      (r) => r.task.dueDate && dayjs(r.task.dueDate).isSame(dayjs(), "day"),
    ).length;
    const overdue = rows.filter(
      (r) => r.task.dueDate && new Date(r.task.dueDate).getTime() < now,
    ).length;
    const pendingApproval = rows.filter(
      (r) => r.task.rawStatus === "PENDING_APPROVAL",
    ).length;
    return { total, today, overdue, pendingApproval };
  }, [rows]);

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
      notify.error(t("onboarding.schedule.toast.failed") ?? "Thao tác thất bại"),
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
      notify.error(t("onboarding.schedule.toast.failed") ?? "Thao tác thất bại"),
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
      notify.error(t("onboarding.schedule.toast.failed") ?? "Thao tác thất bại"),
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
      notify.error(t("onboarding.schedule.toast.failed") ?? "Thao tác thất bại"),
  });

  // ── Helpers ──
  const ScheduleStatusTag = ({ status }: { status?: string }) => {
    const key = (status ?? "UNSCHEDULED").toUpperCase();
    const meta = STATUS_META[key] ?? STATUS_META.UNSCHEDULED;
    return <Tag color={meta.color}>{t(meta.labelKey) ?? meta.fallback}</Tag>;
  };

  const TaskStatusTag = ({ status }: { status?: string }) => {
    if (!status) return null;
    const labelKey = `onboarding.task.status.${status.toLowerCase()}`;
    const label = t(labelKey);
    const display = label.startsWith("onboarding.task.status.") ? status : label;
    return (
      <Tag color={TASK_STATUS_COLOR[status] ?? "default"}>{display}</Tag>
    );
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

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["schedule-instances"] });
    void queryClient.invalidateQueries({ queryKey: ["schedule-tasks"] });
  };

  const isLoading =
    loadingInstances || (scopedInstances.length > 0 && tasksLoading);

  // ── Row renderer ──
  const TaskRow = ({ task, instance }: ScheduledTaskRow) => {
    const overdue =
      task.dueDate && new Date(task.dueDate).getTime() < Date.now();
    return (
      <button
        key={task.id}
        type="button"
        onClick={() => setSelectedTaskId(task.id)}
        className={`w-full rounded-lg border p-3 text-left transition hover:border-blue-300 hover:shadow-sm ${
          overdue
            ? "border-red-200 bg-red-50/30"
            : "border-gray-200 bg-white"
        }`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="!mb-1 truncate text-sm font-semibold text-ink">
              {task.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3 w-3" />
                {instance.employeeName ?? instance.employeeId}
              </span>
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

  // ── Render ──
  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <Card styles={{ body: { padding: 16 } }}>
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
                label: t("onboarding.schedule.view.upcoming") ?? "30 ngày tới",
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
                label: t("onboarding.schedule.filter.status_all") ?? "Mọi trạng thái",
              },
              {
                value: "unscheduled",
                label: t("onboarding.schedule.filter.status_open") ?? "Chưa bắt đầu",
              },
              {
                value: "proposed",
                label: t("onboarding.schedule.filter.status_in_flight") ?? "Đang xử lý",
              },
              {
                value: "confirmed",
                label: t("onboarding.schedule.filter.status_pending_approval") ?? "Chờ duyệt",
              },
            ]}
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
            className="w-72"
          />
          <div className="ml-auto flex items-center gap-2">
            <Segmented
              value={groupMode}
              onChange={(v) => setGroupMode(v as GroupMode)}
              options={[
                {
                  value: "day",
                  label: (
                    <span className="inline-flex items-center gap-1">
                      <LayoutList className="h-3.5 w-3.5" />
                      {t("onboarding.schedule.group.day") ?? "Theo ngày"}
                    </span>
                  ),
                },
                {
                  value: "employee",
                  label: (
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {t("onboarding.schedule.group.employee") ?? "Theo NV"}
                    </span>
                  ),
                },
              ]}
            />
            <Button
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={refresh}
              loading={isLoading}
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-50 p-2">
                <ClipboardList className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.schedule.stat.total") ?? "Tổng task theo dõi"}
                </Text>
                <p className="!mb-0 text-2xl font-bold text-ink">
                  {stats.total}
                </p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.schedule.stat.due_today") ?? "Hôm nay"}
                </Text>
                <p className="!mb-0 text-2xl font-bold text-ink">
                  {stats.today}
                </p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <CalendarIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.schedule.stat.pending_approval") ??
                    "Chờ phê duyệt"}
                </Text>
                <p className="!mb-0 text-2xl font-bold text-ink">
                  {stats.pendingApproval}
                </p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 p-2">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.schedule.stat.overdue") ?? "Quá hạn"}
                </Text>
                <p className="!mb-0 text-2xl font-bold text-ink">
                  {stats.overdue}
                </p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Content */}
      {isLoading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
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
                      className={`h-4 w-4 ${
                        isToday
                          ? "text-emerald-500"
                          : isPast
                            ? "text-red-500"
                            : "text-blue-500"
                      }`}
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

          {groupedByDay.undated.length > 0 && (view === "all" || view === "overdue") && (
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
                      {(instance.employeeName ?? instance.employeeId ?? "?")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="!mb-0 text-sm font-semibold text-ink">
                        {instance.employeeName ?? instance.employeeId ?? "—"}
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

      {/* Detail drawer */}
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
            </div>

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
              {taskDetail.dueDate && (
                <Col span={12}>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <Text type="secondary" className="text-xs">
                      {t("onboarding.schedule.field.due_date") ?? "Hạn"}
                    </Text>
                    <p className="!mb-0 mt-1 text-sm font-medium">
                      {dayjs(taskDetail.dueDate).format("DD/MM/YYYY")}
                    </p>
                  </div>
                </Col>
              )}
              {taskDetail.checklistName && (
                <Col span={12}>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <Text type="secondary" className="text-xs">
                      {t("onboarding.task.field.checklist") ?? "Giai đoạn"}
                    </Text>
                    <p className="!mb-0 mt-1 text-sm font-medium">
                      {taskDetail.checklistName}
                    </p>
                  </div>
                </Col>
              )}
            </Row>

            {taskDetail.description && (
              <div>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.task.field.description") ?? "Mô tả"}
                </Text>
                <div className="mt-1 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                  {taskDetail.description}
                </div>
              </div>
            )}

            {(taskDetail.assignedUserName || taskDetail.assignedUserId) && (
              <div className="rounded-lg border border-gray-200 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.task.field.assignee") ?? "Người thực hiện"}
                </Text>
                <p className="!mb-0 mt-1 flex items-center gap-1 text-sm font-medium">
                  <UserRound className="h-3.5 w-3.5 text-gray-400" />
                  {taskDetail.assignedUserName ?? taskDetail.assignedUserId}
                </p>
              </div>
            )}

            {taskDetail.scheduleRescheduleReason && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.schedule.field.reschedule_reason") ??
                    "Lý do dời lịch"}
                </Text>
                <p className="!mb-0 mt-1 text-sm">
                  {taskDetail.scheduleRescheduleReason}
                </p>
              </div>
            )}

            {taskDetail.scheduleCancelReason && (
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                <Text type="secondary" className="text-xs">
                  {t("onboarding.schedule.field.cancel_reason") ??
                    "Lý do huỷ"}
                </Text>
                <p className="!mb-0 mt-1 text-sm">
                  {taskDetail.scheduleCancelReason}
                </p>
              </div>
            )}

            {/* Actions */}
            {canManage && (
              <div className="flex flex-wrap gap-2 pt-2">
                {taskDetail.scheduleStatus === "PROPOSED" && (
                  <Button
                    type="primary"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    loading={confirmMutation.isPending}
                    onClick={() =>
                      confirmMutation.mutate(taskDetail.taskId)
                    }>
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

      {/* Reschedule modal */}
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

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        title={t("onboarding.schedule.cancel.title") ?? "Huỷ lịch hẹn"}
        onCancel={() => setCancelOpen(false)}
        okButtonProps={{
          danger: true,
          loading: cancelMutation.isPending,
        }}
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

      {/* No-show modal */}
      <Modal
        open={noShowOpen}
        title={t("onboarding.schedule.no_show.title") ?? "Đánh dấu bỏ lỡ"}
        onCancel={() => setNoShowOpen(false)}
        okButtonProps={{
          loading: noShowMutation.isPending,
        }}
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
