import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { Dropdown, Input, Modal } from "antd";
import { useLocale } from "@/i18n";
import type { ChecklistDraft, TaskDraft } from "./constants";
import { STAGE_ACCENTS, getStageMeta } from "./constants";

// ── Assignee chip ──────────────────────────────────────────────────────────────

const ASSIGNEE_STYLES: Record<string, string> = {
  EMPLOYEE: "bg-sky-50 text-sky-700 border-sky-100",
  HR: "bg-emerald-50 text-emerald-700 border-emerald-100",
  MANAGER: "bg-violet-50 text-violet-700 border-violet-100",
  IT: "bg-amber-50 text-amber-700 border-amber-100",
  DEPARTMENT: "bg-teal-50 text-teal-700 border-teal-100",
};

const ASSIGNEE_LABEL: Record<string, string> = {
  EMPLOYEE: "NV",
  HR: "HR",
  MANAGER: "QL",
  IT: "IT",
  DEPARTMENT: "PB",
};

const AssigneeChip = ({ assignee }: { assignee: TaskDraft["assignee"] }) => (
  <span
    className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
      ASSIGNEE_STYLES[assignee] ?? ASSIGNEE_STYLES.EMPLOYEE
    }`}>
    {ASSIGNEE_LABEL[assignee] ?? assignee}
  </span>
);

const FlagDot = ({
  active,
  color,
  title,
}: {
  active: boolean;
  color: string;
  title: string;
}) =>
  active ? (
    <span title={title} className={`h-1.5 w-1.5 rounded-full ${color}`} />
  ) : null;

// ── Sortable mini task card ────────────────────────────────────────────────────

interface SortableTaskMiniCardProps {
  task: TaskDraft;
  taskIndex: number;
  readOnly?: boolean;
  onClick: () => void;
  onClone: () => void;
  onDelete: () => void;
}

const SortableTaskMiniCard = ({
  task,
  taskIndex,
  readOnly,
  onClick,
  onClone,
  onDelete,
}: SortableTaskMiniCardProps) => {
  const { t } = useLocale();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group mx-2.5 mb-2 cursor-pointer rounded-xl border border-stroke bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-brand/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div
        className="flex items-start gap-2 px-3 py-3"
        onClick={onClick}>
        {/* Drag handle */}
        {!readOnly && (
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted/20 transition hover:text-muted/60 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}>
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          {/* Task name */}
          <span className="block text-[13.5px] font-medium leading-snug text-ink line-clamp-2">
            {task.name ||
              t("onboarding.template.editor.pipeline.untitled_task")}
          </span>

          {/* Meta row */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AssigneeChip assignee={task.assignee} />
              <FlagDot
                active={task.requireAck}
                color="bg-blue-400"
                title="Xác nhận tài liệu"
              />
              <FlagDot
                active={task.requireDoc}
                color="bg-sky-400"
                title="Nộp tài liệu"
              />
              <FlagDot
                active={task.requiresManagerApproval}
                color="bg-violet-400"
                title="Cần phê duyệt"
              />
              <FlagDot
                active={(task.responsibleDepartmentIds?.length ?? 0) > 0}
                color="bg-teal-400"
                title={`${task.responsibleDepartmentIds?.length ?? 0} phòng ban xác nhận`}
              />
            </div>
            <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
              D+{task.dueDaysOffset}
            </span>
          </div>
        </div>

        {/* Hover actions */}
        {!readOnly && (
          <div
            className="ml-0.5 flex shrink-0 flex-col items-center gap-0.5 opacity-0 transition group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onClone}
              title={t("onboarding.template.editor.clone_task")}
              className="rounded p-1 text-muted/40 transition hover:bg-slate-100 hover:text-slate-600">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title={t("onboarding.template.editor.remove_task")}
              className="rounded p-1 text-muted/40 transition hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Stage column ───────────────────────────────────────────────────────────────

export interface StageColumnProps {
  checklist: ChecklistDraft;
  checklistIndex: number;
  readOnly?: boolean;
  onAddTask: () => void;
  onEditTask: (ti: number) => void;
  onCloneTask: (ti: number) => void;
  onDeleteTask: (ti: number) => void;
  onReorderTasks: (from: number, to: number) => void;
  onRenameStage: (name: string) => void;
  onCloneStage: () => void;
  onDeleteStage: () => void;
}

export const StageColumn = ({
  checklist,
  checklistIndex,
  readOnly,
  onAddTask,
  onEditTask,
  onCloneTask,
  onDeleteTask,
  onReorderTasks,
  onRenameStage,
  onCloneStage,
  onDeleteStage,
}: StageColumnProps) => {
  const { t } = useLocale();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(checklist.name);

  const meta = getStageMeta(checklist.stageType);
  const accents = STAGE_ACCENTS[meta.accent];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = checklist.tasks.findIndex((t) => t.id === active.id);
    const toIdx = checklist.tasks.findIndex((t) => t.id === over.id);
    if (fromIdx !== -1 && toIdx !== -1) onReorderTasks(fromIdx, toIdx);
  };

  const openRename = () => {
    setRenameValue(checklist.name);
    setRenameOpen(true);
  };

  const confirmRename = () => {
    if (renameValue.trim()) onRenameStage(renameValue.trim());
    setRenameOpen(false);
  };

  const menuItems = readOnly
    ? []
    : [
        {
          key: "rename",
          label: t("onboarding.template.editor.pipeline.stage_menu.rename"),
          onClick: openRename,
        },
        {
          key: "clone",
          label: t("onboarding.template.editor.pipeline.stage_menu.clone"),
          onClick: onCloneStage,
        },
        { type: "divider" as const },
        {
          key: "delete",
          danger: true,
          label: t("onboarding.template.editor.pipeline.stage_menu.delete"),
          onClick: onDeleteStage,
        },
      ];

  return (
    <>
      <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {/* ── Column header ── */}
        <div className={`border-b px-4 pb-3 pt-3.5 ${accents.border} ${accents.soft}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-3 w-3 shrink-0 rounded-full ${accents.dot}`} />
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${accents.chip}`}>
                {meta.code}
              </span>
              <span className="truncate text-sm font-bold text-ink">
                {checklist.name || t(meta.defaultNameKey)}
              </span>
            </div>
            {menuItems.length > 0 && (
              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
                placement="bottomRight">
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-1.5 text-muted/50 transition hover:bg-white/80 hover:text-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </Dropdown>
            )}
          </div>
          <div className={`mt-1.5 flex items-center gap-2 pl-5 text-[11px] ${accents.text}`}>
            <span>{t(meta.dayRangeKey)}</span>
            <span className="text-muted/40">·</span>
            <span className="font-medium text-muted">
              {checklist.tasks.length} nhiệm vụ
            </span>
          </div>
        </div>

        {/* ── Task list ── */}
        <div className="flex-1 overflow-y-auto py-2.5" style={{ maxHeight: 480 }}>
          {checklist.tasks.length === 0 && (
            <p className="px-4 py-6 text-center text-[12px] text-muted/50">
              Chưa có nhiệm vụ nào
            </p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={checklist.tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}>
              {checklist.tasks.map((task, ti) => (
                <SortableTaskMiniCard
                  key={task.id}
                  task={task}
                  taskIndex={ti}
                  readOnly={readOnly}
                  onClick={() => onEditTask(ti)}
                  onClone={() => onCloneTask(ti)}
                  onDelete={() => onDeleteTask(ti)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* ── Add task footer ── */}
        {!readOnly && (
          <div className="border-t border-stroke/50 px-3 py-2.5">
            <button
              type="button"
              onClick={onAddTask}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand/20 bg-brand/[0.03] px-3 py-2 text-[12.5px] font-medium text-brand/70 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand">
              <Plus className="h-3.5 w-3.5" />
              {t("onboarding.template.editor.pipeline.add_task")}
            </button>
          </div>
        )}
      </div>

      {/* Rename modal */}
      <Modal
        open={renameOpen}
        title={t("onboarding.template.editor.stage.rename_title")}
        onOk={confirmRename}
        onCancel={() => setRenameOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
        okButtonProps={{ disabled: !renameValue.trim() }}>
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={confirmRename}
          placeholder={t("onboarding.template.editor.stage_name_placeholder")}
          autoFocus
          className="mt-2"
        />
      </Modal>
    </>
  );
};
