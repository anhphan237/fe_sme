import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ClipboardList,
  FileText,
  LayoutList,
  Table2,
  UserCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { apiGetTaskLibrary } from "@/api/onboarding/onboarding.api";
import { AppRouters } from "@/constants/router";
import TaskLibraryStatusTag from "@/core/components/Status/TaskLibraryStatusTag";
import MyTable from "@/components/table";
import type {
  ChecklistTemplateDetail,
  TaskTemplateDetail,
} from "@/interface/onboarding";
import {
  STAGE_ACCENTS,
  STAGE_COLORS,
  getStageMeta,
} from "@/pages/onboarding/templates/editor/constants";

const { Title, Text } = Typography;

// ── constants ──────────────────────────────────────────────────────────────────

const OWNER_COLOR: Record<string, string> = {
  HR: "blue",
  MANAGER: "purple",
  EMPLOYEE: "green",
  IT_STAFF: "orange",
  IT: "orange",
};

// ── helpers ────────────────────────────────────────────────────────────────────

const stageChipClass = (stage?: string) =>
  STAGE_COLORS[stage ?? ""] ?? STAGE_COLORS["CUSTOM"] ?? "bg-slate-50 text-slate-600 border-slate-200";

const RequirementBadges = ({ task }: { task: TaskTemplateDetail }) => {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {task.requireAck && (
        <Tooltip title={t("onboarding.task_library.detail.ack_required")}>
          <Tag color="gold" className="!m-0 !text-[11px] !px-1.5 !py-0">
            {t("onboarding.task_library.detail.ack")}
          </Tag>
        </Tooltip>
      )}
      {task.requiresManagerApproval && (
        <Tooltip title={t("onboarding.task_library.detail.approval_required")}>
          <Tag color="volcano" className="!m-0 !text-[11px] !px-1.5 !py-0">
            {t("onboarding.task_library.detail.approval")}
          </Tag>
        </Tooltip>
      )}
      {task.requireDoc && (
        <Tooltip title={t("onboarding.task_library.detail.doc_required")}>
          <Tag color="cyan" className="!m-0 !text-[11px] !px-1.5 !py-0">
            {t("onboarding.task_library.detail.doc")}
          </Tag>
        </Tooltip>
      )}
    </div>
  );
};

// ── Board view ─────────────────────────────────────────────────────────────────

const ChecklistSidebar = ({
  checklists,
  activeId,
  onSelect,
}: {
  checklists: ChecklistTemplateDetail[];
  activeId: string;
  onSelect: (id: string) => void;
}) => {
  const { t } = useLocale();
  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-slate-50/60 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
        <LayoutList className="h-3.5 w-3.5 text-brand" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("onboarding.task_library.detail.checklists")}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-1">
        {checklists.map((cl) => {
          const meta = getStageMeta(cl.stage);
          const accent = STAGE_ACCENTS[meta.accent];
          const isActive = cl.checklistTemplateId === activeId;
          return (
            <button
              key={cl.checklistTemplateId}
              type="button"
              onClick={() => onSelect(cl.checklistTemplateId)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 border-l-2 text-left transition
              ${isActive
                  ? `bg-brand/5 border-l-brand`
                  : "border-l-transparent hover:bg-white"
                }`}>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border ${accent.chip}`}>
                {meta.code}
              </span>
              <span
                className={`flex-1 min-w-0 truncate text-sm font-medium ${isActive ? "text-brand" : "text-slate-700"}`}>
                {cl.name}
              </span>
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? "bg-brand/10 text-brand" : "bg-slate-200 text-slate-500"}`}>
                {cl.tasks.length}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

const TaskCard = ({
  task,
  index,
}: {
  task: TaskTemplateDetail;
  index: number;
}) => {
  const { t } = useLocale();
  return (
    <div className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-brand/30 transition-all">
      {/* Index */}
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/8 text-xs font-bold text-brand">
        {index + 1}
      </div>

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Title + owner */}
        <div className="flex flex-wrap items-start gap-2">
          <span className="font-semibold text-slate-800 leading-snug flex-1 min-w-0">
            {task.name}
          </span>
          {task.ownerRefId && (
            <Tag
              color={OWNER_COLOR[task.ownerRefId] ?? "default"}
              className="!m-0 !text-xs shrink-0">
              {task.ownerRefId}
            </Tag>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <Text className="text-slate-500 text-xs leading-relaxed">
            {task.description}
          </Text>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 flex-wrap pt-0.5">
          {task.dueDaysOffset != null && task.dueDaysOffset > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <CheckCircle className="h-3 w-3" />
              {t(
                task.dueDaysOffset !== 1
                  ? "onboarding.task_library.detail.due_in_days_plural"
                  : "onboarding.task_library.detail.due_in_days",
                { days: task.dueDaysOffset },
              )}
            </span>
          )}
          <RequirementBadges task={task} />
        </div>
      </div>
    </div>
  );
};

const BoardView = ({ checklists }: { checklists: ChecklistTemplateDetail[] }) => {
  const { t } = useLocale();
  const [activeId, setActiveId] = useState(
    checklists[0]?.checklistTemplateId ?? "",
  );

  const activeChecklist =
    checklists.find((cl) => cl.checklistTemplateId === activeId) ??
    checklists[0];

  if (!activeChecklist) return null;

  const meta = getStageMeta(activeChecklist.stage);
  const accent = STAGE_ACCENTS[meta.accent];

  return (
    <div className="flex flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm min-h-[420px]">
      <ChecklistSidebar
        checklists={checklists}
        activeId={activeChecklist.checklistTemplateId}
        onSelect={setActiveId}
      />

      {/* Task panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Panel header */}
        <div
          className={`flex items-center justify-between px-5 py-3 border-b border-slate-200 ${accent.soft}`}>
          <div className="flex items-center gap-2">
            <ClipboardList className={`h-4 w-4 ${accent.text}`} />
            <span className="font-semibold text-slate-800">
              {activeChecklist.name}
            </span>
            {activeChecklist.stage && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${stageChipClass(activeChecklist.stage)}`}>
                {meta.code}
              </span>
            )}
          </div>
          <Badge
            count={activeChecklist.tasks.length}
            color="blue"
            overflowCount={99}
          />
        </div>

        {/* Tasks */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeChecklist.tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
              <ClipboardList className="h-8 w-8 text-slate-200" />
              <span className="text-sm">{t("onboarding.task_library.detail.no_tasks")}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...activeChecklist.tasks]
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((task, idx) => (
                  <TaskCard key={task.taskTemplateId} task={task} index={idx} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Table view ─────────────────────────────────────────────────────────────────

interface FlatTask extends TaskTemplateDetail {
  checklistName: string;
  checklistStage?: string;
  globalIndex: number;
}

const TableView = ({ checklists }: { checklists: ChecklistTemplateDetail[] }) => {
  const { t } = useLocale();
  const flatTasks: FlatTask[] = checklists.flatMap((cl) =>
    [...cl.tasks]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((task) => ({
        ...task,
        checklistName: cl.name,
        checklistStage: cl.stage,
        globalIndex: 0,
      })),
  );
  flatTasks.forEach((t, i) => (t.globalIndex = i + 1));

  const columns: ColumnsType<FlatTask> = [
    {
      title: "#",
      dataIndex: "globalIndex",
      key: "no",
      width: 48,
      render: (v: number) => (
        <span className="text-xs text-slate-400 font-medium">{v}</span>
      ),
    },
    {
      title: t("onboarding.task_library.detail.col.task"),
      dataIndex: "name",
      key: "name",
      render: (name: string, row: FlatTask) => (
        <div className="flex flex-col gap-0.5 py-0.5">
          <span className="font-semibold text-slate-800 text-sm">{name}</span>
          {row.description && (
            <span className="text-xs text-slate-400 leading-relaxed">
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      title: t("onboarding.task_library.detail.col.checklist_stage"),
      dataIndex: "checklistName",
      key: "checklist",
      width: 180,
      render: (name: string, row: FlatTask) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-700 font-medium">{name}</span>
          {row.checklistStage && (
            <span
              className={`inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-bold border ${stageChipClass(row.checklistStage)}`}>
              {getStageMeta(row.checklistStage).code}
            </span>
          )}
        </div>
      ),
    },
    {
      title: t("onboarding.task_library.detail.col.owner"),
      dataIndex: "ownerRefId",
      key: "owner",
      width: 110,
      render: (owner?: string) =>
        owner ? (
          <Tag
            color={OWNER_COLOR[owner] ?? "default"}
            className="!m-0 !text-xs">
            {owner}
          </Tag>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        ),
    },
    {
      title: t("onboarding.task_library.detail.col.due"),
      dataIndex: "dueDaysOffset",
      key: "due",
      width: 90,
      align: "center",
      render: (days?: number) =>
        days != null && days > 0 ? (
          <span className="text-xs text-slate-600 font-medium">
            +{days}d
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        ),
    },
    {
      title: t("onboarding.task_library.detail.col.requirements"),
      key: "req",
      width: 160,
      render: (_: unknown, row: FlatTask) => <RequirementBadges task={row} />,
    },
  ];

  return (
    <MyTable<FlatTask>
      columns={columns}
      dataSource={flatTasks}
      rowKey="taskTemplateId"
      pagination={flatTasks.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
    />
  );
};

// ── Stats bar ──────────────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/8">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-bold text-slate-800 leading-tight">{value}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  </div>
);

// ── Page ───────────────────────────────────────────────────────────────────────

type ViewMode = "board" | "table";

const TaskLibraryDetail = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>("board");

  const { data, isLoading } = useQuery({
    queryKey: ["task-library-detail", templateId],
    queryFn: () => apiGetTaskLibrary(templateId!),
    enabled: !!templateId,
  });

  const checklists = data?.checklists ?? [];
  const totalTasks = checklists.reduce(
    (sum, cl) => sum + (cl.tasks?.length ?? 0),
    0,
  );
  const requireApproval = checklists
    .flatMap((cl) => cl.tasks)
    .filter((t) => t.requiresManagerApproval).length;
  const requireDoc = checklists
    .flatMap((cl) => cl.tasks)
    .filter((t) => t.requireDoc).length;

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Back */}
      <Button
        type="text"
        icon={<ArrowLeft className="h-4 w-4" />}
        className="self-start -ml-2 text-slate-500"
        onClick={() => navigate(AppRouters.ONBOARDING_TASK_LIBRARY)}>
        {t("onboarding.task_library.title")}
      </Button>

      {isLoading ? (
        <>
          <Skeleton active paragraph={{ rows: 2 }} title={{ width: "40%" }} />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} active paragraph={{ rows: 1 }} />
            ))}
          </div>
          <Skeleton active paragraph={{ rows: 8 }} />
        </>
      ) : !data ? (
        <div className="text-slate-400">{t("global.not_found")}</div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                <BookOpen className="h-5 w-5 text-brand" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Title level={4} className="!mb-0 !leading-tight">
                    {data.name}
                  </Title>
                  <TaskLibraryStatusTag status={data.status} />
                </div>
                {data.description && (
                  <Text className="text-slate-500 text-sm max-w-xl">
                    {data.description}
                  </Text>
                )}
              </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 self-start shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "board"
                    ? "bg-white shadow-sm text-brand border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                <LayoutList className="h-3.5 w-3.5" />
                {t("onboarding.task_library.detail.view.board")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "table"
                    ? "bg-white shadow-sm text-brand border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                <Table2 className="h-3.5 w-3.5" />
                {t("onboarding.task_library.detail.view.table")}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<ClipboardList className="h-4 w-4 text-brand" />}
              label={t("onboarding.task_library.detail.stat.checklists")}
              value={checklists.length}
            />
            <StatCard
              icon={<CheckCircle className="h-4 w-4 text-brand" />}
              label={t("onboarding.task_library.detail.stat.total_tasks")}
              value={totalTasks}
            />
            <StatCard
              icon={<UserCheck className="h-4 w-4 text-brand" />}
              label={t("onboarding.task_library.detail.stat.need_approval")}
              value={requireApproval}
            />
            <StatCard
              icon={<FileText className="h-4 w-4 text-brand" />}
              label={t("onboarding.task_library.detail.stat.need_doc")}
              value={requireDoc}
            />
          </div>

          {/* Content */}
          {checklists.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-slate-400 rounded-xl border border-slate-200 bg-white">
              <ClipboardList className="h-10 w-10 text-slate-200" />
              <span className="text-sm">
                {t("onboarding.task_library.empty.desc")}
              </span>
            </div>
          ) : viewMode === "board" ? (
            <BoardView checklists={checklists} />
          ) : (
            <TableView checklists={checklists} />
          )}
        </>
      )}
    </div>
  );
};

export default TaskLibraryDetail;
