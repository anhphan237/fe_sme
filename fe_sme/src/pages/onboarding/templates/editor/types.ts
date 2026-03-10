export interface TaskDraft {
  id: string;
  name: string;
  description: string;
  dueDaysOffset: number;
  requireAck: boolean;
}

export interface ChecklistDraft {
  id: string;
  name: string;
  stageType: string;
  tasks: TaskDraft[];
}

export interface EditorForm {
  name: string;
  description: string;
  checklists: ChecklistDraft[];
}

export interface SaveTemplatePayload {
  name: string;
  description: string;
  status: "ACTIVE";
  createdBy: string;
  checklists: {
    name: string;
    stage: string;
    tasks: {
      title: string;
      description: string;
      ownerType: string;
      dueDaysOffset: number;
      requireAck: boolean;
    }[];
  }[];
  templateId?: string;
  id?: string;
}
