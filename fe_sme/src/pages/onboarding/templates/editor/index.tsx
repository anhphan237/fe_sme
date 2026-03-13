import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Skeleton, Steps, message } from "antd";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { useGlobalStore } from "@/stores/global.store";
import type { OnboardingTemplate } from "@/shared/types";
import {
  apiGetTemplate,
  apiCreateTemplate,
  apiUpdateTemplate,
} from "@/api/onboarding/onboarding.api";
import { mapTemplate } from "@/utils/mappers/onboarding";

import { StepInfo } from "./StepInfo";
import { StepStages } from "./StepStages";
import { StepTasks } from "./StepTasks";
import { StepReview } from "./StepReview";
import { WizardFooter } from "./WizardFooter";

import type { TaskDraft, ChecklistDraft, EditorForm } from "./constants";
import type { TemplatePreset, LibraryTask } from "./constants";
import type { Role } from "@/interface/common";

interface SaveTemplatePayload {
  name: string;
  description: string;
  status: "ACTIVE";
  createdBy: string;
  checklists: {
    name: string;
    tasks: {
      name: string;
      ownerRefId: Role;
      description: string;
      dueDaysOffset: number;
      requireAck: boolean;
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

const WIZARD_STEP_COUNT = 4;

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
              description: "",
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
  checklists: form.checklists.map((c) => ({
    name: c.name,
    tasks: c.tasks.map((task) => ({
      name: task.name,
      ownerRefId: "EMPLOYEE" as Role,
      description: task.description,
      dueDaysOffset: task.dueDaysOffset,
      requireAck: task.requireAck,
    })),
  })),
});

const useTemplateQuery = (id?: string) =>
  useQuery({
    queryKey: ["template", id],
    queryFn: () => apiGetTemplate(id!),
    enabled: Boolean(id) && id !== "new",
    select: (res: unknown) => {
      const r = res as Record<string, unknown>;
      const raw = r?.template ?? r?.data ?? r?.result ?? r?.payload ?? res;
      return mapTemplate(
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
      );
    },
  });

const useSaveTemplate = () =>
  useMutation({
    mutationFn: (payload: SaveTemplatePayload) => {
      const id = payload.templateId ?? payload.id;
      return !id || id === "new"
        ? apiCreateTemplate(payload)
        : apiUpdateTemplate({ templateId: id, ...payload });
    },
  });

const TemplateEditor = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const setBreadcrumbs = useGlobalStore((s) => s.setBreadcrumbs);

  const isCreate = !templateId || templateId === "new";
  const duplicateFrom = (
    location.state as { duplicateFrom?: OnboardingTemplate } | null
  )?.duplicateFrom;

  const { data, isLoading } = useTemplateQuery(
    !isCreate ? templateId : undefined,
  );
  const saveTemplate = useSaveTemplate();

  const [form, setForm] = useState<EditorForm>(initialForm);
  const [step, setStep] = useState(0);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const synced = useRef(false);

  useEffect(() => {
    if (!isCreate || !duplicateFrom) return;
    setForm(templateToForm(duplicateFrom));
  }, [isCreate, duplicateFrom]);

  useEffect(() => {
    if (isCreate) return;
    synced.current = false;
  }, [templateId, isCreate]);

  useEffect(() => {
    if (isCreate || !data || synced.current) return;
    synced.current = true;
    setForm(templateToForm(data));
    if (templateId && data.name) {
      setBreadcrumbs({ [templateId]: data.name });
    }
  }, [isCreate, data, templateId, setBreadcrumbs]);

  useEffect(() => {
    setActiveStageIndex((s) =>
      Math.min(s, Math.max(0, form.checklists.length - 1)),
    );
  }, [form.checklists.length]);

  const isEdit = !isCreate && Boolean(data);

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

  const canAdvance = () => {
    if (step === 0) return Boolean(form.name.trim());
    if (step === 1)
      return (
        form.checklists.length > 0 &&
        form.checklists.every((c) => c.name.trim())
      );
    return true;
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      message.warning(t("onboarding.template.editor.toast.name_required"));
      return;
    }
    const createdBy = currentUser?.id ?? "";
    if (!isEdit && !createdBy) {
      message.warning(t("onboarding.template.editor.toast.login_required"));
      return;
    }
    try {
      const payload = buildPayload(form, createdBy);
      if (isEdit && templateId) {
        await saveTemplate.mutateAsync({
          ...payload,
          templateId,
          id: templateId,
        });
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        queryClient.invalidateQueries({ queryKey: ["template", templateId] });
        message.success(t("onboarding.template.editor.toast.saved"));
      } else {
        await saveTemplate.mutateAsync(payload);
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        message.success(t("onboarding.template.editor.toast.created"));
      }
      navigate("/onboarding/templates");
    } catch {
      message.error(
        t(
          isEdit
            ? "onboarding.template.editor.toast.save_failed"
            : "onboarding.template.editor.toast.create_failed",
        ),
      );
    }
  };

  const stepLabels = [
    t("onboarding.template.editor.step.info"),
    t("onboarding.template.editor.step.stages"),
    t("onboarding.template.editor.step.tasks"),
    t("onboarding.template.editor.step.review"),
  ];

  const stepItems = stepLabels.map((label) => ({ title: label }));

  if (!isCreate && isLoading) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/onboarding/templates")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-semibold text-ink">
            {t("onboarding.template.editor.title_edit")}
          </h1>
        </div>
        <Skeleton active paragraph={{ rows: 1 }} />
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!isCreate && !isLoading && !data) return null;

  return (
    <div className="space-y-6 pb-28">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/onboarding/templates")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold text-ink">
          {isEdit
            ? t("onboarding.template.editor.title_edit")
            : duplicateFrom
              ? t("onboarding.template.editor.title_duplicate")
              : t("onboarding.template.editor.title_create")}
        </h1>
      </div>

      <div className="mx-auto max-w-3xl">
        <Steps current={step} items={stepItems} className="mb-6" />

        <div className="mt-6">
          {step === 0 && (
            <StepInfo
              form={form}
              onChange={updateForm}
              onApplyPreset={applyPreset}
            />
          )}
          {step === 1 && (
            <StepStages
              checklists={form.checklists}
              onUpdate={updateChecklist}
              onAdd={addChecklist}
              onRemove={removeChecklist}
              onClone={cloneChecklist}
              onReorder={reorderChecklists}
            />
          )}
          {step === 2 && (
            <StepTasks
              checklists={form.checklists}
              activeIndex={activeStageIndex}
              onSelectStage={setActiveStageIndex}
              onUpdateTask={updateTask}
              onAddTask={addTask}
              onRemoveTask={removeTask}
              onCloneTask={cloneTask}
              onReorderTask={reorderTasks}
              onAddLibraryTask={addLibraryTask}
            />
          )}
          {step === 3 && <StepReview form={form} />}
        </div>
      </div>

      <WizardFooter
        step={step}
        totalSteps={WIZARD_STEP_COUNT}
        isEdit={Boolean(isEdit)}
        isPending={saveTemplate.isPending}
        canAdvance={canAdvance()}
        formName={form.name}
        onBack={() => setStep((s) => s - 1)}
        onCancel={() => navigate("/onboarding/templates")}
        onNext={() => setStep((s) => s + 1)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default TemplateEditor;
