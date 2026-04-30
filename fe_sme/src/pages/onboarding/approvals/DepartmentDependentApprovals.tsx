import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Search,
  User as UserIcon,
} from "lucide-react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Skeleton,
  Tag,
} from "antd";
import { apiListTaskDepartmentDependentTasks } from "@/api/onboarding/onboarding.api";
import { useLocale } from "@/i18n";
import type { TaskDepartmentDependentItem } from "@/interface/onboarding";
import { ConfirmCheckpointModal } from "./components/dept/ConfirmCheckpointModal";
import { DeptTaskDrawer } from "./components/dept/DeptTaskDrawer";

const PAGE_SIZE = 100;

type CheckpointTab = "PENDING" | "CONFIRMED";

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

const isOverdue = (dueDate?: string) =>
  Boolean(dueDate && new Date(dueDate) < new Date());

const formatDate = (value: string, locale: string) =>
  new Date(value).toLocaleDateString(locale.replace("_", "-"), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatDateTime = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale.replace("_", "-"), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  label,
  value,
  colorClass,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
  borderColor: string;
}) => (
  <div
    className={`flex items-center gap-3 rounded-xl border-l-4 bg-white px-4 py-3.5 shadow-sm ${borderColor}`}
  >
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold leading-none text-gray-900">
        {value}
      </p>
    </div>
  </div>
);

// ── Loading Skeleton ──────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((item) => (
      <Card key={item} className="border-l-4 border-l-gray-200 shadow-sm">
        <Skeleton avatar active paragraph={{ rows: 2 }} />
      </Card>
    ))}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

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

  // ── Queries ──────────────────────────────────────────────────────────────────

  const pendingQuery = useQuery({
    queryKey: ["department-dependent-tasks", departmentId, "PENDING"],
    queryFn: () =>
      apiListTaskDepartmentDependentTasks({
        departmentId: departmentId!,
        checkpointStatus: "PENDING",
        page: 1,
        size: PAGE_SIZE,
      }),
    enabled: Boolean(departmentId),
  });

  const confirmedQuery = useQuery({
    queryKey: ["department-dependent-tasks", departmentId, "CONFIRMED"],
    queryFn: () =>
      apiListTaskDepartmentDependentTasks({
        departmentId: departmentId!,
        checkpointStatus: "CONFIRMED",
        page: 1,
        size: PAGE_SIZE,
      }),
    enabled: Boolean(departmentId) && checkpointTab === "CONFIRMED",
  });

  const activeQuery =
    checkpointTab === "PENDING" ? pendingQuery : confirmedQuery;
  const tasks = useMemo(
    () => activeQuery.data?.tasks ?? [],
    [activeQuery.data?.tasks],
  );

  // ── Stats from PENDING list ───────────────────────────────────────────────────

  const pendingTasks = useMemo(
    () => pendingQuery.data?.tasks ?? [],
    [pendingQuery.data?.tasks],
  );

  const stats = useMemo(
    () => ({
      total: pendingQuery.data?.totalCount ?? pendingTasks.length,
      overdue: pendingTasks.filter((item) => isOverdue(item.dueDate)).length,
      requireEvidence: pendingTasks.filter((item) => item.requireEvidence)
        .length,
    }),
    [pendingQuery.data?.totalCount, pendingTasks],
  );

  useEffect(() => {
    onTotalChange?.(stats.total);
  }, [stats.total, onTotalChange]);

  // ── Checklist options for filter ─────────────────────────────────────────────

  const checklistOptions = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((item) => {
      if (item.checklistName) names.add(item.checklistName);
    });
    return [...names].map((name) => ({ label: name, value: name }));
  }, [tasks]);

  // ── Filtered + sorted tasks ────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    let list = tasks;
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((item) => {
        const name = resolveUserName(item.assignedUserId, "");
        return [item.title, item.checklistName, item.onboardingId, name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
    }

    if (overdueOnly) {
      list = list.filter((item) => isOverdue(item.dueDate));
    }

    if (selectedChecklist) {
      list = list.filter((item) => item.checklistName === selectedChecklist);
    }

    // Sort overdue first in PENDING tab
    if (checkpointTab === "PENDING") {
      list = [...list].sort(
        (a, b) =>
          Number(isOverdue(b.dueDate)) - Number(isOverdue(a.dueDate)),
      );
    }

    return list;
  }, [
    tasks,
    search,
    overdueOnly,
    selectedChecklist,
    checkpointTab,
    resolveUserName,
  ]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

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
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ["department-dependent-tasks", departmentId],
    });
  };

  if (!departmentId) {
    return (
      <Card className="shadow-sm">
        <Empty
          description={t("onboarding.approvals.dept.empty.no_department")}
        />
      </Card>
    );
  }

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const error = activeQuery.error;
  const isFetching = activeQuery.isFetching;

  return (
    <div className="space-y-4">
      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Building2 className="h-5 w-5 text-purple-600" />}
          label={t("onboarding.approvals.dept.stat.pending") ?? "Chờ xác nhận"}
          value={stats.total}
          colorClass="bg-purple-50"
          borderColor="border-l-purple-400"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label={t("onboarding.approvals.dept.stat.overdue") ?? "Quá hạn"}
          value={stats.overdue}
          colorClass="bg-red-50"
          borderColor="border-l-red-400"
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-amber-500" />}
          label={
            t("onboarding.approvals.dept.stat.require_evidence") ??
            "Cần bằng chứng"
          }
          value={stats.requireEvidence}
          colorClass="bg-amber-50"
          borderColor="border-l-amber-400"
        />
      </div>

      {/* ── Tab switcher + Search + Refresh ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5">
          <button
            type="button"
            onClick={() => setCheckpointTab("PENDING")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              checkpointTab === "PENDING"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {t("onboarding.approvals.dept.tab.pending") ?? "Chờ xác nhận"}
            {stats.total > 0 && (
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  checkpointTab === "PENDING"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {stats.total}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setCheckpointTab("CONFIRMED")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              checkpointTab === "CONFIRMED"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("onboarding.approvals.dept.tab.confirmed") ?? "Đã xác nhận"}
          </button>
        </div>

        <Input
          placeholder={
            t("onboarding.approvals.dept.search_placeholder") ??
            "Tìm task, checklist..."
          }
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          className="max-w-xs"
          prefix={<Search className="h-3.5 w-3.5 text-gray-400" />}
        />
        <Button
          icon={<RefreshCw className="h-4 w-4" />}
          loading={isFetching}
          onClick={handleRefresh}
        >
          {t("onboarding.approvals.refresh") ?? "Làm mới"}
        </Button>
      </div>

      {/* ── Advanced filters (PENDING tab only) ───────────────────────────── */}
      {checkpointTab === "PENDING" && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOverdueOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              overdueOnly
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("onboarding.approvals.dept.filter.overdue_only") ?? "Chỉ quá hạn"}
          </button>

          {checklistOptions.length > 0 && (
            <Select
              value={selectedChecklist ?? undefined}
              onChange={(v) => setSelectedChecklist(v ?? null)}
              options={[
                {
                  label:
                    t("onboarding.approvals.dept.filter.checklist_all") ??
                    "Tất cả checklist",
                  value: null as unknown as string,
                },
                ...checklistOptions,
              ]}
              className="min-w-[200px]"
              allowClear
              placeholder={
                t("onboarding.approvals.dept.filter.checklist_all") ??
                "Tất cả checklist"
              }
            />
          )}
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <Alert
          showIcon
          type="error"
          message={
            t("onboarding.approvals.dept.error.title") ?? "Lỗi tải dữ liệu"
          }
          description={
            error instanceof Error
              ? error.message
              : (t("onboarding.approvals.dept.error.desc") ??
                "Vui lòng thử lại sau")
          }
        />
      ) : filteredTasks.length === 0 ? (
        <Card className="shadow-sm">
          <div className="flex flex-col items-center gap-3 py-14">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                checkpointTab === "CONFIRMED" ? "bg-green-50" : "bg-purple-50"
              }`}
            >
              {checkpointTab === "CONFIRMED" ? (
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              ) : (
                <Building2 className="h-8 w-8 text-purple-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800">
                {search
                  ? (t("onboarding.approvals.dept.empty.search_title") ??
                    "Không tìm thấy kết quả")
                  : checkpointTab === "CONFIRMED"
                    ? (t("onboarding.approvals.dept.confirmed.empty.title") ??
                      "Chưa có xác nhận nào")
                    : (t("onboarding.approvals.dept.empty.title") ??
                      "Không có checkpoint chờ xác nhận")}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {!search && checkpointTab === "CONFIRMED"
                  ? (t("onboarding.approvals.dept.confirmed.empty.desc") ??
                    "Các checkpoint đã xác nhận sẽ xuất hiện ở đây")
                  : (t("onboarding.approvals.dept.empty.desc") ??
                    "Chưa có nhiệm vụ nào cần xác nhận từ phòng ban này")}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((item) => {
            const overdue = isOverdue(item.dueDate);
            const isConfirmed = item.checkpointStatus === "CONFIRMED";
            const assignedUserName = resolveUserName(
              item.assignedUserId,
              item.assignedUserId,
            );

            return (
              <div
                key={item.taskId}
                role="button"
                tabIndex={0}
                onClick={() => setDrawerTaskId(item.taskId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setDrawerTaskId(item.taskId);
                }}
                className={`group flex cursor-pointer items-start gap-3 rounded-xl border-l-4 bg-white px-4 py-3.5 shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-300 ${
                  isConfirmed
                    ? "border-l-green-400"
                    : overdue
                      ? "border-l-red-400"
                      : "border-l-purple-400"
                }`}
              >
                {/* Status icon */}
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    isConfirmed
                      ? "border-green-200 bg-green-50"
                      : overdue
                        ? "border-red-200 bg-red-50"
                        : "border-purple-200 bg-purple-50"
                  }`}
                >
                  {isConfirmed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : overdue ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Building2 className="h-4 w-4 text-purple-500" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  {/* Title + badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-semibold leading-snug text-gray-800 group-hover:text-blue-600">
                      {item.title}
                    </span>
                    <Tag
                      color={isConfirmed ? "success" : "purple"}
                      style={{ margin: 0, fontSize: 10 }}
                    >
                      {isConfirmed
                        ? (t("onboarding.approvals.dept.tab.confirmed") ??
                          "Đã xác nhận")
                        : (t("onboarding.approvals.dept.tab.pending") ??
                          "Chờ xác nhận")}
                    </Tag>
                    {item.requireEvidence && !isConfirmed && (
                      <Tag color="gold" style={{ margin: 0, fontSize: 10 }}>
                        {t(
                          "onboarding.approvals.dept.badge.require_evidence",
                        ) ?? "Cần bằng chứng"}
                      </Tag>
                    )}
                    {overdue && !isConfirmed && (
                      <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                        {t("onboarding.approvals.task.overdue_badge") ??
                          "Quá hạn"}
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                    {item.checklistName && (
                      <span className="flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {item.checklistName}
                      </span>
                    )}
                    {item.dueDate && (
                      <span
                        className={`flex items-center gap-1 ${
                          overdue && !isConfirmed
                            ? "font-semibold text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {overdue && !isConfirmed ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Calendar className="h-3 w-3" />
                        )}
                        {formatDate(item.dueDate, locale)}
                      </span>
                    )}
                    {item.assignedUserId && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <UserIcon className="h-3 w-3" />
                        {assignedUserName}
                      </span>
                    )}
                  </div>

                  {/* CONFIRMED: show confirmedAt */}
                  {isConfirmed && item.confirmedAt && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-2 py-1 text-xs text-green-700">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span className="font-semibold">
                        {t(
                          "onboarding.approvals.dept.confirmed.confirmed_at",
                        ) ?? "Xác nhận lúc"}:
                      </span>{" "}
                      {formatDateTime(item.confirmedAt, locale)}
                    </div>
                  )}
                </div>

                {/* Action: chỉ hiện nút Xác nhận khi còn pending */}
                {!isConfirmed && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircle2 className="h-3 w-3" />}
                    className="mt-0.5 shrink-0 border-purple-600 bg-purple-600 hover:border-purple-700 hover:bg-purple-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenConfirm(item);
                    }}
                  >
                    {t("global.confirm") ?? "Xác nhận"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirm checkpoint modal ─────────────────────────────────────── */}
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

      {/* ── Task detail drawer ───────────────────────────────────────────── */}
      <DeptTaskDrawer
        open={Boolean(drawerTaskId)}
        taskId={drawerTaskId}
        departmentId={departmentId}
        resolveUserName={resolveUserName}
        onClose={() => setDrawerTaskId(null)}
        onCheckpointConfirmed={() => {
          onConfirmed();
          void queryClient.invalidateQueries({
            queryKey: ["department-dependent-tasks", departmentId],
          });
        }}
      />
    </div>
  );
}
