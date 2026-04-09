import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Check,
  Loader2,
  FileText,
} from "lucide-react";
import { message } from "antd";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import type { OnboardingTemplate } from "@/shared/types";
import { apiCreateTemplate } from "@/api/onboarding/onboarding.api";

import { StageSidebar } from "./StepStages";
import { TasksPanel } from "./StepTasks";

import type { TaskDraft, ChecklistDraft, EditorForm } from "./constants";
import type { TemplatePreset, LibraryTask } from "./constants";
import { TEMPLATE_PRESETS, STAGE_OPTIONS } from "./constants";
import type { Role } from "@/interface/common";

interface SaveTemplatePayload {
  name: string;
  description: string;
  status: "ACTIVE";
  createdBy: string;
  checklists?: {
    name: string;
    /** BE stage type: PRE_BOARDING | DAY_1 | DAY_7 | DAY_30 | DAY_60 */
    stage: string;
    sortOrder?: number;
    tasks: {
      /** BE field — must be `title`, NOT `name` */
      title: string;
      ownerType: string;
      ownerRefId: Role;
      description: string;
      dueDaysOffset: number;
      requireAck: boolean;
      sortOrder?: number;
    }[];
  }[];
  templateId?: string;
  id?: string;
}

const VALID_STAGE_TYPES = [
  "PRE_BOARDING",
  "DAY_1",
  "DAY_7",
  "DAY_30",
  "DAY_60",
] as const;

type ValidStageType = (typeof VALID_STAGE_TYPES)[number];

const FALLBACK_STAGE_TYPE = (index: number): ValidStageType =>
  VALID_STAGE_TYPES[index] ?? "DAY_1";

const emptyTask = (): TaskDraft => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  dueDaysOffset: 0,
  requireAck: false,
});

const emptyChecklist = (): ChecklistDraft => ({
  id: crypto.randomUUID(),
  name: "",
  stageType: "DAY_1",
  tasks: [emptyTask()],
});

const initialForm = (): EditorForm => ({
  name: "",
  description: "",
  checklists: [emptyChecklist()],
});

const templateToForm = (tmpl: OnboardingTemplate): EditorForm => ({
  name: tmpl.name ?? "",
  description: tmpl.description ?? "",
  checklists: tmpl.stages?.length
    ? tmpl.stages.map((s, i) => ({
        id: crypto.randomUUID(),
        name: s.name ?? "",
        stageType: VALID_STAGE_TYPES.includes(s.stageType as ValidStageType)
          ? (s.stageType as ValidStageType)
          : FALLBACK_STAGE_TYPE(i),
        tasks: s.tasks?.length
          ? s.tasks.map((task) => ({
              id: crypto.randomUUID(),
              name: task.title ?? "",
              description: task.description ?? "",
              dueDaysOffset: parseInt(String(task.dueOffset ?? "0"), 10) || 0,
              requireAck: task.required ?? false,
            }))
          : [emptyTask()],
      }))
    : [emptyChecklist()],
});

const buildPayload = (form: EditorForm, createdBy: string) => ({
  name: form.name,
  description: form.description ?? "",
  status: "ACTIVE" as const,
  createdBy,
  checklists: form.checklists.map((c, ci) => ({
    name: c.name,
    stage: c.stageType,
    sortOrder: ci,
    tasks: c.tasks.map((task, ti) => ({
      title: task.name,
      ownerType: "ROLE" as const,
      ownerRefId: "EMPLOYEE" as Role,
      description: task.description,
      dueDaysOffset: task.dueDaysOffset,
      requireAck: task.requireAck,
      sortOrder: ti,
    })),
  })),
});

const useSaveTemplate = () =>
  useMutation({
    mutationFn: (payload: SaveTemplatePayload) => apiCreateTemplate(payload),
  });

const PresetEmptyState = ({
  onApplyPreset,
  onAddBlank,
}: {
  onApplyPreset: (preset: TemplatePreset) => void;
  onAddBlank: () => void;
}) => {
  const { t } = useLocale();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/5">
        <ClipboardList className="h-7 w-7 text-brand/60" />
      </div>
      <div>
        <p className="text-base font-semibold text-ink">
          {t("onboarding.template.editor.empty.title")}
        </p>
        <p className="mt-1 text-sm text-muted">
          {t("onboarding.template.editor.empty.hint")}
        </p>
      </div>
      <div className="grid w-full max-w-lg gap-3 sm:grid-cols-3">
        {TEMPLATE_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onApplyPreset(preset)}
            className="rounded-xl border border-stroke bg-white p-3 text-left transition hover:border-brand/30 hover:shadow-sm">
            <span className="mr-1.5 text-base">{preset.icon}</span>
            <p className="mt-1 text-xs font-semibold text-ink">
              {t(preset.nameKey)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {preset.checklists.length}{" "}
              {t("onboarding.template.editor.stages_label")}
            </p>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onAddBlank}
        className="rounded-lg border border-dashed border-stroke px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand">
        + {t("onboarding.template.editor.add_stage")}
      </button>
    </div>
  );
};

const TemplateEditor = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);

  const isCreate = !templateId || templateId === "new";
  const duplicateFrom = (
    location.state as { duplicateFrom?: OnboardingTemplate } | null
  )?.duplicateFrom;

  // The editor only supports creating new templates.
  // Editing existing templates (structure) is not supported by the backend API.
  // If someone navigates to /:templateId, redirect back to the list.
  useEffect(() => {
    if (!isCreate) {
      navigate("/onboarding/templates", { replace: true });
    }
  }, [isCreate, navigate]);

  const saveTemplate = useSaveTemplate();

  const [form, setForm] = useState<EditorForm>(initialForm);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const TOTAL_STEPS = 3;
  const stepKeys = [
    "onboarding.template.editor.step.info",
    "onboarding.template.editor.step.builder",
    "onboarding.template.editor.step.review",
  ];
  const canAdvance =
    activeStep === 0
      ? form.name.trim().length > 0
      : activeStep === 1
        ? form.checklists.length > 0
        : true;

  // Initialize form from duplicateFrom state (set by list page before navigating)
  useEffect(() => {
    if (duplicateFrom) {
      setForm(templateToForm(duplicateFrom));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActiveStageIndex((s) =>
      Math.min(s, Math.max(0, form.checklists.length - 1)),
    );
  }, [form.checklists.length]);

  const updateForm = (updates: Partial<EditorForm>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const updateChecklist = (i: number, updates: Partial<ChecklistDraft>) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      list[i] = { ...list[i], ...updates };
      return { ...prev, checklists: list };
    });

  const updateTask = (ci: number, ti: number, updates: Partial<TaskDraft>) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const tasks = [...list[ci].tasks];
      tasks[ti] = { ...tasks[ti], ...updates };
      list[ci] = { ...list[ci], tasks };
      return { ...prev, checklists: list };
    });

  const addChecklist = () =>
    setForm((prev) => ({
      ...prev,
      checklists: [...prev.checklists, emptyChecklist()],
    }));

  const removeChecklist = (i: number) =>
    setForm((prev) => ({
      ...prev,
      checklists: prev.checklists.filter((_, idx) => idx !== i),
    }));

  const cloneChecklist = (i: number) =>
    setForm((prev) => {
      const source = prev.checklists[i];
      if (!source) return prev;
      const cloned: ChecklistDraft = {
        ...source,
        id: crypto.randomUUID(),
        tasks: source.tasks.map((t) => ({ ...t, id: crypto.randomUUID() })),
      };
      const list = [...prev.checklists];
      list.splice(i + 1, 0, cloned);
      return { ...prev, checklists: list };
    });

  const addTask = (ci: number) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      list[ci] = { ...list[ci], tasks: [...list[ci].tasks, emptyTask()] };
      return { ...prev, checklists: list };
    });

  const removeTask = (ci: number, ti: number) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const tasks = list[ci].tasks.filter((_, i) => i !== ti);
      list[ci] = { ...list[ci], tasks: tasks.length ? tasks : [emptyTask()] };
      return { ...prev, checklists: list };
    });

  const cloneTask = (ci: number, ti: number) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const source = list[ci].tasks[ti];
      if (!source) return prev;
      const cloned: TaskDraft = { ...source, id: crypto.randomUUID() };
      const tasks = [...list[ci].tasks];
      tasks.splice(ti + 1, 0, cloned);
      list[ci] = { ...list[ci], tasks };
      return { ...prev, checklists: list };
    });

  const reorderChecklists = (from: number, to: number) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { ...prev, checklists: list };
    });

  const reorderTasks = (ci: number, from: number, to: number) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const tasks = [...list[ci].tasks];
      const [moved] = tasks.splice(from, 1);
      tasks.splice(to, 0, moved);
      list[ci] = { ...list[ci], tasks };
      return { ...prev, checklists: list };
    });

  const applyPreset = (preset: TemplatePreset) =>
    setForm({
      name: "",
      description: "",
      checklists: preset.checklists.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        stageType: c.stageType,
        tasks: c.tasks.map((t) => ({
          id: crypto.randomUUID(),
          name: t.name,
          description: t.description,
          dueDaysOffset: t.dueDaysOffset,
          requireAck: t.requireAck,
        })),
      })),
    });

  const addLibraryTask = (ci: number, task: LibraryTask) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const newTask: TaskDraft = {
        id: crypto.randomUUID(),
        name: task.name,
        description: task.description,
        dueDaysOffset: task.dueDaysOffset,
        requireAck: task.requireAck,
      };
      list[ci] = { ...list[ci], tasks: [...list[ci].tasks, newTask] };
      return { ...prev, checklists: list };
    });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      message.warning(t("onboarding.template.editor.toast.name_required"));
      return;
    }
    const createdBy = currentUser?.id ?? "";
    if (!createdBy) {
      message.warning(t("onboarding.template.editor.toast.login_required"));
      return;
    }
    try {
      const payload = buildPayload(form, createdBy);
      await saveTemplate.mutateAsync(payload);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      message.success(t("onboarding.template.editor.toast.created"));
      navigate("/onboarding/templates");
    } catch {
      message.error(t("onboarding.template.editor.toast.create_failed"));
    }
  };

  const activeStage = form.checklists[activeStageIndex];

  return (
    <div className="space-y-4 pb-24">
      {/* Back + title row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/onboarding/templates")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold text-ink">
          {duplicateFrom
            ? t("onboarding.template.editor.title_duplicate")
            : t("onboarding.template.editor.title_create")}
        </h1>
      </div>

      {/* -- Step 0: Info -------------------------------------------- */}
      {activeStep === 0 && (
        <div className="space-y-4">
          {/* Name + Description card */}
          <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
            <div className="flex items-center gap-4 border-b border-stroke bg-slate-50/60 px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                <FileText className="h-4.5 w-4.5 text-brand" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  {t("onboarding.template.editor.step_info.title")}
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  {t("onboarding.template.editor.step_info.subtitle")}
                </p>
              </div>
            </div>
            <div className="space-y-5 p-6">
              {/* Template name */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("onboarding.template.editor.step_info.name_label")}
                  </span>
                  <span className="text-[11px] font-medium text-red-400">
                    {t("onboarding.template.editor.step_info.required")}
                  </span>
                </div>
                <input
                  autoFocus
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder={t(
                    "onboarding.template.editor.step_info.name_placeholder",
                  )}
                  className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm font-semibold text-ink placeholder:text-muted/50 focus:border-brand focus:outline-none"
                />
                {form.name.trim().length > 0 && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-brand">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                    {t("onboarding.template.editor.step_info.looks_good")}
                  </p>
                )}
              </div>

              <div className="border-t border-stroke/60" />

              {/* Description */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("onboarding.template.editor.step_info.desc_label")}
                  </span>
                  <span className="text-[11px] text-muted/50">
                    {t("onboarding.template.editor.step_info.optional")}
                  </span>
                </div>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  placeholder={t(
                    "onboarding.template.editor.step_info.desc_placeholder",
                  )}
                  rows={4}
                  maxLength={500}
                  className="w-full resize-none rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted/50 focus:border-brand focus:outline-none"
                />
                <p className="mt-1.5 text-right text-[11px] text-muted/50">
                  {(form.description ?? "").length}{" "}
                  {t("onboarding.template.editor.step_info.chars")}
                </p>
              </div>
            </div>
          </div>

          {/* Preset picker */}
          <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
            <div className="border-b border-stroke bg-slate-50/60 px-6 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t("onboarding.template.preset.title")}
              </p>
              <p className="mt-0.5 text-[11px] text-muted/70">
                {t("onboarding.template.preset.subtitle")}
              </p>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              {TEMPLATE_PRESETS.map((preset) => {
                const stageCount = preset.checklists.length;
                const taskCount = preset.checklists.reduce(
                  (sum, c) => sum + c.tasks.length,
                  0,
                );
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="group flex flex-col items-start gap-2 rounded-xl border border-stroke bg-white p-4 text-left transition hover:border-brand/40 hover:shadow-md">
                    <span className="text-2xl">{preset.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-ink group-hover:text-brand">
                        {t(preset.nameKey)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t(preset.descKey)}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center gap-2 text-[11px] text-muted/60">
                      <span>
                        {stageCount}{" "}
                        {t("onboarding.template.editor.stages_label")}
                      </span>
                      <span>·</span>
                      <span>
                        {taskCount}{" "}
                        {t("onboarding.template.review.tasks").toLowerCase()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* -- Step 1: Builder ----------------------------------------- */}
      {activeStep === 1 && (
        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
          <div className="flex" style={{ minHeight: 560 }}>
            {/* Left: stage sidebar */}
            <div className="w-64 shrink-0 border-r border-stroke">
              <StageSidebar
                checklists={form.checklists}
                activeIndex={activeStageIndex}
                onSelect={setActiveStageIndex}
                onAdd={addChecklist}
                onRemove={removeChecklist}
                onClone={cloneChecklist}
                onReorder={reorderChecklists}
              />
            </div>
            {/* Right: task panel or empty-state */}
            <div className="flex min-w-0 flex-1">
              {form.checklists.length === 0 ? (
                <PresetEmptyState
                  onApplyPreset={applyPreset}
                  onAddBlank={addChecklist}
                />
              ) : activeStage ? (
                <TasksPanel
                  key={activeStage.id}
                  checklist={activeStage}
                  stageIndex={activeStageIndex}
                  onUpdateStage={(u) => updateChecklist(activeStageIndex, u)}
                  onUpdateTask={(ti, u) => updateTask(activeStageIndex, ti, u)}
                  onAddTask={() => addTask(activeStageIndex)}
                  onRemoveTask={(ti) => removeTask(activeStageIndex, ti)}
                  onCloneTask={(ti) => cloneTask(activeStageIndex, ti)}
                  onReorderTask={(f, to) =>
                    reorderTasks(activeStageIndex, f, to)
                  }
                  onAddLibraryTask={(task) =>
                    addLibraryTask(activeStageIndex, task)
                  }
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* -- Step 2: Review ------------------------------------------ */}
      {activeStep === 2 && (
        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
          <div className="border-b border-stroke px-6 py-5">
            <h3 className="text-base font-semibold text-ink">
              {t("onboarding.template.editor.step_review.title")}
            </h3>
            <p className="mt-0.5 text-sm text-muted">
              {t("onboarding.template.editor.step_review.subtitle")}
            </p>
          </div>
          <div className="space-y-5 p-6">
            {/* Template summary */}
            <div className="flex items-start gap-4 rounded-xl border border-stroke bg-slate-50 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {t("onboarding.template.editor.review.template_label")}
                </p>
                <p className="mt-1 truncate text-lg font-bold text-ink">
                  {form.name || "—"}
                </p>
                {form.description && (
                  <p className="mt-0.5 text-sm text-muted">
                    {form.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-3">
                <div className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-center">
                  <p className="text-xl font-bold text-brand">
                    {form.checklists.length}
                  </p>
                  <p className="text-[11px] text-muted">
                    {t("onboarding.template.review.stages")}
                  </p>
                </div>
                <div className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-center">
                  <p className="text-xl font-bold text-brand">
                    {form.checklists.reduce((n, c) => n + c.tasks.length, 0)}
                  </p>
                  <p className="text-[11px] text-muted">
                    {t("onboarding.template.review.tasks")}
                  </p>
                </div>
              </div>
            </div>

            {/* Stage list */}
            <ul className="space-y-2">
              {form.checklists.map((c, i) => {
                const stageLabelKey = STAGE_OPTIONS.find(
                  (o) => o.value === c.stageType,
                )?.label;
                const stageLabel = stageLabelKey
                  ? t(stageLabelKey)
                  : c.stageType;
                return (
                  <li
                    key={c.id}
                    className="rounded-xl border border-stroke bg-white">
                    <div className="flex items-center gap-2.5 border-b border-stroke/60 px-4 py-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {c.name ||
                          t("onboarding.template.editor.stage_fallback", {
                            num: i + 1,
                          })}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-muted">
                        {stageLabel}
                      </span>
                      <span className="ml-auto text-xs text-muted">
                        {c.tasks.length}{" "}
                        {t("onboarding.template.review.tasks").toLowerCase()}
                      </span>
                    </div>
                    {c.tasks.length > 0 && (
                      <ul className="divide-y divide-stroke/40">
                        {c.tasks.map((task) => (
                          <li
                            key={task.id}
                            className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
                            <span className="shrink-0 text-muted/40">·</span>
                            <span className="flex-1 font-medium text-ink">
                              {task.name ||
                                t(
                                  "onboarding.template.editor.review.untitled_task",
                                )}
                            </span>
                            <span className="shrink-0 text-xs text-muted">
                              {task.dueDaysOffset}d
                            </span>
                            {task.requireAck && (
                              <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] text-brand">
                                {t("onboarding.template.editor.task_ack")}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* -- Wizard footer (sticky) ---------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-stroke bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.07)] lg:left-64">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: back / cancel */}
            <div className="w-28 shrink-0">
              {activeStep > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((s) => s - 1)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-ink">
                  <ChevronLeft className="h-4 w-4" />
                  {t("onboarding.template.editor.btn.back")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/onboarding/templates")}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-ink">
                  {t("onboarding.template.editor.btn.cancel")}
                </button>
              )}
            </div>

            {/* Center: step indicator */}
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                {t(stepKeys[activeStep] ?? stepKeys[0])}
              </p>
              <div className="flex items-center gap-1">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <span
                    key={i}
                    className={`block rounded-full transition-all duration-300 ${
                      i === activeStep
                        ? "h-1.5 w-8 bg-brand"
                        : i < activeStep
                          ? "h-1.5 w-4 bg-brand/40"
                          : "h-1.5 w-4 bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted/60">
                {activeStep + 1} / {TOTAL_STEPS}
              </p>
            </div>

            {/* Right: next / submit */}
            <div className="flex w-28 shrink-0 justify-end">
              {activeStep < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((s) => s + 1)}
                  disabled={!canAdvance}
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50">
                  {t("onboarding.template.editor.btn.next")}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saveTemplate.isPending || !form.name.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50">
                  {saveTemplate.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("onboarding.template.editor.btn.creating")}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {t("onboarding.template.editor.btn.create")}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
