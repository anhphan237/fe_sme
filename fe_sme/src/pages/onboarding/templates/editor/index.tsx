import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ClipboardList,
  Check,
  Info,
  LayoutTemplate,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Modal, message, Spin } from "antd";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import type { OnboardingTemplate } from "@/shared/types";
import {
  apiCreateTemplate,
  apiGetTemplate,
  apiUpdateTemplate,
} from "@/api/onboarding/onboarding.api";
import { mapTemplate } from "@/utils/mappers/onboarding";

import { StageSidebar } from "./StepStages";
import { TasksPanel } from "./StepTasks";
import { StagePickerModal } from "./StagePicker";

import type { TaskDraft, ChecklistDraft, EditorForm } from "./constants";
import type {
  TemplatePreset,
  LibraryTask,
  StageMeta,
  StageType,
} from "./constants";
import { TEMPLATE_PRESETS } from "./constants";

interface SaveTemplatePayload {
  name: string;
  description: string;
  status: "ACTIVE";
  createdBy: string;
  /** TASK_LIBRARY | CUSTOM */
  templateKind?: string;
  departmentTypeCode?: string;
  checklists?: {
    name: string;
    /** BE stage type: PRE_BOARDING | DAY_1 | DAY_7 | DAY_30 | DAY_60 */
    stage: string;
    deadlineDays?: number;
    sortOrder?: number;
    tasks: {
      /** BE field — must be `title`, NOT `name` */
      title: string;
      /** BE supports: USER | DEPARTMENT | EMPLOYEE | MANAGER | IT_STAFF */
      ownerType: string;
      /** Only set when ownerType is USER (userId) or DEPARTMENT (deptId). */
      ownerRefId: string | null;
      description: string;
      dueDaysOffset: number;
      requireAck: boolean;
      requireDoc: boolean;
      requiresManagerApproval: boolean;
      approverUserId?: string;
      requiredDocumentIds?: string[];
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
  "CUSTOM",
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
  requireDoc: false,
  requiresManagerApproval: false,
  assignee: "EMPLOYEE",
});

const emptyChecklist = (): ChecklistDraft => ({
  id: crypto.randomUUID(),
  name: "",
  stageType: "CUSTOM",
  tasks: [emptyTask()],
});

/** Build a new checklist pre-filled from the picked stage meta so HR doesn't
 *  have to retype the phase name or pick a due offset for the first task. */
const checklistFromMeta = (meta: StageMeta, name: string): ChecklistDraft => ({
  id: crypto.randomUUID(),
  name,
  stageType: meta.value,
  tasks: [{ ...emptyTask(), dueDaysOffset: meta.defaultDueOffset }],
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
        id: s.id,
        checklistTemplateId: s.id,
        name: s.name ?? "",
        stageType: VALID_STAGE_TYPES.includes(s.stageType as ValidStageType)
          ? (s.stageType as ValidStageType)
          : FALLBACK_STAGE_TYPE(i),
        deadlineDays: (s as any).deadlineDays ?? undefined,
        tasks: s.tasks?.length
          ? s.tasks.map((task) => ({
              id: task.id,
              taskTemplateId: task.id,
              name: task.title ?? "",
              description: task.description ?? "",
              dueDaysOffset: parseInt(String(task.dueOffset ?? "0"), 10) || 0,
              requireAck: task.requireAck ?? task.required ?? false,
              requireDoc: task.requireDoc ?? false,
              requiresManagerApproval: task.requiresManagerApproval ?? false,
              approverUserId: (task as any).approverUserId ?? undefined,
              requiredDocumentIds:
                (task as any).requiredDocumentIds ?? undefined,
              assignee: (task.ownerRole ?? "EMPLOYEE") as TaskDraft["assignee"],
            }))
          : [emptyTask()],
      }))
    : [emptyChecklist()],
});

/**
 * BE's OnboardingTaskGenerateProcessor.applyOwnerAssignment only resolves
 * ownerType ∈ { USER, DEPARTMENT, EMPLOYEE, MANAGER, IT_STAFF }. Anything else
 * (incl. "ROLE") leaves assignedUserId null → tasks become unassigned.
 * For the 4 generic assignee roles the FE exposes, send the ownerType BE
 * actually resolves; ownerRefId is only meaningful for USER/DEPARTMENT so
 * omit it here.
 */
const mapAssigneeToOwner = (
  assignee: TaskDraft["assignee"] | undefined,
): { ownerType: string; ownerRefId: string | null } => {
  switch (assignee) {
    case "MANAGER":
      return { ownerType: "MANAGER", ownerRefId: null };
    case "IT":
      return { ownerType: "IT_STAFF", ownerRefId: null };
    case "HR":
      return { ownerType: "HR", ownerRefId: null };
    case "EMPLOYEE":
    default:
      return { ownerType: "EMPLOYEE", ownerRefId: null };
  }
};

const buildPayload = (form: EditorForm, createdBy: string) => ({
  name: form.name,
  description: form.description ?? "",
  status: "ACTIVE" as const,
  createdBy,
  checklists: form.checklists.map((c, ci) => ({
    name: c.name,
    stage: c.stageType,
    deadlineDays: c.tasks.length
      ? Math.max(...c.tasks.map((t) => t.dueDaysOffset ?? 0))
      : 0,
    sortOrder: ci,
    tasks: c.tasks.map((task, ti) => {
      const { ownerType, ownerRefId } = mapAssigneeToOwner(task.assignee);
      return {
        title: task.name,
        ownerType,
        ownerRefId,
        description: task.description,
        dueDaysOffset: task.dueDaysOffset,
        requireAck: task.requireAck,
        requireDoc: task.requireDoc,
        requiresManagerApproval: task.requiresManagerApproval,
        approverUserId: task.approverUserId,
        requiredDocumentIds: task.requiredDocumentIds,
        sortOrder: ti,
      };
    }),
  })),
});

const buildUpdatePayload = (form: EditorForm, templateId: string) => ({
  templateId,
  name: form.name,
  description: form.description ?? "",
  checklists: form.checklists.map((c, ci) => ({
    checklistTemplateId: c.checklistTemplateId ?? null,
    name: c.name,
    stage: c.stageType,
    deadlineDays: c.tasks.length
      ? Math.max(...c.tasks.map((t) => t.dueDaysOffset ?? 0))
      : 0,
    sortOrder: ci,
    tasks: c.tasks.map((task, ti) => {
      const { ownerType, ownerRefId } = mapAssigneeToOwner(task.assignee);
      return {
        taskTemplateId: task.taskTemplateId ?? null,
        title: task.name,
        ownerType,
        ownerRefId,
        description: task.description,
        dueDaysOffset: task.dueDaysOffset,
        requireAck: task.requireAck,
        requireDoc: task.requireDoc,
        requiresManagerApproval: task.requiresManagerApproval,
        approverUserId: task.approverUserId,
        requiredDocumentIds: task.requiredDocumentIds,
        sortOrder: ti,
      };
    }),
  })),
});

const useSaveTemplate = () =>
  useMutation({
    mutationFn: (payload: SaveTemplatePayload) => apiCreateTemplate(payload),
  });

const useUpdateTemplate = () =>
  useMutation({
    mutationFn: (payload: ReturnType<typeof buildUpdatePayload>) =>
      apiUpdateTemplate(payload),
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

  // Load existing template when editing
  const { data: templateRes, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => apiGetTemplate(templateId!),
    enabled: !isCreate && !!templateId,
    staleTime: 0,
  });

  const saveTemplate = useSaveTemplate();
  const updateTemplate = useUpdateTemplate();

  const [form, setForm] = useState<EditorForm>(initialForm);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [stagePickerOpen, setStagePickerOpen] = useState(false);

  const totalTasks = useMemo(
    () => form.checklists.reduce((n, c) => n + c.tasks.length, 0),
    [form.checklists],
  );
  const nameValid = form.name.trim().length > 0;
  const hasStages = form.checklists.length > 0;
  const canSave = nameValid && (isCreate ? hasStages : true);

  // Initialize form from duplicateFrom (duplicate mode) or loaded template (edit mode)
  useEffect(() => {
    if (duplicateFrom) {
      const base = templateToForm(duplicateFrom);
      setForm({ ...base, name: `Copy of ${base.name}` });
      return;
    }
    if (!isCreate && templateRes) {
      const raw =
        (templateRes as Record<string, unknown>)?.template ??
        (templateRes as Record<string, unknown>)?.data ??
        templateRes;
      const tmpl = mapTemplate(raw as Record<string, unknown>);
      setForm(templateToForm(tmpl));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateFrom, templateRes]);

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

  const addChecklistFromMeta = (meta: StageMeta) => {
    const name = t(meta.defaultNameKey);
    setForm((prev) => {
      const next = [...prev.checklists, checklistFromMeta(meta, name)];
      setActiveStageIndex(next.length - 1);
      return { ...prev, checklists: next };
    });
    setStagePickerOpen(false);
  };

  const openStagePicker = () => setStagePickerOpen(true);

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
          requireDoc: t.requireDoc ?? false,
          requiresManagerApproval: t.requiresManagerApproval ?? false,
          assignee: t.assignee ?? "EMPLOYEE",
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
        requireDoc: task.requireDoc ?? false,
        requiresManagerApproval: task.requiresManagerApproval ?? false,
        assignee: task.assignee ?? "EMPLOYEE",
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
      if (isCreate) {
        const payload = buildPayload(form, createdBy);
        await saveTemplate.mutateAsync(payload);
        message.success(t("onboarding.template.editor.toast.created"));
      } else {
        const payload = buildUpdatePayload(form, templateId!);
        await updateTemplate.mutateAsync(payload);
        message.success(t("onboarding.template.editor.toast.updated"));
      }
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      navigate("/onboarding/templates");
    } catch {
      message.error(
        isCreate
          ? t("onboarding.template.editor.toast.create_failed")
          : t("onboarding.template.editor.toast.update_failed"),
      );
    }
  };

  const activeStage = form.checklists[activeStageIndex];
  const isSaving = saveTemplate.isPending || updateTemplate.isPending;

  if (!isCreate && isLoadingTemplate) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const pageTitle = !isCreate
    ? t("onboarding.template.editor.title_edit")
    : duplicateFrom
      ? t("onboarding.template.editor.title_duplicate")
      : t("onboarding.template.editor.title_create");

  return (
    <div className="flex h-full flex-col gap-4 pb-24">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/onboarding/templates")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-ink md:text-xl">
              {pageTitle}
            </h1>
            <p className="text-xs text-muted">
              {t("onboarding.template.editor.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            <span>
              {form.checklists.length}{" "}
              {t("onboarding.template.review.stages").toLowerCase()}
            </span>
            <span className="text-slate-300">·</span>
            <span>
              {totalTasks} {t("onboarding.template.review.tasks").toLowerCase()}
            </span>
          </div>
          {isCreate && (
            <button
              type="button"
              onClick={() => setPresetModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand/40 hover:text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              {t("onboarding.template.editor.toolbar.use_preset")}
            </button>
          )}
        </div>
      </div>

      {/* Info card — always visible, inline editable */}
      <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {t("onboarding.template.editor.step_info.name_label")}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  nameValid ? "text-emerald-500" : "text-red-400"
                }`}>
                {nameValid
                  ? t("onboarding.template.editor.step_info.looks_good")
                  : t("onboarding.template.editor.step_info.required")}
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
              className="w-full rounded-lg border border-transparent bg-slate-50 px-3 py-2.5 text-base font-semibold text-ink placeholder:text-muted/50 focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {t("onboarding.template.editor.step_info.desc_label")}
              </span>
              <span className="text-[10px] text-muted/50">
                {(form.description ?? "").length} / 500
              </span>
            </div>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => updateForm({ description: e.target.value })}
              placeholder={t(
                "onboarding.template.editor.step_info.desc_placeholder",
              )}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-transparent bg-slate-50 px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted/50 focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Builder — empty state or sidebar + tasks panel */}
      {!hasStages ? (
        <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
          <PresetEmptyState
            onApplyPreset={applyPreset}
            onAddBlank={openStagePicker}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
          <div className="flex flex-col lg:flex-row" style={{ minHeight: 520 }}>
            <div className="w-full shrink-0 border-b border-stroke lg:w-64 lg:border-b-0 lg:border-r">
              <StageSidebar
                checklists={form.checklists}
                activeIndex={activeStageIndex}
                onSelect={setActiveStageIndex}
                onAdd={openStagePicker}
                onRemove={removeChecklist}
                onClone={cloneChecklist}
                onReorder={reorderChecklists}
              />
            </div>
            <div className="flex min-w-0 flex-1">
              {activeStage ? (
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

      {/* Stage picker modal — shown when HR clicks "Add stage" */}
      <StagePickerModal
        open={stagePickerOpen}
        usedStages={
          form.checklists
            .map((c) => c.stageType as StageType)
            .filter(Boolean) as StageType[]
        }
        onCancel={() => setStagePickerOpen(false)}
        onPick={addChecklistFromMeta}
      />

      {/* Preset picker modal — reachable anytime via toolbar */}
      <Modal
        open={presetModalOpen}
        onCancel={() => setPresetModalOpen(false)}
        footer={null}
        width={640}
        title={
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-brand" />
            <span>{t("onboarding.template.preset.title")}</span>
          </div>
        }>
        <p className="mb-4 text-xs text-muted">
          {t("onboarding.template.preset.subtitle")}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
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
                onClick={() => {
                  applyPreset(preset);
                  setPresetModalOpen(false);
                }}
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
                    {stageCount} {t("onboarding.template.editor.stages_label")}
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
      </Modal>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-stroke bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 text-xs text-muted">
            {!nameValid && (
              <span className="flex items-center gap-1.5 text-red-500">
                <Info className="h-3.5 w-3.5" />
                {t("onboarding.template.editor.toast.name_required")}
              </span>
            )}
            {nameValid && !hasStages && isCreate && (
              <span className="flex items-center gap-1.5 text-amber-500">
                <Info className="h-3.5 w-3.5" />
                {t("onboarding.template.editor.footer.need_stage")}
              </span>
            )}
            {canSave && (
              <span className="flex items-center gap-1.5 text-emerald-500">
                <Check className="h-3.5 w-3.5" />
                {t("onboarding.template.editor.footer.ready")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/onboarding/templates")}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-ink">
              {t("onboarding.template.editor.btn.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSave || isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50">
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {isCreate
                    ? t("onboarding.template.editor.btn.creating")
                    : t("onboarding.template.editor.btn.saving")}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isCreate
                    ? t("onboarding.template.editor.btn.create")
                    : t("onboarding.template.editor.btn.save")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
