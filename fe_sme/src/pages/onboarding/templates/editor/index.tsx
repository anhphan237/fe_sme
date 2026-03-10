import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/ui/Stepper";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { useGlobalStore } from "@/stores/global.store";
import type { OnboardingTemplate } from "@/shared/types";

import { StepInfo } from "./StepInfo";
import { StepStages } from "./StepStages";
import { StepTasks } from "./StepTasks";
import { StepReview } from "./StepReview";
import { WizardFooter } from "./WizardFooter";
import {
  type EditorForm,
  type ChecklistDraft,
  type TaskDraft,
  WIZARD_STEP_COUNT,
  initialForm,
  templateToForm,
  buildPayload,
  useTemplateQuery,
  useSaveTemplate,
  emptyTask,
  emptyChecklist,
} from "./shared";

export default function TemplateEditor() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToast();
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
      toast(t("onboarding.template.editor.toast.name_required"));
      return;
    }
    const createdBy = currentUser?.id ?? "";
    if (!isEdit && !createdBy) {
      toast(t("onboarding.template.editor.toast.login_required"));
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
        toast(t("onboarding.template.editor.toast.saved"));
      } else {
        await saveTemplate.mutateAsync(payload);
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        toast(t("onboarding.template.editor.toast.created"));
      }
      navigate("/onboarding/templates");
    } catch {
      toast(
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

  if (!isCreate && isLoading) {
    return (
      <div className="space-y-4 pb-20">
        <PageHeader
          title={t("onboarding.template.editor.title_edit")}
          subtitle={t("onboarding.template.editor.loading")}
        />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!isCreate && !isLoading && !data) return null;

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title={
          isEdit
            ? t("onboarding.template.editor.title_edit")
            : duplicateFrom
              ? t("onboarding.template.editor.title_duplicate")
              : t("onboarding.template.editor.title_create")
        }
        subtitle={t("onboarding.template.editor.subtitle")}
      />

      <div className="mx-auto max-w-3xl">
        <Stepper steps={stepLabels} current={step} />

        <div className="mt-6">
          {step === 0 && <StepInfo form={form} onChange={updateForm} />}
          {step === 1 && (
            <StepStages
              checklists={form.checklists}
              onUpdate={updateChecklist}
              onAdd={addChecklist}
              onRemove={removeChecklist}
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
}
