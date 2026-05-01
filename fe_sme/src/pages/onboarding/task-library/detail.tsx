import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  Eye,
  FileCheck2,
  FileText,
  LayoutList,
  ListChecks,
  ShieldCheck,
  Table2,
  UserCheck,
} from "lucide-react";
import {
  Button,
  Drawer,
  Empty,
  Segmented,
  Skeleton,
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

const OWNER_STYLES: Record<string, string> = {
  EMPLOYEE: "bg-sky-50 text-sky-700 border-sky-200",
  HR: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MANAGER: "bg-violet-50 text-violet-700 border-violet-200",
  IT: "bg-amber-50 text-amber-700 border-amber-200",
  IT_STAFF: "bg-amber-50 text-amber-700 border-amber-200",
  DEPARTMENT: "bg-teal-50 text-teal-700 border-teal-200",
  USER: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const OWNER_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  HR: "HR",
  MANAGER: "Manager",
  IT: "IT",
  IT_STAFF: "IT",
  DEPARTMENT: "Department",
  USER: "User",
};

const sortByOrder = <T extends { sortOrder?: number; orderNo?: number }>(
  items: T[],
) =>
  [...items].sort(
    (a, b) =>
      (a.sortOrder ?? a.orderNo ?? Number.MAX_SAFE_INTEGER) -
      (b.sortOrder ?? b.orderNo ?? Number.MAX_SAFE_INTEGER),
  );

const stageChipClass = (stage?: string) =>
  STAGE_COLORS[stage ?? ""] ??
  STAGE_COLORS.CUSTOM ??
  "bg-slate-50 text-slate-600 border-slate-200";

const getOwnerKey = (task: TaskTemplateDetail) => {
  const ownerType = (task.ownerType ?? "").toUpperCase();
  const ownerRef = String(task.ownerRefId ?? "").toUpperCase();

  if (ownerType === "IT_STAFF") return "IT_STAFF";
  if (ownerType) return ownerType;
  if (ownerRef === "IT") return "IT";
  if (ownerRef === "IT_STAFF") return "IT_STAFF";
  if (ownerRef === "HR") return "HR";
  if (ownerRef === "MANAGER") return "MANAGER";
  if (ownerRef === "DEPARTMENT") return "DEPARTMENT";
  return ownerRef || "EMPLOYEE";
};

const getOwnerLabel = (task: TaskTemplateDetail) => {
  const ownerKey = getOwnerKey(task);
  return OWNER_LABELS[ownerKey] ?? ownerKey.replace("_", " ");
};

const formatDueOffset = (days?: number | null) => {
  if (days == null) return "-";
  if (days === 0) return "D+0";
  return days > 0 ? `D+${days}` : `D${days}`;
};

interface ChecklistSummary {
  name: string;
  stage?: string;
  deadlineDays?: number;
  status?: string;
}

interface TaskDetailSelection {
  task: TaskTemplateDetail;
  checklist: ChecklistSummary;
  position: number;
}

const toChecklistSummary = (
  checklist: ChecklistTemplateDetail,
): ChecklistSummary => ({
  name: checklist.name,
  stage: checklist.stage,
  deadlineDays: checklist.deadlineDays,
  status: checklist.status,
});

const OwnerChip = ({ task }: { task: TaskTemplateDetail }) => {
  const ownerKey = getOwnerKey(task);
  const ownerLabel = getOwnerLabel(task);
  const style = OWNER_STYLES[ownerKey] ?? OWNER_STYLES.EMPLOYEE;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${style}`}
    >
      <UserCheck className="h-3 w-3 shrink-0" />
      <span className="truncate">{ownerLabel}</span>
    </span>
  );
};

const RequirementBadges = ({ task }: { task: TaskTemplateDetail }) => {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {task.requireAck && (
        <Tooltip title={t("onboarding.task_library.detail.ack_required")}>
          <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
            <FileCheck2 className="h-3 w-3" />
            {t("onboarding.task_library.detail.ack")}
          </span>
        </Tooltip>
      )}
      {task.requiresManagerApproval && (
        <Tooltip title={t("onboarding.task_library.detail.approval_required")}>
          <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700">
            <ShieldCheck className="h-3 w-3" />
            {t("onboarding.task_library.detail.approval")}
          </span>
        </Tooltip>
      )}
      {task.requireDoc && (
        <Tooltip title={t("onboarding.task_library.detail.doc_required")}>
          <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-[11px] font-medium text-cyan-700">
            <FileText className="h-3 w-3" />
            {t("onboarding.task_library.detail.doc")}
          </span>
        </Tooltip>
      )}
    </div>
  );
};

const EmptyValue = () => <span className="text-slate-400">-</span>;

const InfoTile = ({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) => (
  <div
    className={`rounded-lg border border-slate-200 bg-white p-3 ${
      full ? "md:col-span-2" : ""
    }`}
  >
    <div className="text-[11px] font-semibold uppercase text-slate-400">
      {label}
    </div>
    <div className="mt-1 break-words text-sm font-medium leading-6 text-slate-800">
      {children}
    </div>
  </div>
);

const DetailSection = ({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) => (
  <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand ring-1 ring-slate-200">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    {children}
  </section>
);

const BooleanPill = ({
  active,
  label,
}: {
  active?: boolean;
  label: string;
}) => {
  const { t } = useLocale();

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {t(active ? "global.yes" : "global.no")} - {label}
    </span>
  );
};

const CountValue = ({
  count,
  label,
}: {
  count?: number;
  label: string;
}) =>
  count && count > 0 ? (
    <span>
      {count} {label}
    </span>
  ) : (
    <EmptyValue />
  );

const TaskDetailDrawer = ({
  selection,
  onClose,
}: {
  selection: TaskDetailSelection | null;
  onClose: () => void;
}) => {
  const { t } = useLocale();
  const task = selection?.task;
  const checklist = selection?.checklist;
  const stageMeta = getStageMeta(checklist?.stage);
  const requiredDocumentCount = task?.requiredDocumentIds?.length ?? 0;
  const departmentCheckpointCount =
    task?.responsibleDepartmentIds?.length ?? 0;

  return (
    <Drawer
      open={Boolean(selection)}
      onClose={onClose}
      width={680}
      destroyOnClose
      title={
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ClipboardList className="h-4 w-4 text-brand" />
            Chi tiết task
          </div>
          {task && (
            <div className="mt-1 truncate text-xs font-normal text-slate-500">
              {task.name}
            </div>
          )}
        </div>
      }
    >
      {task && checklist && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Title level={4} className="!mb-0 !leading-tight">
                    {task.name}
                  </Title>
                  {task.status && <TaskLibraryStatusTag status={task.status} />}
                </div>
                {task.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {task.description}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    {t("onboarding.template.card.no_description")}
                  </p>
                )}
              </div>
              <OwnerChip task={task} />
            </div>
          </div>

          <DetailSection
            icon={<BookOpen className="h-4 w-4" />}
            title="Thông tin chính"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoTile label="Checklist">{checklist.name}</InfoTile>
              <InfoTile label="Giai đoạn">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-bold ${stageChipClass(checklist.stage)}`}
                  >
                    {stageMeta.code}
                  </span>
                  <span>{t(stageMeta.labelKey)}</span>
                </div>
              </InfoTile>
              <InfoTile label="Trạng thái task">
                {task.status ? (
                  <TaskLibraryStatusTag status={task.status} />
                ) : (
                  <EmptyValue />
                )}
              </InfoTile>
              <InfoTile label="Vị trí trong checklist">
                #{selection.position}
              </InfoTile>
              <InfoTile label="Người phụ trách">
                <OwnerChip task={task} />
              </InfoTile>
              <InfoTile label="Hạn task">
                {formatDueOffset(task.dueDaysOffset)}
              </InfoTile>
              <InfoTile label="Hạn checklist">
                {checklist.deadlineDays == null ? (
                  <EmptyValue />
                ) : (
                  formatDueOffset(checklist.deadlineDays)
                )}
              </InfoTile>
            </div>
          </DetailSection>

          <DetailSection
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Yêu cầu hoàn thành"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoTile label="Các yêu cầu" full>
                <div className="flex flex-wrap gap-2">
                  <BooleanPill
                    active={task.requireAck}
                    label={t("onboarding.task_library.detail.ack")}
                  />
                  <BooleanPill
                    active={task.requireDoc}
                    label={t("onboarding.task_library.detail.doc")}
                  />
                  <BooleanPill
                    active={task.requiresManagerApproval}
                    label={t("onboarding.task_library.detail.approval")}
                  />
                </div>
              </InfoTile>
              <InfoTile label="Tài liệu bắt buộc">
                <CountValue count={requiredDocumentCount} label="tài liệu" />
              </InfoTile>
              <InfoTile label="Phòng ban cần xác nhận">
                <CountValue
                  count={departmentCheckpointCount}
                  label="phòng ban"
                />
              </InfoTile>
            </div>
          </DetailSection>
        </div>
      )}
    </Drawer>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
  toneClass,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  toneClass: string;
}) => (
  <div className="flex min-h-[88px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-2xl font-semibold leading-none text-slate-900">
        {value}
      </div>
      <div className="mt-1 truncate text-xs font-medium text-slate-500">
        {label}
      </div>
    </div>
  </div>
);

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
    <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-slate-50/70 xl:border-b-0 xl:border-r">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <LayoutList className="h-4 w-4 shrink-0 text-brand" />
          <span className="truncate text-xs font-semibold uppercase text-slate-500">
            {t("onboarding.task_library.detail.checklists")}
          </span>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
          {checklists.length}
        </span>
      </div>

      <nav className="flex gap-2 overflow-x-auto p-3 xl:flex-1 xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden">
        {checklists.map((checklist) => {
          const meta = getStageMeta(checklist.stage);
          const accent = STAGE_ACCENTS[meta.accent];
          const isActive = checklist.checklistTemplateId === activeId;
          const taskCount = checklist.tasks.length;

          return (
            <button
              key={checklist.checklistTemplateId}
              type="button"
              onClick={() => onSelect(checklist.checklistTemplateId)}
              className={`flex min-w-[230px] items-start gap-3 rounded-lg border px-3 py-3 text-left transition xl:min-w-0 ${
                isActive
                  ? "border-brand/40 bg-white shadow-sm ring-1 ring-brand/10"
                  : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white"
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold ${accent.chip}`}
              >
                {meta.code}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm font-semibold ${
                    isActive ? "text-brand" : "text-slate-800"
                  }`}
                >
                  {checklist.name}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <ClipboardList className="h-3 w-3" />
                  {taskCount} {t("onboarding.task_library.detail.col.task")}
                </span>
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
  onOpen,
}: {
  task: TaskTemplateDetail;
  index: number;
  onOpen: () => void;
}) => (
  <button
    type="button"
    onClick={onOpen}
    className="group w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/20"
  >
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold leading-6 text-slate-900">
                {task.name}
              </h3>
              {task.status && <TaskLibraryStatusTag status={task.status} />}
            </div>
            {task.description && (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {task.description}
              </p>
            )}
          </div>
          <OwnerChip task={task} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
            <CalendarClock className="h-3 w-3" />
            {formatDueOffset(task.dueDaysOffset)}
          </span>
          <RequirementBadges task={task} />
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition group-hover:opacity-100">
            <Eye className="h-3.5 w-3.5" />
            Chi tiết
          </span>
        </div>
      </div>
    </div>
  </button>
);

const BoardView = ({
  checklists,
  onTaskSelect,
}: {
  checklists: ChecklistTemplateDetail[];
  onTaskSelect: (selection: TaskDetailSelection) => void;
}) => {
  const { t } = useLocale();
  const sortedChecklists = useMemo(() => sortByOrder(checklists), [checklists]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeChecklist =
    sortedChecklists.find((item) => item.checklistTemplateId === selectedId) ??
    sortedChecklists[0];

  if (!activeChecklist) return null;

  const meta = getStageMeta(activeChecklist.stage);
  const accent = STAGE_ACCENTS[meta.accent];
  const tasks = sortByOrder(activeChecklist.tasks);

  return (
    <div className="grid min-h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:grid-cols-[280px_minmax(0,1fr)]">
      <ChecklistSidebar
        checklists={sortedChecklists}
        activeId={activeChecklist.checklistTemplateId}
        onSelect={setSelectedId}
      />

      <section className="flex min-h-0 flex-col">
        <div
          className={`flex flex-col gap-3 border-b border-slate-200 px-5 py-4 ${accent.soft} lg:flex-row lg:items-center lg:justify-between`}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2 py-1 text-[10px] font-bold ${stageChipClass(activeChecklist.stage)}`}
              >
                {meta.code}
              </span>
              <h2 className="truncate text-base font-semibold text-slate-900">
                {activeChecklist.name}
              </h2>
              {activeChecklist.status && (
                <TaskLibraryStatusTag status={activeChecklist.status} />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{t(meta.labelKey)}</span>
              {activeChecklist.deadlineDays != null && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  {formatDueOffset(activeChecklist.deadlineDays)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/80 bg-white/80 px-3 py-2 text-right shadow-sm">
            <div className="text-lg font-semibold leading-none text-slate-900">
              {tasks.length}
            </div>
            <div className="mt-1 text-[11px] font-medium text-slate-500">
              {t("onboarding.task_library.detail.col.task")}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 p-4">
          {tasks.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("onboarding.task_library.detail.no_tasks")}
              />
            </div>
          ) : (
            <div className="grid gap-3">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.taskTemplateId}
                  task={task}
                  index={index}
                  onOpen={() =>
                    onTaskSelect({
                      task,
                      checklist: toChecklistSummary(activeChecklist),
                      position: index + 1,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

interface FlatTask extends TaskTemplateDetail {
  checklist: ChecklistSummary;
  checklistName: string;
  checklistStage?: string;
  checklistStatus?: string;
  globalIndex: number;
}

const TableView = ({
  checklists,
  onTaskSelect,
}: {
  checklists: ChecklistTemplateDetail[];
  onTaskSelect: (selection: TaskDetailSelection) => void;
}) => {
  const { t } = useLocale();

  const flatTasks = useMemo(() => {
    const rows = sortByOrder(checklists).flatMap((checklist) =>
      sortByOrder(checklist.tasks).map((task) => ({
        ...task,
        checklist: toChecklistSummary(checklist),
        checklistName: checklist.name,
        checklistStage: checklist.stage,
        checklistStatus: checklist.status,
        globalIndex: 0,
      })),
    );

    return rows.map((row, index) => ({
      ...row,
      globalIndex: index + 1,
    }));
  }, [checklists]);

  const columns: ColumnsType<FlatTask> = [
    {
      title: "#",
      dataIndex: "globalIndex",
      key: "no",
      width: 56,
      render: (value: number) => (
        <span className="text-xs font-semibold text-slate-400">{value}</span>
      ),
    },
    {
      title: t("onboarding.task_library.detail.col.task"),
      dataIndex: "name",
      key: "name",
      render: (name: string, row: FlatTask) => (
        <div className="min-w-[260px] py-1">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <span>{name}</span>
            <Eye className="h-3.5 w-3.5 text-slate-300" />
          </div>
          {row.description && (
            <div className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t("onboarding.task_library.detail.col.checklist_stage"),
      dataIndex: "checklistName",
      key: "checklist",
      width: 220,
      render: (name: string, row: FlatTask) => (
        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-slate-700">{name}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {row.checklistStage && (
              <span
                className={`inline-flex w-fit rounded-md border px-2 py-1 text-[10px] font-bold ${stageChipClass(row.checklistStage)}`}
              >
                {getStageMeta(row.checklistStage).code}
              </span>
            )}
            {row.checklistStatus && (
              <TaskLibraryStatusTag status={row.checklistStatus} />
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("onboarding.task_library.detail.col.owner"),
      key: "owner",
      width: 140,
      render: (_: unknown, row: FlatTask) => <OwnerChip task={row} />,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status?: string) =>
        status ? <TaskLibraryStatusTag status={status} /> : <EmptyValue />,
    },
    {
      title: t("onboarding.task_library.detail.col.due"),
      dataIndex: "dueDaysOffset",
      key: "due",
      width: 96,
      align: "center",
      render: (days?: number) => (
        <span className="inline-flex rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
          {formatDueOffset(days)}
        </span>
      ),
    },
    {
      title: t("onboarding.task_library.detail.col.requirements"),
      key: "requirements",
      width: 220,
      render: (_: unknown, row: FlatTask) => <RequirementBadges task={row} />,
    },
  ];

  return (
    <div className="h-[640px]">
      <MyTable<FlatTask>
        columns={columns}
        dataSource={flatTasks}
        rowKey="taskTemplateId"
        onRow={(row) => ({
          onClick: () =>
            onTaskSelect({
              task: row,
              checklist: row.checklist,
              position: row.globalIndex,
            }),
          className: "cursor-pointer",
        })}
        pagination={
          flatTasks.length > 20
            ? {
                pageSize: 20,
                showSizeChanger: false,
                showTotal: (total) =>
                  t("global.pagination.total", { total: String(total) }),
              }
            : false
        }
      />
    </div>
  );
};

type ViewMode = "board" | "table";

const LoadingState = () => (
  <div className="flex flex-col gap-5 p-6">
    <Skeleton active paragraph={{ rows: 3 }} title={{ width: "38%" }} />
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton.Button
          key={item}
          active
          block
          className="!h-[88px] !rounded-lg"
        />
      ))}
    </div>
    <Skeleton active paragraph={{ rows: 12 }} />
  </div>
);

const TaskLibraryDetail = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [selectedTask, setSelectedTask] = useState<TaskDetailSelection | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["task-library-detail", templateId],
    queryFn: () => apiGetTaskLibrary(templateId!),
    enabled: Boolean(templateId),
  });

  const checklists = useMemo(
    () => sortByOrder(data?.checklists ?? []),
    [data?.checklists],
  );

  const allTasks = useMemo(
    () => checklists.flatMap((checklist) => checklist.tasks),
    [checklists],
  );

  const totalTasks = allTasks.length;
  const requireApproval = allTasks.filter(
    (task) => task.requiresManagerApproval,
  ).length;
  const requireDoc = allTasks.filter((task) => task.requireDoc).length;
  const requireAck = allTasks.filter((task) => task.requireAck).length;

  if (isLoading) {
    return <LoadingState />;
  }

  if (!data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("onboarding.task_library.empty.title")}
        >
          <Button
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(AppRouters.ONBOARDING_TASK_LIBRARY)}
          >
            {t("onboarding.task_library.title")}
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50/70 p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <Button
                type="text"
                icon={<ArrowLeft className="h-4 w-4" />}
                className="!-ml-2 !mb-3 !px-2 text-slate-500"
                onClick={() => navigate(AppRouters.ONBOARDING_TASK_LIBRARY)}
              >
                {t("onboarding.task_library.title")}
              </Button>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                  <BookOpen className="h-6 w-6 text-brand" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Title
                      level={3}
                      className="!mb-0 !max-w-4xl !leading-tight"
                    >
                      {data.name}
                    </Title>
                    <TaskLibraryStatusTag status={data.status} />
                  </div>
                  {data.description && (
                    <Text className="mt-2 block max-w-3xl text-sm leading-6 text-slate-500">
                      {data.description}
                    </Text>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <Segmented<ViewMode>
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    value: "board",
                    label: (
                      <span className="inline-flex items-center gap-1.5 px-1">
                        <LayoutList className="h-3.5 w-3.5" />
                        {t("onboarding.task_library.detail.view.board")}
                      </span>
                    ),
                  },
                  {
                    value: "table",
                    label: (
                      <span className="inline-flex items-center gap-1.5 px-1">
                        <Table2 className="h-3.5 w-3.5" />
                        {t("onboarding.task_library.detail.view.table")}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard
            icon={<ListChecks className="h-5 w-5 text-brand" />}
            label={t("onboarding.task_library.detail.stat.checklists")}
            value={checklists.length}
            toneClass="bg-brand/10"
          />
          <MetricCard
            icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
            label={t("onboarding.task_library.detail.stat.total_tasks")}
            value={totalTasks}
            toneClass="bg-emerald-50"
          />
          <MetricCard
            icon={<ShieldCheck className="h-5 w-5 text-violet-600" />}
            label={t("onboarding.task_library.detail.stat.need_approval")}
            value={requireApproval}
            toneClass="bg-violet-50"
          />
          <MetricCard
            icon={<FileText className="h-5 w-5 text-cyan-600" />}
            label={t("onboarding.task_library.detail.stat.need_doc")}
            value={requireDoc}
            toneClass="bg-cyan-50"
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <ClipboardList className="h-4 w-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-900">
                  {viewMode === "board"
                    ? t("onboarding.task_library.detail.checklists")
                    : t("onboarding.task_library.detail.view.table")}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {totalTasks} {t("onboarding.task_library.detail.col.task")} -{" "}
                  {requireAck} {t("onboarding.task_library.detail.ack")}
                </p>
              </div>
            </div>
          </div>

          {checklists.length === 0 ? (
            <div className="flex min-h-[460px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium text-slate-700">
                      {t("onboarding.task_library.empty.title")}
                    </span>
                    <span className="text-sm text-slate-400">
                      {t("onboarding.task_library.empty.desc")}
                    </span>
                  </div>
                }
              />
            </div>
          ) : viewMode === "board" ? (
            <BoardView
              checklists={checklists}
              onTaskSelect={setSelectedTask}
            />
          ) : (
            <TableView
              checklists={checklists}
              onTaskSelect={setSelectedTask}
            />
          )}
        </section>
      </div>
      <TaskDetailDrawer
        selection={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
};

export default TaskLibraryDetail;
