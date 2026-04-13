import { useMemo, useState } from "react";
import { Badge, Card, Empty, Progress, Select, Skeleton } from "antd";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Loader2,
  HourglassIcon,
} from "lucide-react";
import { useLocale } from "@/i18n";
import { STATUS_DONE } from "../constants";
import { TaskItem } from "./TaskItem";
import type { OnboardingTask } from "@/shared/types";

export interface TaskListPanelProps {
  tasks: OnboardingTask[];
  isLoading: boolean;
  isUpdating: boolean;
  canManage: boolean;
  onToggle: (task: OnboardingTask) => void;
  onOpenDrawer: (task: OnboardingTask) => void;
  onApprove: (task: OnboardingTask) => void;
  onReject: (task: OnboardingTask) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

type FilterKey = "all" | "todo" | "in_progress" | "pending_approval" | "done";

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
  ];

const STAT_ITEMS = (
  tasks: OnboardingTask[],
  completedCount: number,
  t: (k: string) => string,
) => [
  {
    label: t("onboarding.task.stat.total"),
    count: tasks.length,
    icon: <ListTodo className="h-4 w-4" />,
    color: "text-gray-500",
    bg: "bg-gray-50",
  },
  {
    label: t("onboarding.task.stat.in_progress"),
    count: tasks.filter((t) => t.rawStatus === "IN_PROGRESS").length,
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    label: t("onboarding.task.stat.pending_approval"),
    count: tasks.filter((t) => t.rawStatus === "PENDING_APPROVAL").length,
    icon: <HourglassIcon className="h-4 w-4" />,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    label: t("onboarding.task.stat.done"),
    count: completedCount,
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
];

export const TaskListPanel = ({
  tasks,
  isLoading,
  isUpdating,
  canManage,
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

  const filteredTasks = useMemo(() => {
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
            : tasks.filter((task) =>
                f.statusValues.includes(task.rawStatus ?? ""),
              ).length,
        ]),
      ) as Record<FilterKey, number>,
    [tasks],
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
    isUpdating,
    isApproving,
    isRejecting,
    onToggle,
    onOpenDrawer,
    onApprove,
    onReject,
  };

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

      {/* ── Summary stats ────────────────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {STAT_ITEMS(tasks, completedCount, t).map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl ${stat.bg} flex flex-col items-center gap-0.5 px-2 py-2.5`}>
              <span className={stat.color}>{stat.icon}</span>
              <p className="text-base font-bold text-gray-800">{stat.count}</p>
              <p className="text-center text-[10px] leading-tight text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter select ────────────────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <Select
            value={activeFilter}
            onChange={(val) => setActiveFilter(val)}
            size="small"
            style={{ width: 180 }}
            options={FILTERS.map((f) => ({
              value: f.key,
              label: (
                <span className="flex items-center justify-between gap-2">
                  <span>{t(f.labelKey)}</span>
                  {filterCounts[f.key] > 0 && (
                    <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-500">
                      {filterCounts[f.key]}
                    </span>
                  )}
                </span>
              ),
            }))}
          />
        </div>
      )}

      {/* ── Task list ────────────────────────────────────────────────────────── */}
      <div className="mt-4">
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
              return (
                <div key={group}>
                  <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {group}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {groupDone}/{groupItems.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupItems.map((task) => (
                      <TaskItem key={task.id} task={task} {...sharedItemProps} />
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
