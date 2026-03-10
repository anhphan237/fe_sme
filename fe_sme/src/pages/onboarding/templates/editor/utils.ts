import type { OnboardingTemplate } from "@/shared/types";
import type { TaskDraft, ChecklistDraft, EditorForm } from "./types";
import { VALID_STAGE_TYPES, type ValidStageType } from "./constants";

const FALLBACK_STAGE_TYPE = (index: number): ValidStageType =>
  VALID_STAGE_TYPES[index] ?? "DAY_1";

export const emptyTask = (): TaskDraft => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  dueDaysOffset: 0,
  requireAck: false,
});

export const emptyChecklist = (): ChecklistDraft => ({
  id: crypto.randomUUID(),
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

export const buildPayload = (form: EditorForm, createdBy: string) => ({
  name: form.name,
  description: form.description ?? "",
  status: "ACTIVE" as const,
  createdBy,
  checklists: form.checklists.map((c) => ({
    name: c.name,
    stage: c.stageType,
    tasks: c.tasks.map((task) => ({
      title: task.name,
      description: task.description,
      ownerType: "EMPLOYEE",
      dueDaysOffset: task.dueDaysOffset,
      requireAck: task.requireAck,
    })),
  })),
});
