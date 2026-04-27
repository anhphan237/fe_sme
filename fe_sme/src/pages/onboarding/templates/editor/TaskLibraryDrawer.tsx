/**
 * TaskLibraryDrawer — Browse task libraries and add tasks to template stages.
 *
 * Layout:
 *   Drawer (right, 780px)
 *   ├── Header: title + library selector + search
 *   ├── Body (flex row)
 *   │   ├── Sidebar: checklist list (like detail.tsx BoardView sidebar)
 *   │   └── Main: task cards with full metadata + "Add" button per task
 *   └── Footer: selected count + "Add selected to stage" CTA
 *
 * After clicking Add (single or bulk), a mini Modal asks which stage to add to.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Badge,
  Checkbox,
  Drawer,
  Empty,
  Input,
  Modal,
  Select,
  Skeleton,
  Tooltip,
} from "antd";
import {
  BookOpen,
  CheckSquare,
  ClipboardList,
  Clock,
  FileCheck2,
  FileText,
  Layers,
  LayoutList,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Square,
  UserCheck,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import {
  apiListTaskLibraries,
  apiGetTaskLibrary,
} from "@/api/onboarding/onboarding.api";
import TaskLibraryStatusTag from "@/core/components/Status/TaskLibraryStatusTag";
import { STAGE_ACCENTS, getStageMeta } from "./constants";
import type { ChecklistDraft, TaskDraft } from "./constants";
import type {
  ChecklistTemplateDetail,
  TaskTemplateDetail,
} from "@/interface/onboarding";

// ── Owner type resolution ──────────────────────────────────────────────────────

type AssigneeRole = "HR" | "MANAGER" | "EMPLOYEE" | "IT" | "DEPARTMENT";

function resolveAssignee(task: TaskTemplateDetail): AssigneeRole {
  const ownerType = (task.ownerType ?? "").toUpperCase();
  if (ownerType === "MANAGER") return "MANAGER";
  if (ownerType === "IT_STAFF") return "IT";
  if (ownerType === "DEPARTMENT") return "DEPARTMENT";
  if (ownerType === "USER") return "HR";
  const ref = String(task.ownerRefId ?? "").toUpperCase();
  if (ref === "HR") return "HR";
  if (ref === "DEPARTMENT") return "DEPARTMENT";
  if (ref === "MANAGER") return "MANAGER";
  if (ref === "IT" || ref === "IT_STAFF") return "IT";
  if (ownerType === "EMPLOYEE") return "EMPLOYEE";
  return "EMPLOYEE";
}

function resolveOwnerType(task: TaskTemplateDetail): string {
  const ownerType = (task.ownerType ?? "").toUpperCase();
  if (ownerType === "IT_STAFF") return "IT_STAFF";
  if (ownerType) return ownerType;
  const ref = String(task.ownerRefId ?? "").toUpperCase();
  if (ref === "IT" || ref === "IT_STAFF") return "IT_STAFF";
  return "EMPLOYEE";
}

function resolveOwnerRefId(task: TaskTemplateDetail): string | null {
  const ownerType = (task.ownerType ?? "").toUpperCase();
  if (ownerType === "DEPARTMENT" || ownerType === "USER") {
    return task.ownerRefId ?? null;
  }
  return null;
}

function libraryTaskToTaskDraft(
  task: TaskTemplateDetail,
): Omit<TaskDraft, "id"> {
  const assignee = resolveAssignee(task);
  return {
    name: task.name ?? task.title ?? "",
    description: task.description ?? "",
    dueDaysOffset: task.dueDaysOffset ?? 0,
    requireAck: task.requireAck ?? false,
    requireDoc: task.requireDoc ?? false,
    requiresManagerApproval: task.requiresManagerApproval ?? false,
    approverUserId: task.approverUserId ?? undefined,
    requiredDocumentIds: task.requiredDocumentIds ?? undefined,
    assignee,
    ownerRefId: assignee === "DEPARTMENT" ? (task.ownerRefId ?? null) : null,
    responsibleDepartmentIds: task.responsibleDepartmentIds ?? undefined,
  };
}

// ── Assignee chip ──────────────────────────────────────────────────────────────

const ASSIGNEE_STYLES: Record<string, string> = {
  EMPLOYEE: "bg-sky-50 text-sky-700 border-sky-200",
  HR: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MANAGER: "bg-violet-50 text-violet-700 border-violet-200",
  IT: "bg-amber-50 text-amber-700 border-amber-200",
  IT_STAFF: "bg-amber-50 text-amber-700 border-amber-200",
  DEPARTMENT: "bg-teal-50 text-teal-700 border-teal-200",
  USER: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const AssigneeChip = ({
  ownerType,
  ownerRefId,
}: {
  ownerType?: string;
  ownerRefId?: string | null;
}) => {
  const upper = (ownerType ?? "").toUpperCase();
  const label = ownerType === "DEPARTMENT" && ownerRefId;
  const style = ASSIGNEE_STYLES[upper] ?? ASSIGNEE_STYLES.EMPLOYEE;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${style}`}
    >
      <UserCheck className="mr-0.5 h-2.5 w-2.5" />
      {label}
    </span>
  );
};

// ── Requirement badges ─────────────────────────────────────────────────────────

const RequirementBadges = ({ task }: { task: TaskTemplateDetail }) => {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap items-center gap-1">
      {task.requireAck && (
        <Tooltip
          title={
            t("onboarding.task_library.detail.ack_required") ??
            "Yêu cầu xác nhận"
          }
        >
          <span className="inline-flex items-center gap-0.5 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
            <FileCheck2 className="h-2.5 w-2.5" />
            {t("onboarding.task_library.detail.ack") ?? "Ack"}
          </span>
        </Tooltip>
      )}
      {task.requireDoc && (
        <Tooltip
          title={
            t("onboarding.task_library.detail.doc_required") ??
            "Yêu cầu tài liệu"
          }
        >
          <span className="inline-flex items-center gap-0.5 rounded-md border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700">
            <FileText className="h-2.5 w-2.5" />
            {t("onboarding.task_library.detail.doc") ?? "Doc"}
          </span>
        </Tooltip>
      )}
      {task.requiresManagerApproval && (
        <Tooltip
          title={
            t("onboarding.task_library.detail.approval_required") ??
            "Yêu cầu phê duyệt"
          }
        >
          <span className="inline-flex items-center gap-0.5 rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
            <ShieldCheck className="h-2.5 w-2.5" />
            {t("onboarding.task_library.detail.approval") ?? "Approval"}
          </span>
        </Tooltip>
      )}
    </div>
  );
};

// ── Task card ──────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: TaskTemplateDetail;
  index: number;
  selected: boolean;
  onToggleSelect: () => void;
  onAddSingle: () => void;
  readOnly: boolean;
}

const TaskCard = ({
  task,
  index,
  selected,
  onToggleSelect,
  onAddSingle,
  readOnly,
}: TaskCardProps) => {
  const { t } = useLocale();
  const ownerType = resolveOwnerType(task);
  const ownerRefId = resolveOwnerRefId(task);

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-xl border bg-white p-3.5 transition-all ${
        selected
          ? "border-brand/40 shadow-sm ring-1 ring-brand/20"
          : "border-slate-200 hover:border-brand/30 hover:shadow-sm"
      }`}
    >
      {/* Checkbox */}
      {!readOnly && (
        <button
          type="button"
          onClick={onToggleSelect}
          className="mt-0.5 shrink-0 text-slate-400 transition hover:text-brand"
        >
          {selected ? (
            <CheckSquare className="h-4 w-4 text-brand" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Index badge */}
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/8 text-[10px] font-bold text-brand">
        {index + 1}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-slate-800">
            {task.name}
          </p>
          <AssigneeChip ownerType={ownerType} ownerRefId={ownerRefId} />
        </div>

        {/* Description */}
        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {task.dueDaysOffset != null && task.dueDaysOffset > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="h-3 w-3" />
              D+{task.dueDaysOffset}
            </span>
          )}
          <RequirementBadges task={task} />
          {(task.requiredDocumentIds?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
              <Layers className="h-2.5 w-2.5" />
              {task.requiredDocumentIds!.length}{" "}
              {t("onboarding.template.library.drawer.docs") ?? "tài liệu"}
            </span>
          )}
        </div>
      </div>

      {/* Add single button */}
      {!readOnly && (
        <Tooltip
          title={
            t("onboarding.template.library.drawer.add_task") ??
            "Thêm vào giai đoạn"
          }
        >
          <button
            type="button"
            onClick={onAddSingle}
            className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-brand hover:bg-brand/5 hover:text-brand"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
};

// ── Checklist sidebar ──────────────────────────────────────────────────────────

const ChecklistSidebar = ({
  checklists,
  activeId,
  selectedTasks,
  onSelect,
}: {
  checklists: ChecklistTemplateDetail[];
  activeId: string;
  selectedTasks: Set<string>;
  onSelect: (id: string) => void;
}) => {
  const { t } = useLocale();

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-slate-200 bg-slate-50/60">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5">
        <LayoutList className="h-3.5 w-3.5 text-brand" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("onboarding.task_library.detail.checklists") ?? "Checklists"}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-1">
        {checklists.map((cl) => {
          const meta = getStageMeta(cl.stage);
          const accent = STAGE_ACCENTS[meta.accent];
          const isActive = cl.checklistTemplateId === activeId;

          // Count how many tasks in this checklist are selected
          const selectedInThis = cl.tasks.filter((tk) =>
            selectedTasks.has(tk.taskTemplateId),
          ).length;

          return (
            <button
              key={cl.checklistTemplateId}
              type="button"
              onClick={() => onSelect(cl.checklistTemplateId)}
              className={`flex w-full items-center gap-2 border-l-2 px-3 py-2 text-left transition ${
                isActive
                  ? "border-l-brand bg-brand/5"
                  : "border-l-transparent hover:bg-white"
              }`}
            >
              <span
                className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${accent.chip}`}
              >
                {meta.code}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-xs font-medium ${
                  isActive ? "text-brand" : "text-slate-700"
                }`}
              >
                {cl.name}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                {selectedInThis > 0 && (
                  <span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {selectedInThis}
                  </span>
                )}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-brand/10 text-brand"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {cl.tasks.length}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

// ── Stage picker modal ─────────────────────────────────────────────────────────

interface StageSelectorProps {
  open: boolean;
  checklists: ChecklistDraft[];
  taskCount: number;
  onConfirm: (checklistIndex: number) => void;
  onCancel: () => void;
}

const StageSelector = ({
  open,
  checklists,
  taskCount,
  onConfirm,
  onCancel,
}: StageSelectorProps) => {
  const { t } = useLocale();
  const [selected, setSelected] = useState<number | null>(
    checklists.length === 1 ? 0 : null,
  );

  // Reset when opened
  useEffect(() => {
    if (open) {
      setSelected(checklists.length === 1 ? 0 : null);
    }
  }, [open, checklists.length]);

  const options = checklists.map((cl, i) => {
    const meta = getStageMeta(cl.stageType);
    const accent = STAGE_ACCENTS[meta.accent];
    return { value: i, label: cl.name || t(meta.defaultNameKey), accent, meta };
  });

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand" />
          <span>
            {t("onboarding.template.library.drawer.pick_stage_title") ??
              "Chọn giai đoạn"}
          </span>
        </div>
      }
      okText={
        t("onboarding.template.library.drawer.pick_stage_confirm") ?? "Thêm vào"
      }
      cancelText={t("onboarding.template.editor.btn.cancel") ?? "Huỷ"}
      okButtonProps={{ disabled: selected === null }}
      onOk={() => selected !== null && onConfirm(selected)}
      onCancel={onCancel}
      width={420}
      destroyOnClose
    >
      <p className="mb-4 text-sm text-slate-500">
        {t("onboarding.template.library.drawer.pick_stage_hint", {
          count: String(taskCount),
        }) ?? `Thêm ${taskCount} nhiệm vụ vào giai đoạn:`}
      </p>

      {checklists.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            t("onboarding.template.library.drawer.no_stages") ??
            "Chưa có giai đoạn nào. Hãy thêm giai đoạn trước."
          }
        />
      ) : (
        <div className="space-y-1.5">
          {options.map(({ value, label, accent, meta }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                selected === value
                  ? "border-brand bg-brand/5 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${accent.chip}`}
              >
                {meta.code}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700">
                {label}
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {checklists[value]?.tasks.length ?? 0}{" "}
                {t("onboarding.template.review.tasks")?.toLowerCase() ??
                  "nhiệm vụ"}
              </span>
              {selected === value && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export interface TaskLibraryDrawerProps {
  open: boolean;
  /** Current template checklists — used for the stage picker */
  checklists: ChecklistDraft[];
  /** Called when the user confirms adding tasks to a stage */
  onAddTasks: (checklistIndex: number, tasks: Omit<TaskDraft, "id">[]) => void;
  onClose: () => void;
}

const TaskLibraryDrawer = ({
  open,
  checklists,
  onAddTasks,
  onClose,
}: TaskLibraryDrawerProps) => {
  const { t } = useLocale();

  // ── Library selection ────────────────────────────────────────────────────
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(
    null,
  );
  const [activeChecklistId, setActiveChecklistId] = useState<string>("");
  const [search, setSearch] = useState("");

  // ── Task selection (for bulk add) ────────────────────────────────────────
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );

  // ── Stage picker state ───────────────────────────────────────────────────
  const [stageSelectorOpen, setStageSelectorOpen] = useState(false);
  /** Tasks queued to add (single or bulk) — resolved when stage is confirmed */
  const [pendingTasks, setPendingTasks] = useState<TaskTemplateDetail[]>([]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedTaskIds(new Set());
      setStageSelectorOpen(false);
      setPendingTasks([]);
    }
  }, [open]);

  // ── Data: library list ────────────────────────────────────────────────────
  const { data: libraryList, isLoading: isLoadingList } = useQuery({
    queryKey: ["task-libraries", "ACTIVE"],
    queryFn: () => apiListTaskLibraries({ status: "ACTIVE", size: 100 }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const libraries = useMemo(() => libraryList?.items ?? [], [libraryList]);

  // Auto-select first library
  useEffect(() => {
    if (libraries.length && !selectedLibraryId) {
      setSelectedLibraryId(libraries[0].templateId);
    }
  }, [libraries, selectedLibraryId]);

  // ── Data: library detail ──────────────────────────────────────────────────
  const { data: libraryDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["task-library-detail", selectedLibraryId],
    queryFn: () => apiGetTaskLibrary(selectedLibraryId!),
    enabled: !!selectedLibraryId,
    staleTime: 5 * 60 * 1000,
  });

  const libChecklists: ChecklistTemplateDetail[] = useMemo(
    () => libraryDetail?.checklists ?? [],
    [libraryDetail],
  );

  // Auto-select first checklist when library loads
  useEffect(() => {
    if (libChecklists.length && !activeChecklistId) {
      setActiveChecklistId(libChecklists[0].checklistTemplateId);
    }
  }, [libChecklists, activeChecklistId]);

  // Reset active checklist when library changes
  const handleLibraryChange = (id: string) => {
    setSelectedLibraryId(id);
    setActiveChecklistId("");
    setSelectedTaskIds(new Set());
  };

  const activeChecklist =
    libChecklists.find((cl) => cl.checklistTemplateId === activeChecklistId) ??
    libChecklists[0];

  // ── Filtered tasks ────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const tasks = activeChecklist?.tasks ?? [];
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (tk) =>
        (tk.name ?? "").toLowerCase().includes(q) ||
        (tk.description ?? "").toLowerCase().includes(q),
    );
  }, [activeChecklist, search]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const allTasks = libChecklists.flatMap((cl) => cl.tasks);
    return {
      checklists: libChecklists.length,
      tasks: allTasks.length,
      needApproval: allTasks.filter((t) => t.requiresManagerApproval).length,
      needDoc: allTasks.filter((t) => t.requireDoc).length,
    };
  }, [libChecklists]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const isAllSelected =
    filteredTasks.length > 0 &&
    filteredTasks.every((tk) => selectedTaskIds.has(tk.taskTemplateId));

  const toggleTask = (id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        filteredTasks.forEach((tk) => next.delete(tk.taskTemplateId));
        return next;
      });
    } else {
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        filteredTasks.forEach((tk) => next.add(tk.taskTemplateId));
        return next;
      });
    }
  };

  // ── Add flow ──────────────────────────────────────────────────────────────

  /** Open stage picker with a specific set of tasks queued */
  const openStagePickerWith = (tasks: TaskTemplateDetail[]) => {
    if (tasks.length === 0) return;
    if (checklists.length === 0) {
      // No stages yet — inform user
      return;
    }
    setPendingTasks(tasks);
    setStageSelectorOpen(true);
  };

  const handleAddSingle = (task: TaskTemplateDetail) => {
    openStagePickerWith([task]);
  };

  const handleAddSelected = () => {
    const tasks = libChecklists
      .flatMap((cl) => cl.tasks)
      .filter((tk) => selectedTaskIds.has(tk.taskTemplateId));
    openStagePickerWith(tasks);
  };

  const handleStageConfirm = (checklistIndex: number) => {
    const drafts = pendingTasks.map((t) => libraryTaskToTaskDraft(t));
    onAddTasks(checklistIndex, drafts);
    // Clear selection for added tasks
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      pendingTasks.forEach((t) => next.delete(t.taskTemplateId));
      return next;
    });
    setStageSelectorOpen(false);
    setPendingTasks([]);
  };

  const isLoading = isLoadingList || isLoadingDetail;

  // ── Render ────────────────────────────────────────────────────────────────

  const selectedCount = selectedTaskIds.size;

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        placement="right"
        width={780}
        styles={{
          header: { borderBottom: "1px solid #e2e8f0", paddingBlock: "12px" },
          body: {
            padding: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
              <BookOpen className="h-4 w-4 text-brand" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {t("onboarding.template.library.drawer.title") ??
                  "Thư viện Task"}
              </p>
              <p className="text-[11px] text-muted">
                {t("onboarding.template.library.drawer.subtitle") ??
                  "Chọn task từ thư viện và thêm vào giai đoạn của template"}
              </p>
            </div>
          </div>
        }
        extra={
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        }
        closable={false}
      >
        {/* ── Loading skeleton ── */}
        {isLoading && !libraryDetail ? (
          <div className="flex-1 space-y-4 p-6">
            <Skeleton active paragraph={{ rows: 2 }} title={{ width: "40%" }} />
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} active paragraph={{ rows: 1 }} />
              ))}
            </div>
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : libraries.length === 0 ? (
          /* ── No libraries ── */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <BookOpen className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">
                {t("onboarding.task_library.empty.title") ??
                  "Chưa có thư viện task"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {t("onboarding.template.library.drawer.empty_hint") ??
                  "Import file Excel tại trang Thư viện Task để bắt đầu."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Top bar: library selector + search + stats ── */}
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 space-y-3">
              {/* Library selector */}
              <div className="flex items-center gap-3">
                {libraries.length > 1 ? (
                  <Select
                    value={selectedLibraryId}
                    onChange={handleLibraryChange}
                    options={libraries.map((lib) => ({
                      value: lib.templateId,
                      label: lib.departmentTypeName
                        ? `${lib.name} (${lib.departmentTypeName})`
                        : lib.name,
                    }))}
                    className="flex-1"
                    size="small"
                    loading={isLoadingList}
                  />
                ) : (
                  <div className="flex flex-1 items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {libraryDetail?.name ?? libraries[0]?.name}
                    </p>
                    {libraryDetail?.status && (
                      <TaskLibraryStatusTag status={libraryDetail.status} />
                    )}
                  </div>
                )}
                {/* Search */}
                <Input
                  prefix={<Search className="h-3.5 w-3.5 text-slate-400" />}
                  placeholder={
                    t("onboarding.template.library.search") ?? "Tìm task..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                  size="small"
                  className="w-52"
                />
              </div>

              {/* Stats strip */}
              {!isLoading && libChecklists.length > 0 && (
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-3 w-3 text-brand" />
                    <strong className="text-slate-700">
                      {stats.checklists}
                    </strong>{" "}
                    {t("onboarding.task_library.detail.stat.checklists") ??
                      "giai đoạn"}
                  </span>
                  <span className="h-3 w-px bg-slate-200" />
                  <span className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3 text-brand" />
                    <strong className="text-slate-700">
                      {stats.tasks}
                    </strong>{" "}
                    {t("onboarding.task_library.detail.stat.total_tasks") ??
                      "task"}
                  </span>
                  <span className="h-3 w-px bg-slate-200" />
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-violet-500" />
                    <strong className="text-slate-700">
                      {stats.needApproval}
                    </strong>{" "}
                    {t("onboarding.task_library.detail.stat.need_approval") ??
                      "cần phê duyệt"}
                  </span>
                  <span className="h-3 w-px bg-slate-200" />
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3 text-cyan-500" />
                    <strong className="text-slate-700">
                      {stats.needDoc}
                    </strong>{" "}
                    {t("onboarding.task_library.detail.stat.need_doc") ??
                      "cần tài liệu"}
                  </span>
                </div>
              )}
            </div>

            {/* ── Body: sidebar + task panel ── */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Checklist sidebar */}
              {libChecklists.length > 0 && (
                <ChecklistSidebar
                  checklists={libChecklists}
                  activeId={activeChecklist?.checklistTemplateId ?? ""}
                  selectedTasks={selectedTaskIds}
                  onSelect={(id) => {
                    setActiveChecklistId(id);
                    setSearch("");
                  }}
                />
              )}

              {/* Task panel */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Panel header */}
                {activeChecklist && (
                  <div
                    className={`flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5 ${
                      STAGE_ACCENTS[getStageMeta(activeChecklist.stage).accent]
                        .soft
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList
                        className={`h-3.5 w-3.5 ${
                          STAGE_ACCENTS[
                            getStageMeta(activeChecklist.stage).accent
                          ].text
                        }`}
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        {activeChecklist.name}
                      </span>
                      {activeChecklist.stage && (
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                            STAGE_ACCENTS[
                              getStageMeta(activeChecklist.stage).accent
                            ].chip
                          }`}
                        >
                          {getStageMeta(activeChecklist.stage).code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Select all toggle */}
                      {filteredTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={toggleAll}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-white hover:text-brand"
                        >
                          <Checkbox
                            checked={isAllSelected}
                            indeterminate={
                              !isAllSelected &&
                              filteredTasks.some((tk) =>
                                selectedTaskIds.has(tk.taskTemplateId),
                              )
                            }
                          />
                          <span>
                            {t(
                              "onboarding.template.library.drawer.select_all",
                            ) ?? "Chọn tất cả"}
                          </span>
                        </button>
                      )}
                      <Badge
                        count={activeChecklist.tasks.length}
                        color="blue"
                      />
                    </div>
                  </div>
                )}

                {/* Task list */}
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                      <ClipboardList className="h-10 w-10 text-slate-200" />
                      <p className="text-sm text-slate-400">
                        {search.trim()
                          ? (t("onboarding.template.library.no_results") ??
                            "Không tìm thấy task phù hợp")
                          : (t("onboarding.task_library.detail.no_tasks") ??
                            "Chưa có task trong giai đoạn này")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...filteredTasks]
                        .sort(
                          (a, b) =>
                            (a.sortOrder ?? a.orderNo ?? 0) -
                            (b.sortOrder ?? b.orderNo ?? 0),
                        )
                        .map((task, idx) => (
                          <TaskCard
                            key={task.taskTemplateId}
                            task={task}
                            index={idx}
                            selected={selectedTaskIds.has(task.taskTemplateId)}
                            onToggleSelect={() =>
                              toggleTask(task.taskTemplateId)
                            }
                            onAddSingle={() => handleAddSingle(task)}
                            readOnly={false}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Footer: bulk add CTA ── */}
            {selectedCount > 0 && (
              <div className="shrink-0 flex items-center justify-between border-t border-brand/10 bg-brand/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                    {selectedCount}
                  </span>
                  <span className="text-sm font-medium text-brand">
                    {t("onboarding.template.library.drawer.selected_count", {
                      count: String(selectedCount),
                    }) ?? `${selectedCount} task đã chọn`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskIds(new Set())}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/10"
                  >
                    {t("onboarding.template.library.drawer.clear_selection") ??
                      "Bỏ chọn"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSelected}
                    className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand/90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("onboarding.template.library.drawer.add_selected") ??
                      "Thêm vào giai đoạn"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* Stage picker modal */}
      <StageSelector
        open={stageSelectorOpen}
        checklists={checklists}
        taskCount={pendingTasks.length}
        onConfirm={handleStageConfirm}
        onCancel={() => {
          setStageSelectorOpen(false);
          setPendingTasks([]);
        }}
      />
    </>
  );
};

export default TaskLibraryDrawer;
