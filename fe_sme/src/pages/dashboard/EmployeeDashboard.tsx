import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, Progress, Skeleton, Tag } from "antd";
import dayjs from "dayjs";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useUserStore } from "@/stores/user.store";
import {
  apiListInstances,
  apiListTasks,
} from "@/api/onboarding/onboarding.api";
import { apiGetDocuments } from "@/api/document/document.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type DashboardDocument = {
  documentId: string;
  name: string;
  status?: string;
};

// ── Mock data — replace with com.sme.analytics.employee.onboarding.myProgress ─

const MOCK_TIMELINE = [
  { phase: "Giai đoạn 1: Hành chính", done: true, tasks: 5, completed: 5 },
  {
    phase: "Giai đoạn 2: Đào tạo kỹ năng",
    done: false,
    tasks: 8,
    completed: 3,
  },
  { phase: "Giai đoạn 3: Thực hành", done: false, tasks: 6, completed: 0 },
  {
    phase: "Giai đoạn 4: Đánh giá cuối kỳ",
    done: false,
    tasks: 3,
    completed: 0,
  },
];

// ── Query hooks ────────────────────────────────────────────────────────────────

function useMyInstancesQuery(employeeId?: string) {
  return useQuery({
    queryKey: ["employee-instances", employeeId ?? ""],
    queryFn: () => apiListInstances({ employeeId }),
    enabled: Boolean(employeeId),
    select: (res: unknown) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
  });
}

function useMyTasksQuery(instanceId?: string) {
  return useQuery({
    queryKey: ["employee-tasks", instanceId ?? ""],
    queryFn: () =>
      apiListTasks(instanceId ?? "", {
        size: 50,
        sortBy: "due_date",
        sortOrder: "ASC",
      }),
    enabled: Boolean(instanceId),
    select: (res: unknown) =>
      extractList(res, "tasks", "items", "list").map(
        mapTask,
      ) as OnboardingTask[],
  });
}

function useMyDocumentsQuery() {
  return useQuery({
    queryKey: ["employee-documents"],
    queryFn: () => apiGetDocuments(),
    select: (res: unknown) =>
      extractList<DashboardDocument>(res, "items", "documents", "list"),
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: "teal" | "emerald" | "amber" | "red";
}) {
  const toneClass: Record<typeof tone, { bg: string; icon: string }> = {
    teal: { bg: "bg-teal-50", icon: "text-teal-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600" },
    red: { bg: "bg-red-50", icon: "text-red-600" },
  };
  const cls = toneClass[tone];
  return (
    <Card size="small" className="border border-stroke bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${cls.bg} ${cls.icon}`}>{icon}</div>
        <div>
          <p className="text-lg font-bold tabular-nums text-ink">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function taskStatusVariant(
  status?: string,
): "success" | "processing" | "warning" | "error" {
  switch (status) {
    case "Done":
      return "success";
    case "In Progress":
      return "processing";
    case "Pending":
    default:
      return "warning";
  }
}

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return dayjs(dueDate).isBefore(dayjs(), "day");
}

function docNeedsAck(status?: string) {
  const s = (status ?? "").toUpperCase();
  return !s.includes("DONE") && !s.includes("PROCESSED") && !s.includes("ACK");
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EmployeeDashboard() {
  const currentUser = useUserStore((s) => s.currentUser);
  const employeeId = currentUser?.employeeId ?? undefined;

  const { data: instances = [], isLoading: instancesLoading } =
    useMyInstancesQuery(employeeId);

  const latestInstance = useMemo(
    () =>
      [...instances]
        .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
        .find((i) => i.status === "ACTIVE" || i.status === "DRAFT") ??
      instances[0],
    [instances],
  );

  const { data: tasks = [], isLoading: tasksLoading } = useMyTasksQuery(
    latestInstance?.id,
  );

  const { data: documents = [], isLoading: docsLoading } =
    useMyDocumentsQuery();

  // Computed stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const pendingTasks = tasks.filter((t) => t.status !== "Done");
  const overdueTasks = pendingTasks.filter((t) => isOverdue(t.dueDate));
  const completionPct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const pendingDocs = documents.filter((d) => docNeedsAck(d.status));

  // Day counter from instance start
  const daysInOnboarding = latestInstance?.startDate
    ? dayjs().diff(dayjs(latestInstance.startDate), "day") + 1
    : null;

  const isLoading = instancesLoading;

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <Card className="border-0 bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Xin chào, {currentUser?.name ?? "bạn"}! 👋
            </h1>
            {daysInOnboarding !== null ? (
              <p className="mt-1 text-teal-100">
                Ngày{" "}
                <span className="font-semibold text-white">
                  {daysInOnboarding}
                </span>{" "}
                trong hành trình onboarding của bạn.
              </p>
            ) : (
              <p className="mt-1 text-teal-100">
                Bắt đầu hành trình onboarding của bạn.
              </p>
            )}
          </div>
          {latestInstance && (
            <Tag
              color="white"
              className="mt-2 self-start text-teal-600 sm:mt-0">
              {latestInstance.status}
            </Tag>
          )}
        </div>
      </Card>

      {/* Progress + Stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Progress circle */}
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">Tiến độ của tôi</h2>
          <p className="text-sm text-muted">
            {completedTasks}/{totalTasks} task hoàn thành
          </p>
          <div className="mt-6 flex flex-col items-center justify-center">
            {tasksLoading || isLoading ? (
              <Skeleton.Avatar active size={120} />
            ) : (
              <>
                <Progress
                  type="circle"
                  percent={completionPct}
                  size={120}
                  strokeColor="#0f766e"
                  format={(pct) => (
                    <span className="text-lg font-bold text-ink">{pct}%</span>
                  )}
                />
                <p className="mt-3 text-sm text-muted">
                  {completionPct < 100
                    ? `Còn ${totalTasks - completedTasks} task cần hoàn thành`
                    : "Tất cả task đã hoàn thành! 🎉"}
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Stats row (2 cols on right) */}
        <div className="grid grid-cols-2 gap-3 content-start lg:col-span-2">
          <StatCard
            label="Tổng số task"
            value={totalTasks}
            icon={<ClipboardList className="h-4 w-4" />}
            tone="teal"
          />
          <StatCard
            label="Đã hoàn thành"
            value={completedTasks}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="emerald"
          />
          <StatCard
            label="Đang chờ"
            value={pendingTasks.length}
            icon={<Clock className="h-4 w-4" />}
            tone="amber"
          />
          <StatCard
            label="Quá hạn"
            value={overdueTasks.length}
            icon={<AlertCircle className="h-4 w-4" />}
            tone="red"
          />
        </div>
      </div>

      {/* Pending Tasks + Documents */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Task list */}
        <Card className="border border-stroke bg-white shadow-sm">
          <h2 className="text-base font-semibold text-ink">Task đang chờ</h2>
          <p className="text-sm text-muted">Các task bạn cần hoàn thành</p>
          <div
            className="mt-4 space-y-2 overflow-y-auto"
            style={{ maxHeight: 320 }}>
            {!latestInstance ? (
              <p className="py-4 text-sm text-muted">
                {instancesLoading
                  ? "Đang tải..."
                  : "Bạn chưa có onboarding nào đang hoạt động."}
              </p>
            ) : tasksLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : pendingTasks.length === 0 ? (
              <p className="py-4 text-sm text-muted">
                Tất cả task đã hoàn thành. Xuất sắc! 🎉
              </p>
            ) : (
              pendingTasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2.5 ${
                    isOverdue(task.dueDate)
                      ? "border-red-200 bg-red-50/40"
                      : "border-stroke/60 bg-slate-50"
                  }`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {task.title ?? "Không có tiêu đề"}
                    </p>
                    {task.dueDate && (
                      <p
                        className={`mt-0.5 text-xs ${
                          isOverdue(task.dueDate)
                            ? "font-semibold text-red-500"
                            : "text-muted"
                        }`}>
                        {isOverdue(task.dueDate) ? "⚠ Quá hạn: " : "Hạn: "}
                        {dayjs(task.dueDate).format("DD/MM/YYYY")}
                      </p>
                    )}
                  </div>
                  <Badge
                    status={taskStatusVariant(task.status)}
                    text={
                      <span className="whitespace-nowrap text-xs text-muted">
                        {task.status}
                      </span>
                    }
                  />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Documents */}
        <Card className="border border-stroke bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Tài liệu cần xác nhận
              </h2>
              <p className="text-sm text-muted">
                Các tài liệu bạn cần đọc và xác nhận
              </p>
            </div>
            {pendingDocs.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {pendingDocs.length} chờ xác nhận
              </span>
            )}
          </div>
          <div
            className="mt-4 space-y-2 overflow-y-auto"
            style={{ maxHeight: 320 }}>
            {docsLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} title={false} />
            ) : pendingDocs.length === 0 ? (
              <p className="py-4 text-sm text-muted">
                {documents.length === 0
                  ? "Chưa có tài liệu nào."
                  : "Tất cả tài liệu đã được xác nhận. ✅"}
              </p>
            ) : (
              pendingDocs.slice(0, 8).map((doc) => (
                <div
                  key={doc.documentId}
                  className="flex items-center gap-3 rounded-lg border border-stroke/60 bg-slate-50 px-3 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {doc.name}
                    </p>
                  </div>
                  <Tag color="orange" className="shrink-0">
                    Chờ xác nhận
                  </Tag>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Onboarding Timeline — mock data, awaiting com.sme.analytics.employee.onboarding.myProgress */}
      <Card className="border border-stroke bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Lộ trình onboarding
            </h2>
            <p className="text-sm text-muted">
              Các giai đoạn trong quá trình onboarding của bạn
            </p>
          </div>
          <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600">
            ⏳ Demo data — Chờ API BE
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {MOCK_TIMELINE.map((phase, index) => (
            <div
              key={phase.phase}
              className={`rounded-xl border px-4 py-3 ${
                phase.done
                  ? "border-emerald-200 bg-emerald-50"
                  : index === MOCK_TIMELINE.findIndex((p) => !p.done)
                    ? "border-teal-300 bg-teal-50"
                    : "border-stroke bg-slate-50"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {phase.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : index === MOCK_TIMELINE.findIndex((p) => !p.done) ? (
                    <Clock className="h-4 w-4 text-teal-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      phase.done
                        ? "text-emerald-700"
                        : index === MOCK_TIMELINE.findIndex((p) => !p.done)
                          ? "text-teal-700"
                          : "text-muted"
                    }`}>
                    {phase.phase}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  {phase.completed}/{phase.tasks} task
                </span>
              </div>
              {!phase.done && phase.completed > 0 && (
                <Progress
                  className="mt-2"
                  percent={Math.round((phase.completed / phase.tasks) * 100)}
                  size="small"
                  strokeColor="#0f766e"
                  showInfo={false}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="border border-stroke bg-white shadow-sm">
        <h2 className="text-base font-semibold text-ink">Liên hệ hỗ trợ</h2>
        <p className="text-sm text-muted">
          Người hỗ trợ bạn trong quá trình onboarding
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-stroke bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase text-muted">
              Manager của tôi
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {currentUser?.manager ??
                currentUser?.managerUserId ??
                "Chưa được phân công"}
            </p>
          </div>
          <div className="rounded-lg border border-stroke bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase text-muted">
              Phòng ban
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {currentUser?.department ?? "—"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
