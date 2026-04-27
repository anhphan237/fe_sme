import { memo, useState } from "react";
import { Form, Input, Modal, InputNumber, Tooltip } from "antd";
import {
  CalendarDays,
  Clock,
  Copy,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale } from "@/i18n";
import type { EventDraft } from "./constants";

// ── Types ──────────────────────────────────────────────────────────────────────
interface StepEventsProps {
  events: EventDraft[];
  onChange: (events: EventDraft[]) => void;
  readonly?: boolean;
}

interface EventFormValues {
  name: string;
  content?: string;
  description?: string;
  dueDaysOffset: number;
  durationHours?: number;
}

// ── Sortable event card ────────────────────────────────────────────────────────
const SortableEventCard = memo(
  ({
    event,
    index,
    onEdit,
    onClone,
    onRemove,
    readonly,
  }: {
    event: EventDraft;
    index: number;
    onEdit: () => void;
    onClone: () => void;
    onRemove: () => void;
    readonly?: boolean;
  }) => {
    const { t } = useLocale();
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: event.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group flex items-start gap-3 rounded-xl border border-stroke bg-white p-4 shadow-sm transition hover:border-brand/30 hover:shadow-md">
        {/* Drag handle */}
        {!readonly && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="mt-0.5 shrink-0 cursor-grab touch-none text-muted/40 transition hover:text-muted active:cursor-grabbing">
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* Index badge */}
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
          {index + 1}
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1" onClick={readonly ? undefined : onEdit}>
          <p className="truncate text-sm font-semibold text-ink">
            {event.name || (
              <span className="italic text-muted/50">
                {t("onboarding.template.editor.events.name_placeholder")}
              </span>
            )}
          </p>
          {event.content && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
              {event.content}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-muted/70">
              <CalendarDays className="h-3 w-3" />
              {t("onboarding.template.editor.events.day_badge", {
                day: event.dueDaysOffset,
              }) ?? `Ngày ${event.dueDaysOffset}`}
            </span>
            {event.durationHours != null && event.durationHours > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted/70">
                <Clock className="h-3 w-3" />
                {event.durationHours}h
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!readonly && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Tooltip title={t("onboarding.template.editor.events.clone")}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClone();
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <Tooltip title={t("onboarding.template.editor.events.delete")}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    );
  },
);
SortableEventCard.displayName = "SortableEventCard";

// ── Main StepEvents component ──────────────────────────────────────────────────
export const StepEvents = memo(
  ({ events, onChange, readonly }: StepEventsProps) => {
    const { t } = useLocale();
    const [form] = Form.useForm<EventFormValues>();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    // ── Handlers ────────────────────────────────────────────
    const openAdd = () => {
      form.resetFields();
      form.setFieldsValue({ dueDaysOffset: 0, durationHours: undefined });
      setEditingIndex(null);
      setModalOpen(true);
    };

    const openEdit = (index: number) => {
      const ev = events[index];
      form.setFieldsValue({
        name: ev.name,
        content: ev.content,
        description: ev.description,
        dueDaysOffset: ev.dueDaysOffset,
        durationHours: ev.durationHours,
      });
      setEditingIndex(index);
      setModalOpen(true);
    };

    const handleOk = async () => {
      const values = await form.validateFields();
      if (editingIndex !== null) {
        // Edit existing
        const updated = events.map((ev, i) =>
          i === editingIndex ? { ...ev, ...values } : ev,
        );
        onChange(updated);
      } else {
        // Add new
        const newEvent: EventDraft = {
          id: crypto.randomUUID(),
          name: values.name,
          content: values.content ?? "",
          description: values.description,
          dueDaysOffset: values.dueDaysOffset ?? 0,
          durationHours: values.durationHours,
        };
        onChange([...events, newEvent]);
      }
      setModalOpen(false);
    };

    const handleClone = (index: number) => {
      const source = events[index];
      const cloned: EventDraft = {
        ...source,
        id: crypto.randomUUID(),
        eventTemplateId: undefined,
      };
      const next = [...events];
      next.splice(index + 1, 0, cloned);
      onChange(next);
    };

    const handleRemove = (index: number) => {
      onChange(events.filter((_, i) => i !== index));
    };

    const handleDragEnd = (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const from = events.findIndex((ev) => ev.id === active.id);
      const to = events.findIndex((ev) => ev.id === over.id);
      if (from < 0 || to < 0) return;
      const next = [...events];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange(next);
    };

    // ── Render ───────────────────────────────────────────────
    return (
      <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <CalendarDays className="h-4 w-4 text-violet-600" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {t("onboarding.template.editor.events.title")}
              </p>
              <p className="text-[11px] text-muted">
                {t("onboarding.template.editor.events.subtitle")}
              </p>
            </div>
          </div>
          {!readonly && (
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand/40 hover:text-brand">
              <Plus className="h-3.5 w-3.5" />
              {t("onboarding.template.editor.events.add")}
            </button>
          )}
        </div>

        {/* Event list or empty state */}
        {events.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center"
            onClick={readonly ? undefined : openAdd}
            style={{ cursor: readonly ? "default" : "pointer" }}>
            <CalendarDays className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-muted">
              {t("onboarding.template.editor.events.empty_title")}
            </p>
            <p className="max-w-xs text-xs text-muted/60">
              {t("onboarding.template.editor.events.empty_hint")}
            </p>
            {!readonly && (
              <button
                type="button"
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20">
                <Plus className="h-3.5 w-3.5" />
                {t("onboarding.template.editor.events.add")}
              </button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={events.map((e) => e.id)}
              strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {events.map((ev, i) => (
                  <SortableEventCard
                    key={ev.id}
                    event={ev}
                    index={i}
                    onEdit={() => openEdit(i)}
                    onClone={() => handleClone(i)}
                    onRemove={() => handleRemove(i)}
                    readonly={readonly}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Add/Edit modal */}
        <Modal
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleOk}
          okText={
            editingIndex !== null
              ? t("common.btn.save")
              : t("onboarding.template.editor.events.add")
          }
          cancelText={t("common.btn.cancel")}
          title={
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-violet-500" />
              <span>
                {editingIndex !== null
                  ? t("onboarding.template.editor.events.modal_edit_title")
                  : t("onboarding.template.editor.events.modal_add_title")}
              </span>
            </div>
          }
          width={520}
          destroyOnClose>
          <Form
            form={form}
            layout="vertical"
            className="mt-4"
            initialValues={{ dueDaysOffset: 0 }}>
            <Form.Item
              name="name"
              label={t("onboarding.template.editor.events.name_label")}
              rules={[
                {
                  required: true,
                  message: t("onboarding.template.editor.events.name_required"),
                },
              ]}>
              <Input
                placeholder={t(
                  "onboarding.template.editor.events.name_placeholder",
                )}
                maxLength={200}
              />
            </Form.Item>

            <Form.Item
              name="content"
              label={t("onboarding.template.editor.events.content_label")}>
              <Input.TextArea
                rows={3}
                placeholder={t(
                  "onboarding.template.editor.events.content_placeholder",
                )}
                maxLength={2000}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={t("onboarding.template.editor.events.description_label")}>
              <Input.TextArea
                rows={2}
                placeholder={t(
                  "onboarding.template.editor.events.description_placeholder",
                )}
                maxLength={500}
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="dueDaysOffset"
                label={
                  <span>
                    {t("onboarding.template.editor.events.day_label")}{" "}
                    <Tooltip
                      title={t("onboarding.template.editor.events.day_hint")}>
                      <span className="cursor-help text-muted/60">(?)</span>
                    </Tooltip>
                  </span>
                }
                rules={[{ required: true }]}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>

              <Form.Item
                name="durationHours"
                label={t("onboarding.template.editor.events.duration_label")}>
                <InputNumber min={0} step={0.5} className="w-full" />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    );
  },
);

StepEvents.displayName = "StepEvents";
