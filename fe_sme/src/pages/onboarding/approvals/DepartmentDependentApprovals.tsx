import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Search,
  User as UserIcon,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Skeleton,
  Tag,
} from "antd";
import { apiListTaskDepartmentDependentTasks } from "@/api/onboarding/onboarding.api";
import { AppLoading } from "@/components/page-loading";
import { useLocale } from "@/i18n";
import type { TaskDepartmentDependentItem } from "@/interface/onboarding";
import { ConfirmCheckpointModal } from "./components/dept/ConfirmCheckpointModal";
import { DeptTaskDrawer } from "./components/dept/DeptTaskDrawer";

const PAGE_SIZE = 100;
const EMPTY_TEXT = "--";

type CheckpointTab = "PENDING" | "CONFIRMED";
type MetricTone = "blue" | "amber" | "red" | "green";

interface ConfirmTarget {
  taskId: string;
  taskTitle: string;
  checklistName?: string;
  requireEvidence: boolean;
}

interface DepartmentDependentApprovalsProps {
  departmentId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  resolveUserName: (id: string | null | undefined, fallback?: string) => string;
  onConfirmed: () => void;
  onTotalChange?: (total: number) => void;
}

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  tone: MetricTone;
  loading?: boolean;
}

interface TaskCardProps {
  item: TaskDepartmentDependentItem;
  locale: string;
  assignedUserName: string;
  pendingLabel: string;
  confirmedLabel: string;
  requireEvidenceLabel: string;
  overdueLabel: string;
  confirmLabel: string;
  detailLabel: string;
  checklistLabel: string;
  onboardingLabel: string;
  noAssigneeLabel: string;
  onOpen: () => void;
  onConfirm: () => void;
}

const metricToneClasses: Record<
  MetricTone,
  { icon: string; ring: string; value: string }
> = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    ring: "border-blue-100",
    value: "text-blue-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    ring: "border-amber-100",
    value: "text-amber-700",
  },
  red: {
    icon: "bg-red-50 text-red-600",
    ring: "border-red-100",
    value: "text-red-700",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    ring: "border-emerald-100",
    value: "text-emerald-700",
  },
};

const taskStatusLabels: Record<string, string> = {
  TODO: "Chưa làm",
  ASSIGNED: "Đã giao",
  WAIT_ACK: "Chờ nhận việc",
  IN_PROGRESS: "Đang xử lý",
  PENDING_APPROVAL: "Chờ duyệt",
  DONE: "Hoàn thành",
};

const taskStatusColors: Record<string, string> = {
  TODO: "default",
  ASSIGNED: "blue",
  WAIT_ACK: "orange",
  IN_PROGRESS: "processing",
  PENDING_APPROVAL: "gold",
  DONE: "success",
};

const translate = (
  t: (key: string, values?: Record<string, unknown>) => string,
  key: string,
  fallback: string,
) => {
  const value = t(key);
  return value && value !== key ? value : fallback;
};

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const isOverdue = (dueDate?: string) => {
  const date = toDate(dueDate);
  if (!date) return false;
  return startOfDay(date) < startOfDay(new Date());
};

const isDueToday = (dueDate?: string) => {
  const date = toDate(dueDate);
  if (!date) return false;
  return startOfDay(date) === startOfDay(new Date());
};

const formatDate = (value: string | undefined, locale: string) => {
  const date = toDate(value);
  if (!date) return EMPTY_TEXT;
  return date.toLocaleDateString(locale.replace("_", "-"), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value: string | undefined, locale: string) => {
  const date = toDate(value);
  if (!date) return EMPTY_TEXT;
  return date.toLocaleString(locale.replace("_", "-"), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDateValue = (value?: string) => toDate(value)?.getTime() ?? Infinity;

const getTaskStatusLabel = (status?: string) =>
  status ? (taskStatusLabels[status] ?? status) : EMPTY_TEXT;

const getTaskStatusColor = (status?: string) =>
  status ? (taskStatusColors[status] ?? "default") : "default";

const MetricCard = ({ icon, label, value, tone, loading }: MetricCardProps) => {
  const classes = metricToneClasses[tone];

  return (
    <div
      className={`flex min-h-[92px] items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm ${classes.ring}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${classes.icon}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        {loading ? (
          <Skeleton.Input
            active
            size="small"
            style={{ height: 28, marginTop: 4, width: 54 }}
          />
        ) : (
          <p className={`mt-1 text-2xl font-bold leading-none ${classes.value}`}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((item) => (
      <div key={item} className="rounded-lg border border-gray-100 bg-white p-4">
        <Skeleton active avatar paragraph={{ rows: 2 }} />
      </div>
    ))}
  </div>
);

const TaskCard = ({
  item,
  locale,
  assignedUserName,
  pendingLabel,
  confirmedLabel,
  requireEvidenceLabel,
  overdueLabel,
  confirmLabel,
  detailLabel,
  checklistLabel,
  onboardingLabel,
  noAssigneeLabel,
  onOpen,
  onConfirm,
}: TaskCardProps) => {
  const overdue = isOverdue(item.dueDate);
  const dueToday = isDueToday(item.dueDate);
  const isConfirmed = item.checkpointStatus === "CONFIRMED";
  const dueTone =
    overdue && !isConfirmed
      ? "border-red-200 bg-red-50 text-red-700"
      : dueToday && !isConfirmed
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-gray-200 bg-gray-50 text-gray-600";
  const statusTone = isConfirmed
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : overdue
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm outline-none transition hover:border-blue-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-300"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${statusTone}`}
          >
            {isConfirmed ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : overdue ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900 group-hover:text-blue-700">
                {item.title}
              </h3>
              <Tag
                color={isConfirmed ? "success" : "processing"}
                style={{ margin: 0 }}
              >
                {isConfirmed ? confirmedLabel : pendingLabel}
              </Tag>
              {item.requireEvidence && !isConfirmed && (
                <Tag color="gold" style={{ margin: 0 }}>
                  {requireEvidenceLabel}
                </Tag>
              )}
              {overdue && !isConfirmed && (
                <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-red-700">
                  {overdueLabel}
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {checklistLabel}
                </p>
                <p className="truncate font-medium text-gray-700">
                  {item.checklistName ?? EMPTY_TEXT}
                </p>
              </div>
              <div className={`rounded-md border px-2.5 py-2 ${dueTone}`}>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  Hạn xử lý
                </p>
                <p className="flex items-center gap-1.5 font-semibold">
                  {overdue && !isConfirmed ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <Calendar className="h-3.5 w-3.5" />
                  )}
                  {formatDate(item.dueDate, locale)}
                </p>
              </div>
              <div className="min-w-0 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Người phụ trách
                </p>
                <p className="flex min-w-0 items-center gap-1.5 font-medium text-gray-700">
                  <UserIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">
                    {assignedUserName || noAssigneeLabel}
                  </span>
                </p>
              </div>
              <div className="min-w-0 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {onboardingLabel}
                </p>
                <p className="truncate font-medium text-gray-700">
                  {item.onboardingId}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Tag
                color={getTaskStatusColor(item.taskStatus)}
                style={{ margin: 0 }}
              >
                {getTaskStatusLabel(item.taskStatus)}
              </Tag>
              {isConfirmed && item.confirmedAt && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {formatDateTime(item.confirmedAt, locale)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 lg:flex-col lg:items-stretch">
          <Button
            size="small"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            {detailLabel}
          </Button>
          {!isConfirmed && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={(event) => {
                event.stopPropagation();
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export function DepartmentDependentApprovals({
  departmentId,
  search,
  onSearchChange,
  resolveUserName,
  onConfirmed,
  onTotalChange,
}: DepartmentDependentApprovalsProps) {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();

  const [checkpointTab, setCheckpointTab] = useState<CheckpointTab>("PENDING");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(
    null,
  );
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(
    null,
  );
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);

  const labels = useMemo(
    () => ({
      title: "Checkpoint phong ban",
      subtitle:
        "Theo dõi các task cần phòng ban phụ trách xác nhận trước khi hoàn thành.",
      pending: translate(
        t,
        "onboarding.approvals.dept.tab.pending",
        "Chờ xác nhận",
      ),
      confirmed: translate(
        t,
        "onboarding.approvals.dept.tab.confirmed",
        "Đã xác nhận",
      ),
      pendingStat: translate(
        t,
        "onboarding.approvals.dept.stat.pending",
        "Chờ xác nhận",
      ),
      overdueStat: translate(
        t,
        "onboarding.approvals.dept.stat.overdue",
        "Quá hạn",
      ),
      requireEvidenceStat: translate(
        t,
        "onboarding.approvals.dept.stat.require_evidence",
        "Cần bằng chứng",
      ),
      searchPlaceholder: translate(
        t,
        "onboarding.approvals.dept.search_placeholder",
        "Tìm theo tên task, checklist hoặc onboarding...",
      ),
      refresh: translate(t, "onboarding.approvals.refresh", "Làm mới"),
      overdueOnly: translate(
        t,
        "onboarding.approvals.dept.filter.overdue_only",
        "Chỉ quá hạn",
      ),
      checklistAll: translate(
        t,
        "onboarding.approvals.dept.filter.checklist_all",
        "Tất cả checklist",
      ),
      requireEvidence: translate(
        t,
        "onboarding.approvals.dept.badge.require_evidence",
        "Cần bằng chứng",
      ),
      overdueBadge: translate(
        t,
        "onboarding.approvals.task.overdue_badge",
        "Quá hạn",
      ),
      confirm: translate(t, "global.confirm", "Xác nhận"),
      detail: translate(t, "onboarding.task.detail.view", "Chi tiết"),
      checklist: translate(
        t,
        "onboarding.approvals.dept.checklist_label",
        "Checklist",
      ),
      onboarding: translate(
        t,
        "onboarding.approvals.dept.onboarding_label",
        "Onboarding",
      ),
      noAssignee: translate(t, "global.not_available", "Chưa gán"),
      noDepartment: translate(
        t,
        "onboarding.approvals.dept.empty.no_department",
        "Không xác định được phòng ban của tài khoản hiện tại",
      ),
      searchEmptyTitle: translate(
        t,
        "onboarding.approvals.dept.empty.search_title",
        "Không tìm thấy task phù hợp",
      ),
      pendingEmptyTitle: translate(
        t,
        "onboarding.approvals.dept.empty.title",
        "Không có task cần phòng ban xác nhận",
      ),
      pendingEmptyDesc: translate(
        t,
        "onboarding.approvals.dept.empty.desc",
        "API chỉ trả về các checkpoint còn pending của phòng ban bạn quản lý.",
      ),
      confirmedEmptyTitle: translate(
        t,
        "onboarding.approvals.dept.confirmed.empty.title",
        "Chưa có checkpoint nào được xác nhận",
      ),
      confirmedEmptyDesc: translate(
        t,
        "onboarding.approvals.dept.confirmed.empty.desc",
        "Các checkpoint đã xác nhận sẽ xuất hiện ở đây.",
      ),
      errorTitle: translate(
        t,
        "onboarding.approvals.dept.error.title",
        "Không tải được danh sách task phụ thuộc phòng ban",
      ),
      errorDesc: translate(
        t,
        "onboarding.approvals.dept.error.desc",
        "Vui lòng kiểm tra quyền quản lý phòng ban hiện tại.",
      ),
      confirmedAt: translate(
        t,
        "onboarding.approvals.dept.confirmed.confirmed_at",
        "Thời gian xác nhận",
      ),
    }),
    [t],
  );

  const pendingQuery = useQuery({
    queryKey: ["department-dependent-tasks", departmentId, "PENDING", PAGE_SIZE],
    queryFn: () =>
      apiListTaskDepartmentDependentTasks({
        departmentId: departmentId!,
        checkpointStatus: "PENDING",
        page: 1,
        size: PAGE_SIZE,
      }),
    enabled: Boolean(departmentId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const confirmedQuery = useQuery({
    queryKey: [
      "department-dependent-tasks",
      departmentId,
      "CONFIRMED",
      PAGE_SIZE,
    ],
    queryFn: () =>
      apiListTaskDepartmentDependentTasks({
        departmentId: departmentId!,
        checkpointStatus: "CONFIRMED",
        page: 1,
        size: PAGE_SIZE,
      }),
    enabled: Boolean(departmentId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const pendingTasks = useMemo(
    () => pendingQuery.data?.tasks ?? [],
    [pendingQuery.data?.tasks],
  );
  const confirmedTasks = useMemo(
    () => confirmedQuery.data?.tasks ?? [],
    [confirmedQuery.data?.tasks],
  );

  const activeQuery =
    checkpointTab === "PENDING" ? pendingQuery : confirmedQuery;
  const tasks = checkpointTab === "PENDING" ? pendingTasks : confirmedTasks;

  const stats = useMemo(() => {
    const pendingTotal = pendingQuery.data?.totalCount ?? pendingTasks.length;
    const confirmedTotal =
      confirmedQuery.data?.totalCount ?? confirmedTasks.length;
    const totalKnown = pendingTotal + confirmedTotal;

    return {
      pending: pendingTotal,
      confirmed: confirmedTotal,
      totalKnown,
      progress:
        totalKnown > 0 ? Math.round((confirmedTotal / totalKnown) * 100) : 0,
      overdue: pendingTasks.filter((item) => isOverdue(item.dueDate)).length,
      requireEvidence: pendingTasks.filter((item) => item.requireEvidence)
        .length,
    };
  }, [
    confirmedQuery.data?.totalCount,
    confirmedTasks.length,
    pendingQuery.data?.totalCount,
    pendingTasks,
  ]);

  useEffect(() => {
    onTotalChange?.(stats.pending);
  }, [stats.pending, onTotalChange]);

  const checklistOptions = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((item) => {
      const name = item.checklistName?.trim();
      if (name) names.add(name);
    });

    return [...names].sort().map((name) => ({ label: name, value: name }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = tasks;

    if (q) {
      list = list.filter((item) => {
        const assignedName = resolveUserName(item.assignedUserId, "");
        return [
          item.title,
          item.checklistName,
          item.onboardingId,
          item.taskStatus,
          assignedName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      });
    }

    if (checkpointTab === "PENDING" && overdueOnly) {
      list = list.filter((item) => isOverdue(item.dueDate));
    }

    if (selectedChecklist) {
      list = list.filter((item) => item.checklistName === selectedChecklist);
    }

    return [...list].sort((a, b) => {
      if (checkpointTab === "CONFIRMED") {
        return getDateValue(b.confirmedAt) - getDateValue(a.confirmedAt);
      }

      const overdueDiff =
        Number(isOverdue(b.dueDate)) - Number(isOverdue(a.dueDate));
      if (overdueDiff !== 0) return overdueDiff;

      return getDateValue(a.dueDate) - getDateValue(b.dueDate);
    });
  }, [
    checkpointTab,
    overdueOnly,
    resolveUserName,
    search,
    selectedChecklist,
    tasks,
  ]);

  const groupedTasks = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; name: string; items: TaskDepartmentDependentItem[] }
    >();

    filteredTasks.forEach((item) => {
      const name = item.checklistName?.trim() || labels.checklistAll;
      const key = item.checklistName?.trim() || "__no_checklist__";
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
        return;
      }
      groups.set(key, { key, name, items: [item] });
    });

    return [...groups.values()];
  }, [filteredTasks, labels.checklistAll]);

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const error = activeQuery.error;
  const isFetching = pendingQuery.isFetching || confirmedQuery.isFetching;
  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(selectedChecklist) ||
    (checkpointTab === "PENDING" && overdueOnly);
  const activeTotal = activeQuery.data?.totalCount ?? tasks.length;

  const handleOpenConfirm = (item: TaskDepartmentDependentItem) => {
    setConfirmTarget({
      taskId: item.taskId,
      taskTitle: item.title,
      checklistName: item.checklistName,
      requireEvidence: item.requireEvidence ?? false,
    });
  };

  const handleConfirmSuccess = () => {
    setConfirmTarget(null);
    onConfirmed();
    void queryClient.invalidateQueries({
      queryKey: ["department-dependent-tasks"],
    });
  };

  const handleTabChange = (tab: CheckpointTab) => {
    setCheckpointTab(tab);
    setSelectedChecklist(null);
    if (tab === "CONFIRMED") {
      setOverdueOnly(false);
    }
  };

  if (!departmentId) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <Empty description={labels.noDepartment} />
      </Card>
    );
  }

  return (
    <div className="relative space-y-4">
      {isFetching && <AppLoading />}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Clock className="h-5 w-5" />}
            label={labels.pendingStat}
            value={stats.pending}
            tone="blue"
            loading={pendingQuery.isLoading}
          />
          <MetricCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label={labels.confirmed}
            value={stats.confirmed}
            tone="green"
            loading={confirmedQuery.isLoading}
          />
          <MetricCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label={labels.overdueStat}
            value={stats.overdue}
            tone="red"
            loading={pendingQuery.isLoading}
          />
          <MetricCard
            icon={<FileText className="h-5 w-5" />}
            label={labels.requireEvidenceStat}
            value={stats.requireEvidence}
            tone="amber"
            loading={pendingQuery.isLoading}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
            <div className="inline-flex w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => handleTabChange("PENDING")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  checkpointTab === "PENDING"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Clock className="h-4 w-4" />
                {labels.pending}
                {stats.pending > 0 && (
                  <Badge count={stats.pending} size="small" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("CONFIRMED")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  checkpointTab === "CONFIRMED"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {labels.confirmed}
                {stats.confirmed > 0 && (
                  <Badge count={stats.confirmed} size="small" color="#10b981" />
                )}
              </button>
            </div>

            <Input
              placeholder={labels.searchPlaceholder}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              allowClear
              className="w-full md:max-w-sm"
              prefix={<Search className="h-4 w-4 text-gray-400" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {checkpointTab === "PENDING" && (
              <button
                type="button"
                onClick={() => setOverdueOnly((value) => !value)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                  overdueOnly
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                {labels.overdueOnly}
              </button>
            )}

            <Select<string>
              value={selectedChecklist ?? undefined}
              onChange={(value) => setSelectedChecklist(value)}
              onClear={() => setSelectedChecklist(null)}
              options={checklistOptions}
              className="min-w-[220px]"
              allowClear
              placeholder={labels.checklistAll}
              disabled={checklistOptions.length === 0}
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <Alert
          showIcon
          type="error"
          message={labels.errorTitle}
          description={error instanceof Error ? error.message : labels.errorDesc}
        />
      ) : filteredTasks.length === 0 ? (
        <Card className="border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center gap-3 py-14">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-lg ${
                checkpointTab === "CONFIRMED"
                  ? "bg-emerald-50 text-emerald-500"
                  : "bg-blue-50 text-blue-500"
              }`}
            >
              {checkpointTab === "CONFIRMED" ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <Building2 className="h-8 w-8" />
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">
                {hasActiveFilters
                  ? labels.searchEmptyTitle
                  : checkpointTab === "CONFIRMED"
                    ? labels.confirmedEmptyTitle
                    : labels.pendingEmptyTitle}
              </p>
              <p className="mt-1 max-w-lg text-sm text-gray-500">
                {checkpointTab === "CONFIRMED" && !hasActiveFilters
                  ? labels.confirmedEmptyDesc
                  : labels.pendingEmptyDesc}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <span>
              {filteredTasks.length}/{activeTotal} task
            </span>
            {checkpointTab === "CONFIRMED" && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {labels.confirmedAt}
              </span>
            )}
          </div>

          {groupedTasks.map((group) => (
            <section key={group.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="truncate text-sm font-semibold text-gray-800">
                    {group.name}
                  </h3>
                </div>
                <Badge
                  count={group.items.length}
                  style={{ backgroundColor: "#64748b" }}
                />
              </div>

              <div className="space-y-2">
                {group.items.map((item) => (
                  <TaskCard
                    key={item.taskId}
                    item={item}
                    locale={locale}
                    assignedUserName={resolveUserName(
                      item.assignedUserId,
                      item.assignedUserId,
                    )}
                    pendingLabel={labels.pending}
                    confirmedLabel={labels.confirmed}
                    requireEvidenceLabel={labels.requireEvidence}
                    overdueLabel={labels.overdueBadge}
                    confirmLabel={labels.confirm}
                    detailLabel={labels.detail}
                    checklistLabel={labels.checklist}
                    onboardingLabel={labels.onboarding}
                    noAssigneeLabel={labels.noAssignee}
                    onOpen={() => setDrawerTaskId(item.taskId)}
                    onConfirm={() => handleOpenConfirm(item)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmCheckpointModal
        open={Boolean(confirmTarget)}
        taskId={confirmTarget?.taskId ?? null}
        taskTitle={confirmTarget?.taskTitle}
        checklistName={confirmTarget?.checklistName}
        requireEvidence={confirmTarget?.requireEvidence ?? false}
        departmentId={departmentId}
        onClose={() => setConfirmTarget(null)}
        onSuccess={handleConfirmSuccess}
      />

      <DeptTaskDrawer
        open={Boolean(drawerTaskId)}
        taskId={drawerTaskId}
        departmentId={departmentId}
        resolveUserName={resolveUserName}
        onClose={() => setDrawerTaskId(null)}
        onCheckpointConfirmed={() => {
          onConfirmed();
          void queryClient.invalidateQueries({
            queryKey: ["department-dependent-tasks"],
          });
        }}
      />
    </div>
  );
}
