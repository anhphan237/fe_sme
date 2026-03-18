import { useEffect } from "react";
import { Form, Button } from "antd";
import { LayoutList, Copy, X, GripVertical, Plus } from "lucide-react";
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
import BaseSelect from "@core/components/Select/BaseSelect";
import { STAGE_OPTIONS, STAGE_COLORS } from "./constants";
import type { ChecklistDraft } from "./constants";

export interface StageSidebarProps {
  checklists: ChecklistDraft[];
  activeIndex: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onClone: (i: number) => void;
  onReorder: (from: number, to: number) => void;
}

function SortableStageCard({
  checklist,
  index,
  isActive,
  total,
  onSelect,
  onClone,
  onRemove,
}: {
  checklist: ChecklistDraft;
  index: number;
  isActive: boolean;
  total: number;
  onSelect: (i: number) => void;
  onClone: (i: number) => void;
  onRemove: (i: number) => void;
}) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: checklist.id });

  const stageLabel = STAGE_OPTIONS.find(
    (o) => o.value === checklist.stageType,
  )?.label;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: "relative",
      }}
      className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none border-l-2 transition ${
        isActive
          ? "bg-brand/5 border-l-brand"
          : "border-l-transparent hover:bg-slate-50"
      } ${isDragging ? "shadow-md opacity-90" : ""}`}
      onClick={() => onSelect(index)}>
      {/* Drag handle */}
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted/30 transition hover:text-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Index badge */}
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          isActive ? "bg-brand text-white" : "bg-slate-100 text-slate-500"
        }`}>
        {index + 1}
      </span>

      {/* Stage name + type label */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium leading-tight ${
            isActive ? "text-brand" : "text-ink"
          }`}>
          {checklist.name ||
            `${t("onboarding.template.editor.step_tasks.stage_fallback")} ${index + 1}`}
        </p>
        {stageLabel && (
          <p className="mt-0.5 truncate text-[10px] text-muted">
            {t(stageLabel)}
          </p>
        )}
      </div>

      {/* Task count */}
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          isActive ? "bg-brand/10 text-brand" : "bg-slate-100 text-muted"
        }`}>
        {checklist.tasks.length}
      </span>

      {/* Clone / Delete */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClone(index);
          }}
          className="rounded p-1 text-muted hover:bg-brand/10 hover:text-brand">
          <Copy className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          disabled={total <= 1}
          className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export const StageSidebar = ({
  checklists,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
  onClone,
  onReorder,
}: StageSidebarProps) => {
  const { t } = useLocale();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = checklists.findIndex((c) => c.id === active.id);
    const to = checklists.findIndex((c) => c.id === over.id);
    if (from !== -1 && to !== -1) onReorder(from, to);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stroke px-4 py-3">
        <div className="flex items-center gap-2">
          <LayoutList className="h-4 w-4 text-brand" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t("onboarding.template.editor.step_stages.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand transition hover:bg-brand/10">
          <Plus className="h-3.5 w-3.5" />
          {t("onboarding.template.editor.add_stage")}
        </button>
      </div>

      {/* Stage list */}
      <div className="flex-1 overflow-y-auto">
        {checklists.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <LayoutList className="h-8 w-8 text-muted/30" />
            <p className="text-xs text-muted">
              {t("onboarding.template.editor.step_stages.empty_subtitle")}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={checklists.map((c) => c.id)}
              strategy={verticalListSortingStrategy}>
              <div className="py-1">
                {checklists.map((c, i) => (
                  <SortableStageCard
                    key={c.id}
                    checklist={c}
                    index={i}
                    isActive={i === activeIndex}
                    total={checklists.length}
                    onSelect={onSelect}
                    onClone={onClone}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer */}
      {checklists.length > 0 && (
        <div className="border-t border-stroke px-4 py-2.5">
          <p className="text-[11px] text-muted">
            <span className="font-semibold text-ink">{checklists.length}</span>{" "}
            {t("onboarding.template.editor.step_stages.footer_count")}
          </p>
        </div>
      )}
    </div>
  );
};

// ── StepStages — full-page stage management table ──────────────────────────────

interface Props {
  checklists: ChecklistDraft[];
  onUpdate: (i: number, updates: Partial<ChecklistDraft>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onClone: (i: number) => void;
  onReorder: (from: number, to: number) => void;
}

interface FormValues {
  checklists: { name: string; stageType: string }[];
}

function SortableStageRow({
  checklist,
  index,
  field,
  stageOptions,
  total,
  onClone,
  onRemove,
}: {
  checklist: ChecklistDraft;
  index: number;
  field: { name: number; key: number };
  stageOptions: { value: string; label: string }[];
  total: number;
  onClone: (i: number) => void;
  onRemove: (i: number) => void;
}) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: checklist.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };

  const stageColor =
    STAGE_COLORS[checklist.stageType ?? ""] ??
    "bg-slate-50 text-slate-500 border-slate-200";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-3 px-5 py-4 transition hover:bg-slate-50/50 ${
        isDragging ? "bg-slate-50 shadow-md rounded-lg opacity-90" : ""
      }`}>
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab touch-none rounded p-1 text-muted/40 transition hover:text-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Index badge */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/8 text-xs font-bold text-brand">
        {index + 1}
      </div>

      {/* Name input */}
      <div className="min-w-0">
        <BaseInput
          name={[field.name, "name"]}
          placeholder={t("onboarding.template.editor.stage_name_placeholder")}
          size="small"
          formItemProps={{
            rules: [
              {
                required: true,
                message: t("onboarding.template.editor.stage_name_placeholder"),
              },
            ],
          }}
        />
      </div>

      {/* Stage type select */}
      <div
        className={`shrink-0 [&_.ant-select-selector]:border-0 [&_.ant-select-selector]:${stageColor} [&_.ant-select-selector]:font-semibold [&_.ant-select-selector]:text-xs`}>
        <BaseSelect
          name={[field.name, "stageType"]}
          options={stageOptions}
          size="small"
          className={`rounded-lg border text-xs font-semibold ${stageColor}`}
        />
      </div>

      {/* Clone & Remove buttons */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onClone(index)}
          aria-label="Clone stage"
          className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-brand/10 hover:text-brand group-hover:opacity-100">
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={total <= 1}
          aria-label="Remove stage"
          className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export const StepStages = ({
  checklists,
  onUpdate,
  onAdd,
  onRemove,
  onClone,
  onReorder,
}: Props) => {
  const { t } = useLocale();
  const [antdForm] = Form.useForm<FormValues>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Sync parent state into antd form on structural changes (add/remove/reorder)
  // Note: setFieldsValue does NOT trigger onValuesChange in antd 5
  useEffect(() => {
    antdForm.setFieldsValue({
      checklists: checklists.map((c) => ({
        name: c.name,
        stageType: c.stageType,
      })),
    });
  }, [checklists, antdForm]);

  const stageOptions = STAGE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.label),
  }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = checklists.findIndex((c) => c.id === active.id);
    const to = checklists.findIndex((c) => c.id === over.id);
    if (from !== -1 && to !== -1) onReorder(from, to);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-stroke bg-slate-50/60 px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <LayoutList className="h-4.5 w-4.5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink">
            {t("onboarding.template.editor.step_stages.title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {t("onboarding.template.editor.step_stages.subtitle")}
          </p>
        </div>
        <Button type="default" onClick={onAdd}>
          + {t("onboarding.template.editor.add_stage")}
        </Button>
      </div>

      {/* Stage list */}
      <Form
        form={antdForm}
        onValuesChange={(_, all) => {
          all.checklists?.forEach(
            (c: { name: string; stageType: string }, i: number) => {
              const orig = checklists[i];
              if (
                orig &&
                (c.name !== orig.name || c.stageType !== orig.stageType)
              ) {
                onUpdate(i, { name: c.name, stageType: c.stageType });
              }
            },
          );
        }}>
        <div className="divide-y divide-stroke/60">
          {checklists.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <LayoutList className="h-6 w-6 text-muted" />
              </div>
              <p className="text-sm font-medium text-ink">
                {t("onboarding.template.editor.step_stages.empty_title")}
              </p>
              <p className="text-xs text-muted">
                {t("onboarding.template.editor.step_stages.empty_subtitle")}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}>
              <SortableContext
                items={checklists.map((c) => c.id)}
                strategy={verticalListSortingStrategy}>
                <Form.List name="checklists">
                  {(fields) =>
                    fields.map((field, i) => (
                      <SortableStageRow
                        key={checklists[i]?.id ?? field.key}
                        checklist={checklists[i]}
                        index={i}
                        field={field}
                        stageOptions={stageOptions}
                        total={checklists.length}
                        onClone={onClone}
                        onRemove={onRemove}
                      />
                    ))
                  }
                </Form.List>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </Form>

      {/* Footer summary */}
      {checklists.length > 0 && (
        <div className="flex items-center justify-between border-t border-stroke/60 bg-slate-50/60 px-5 py-3">
          <p className="text-xs text-muted">
            <span className="font-semibold text-ink">{checklists.length}</span>{" "}
            {t("onboarding.template.editor.step_stages.footer_count")}
          </p>
          <p className="text-xs text-muted">
            {t("onboarding.template.editor.step_stages.footer_hint")}
          </p>
        </div>
      )}
    </div>
  );
};
