import { memo, useState, useMemo, useEffect, useRef } from "react";
import { Form, Input, Button } from "antd";
import {
  BookOpen,
  ClipboardList,
  Copy,
  GripVertical,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale } from "@/i18n";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseInputNumber from "@core/components/Input/BaseNumberInput";
import BaseCheckbox from "@core/components/Checkbox";
import BaseModal from "@core/components/Modal/BaseModal";
import { STAGE_COLORS, TASK_LIBRARY, TASK_CATEGORIES } from "./constants";
import type {
  TaskDraft,
  ChecklistDraft,
  LibraryTask,
  TaskCategory,
} from "./constants";
interface FormValues {
  tasks: {
    name: string;
    description: string;
    dueDaysOffset: number;
    requireAck: boolean;
  }[];
}

/* ── Task Library Modal ─────────────────────────────────── */
const TaskLibraryModal = ({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (task: LibraryTask) => void;
}) => {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TaskCategory | "all">(
    "all",
  );

  const filtered = useMemo(() => {
    let list = TASK_LIBRARY;
    if (activeCategory !== "all") {
      list = list.filter((task) => task.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (task) =>
          task.name.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<TaskCategory, LibraryTask[]>();
    for (const task of filtered) {
      const list = map.get(task.category) ?? [];
      list.push(task);
      map.set(task.category, list);
    }
    return map;
  }, [filtered]);

  return (
    <BaseModal
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand" />
          <span>{t("onboarding.template.library.title")}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}>
      <Input
        prefix={<Search className="h-3.5 w-3.5 text-muted" />}
        placeholder={t("onboarding.template.library.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        className="mb-3"
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            activeCategory === "all"
              ? "bg-brand/10 text-brand"
              : "bg-slate-100 text-muted hover:bg-slate-200"
          }`}>
          {t("onboarding.template.library.cat_all")}
        </button>
        {TASK_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveCategory(cat.value)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              activeCategory === cat.value
                ? "bg-brand/10 text-brand"
                : "bg-slate-100 text-muted hover:bg-slate-200"
            }`}>
            {t(cat.label)}
          </button>
        ))}
      </div>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto">
        {TASK_CATEGORIES.filter(
          (cat) => activeCategory === "all" || activeCategory === cat.value,
        ).map((cat) => {
          const tasks = grouped.get(cat.value);
          if (!tasks?.length) return null;
          return (
            <div key={cat.value}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                {t(cat.label)}
              </h4>
              <div className="space-y-1.5">
                {tasks.map((task, i) => (
                  <div
                    key={`${cat.value}-${i}`}
                    className="group flex items-start gap-3 rounded-lg border border-stroke bg-white p-3 transition hover:border-brand/30 hover:shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">
                        {task.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {task.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted/70">
                        <span>
                          {t("onboarding.template.library.due_days", {
                            days: task.dueDaysOffset,
                          })}
                        </span>
                        {task.requireAck && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-600">
                            {t("onboarding.template.library.requires_ack")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAdd(task)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stroke text-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted">
              {t("onboarding.template.library.no_results")}
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

interface Props {
  checklists: ChecklistDraft[];
  activeIndex: number;
  onSelectStage: (i: number) => void;
  onUpdateTask: (ci: number, ti: number, updates: Partial<TaskDraft>) => void;
  onAddTask: (ci: number) => void;
  onRemoveTask: (ci: number, ti: number) => void;
  onCloneTask: (ci: number, ti: number) => void;
  onReorderTask: (ci: number, from: number, to: number) => void;
  onAddLibraryTask: (ci: number, task: LibraryTask) => void;
}

function SortableTaskCard({
  taskId,
  field,
  index,
  total,
  activeIndex,
  onCloneTask,
  onRemoveTask,
}: {
  taskId: string;
  field: { name: number; key: number };
  index: number;
  total: number;
  activeIndex: number;
  onCloneTask: (ci: number, ti: number) => void;
  onRemoveTask: (ci: number, ti: number) => void;
}) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group overflow-hidden rounded-xl border border-stroke bg-white transition hover:shadow-sm ${
        isDragging ? "shadow-md opacity-90" : ""
      }`}>
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-stroke/60 bg-slate-50/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab touch-none rounded p-0.5 text-muted/40 transition hover:text-muted active:cursor-grabbing"
            {...attributes}
            {...listeners}>
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-muted">
            {t("onboarding.template.editor.step_tasks.task_label")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCloneTask(activeIndex, index)}
            className="flex items-center gap-1 text-xs font-medium text-muted/60 opacity-0 transition hover:text-brand group-hover:opacity-100">
            <Copy className="h-3.5 w-3.5" />
            {t("onboarding.template.editor.clone_task")}
          </button>
          <button
            type="button"
            onClick={() => onRemoveTask(activeIndex, index)}
            disabled={total <= 1}
            className="flex items-center gap-1 text-xs font-medium text-muted/60 opacity-0 transition hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0">
            <X className="h-3.5 w-3.5" />
            {t("onboarding.template.editor.remove_task")}
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <BaseInput
              name={[field.name, "name"]}
              label={t("onboarding.template.editor.task.name_label")}
              placeholder={t(
                "onboarding.template.editor.task.name_placeholder",
              )}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: t(
                      "onboarding.template.editor.task.name_placeholder",
                    ),
                  },
                ],
              }}
            />
          </div>
          <div>
            <BaseInputNumber
              name={[field.name, "dueDaysOffset"]}
              label={t("onboarding.template.editor.task.due_label")}
              min={0}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <BaseInput
              name={[field.name, "description"]}
              label={t("onboarding.template.editor.task.desc_label")}
              placeholder={t(
                "onboarding.template.editor.task.desc_placeholder",
              )}
            />
          </div>
        </div>

        <div className="border-t border-stroke/60 pt-3">
          <BaseCheckbox
            name={[field.name, "requireAck"]}
            labelCheckbox={t("onboarding.template.editor.task.require_ack")}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * TaskForm — per-active-stage antd Form that syncs with parent state.
 * Rendered only when `active` checklist is present.
 * Memoized to skip re-renders when parent stage tabs change but active stage hasn't.
 */
const TaskForm = memo(function TaskForm({
  active,
  activeIndex,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onCloneTask,
  onReorderTask,
  onAddLibraryTask,
}: {
  active: ChecklistDraft;
  activeIndex: number;
  onUpdateTask: Props["onUpdateTask"];
  onAddTask: Props["onAddTask"];
  onRemoveTask: Props["onRemoveTask"];
  onCloneTask: Props["onCloneTask"];
  onReorderTask: Props["onReorderTask"];
  onAddLibraryTask: Props["onAddLibraryTask"];
}) {
  const { t } = useLocale();
  const [antdForm] = Form.useForm<FormValues>();
  const skipSync = useRef(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Sync parent tasks into antd form when active stage or its tasks change
  useEffect(() => {
    skipSync.current = true;
    antdForm.setFieldsValue({
      tasks: active.tasks.map((tk) => ({
        name: tk.name,
        description: tk.description,
        dueDaysOffset: tk.dueDaysOffset,
        requireAck: tk.requireAck,
      })),
    });
    const timer = setTimeout(() => {
      skipSync.current = false;
    }, 0);
    return () => clearTimeout(timer);
  }, [active.id, active.tasks, antdForm]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event;
    if (!over || dragActive.id === over.id) return;
    const from = active.tasks.findIndex((tk) => tk.id === dragActive.id);
    const to = active.tasks.findIndex((tk) => tk.id === over.id);
    if (from !== -1 && to !== -1) onReorderTask(activeIndex, from, to);
  };

  return (
    <Form
      form={antdForm}
      onValuesChange={(_, all) => {
        if (skipSync.current) return;
        all.tasks?.forEach(
          (
            tk: {
              name: string;
              description: string;
              dueDaysOffset: number;
              requireAck: boolean;
            },
            ti: number,
          ) => {
            const orig = active.tasks[ti];
            if (!orig) return;
            if (
              tk.name !== orig.name ||
              tk.description !== orig.description ||
              tk.dueDaysOffset !== orig.dueDaysOffset ||
              tk.requireAck !== orig.requireAck
            ) {
              onUpdateTask(activeIndex, ti, {
                name: tk.name,
                description: tk.description,
                dueDaysOffset: tk.dueDaysOffset,
                requireAck: tk.requireAck,
              });
            }
          },
        );
      }}>
      {/* Sub-header */}
      <div className="flex items-center justify-between border-b border-stroke/60 bg-slate-50/30 px-5 py-3">
        <p className="text-xs font-semibold text-muted">
          {active.name ||
            `${t("onboarding.template.editor.step_tasks.stage_fallback")} ${
              activeIndex + 1
            }`}
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
            {active.tasks.length}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="default"
            icon={<BookOpen className="h-3.5 w-3.5" />}
            onClick={() => setLibraryOpen(true)}>
            {t("onboarding.template.library.button")}
          </Button>
          <Button type="default" onClick={() => onAddTask(activeIndex)}>
            + {t("onboarding.template.editor.add_task")}
          </Button>
        </div>
      </div>

      <TaskLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAdd={(task) => onAddLibraryTask(activeIndex, task)}
      />

      {active.tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <ClipboardList className="h-6 w-6 text-muted" />
          </div>
          <p className="text-sm font-medium text-ink">
            {t("onboarding.template.editor.step_tasks.no_tasks")}
          </p>
          <p className="text-xs text-muted">
            {t("onboarding.template.editor.step_tasks.no_tasks_hint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3 p-5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={active.tasks.map((tk) => tk.id)}
              strategy={verticalListSortingStrategy}>
              <Form.List name="tasks">
                {(fields) =>
                  fields.map((field, ti) => {
                    const task = active.tasks[ti];
                    if (!task) return null;
                    return (
                      <SortableTaskCard
                        key={task.id}
                        taskId={task.id}
                        field={field}
                        index={ti}
                        total={active.tasks.length}
                        activeIndex={activeIndex}
                        onCloneTask={onCloneTask}
                        onRemoveTask={onRemoveTask}
                      />
                    );
                  })
                }
              </Form.List>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </Form>
  );
});

export const StepTasks = ({
  checklists,
  activeIndex,
  onSelectStage,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onCloneTask,
  onReorderTask,
  onAddLibraryTask,
}: Props) => {
  const { t } = useLocale();
  const active = checklists[activeIndex];

  return (
    <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-stroke bg-slate-50/60 px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <ClipboardList className="h-4.5 w-4.5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink">
            {t("onboarding.template.editor.step_tasks.title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {t("onboarding.template.editor.step_tasks.subtitle")}
          </p>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-stroke px-4 py-3">
        {checklists.map((c, i) => {
          const isActive = i === activeIndex;
          const colorCls =
            STAGE_COLORS[c.stageType] ??
            "bg-slate-50 text-slate-600 border-slate-200";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectStage(i)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? colorCls +
                    " shadow-sm ring-1 ring-inset " +
                    colorCls.split(" ").find((c) => c.startsWith("border-"))
                  : "border-transparent text-muted hover:bg-slate-50 hover:text-ink"
              }`}>
              <span className="opacity-60">{i + 1}.</span>
              <span className="max-w-[110px] truncate">
                {c.name ||
                  `${t("onboarding.template.editor.step_tasks.stage_fallback")} ${
                    i + 1
                  }`}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/50" : "bg-slate-100 text-muted"
                }`}>
                {c.tasks.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tasks area — encapsulates antd Form + Form.List per active stage */}
      {active && (
        <TaskForm
          active={active}
          activeIndex={activeIndex}
          onUpdateTask={onUpdateTask}
          onAddTask={onAddTask}
          onRemoveTask={onRemoveTask}
          onCloneTask={onCloneTask}
          onReorderTask={onReorderTask}
          onAddLibraryTask={onAddLibraryTask}
        />
      )}
    </div>
  );
};
