import { useQuery, useMutation } from "@tanstack/react-query";
import {
  apiGetTemplate,
  apiCreateTemplate,
  apiUpdateTemplate,
} from "@/api/onboarding/onboarding.api";
import { mapTemplate } from "@/utils/mappers/onboarding";
import type { OnboardingTemplate } from "@/shared/types";

export interface TaskDraft {
  name: string;
  description: string;
  ownerRefId: string;
  dueDaysOffset: number;
  requireAck: boolean;
}

export interface ChecklistDraft {
  name: string;
  stageType: string;
  tasks: TaskDraft[];
}

export interface EditorForm {
  name: string;
  description: string;
  checklists: ChecklistDraft[];
}

export const STAGE_OPTIONS = [
  { value: "PRE_BOARDING", label: "onboarding.template.stage.pre_boarding" },
  { value: "DAY_1", label: "onboarding.template.stage.day_1" },
  { value: "DAY_7", label: "onboarding.template.stage.day_7" },
  { value: "DAY_30", label: "onboarding.template.stage.day_30" },
  { value: "DAY_60", label: "onboarding.template.stage.day_60" },
] as const;

export const OWNER_OPTIONS = ["HR", "IT", "MANAGER", "EMPLOYEE"] as const;

export const WIZARD_STEP_COUNT = 4;

export const inputCls =
  "w-full rounded-xl border border-stroke bg-white px-3.5 py-2.5 text-sm text-ink transition placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

export const labelCls =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted";

export const emptyTask = (): TaskDraft => ({
  name: "",
  description: "",
  ownerRefId: "HR",
  dueDaysOffset: 0,
  requireAck: false,
});

export const emptyChecklist = (): ChecklistDraft => ({
  name: "",
  stageType: "DAY_1",
  tasks: [emptyTask()],
});

export const initialForm = (): EditorForm => ({
  name: "",
  description: "",
  checklists: [emptyChecklist()],
});

export const templateToForm = (tmpl: OnboardingTemplate): EditorForm => ({
  name: tmpl.name ?? "",
  description: tmpl.description ?? "",
  checklists: tmpl.stages?.length
    ? tmpl.stages.map((s, i) => ({
        name: s.name ?? "",
        stageType:
          (["PRE_BOARDING", "DAY_1", "DAY_7", "DAY_30", "DAY_60"] as const)[
            i
          ] ?? "DAY_1",
        tasks: s.tasks?.length
          ? s.tasks.map((task) => ({
              name: task.title ?? "",
              description: "",
              ownerRefId: task.ownerRole ?? "HR",
              dueDaysOffset: parseInt(String(task.dueOffset ?? "0"), 10) || 0,
              requireAck: task.required ?? false,
            }))
          : [emptyTask()],
      }))
    : [emptyChecklist()],
});

export const buildPayload = (form: EditorForm, createdBy: string) => ({
  name: form.name,
  description: form.description ?? "",
  status: "ACTIVE" as const,
  createdBy,
  checklists: form.checklists.map((c) => ({
    name: c.name,
    tasks: c.tasks.map((task) => ({
      name: task.name,
      description: task.description,
      ownerRefId: task.ownerRefId,
      dueDaysOffset: task.dueDaysOffset,
      requireAck: task.requireAck,
    })),
  })),
});

export const useTemplateQuery = (id?: string) =>
  useQuery({
    queryKey: ["template", id],
    queryFn: () => apiGetTemplate(id!),
    enabled: Boolean(id) && id !== "new",
    select: (res: any) => {
      const raw =
        res?.template ?? res?.data ?? res?.result ?? res?.payload ?? res;
      return mapTemplate(raw && typeof raw === "object" ? raw : {});
    },
  });

export const useSaveTemplate = () =>
  useMutation({
    mutationFn: (payload: any) => {
      const id = payload.templateId ?? payload.id;
      return !id || id === "new"
        ? apiCreateTemplate(payload)
        : apiUpdateTemplate({ templateId: id, ...payload });
    },
  });
