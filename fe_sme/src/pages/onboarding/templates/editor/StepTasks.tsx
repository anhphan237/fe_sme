import { memo, useState, useMemo, useEffect, useRef } from "react";
import { Form, Input, Select, Button } from "antd";
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
import {
  STAGE_OPTIONS,
  STAGE_COLORS,
  TASK_LIBRARY,
  TASK_CATEGORIES,
} from "./constants";
import type {
  TaskDraft,
  ChecklistDraft,
  LibraryTask,
  TaskCategory,
} from "./constants";

// ── Task Library Modal ─────────────────────────────────────────────────────────

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
    if (activeCategory !== "all")
      list = list.filter((tk) => tk.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (tk) =>
          tk.name.toLowerCase().includes(q) ||
          tk.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<TaskCategory, LibraryTask[]>();
    for (const tk of filtered) {
      const arr = map.get(tk.category) ?? [];
      arr.push(tk);
      map.set(tk.category, arr);
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
                {tasks.map((tk, i) => (
                  <div
                    key={`${cat.value}-${i}`}
                    className="group flex items-start gap-3 rounded-lg border border-stroke bg-white p-3 transition hover:border-brand/30 hover:shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{tk.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {tk.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted/70">
                        <span>
                          {t("onboarding.template.library.due_days", {
                            days: tk.dueDaysOffset,
                          })}
                        </span>
                        {tk.requireAck && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-600">
                            {t("onboarding.template.library.requires_ack")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAdd(tk)}
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

// ── SortableTaskCard ───────────────────────────────────────────────────────────

interface FormValues {
  tasks: {
    name: string;
    description: string;
    dueDaysOffset: number;
    requireAck: boolean;
    requireDoc: boolean;
    requiresManagerApproval: boolean;
    assignee: string;
  }[];
}

function SortableTaskCard({
  taskId,
  field,
  index,
  total,
  onCloneTask,
  onRemoveTask,
  readOnly,
}: {
  taskId: string;
  field: { name: number; key: number };
  index: number;
  total: number;
  onCloneTask: (ti: number) => void;
  onRemoveTask: (ti: number) => void;
  readOnly?: boolean;
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
          {!readOnly && (
            <button
              type="button"
              className="cursor-grab touch-none rounded p-0.5 text-muted/40 transition hover:text-muted active:cursor-grabbing"
              {...attributes}
              {...listeners}>
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-muted">
            {t("onboarding.template.editor.step_tasks.task_label")}
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCloneTask(index)}
              className="flex items-center gap-1 text-xs font-medium text-muted/60 opacity-0 transition hover:text-brand group-hover:opacity-100">
              <Copy className="h-3.5 w-3.5" />
              {t("onboarding.template.editor.clone_task")}
            </button>
            <button
              type="button"
              onClick={() => onRemoveTask(index)}
              disabled={total <= 1}
              className="flex items-center gap-1 text-xs font-medium text-muted/60 opacity-0 transition hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0">
              <X className="h-3.5 w-3.5" />
              {t("onboarding.template.editor.remove_task")}
            </button>
          </div>
        )}
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
              disabled={readOnly}
              formItemProps={{
                rules: readOnly
                  ? []
                  : [
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
              disabled={readOnly}
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
              disabled={readOnly}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              {t("onboarding.template.editor.task.assignee_label")}
            </p>
            <Form.Item name={[field.name, "assignee"]} className="mb-0">
              <Select
                size="small"
                disabled={readOnly}
                options={[
                  {
                    value: "EMPLOYEE",
                    label: t(
                      "onboarding.template.editor.task.assignee.employee",
                    ),
                  },
                  {
                    value: "HR",
                    label: t("onboarding.template.editor.task.assignee.hr"),
                  },
                  {
                    value: "MANAGER",
                    label: t(
                      "onboarding.template.editor.task.assignee.manager",
                    ),
                  },
                  {
                    value: "IT",
                    label: t("onboarding.template.editor.task.assignee.it"),
                  },
                ]}
              />
            </Form.Item>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 border-t border-stroke/60 pt-3">
          <BaseCheckbox
            name={[field.name, "requireAck"]}
            labelCheckbox={t("onboarding.template.editor.task.require_ack")}
            disabled={readOnly}
          />
          <BaseCheckbox
            name={[field.name, "requireDoc"]}
            labelCheckbox={t("onboarding.template.editor.task.require_doc")}
            disabled={readOnly}
          />
          <BaseCheckbox
            name={[field.name, "requiresManagerApproval"]}
            labelCheckbox={t(
              "onboarding.template.editor.task.require_approval",
            )}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

// ── TaskForm — inner form for one stage's tasks (memoized) ─────────────────────

const TaskForm = memo(function TaskForm({
  checklist,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onCloneTask,
  onReorderTask,
  onAddLibraryTask,
  readOnly,
}: {
  checklist: ChecklistDraft;
  onUpdateTask: (ti: number, updates: Partial<TaskDraft>) => void;
  onAddTask: () => void;
  onRemoveTask: (ti: number) => void;
  onCloneTask: (ti: number) => void;
  onReorderTask: (from: number, to: number) => void;
  onAddLibraryTask: (task: LibraryTask) => void;
  readOnly?: boolean;
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
      tasks: checklist.tasks.map((tk) => ({
        name: tk.name,
        description: tk.description,
        dueDaysOffset: tk.dueDaysOffset,
        requireAck: tk.requireAck,
        requireDoc: tk.requireDoc,
        requiresManagerApproval: tk.requiresManagerApproval,
        assignee: tk.assignee,
      })),
    });
    const timer = setTimeout(() => {
      skipSync.current = false;
    }, 0);
    return () => clearTimeout(timer);
  }, [checklist.id, checklist.tasks, antdForm]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event;
    if (!over || dragActive.id === over.id) return;
    const from = checklist.tasks.findIndex((tk) => tk.id === dragActive.id);
    const to = checklist.tasks.findIndex((tk) => tk.id === over.id);
    if (from !== -1 && to !== -1) onReorderTask(from, to);
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
              requireDoc: boolean;
              requiresManagerApproval: boolean;
              assignee: string;
            },
            ti: number,
          ) => {
            const orig = checklist.tasks[ti];
            if (!orig) return;
            if (
              tk.name !== orig.name ||
              tk.description !== orig.description ||
              tk.dueDaysOffset !== orig.dueDaysOffset ||
              tk.requireAck !== orig.requireAck ||
              tk.requireDoc !== orig.requireDoc ||
              tk.requiresManagerApproval !== orig.requiresManagerApproval ||
              tk.assignee !== orig.assignee
            ) {
              onUpdateTask(ti, {
                name: tk.name,
                description: tk.description,
                dueDaysOffset: tk.dueDaysOffset,
                requireAck: tk.requireAck,
                requireDoc: tk.requireDoc,
                requiresManagerApproval: tk.requiresManagerApproval,
                assignee: tk.assignee as TaskDraft["assignee"],
              });
            }
          },
        );
      }}>
      {/* Action bar */}
      <div className="flex items-center justify-between border-b border-stroke/60 bg-slate-50/30 px-5 py-3">
        <p className="text-xs font-semibold text-muted">
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
            {checklist.tasks.length}{" "}
            {t("onboarding.template.editor.step_tasks.task_label")}
          </span>
        </p>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button
              type="default"
              size="small"
              icon={<BookOpen className="h-3.5 w-3.5" />}
              onClick={() => setLibraryOpen(true)}>
              {t("onboarding.template.library.button")}
            </Button>
            <Button type="default" size="small" onClick={onAddTask}>
              + {t("onboarding.template.editor.add_task")}
            </Button>
          </div>
        )}
      </div>

      <TaskLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAdd={(task) => onAddLibraryTask(task)}
      />

      {checklist.tasks.length === 0 ? (
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
              items={checklist.tasks.map((tk) => tk.id)}
              strategy={verticalListSortingStrategy}>
              <Form.List name="tasks">
                {(fields) =>
                  fields.map((field, ti) => {
                    const task = checklist.tasks[ti];
                    if (!task) return null;
                    return (
                      <SortableTaskCard
                        key={task.id}
                        taskId={task.id}
                        field={field}
                        index={ti}
                        total={checklist.tasks.length}
                        onCloneTask={onCloneTask}
                        onRemoveTask={onRemoveTask}
                        readOnly={readOnly}
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

// ── TasksPanel — exported component ──────────────────────────────────────────

export interface TasksPanelProps {
  checklist: ChecklistDraft;
  stageIndex: number;
  onUpdateStage: (updates: Partial<ChecklistDraft>) => void;
  onUpdateTask: (ti: number, updates: Partial<TaskDraft>) => void;
  onAddTask: () => void;
  onRemoveTask: (ti: number) => void;
  onCloneTask: (ti: number) => void;
  onReorderTask: (from: number, to: number) => void;
  onAddLibraryTask: (task: LibraryTask) => void;
  readOnly?: boolean;
}

export const TasksPanel = ({
  checklist,
  onUpdateStage,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onCloneTask,
  onReorderTask,
  onAddLibraryTask,
  readOnly,
}: TasksPanelProps) => {
  const { t } = useLocale();
  const [stageForm] = Form.useForm<{ name: string; stageType: string }>();

  const stageOptions = STAGE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.label),
  }));

  const stageColor =
    STAGE_COLORS[checklist.stageType ?? ""] ??
    "bg-slate-50 text-slate-500 border-slate-200";

  // Sync form when switching stages
  useEffect(() => {
    stageForm.setFieldsValue({
      name: checklist.name,
      stageType: checklist.stageType,
    });
  }, [checklist.id, checklist.name, checklist.stageType, stageForm]);

  return (
    <div className="flex h-full flex-col">
      {/* Stage header — editable name + type */}
      <div className="flex items-center gap-3 border-b border-stroke bg-slate-50/50 px-5 py-3">
        <Form
          form={stageForm}
          layout="inline"
          className="flex flex-1 min-w-0 items-center gap-3"
          onValuesChange={(_, all) => {
            if (readOnly) return;
            onUpdateStage({
              name: all.name ?? "",
              stageType: all.stageType ?? checklist.stageType,
            });
          }}>
          <Form.Item
            name="name"
            className="mb-0 flex-1 min-w-0"
            rules={readOnly ? [] : [{ required: true }]}>
            <Input
              placeholder={t(
                "onboarding.template.editor.stage_name_placeholder",
              )}
              disabled={readOnly}
              className="border-0 bg-transparent text-sm font-semibold text-ink shadow-none focus:bg-white focus:shadow"
              style={{ boxShadow: "none" }}
            />
          </Form.Item>
          <Form.Item name="stageType" className="mb-0 shrink-0">
            <Select
              options={stageOptions}
              size="small"
              disabled={readOnly}
              className={`rounded-lg border text-xs font-semibold ${stageColor}`}
              style={{ minWidth: 120 }}
            />
          </Form.Item>
        </Form>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        <TaskForm
          checklist={checklist}
          onUpdateTask={onUpdateTask}
          onAddTask={onAddTask}
          onRemoveTask={onRemoveTask}
          onCloneTask={onCloneTask}
          onReorderTask={onReorderTask}
          onAddLibraryTask={onAddLibraryTask}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};
