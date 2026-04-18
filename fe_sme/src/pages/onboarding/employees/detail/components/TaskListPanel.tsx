import { useMemo, useState } from "react";
import { Badge, Card, Empty, Progress, Skeleton, Tag } from "antd";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HourglassIcon,
  ListTodo,
  Loader2,
} from "lucide-react";
import { useLocale } from "@/i18n";
import { STAGE_TAG_COLOR, STATUS_DONE } from "../constants";
import { isTaskOverdue } from "../helpers";
import { TaskItem } from "./TaskItem";
import type { OnboardingTask } from "@/shared/types";

export interface TaskListPanelProps {
  tasks: OnboardingTask[];
  isLoading: boolean;
  isUpdating: boolean;
  canManage: boolean;
  /** Current logged-in user id — forwarded to TaskItem for per-task canAct calculation */
  currentUserId: string;
  /** Pre-computed approve/reject permission (isHr || isLineManager). Forwarded to TaskItem. */
  canApproveOrReject?: boolean;
  onToggle: (task: OnboardingTask) => void;
  onOpenDrawer: (task: OnboardingTask) => void;
  onApprove: (task: OnboardingTask) => void;
  onReject: (task: OnboardingTask) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

type FilterKey =
  | "all"
  | "todo"
  | "in_progress"
  | "pending_approval"
  | "done"
  | "overdue";

const FILTERS: { key: FilterKey; labelKey: string; statusValues: string[] }[] =
  [
    { key: "all", labelKey: "global.all", statusValues: [] },
    {
      key: "todo",
      labelKey: "onboarding.task.filter.todo",
      statusValues: ["TODO", "ASSIGNED"],
    },
    {
      key: "in_progress",
      labelKey: "onboarding.task.filter.in_progress",
      statusValues: ["IN_PROGRESS", "WAIT_ACK"],
    },
    {
      key: "pending_approval",
      labelKey: "onboarding.task.filter.pending_approval",
      statusValues: ["PENDING_APPROVAL"],
    },
    {
      key: "done",
      labelKey: "onboarding.task.filter.done",
      statusValues: ["DONE"],
    },
    {
      key: "overdue",
      labelKey: "onboarding.task.stat.overdue",
      statusValues: [],
    },
  ];

export const TaskListPanel = ({
  tasks,
  isLoading,
  isUpdating,
  canManage,
  currentUserId,
  canApproveOrReject,
  onToggle,
  onOpenDrawer,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: TaskListPanelProps) => {
  const { t } = useLocale();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const completedCount = tasks.filter((tk) => tk.status === STATUS_DONE).length;
  const progressPercent =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const overdueCount = tasks.filter(
    (tk) =>
      (tk.overdue ?? isTaskOverdue(tk.dueDate)) && tk.status !== STATUS_DONE,
  ).length;

  const filteredTasks = useMemo(() => {
    if (activeFilter === "overdue") {
      return tasks.filter(
        (tk) =>
          (tk.overdue ?? isTaskOverdue(tk.dueDate)) &&
          tk.status !== STATUS_DONE,
      );
    }
    if (activeFilter === "all") return tasks;
    const filter = FILTERS.find((f) => f.key === activeFilter);
    return tasks.filter((task) =>
      (filter?.statusValues ?? []).includes(task.rawStatus ?? ""),
    );
  }, [tasks, activeFilter]);

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [
          f.key,
          f.key === "all"
            ? tasks.length
            : f.key === "overdue"
              ? overdueCount
              : tasks.filter((task) =>
                  f.statusValues.includes(task.rawStatus ?? ""),
                ).length,
        ]),
      ) as Record<FilterKey, number>,
    [tasks, overdueCount],
  );

  const groupedTasks = useMemo(() => {
    const groups: Record<string, OnboardingTask[]> = {};
    for (const task of filteredTasks) {
      const group = task.checklistName ?? "—";
      if (!groups[group]) groups[group] = [];
      groups[group].push(task);
    }
    return Object.entries(groups);
  }, [filteredTasks]);

  const isGrouped =
    groupedTasks.length > 1 ||
    (groupedTasks.length === 1 && groupedTasks[0][0] !== "—");

  const sharedItemProps = {
    canManage,
    currentUserId,
    canApproveOrReject,
    isUpdating,
    isApproving,
    isRejecting,
    onToggle,
    onOpenDrawer,
    onApprove,
    onReject,
  };

  const STAT_ITEMS = [
    {
      label: t("onboarding.task.stat.total"),
      count: filterCounts.all,
      icon: <ListTodo className="h-4 w-4" />,
      color: "text-gray-500",
      bg: "bg-gray-50",
      activeBg: "bg-gray-100",
      ring: "ring-gray-400",
      filterKey: "all" as FilterKey,
    },
    {
      label: t("onboarding.task.stat.in_progress"),
      count: filterCounts.in_progress,
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      color: "text-blue-500",
      bg: "bg-blue-50",
      activeBg: "bg-blue-100",
      ring: "ring-blue-400",
      filterKey: "in_progress" as FilterKey,
    },
    {
      label: t("onboarding.task.stat.pending_approval"),
      count: filterCounts.pending_approval,
      icon: <HourglassIcon className="h-4 w-4" />,
      color: "text-amber-500",
      bg: "bg-amber-50",
      activeBg: "bg-amber-100",
      ring: "ring-amber-400",
      filterKey: "pending_approval" as FilterKey,
    },
    {
      label: t("onboarding.task.stat.done"),
      count: filterCounts.done,
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      activeBg: "bg-emerald-100",
      ring: "ring-emerald-400",
      filterKey: "done" as FilterKey,
    },
    {
      label: t("onboarding.task.stat.overdue"),
      count: filterCounts.overdue,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-red-500",
      bg: "bg-red-50",
      activeBg: "bg-red-100",
      ring: "ring-red-400",
      filterKey: "overdue" as FilterKey,
    },
  ];

  return (
    <Card className="overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            {t("onboarding.detail.task.title")}
          </h3>
          <Badge
            count={tasks.length}
            style={{
              backgroundColor: "#e2e8f0",
              color: "#475569",
              fontSize: 11,
              boxShadow: "none",
            }}
          />
        </div>
        <span className="flex items-center gap-1 text-sm text-gray-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          {completedCount}/{tasks.length}
        </span>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <Progress
          className="mt-3"
          percent={progressPercent}
          size="small"
          strokeColor={{ "0%": "#3b82f6", "100%": "#10b981" }}
        />
      )}
      {/* ── Summary stats (clickable filters) ──────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {STAT_ITEMS.map((stat) => {
            const isActive = activeFilter === stat.filterKey;
            return (
              <button
                key={stat.filterKey}
                type="button"
                onClick={() =>
                  setActiveFilter(isActive ? "all" : stat.filterKey)
                }
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-all hover:opacity-80 ${
                  isActive ? `${stat.activeBg} ring-2 ${stat.ring}` : stat.bg
                }`}>
                <span className={stat.color}>{stat.icon}</span>
                <p className="text-base font-bold text-gray-800">
                  {stat.count}
                </p>
                <p className="text-center text-[9px] leading-tight text-gray-400">
                  {stat.label}
                </p>
              </button>
            );
          })}
        </div>
      )}
      {/* ── Task list ────────────────────────────────────────────────────────── */}
      <div className="mt-4">
        {/* Active filter indicator */}
        {activeFilter !== "all" && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
            <span>{t("onboarding.task.filter.showing")}:</span>
            <Tag
              style={{ margin: 0, fontSize: 11 }}
              closable
              onClose={() => setActiveFilter("all")}>
              {STAT_ITEMS.find((s) => s.filterKey === activeFilter)?.label} (
              {filteredTasks.length})
            </Tag>
          </div>
        )}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton.Input key={i} active block size="small" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <Empty
            description={
              activeFilter === "all"
                ? t("onboarding.detail.task.empty")
                : t("onboarding.detail.task.filter_empty")
            }
            imageStyle={{ height: 48 }}
          />
        ) : isGrouped ? (
          <div className="space-y-5">
            {groupedTasks.map(([group, groupItems]) => {
              const groupDone = groupItems.filter(
                (tk) => tk.status === STATUS_DONE,
              ).length;
              const groupOverdue = groupItems.filter(
                (tk) =>
                  (tk.overdue ?? isTaskOverdue(tk.dueDate)) &&
                  tk.status !== STATUS_DONE,
              ).length;
              const stageColorKey = Object.keys(STAGE_TAG_COLOR).find((k) =>
                group.toUpperCase().includes(k),
              );
              const stageColor = stageColorKey
                ? STAGE_TAG_COLOR[stageColorKey]
                : "blue";

              return (
                <div key={group}>
                  <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <Tag
                        color={stageColor}
                        style={{ margin: 0, fontSize: 11 }}>
                        {group}
                      </Tag>
                    </div>
                    <div className="flex items-center gap-2">
                      {groupOverdue > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
                          <AlertTriangle className="h-3 w-3" />
                          {groupOverdue}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {groupDone}/{groupItems.length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {groupItems.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        {...sharedItemProps}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} {...sharedItemProps} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
