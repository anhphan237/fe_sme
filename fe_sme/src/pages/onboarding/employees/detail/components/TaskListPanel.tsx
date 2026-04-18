import { useMemo, useState } from "react";
import { Badge, Card, Empty, Progress, Radio, Skeleton, Tag } from "antd";
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
    {
      label: t("onboarding.task.stat.overdue"),
      count: overdueCount,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-red-500",
      bg: "bg-red-50",
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

      {/* ── Summary stats ────────────────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {STAT_ITEMS.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl ${stat.bg} flex flex-col items-center gap-0.5 px-1 py-2`}>
              <span className={stat.color}>{stat.icon}</span>
              <p className="text-base font-bold text-gray-800">{stat.count}</p>
              <p className="text-center text-[9px] leading-tight text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter pills (Radio.Group button style) ──────────────────────────── */}
      {tasks.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <Radio.Group
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as FilterKey)}
            size="small"
            optionType="button"
            buttonStyle="solid">
            {FILTERS.map((f) => {
              const count = filterCounts[f.key];
              return (
                <Radio.Button key={f.key} value={f.key}>
                  <span className="flex items-center gap-1">
                    {f.key === "overdue" && (
                      <AlertTriangle className="h-2.5 w-2.5" />
                    )}
                    {t(f.labelKey)}
                    {count > 0 && (
                      <span
                        className={`ml-0.5 rounded-full px-1 text-[10px] ${
                          activeFilter === f.key
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                        {count}
                      </span>
                    )}
                  </span>
                </Radio.Button>
              );
            })}
          </Radio.Group>
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
              const groupOverdue = groupItems.filter(
                (tk) =>
                  (tk.overdue ?? isTaskOverdue(tk.dueDate)) &&
                  tk.status !== STATUS_DONE,
              ).length;
              // Determine color from stage type embedded in the group name
              // The group name is checklistName which may contain stage type
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
