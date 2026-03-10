import type { OnboardingInstance, OnboardingTask, User } from "@/shared/types";

export interface InfoCardProps {
  instance: OnboardingInstance;
  template?: { name?: string; description?: string };
  employeeDisplayName: string;
  employeeDisplayEmail: string | null;
  employee?: User;
  managerDisplayName: string;
  completedCount: number;
  totalTasks: number;
  progressPercent: number;
}

export interface StageProgress {
  name: string;
  done: number;
  total: number;
  percent: number;
}

export interface TaskListPanelProps {
  tasks: OnboardingTask[];
  isLoading: boolean;
  isUpdating: boolean;
  onToggle: (task: OnboardingTask) => void;
  onOpenDrawer: (task: OnboardingTask) => void;
}

export interface TaskDrawerProps {
  open: boolean;
  task: OnboardingTask | null;
  isUpdating: boolean;
  onToggle: (task: OnboardingTask) => void;
  onClose: () => void;
}

export interface EvaluationsPanelProps {
  milestones: { label: "7" | "30" | "60"; completed: boolean }[];
  onCreateEval: (milestone: "7" | "30" | "60") => void;
}

export interface ActivityPanelProps {
  tasks: OnboardingTask[];
  completedCount: number;
}
