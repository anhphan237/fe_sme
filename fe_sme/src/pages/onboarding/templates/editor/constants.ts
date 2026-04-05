// ── Shared draft types ────────────────────────────────────────────────────────
export interface TaskDraft {
  id: string;
  name: string;
  description: string;
  dueDaysOffset: number;
  requireAck: boolean;
  assignee?: "HR" | "MANAGER" | "EMPLOYEE" | "IT";
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

// ── Stage options ──────────────────────────────────────────────────────────────
export const STAGE_OPTIONS = [
  { value: "PRE_BOARDING", label: "onboarding.template.stage.pre_boarding" },
  { value: "DAY_1", label: "onboarding.template.stage.day_1" },
  { value: "DAY_7", label: "onboarding.template.stage.day_7" },
  { value: "DAY_30", label: "onboarding.template.stage.day_30" },
  { value: "DAY_60", label: "onboarding.template.stage.day_60" },
] as const;

export type StageType = (typeof STAGE_OPTIONS)[number]["value"];

export const STAGE_COLORS: Record<string, string> = {
  PRE_BOARDING: "bg-violet-50 text-violet-700 border-violet-200",
  DAY_1: "bg-blue-50 text-blue-700 border-blue-200",
  DAY_7: "bg-sky-50 text-sky-700 border-sky-200",
  DAY_30: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DAY_60: "bg-amber-50 text-amber-700 border-amber-200",
};

// ── Task library (categorized prebuilt tasks) ─────────────────────────────────
export type TaskCategory = "hr" | "it" | "training" | "team";

export interface LibraryTask {
  name: string;
  description: string;
  dueDaysOffset: number;
  requireAck: boolean;
  category: TaskCategory;
  assignee?: "HR" | "MANAGER" | "EMPLOYEE" | "IT";
}

export const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "hr", label: "onboarding.template.library.cat_hr" },
  { value: "it", label: "onboarding.template.library.cat_it" },
  { value: "training", label: "onboarding.template.library.cat_training" },
  { value: "team", label: "onboarding.template.library.cat_team" },
];

export const TASK_LIBRARY: LibraryTask[] = [
  // HR / Admin
  {
    name: "Collect personal documents",
    description: "ID, tax forms, bank details",
    dueDaysOffset: 0,
    requireAck: true,
    category: "hr",
  },
  {
    name: "Sign employment contract",
    description: "Review and sign offer letter",
    dueDaysOffset: 0,
    requireAck: true,
    category: "hr",
  },
  {
    name: "Setup payroll",
    description: "Register in payroll system",
    dueDaysOffset: 1,
    requireAck: false,
    category: "hr",
  },
  {
    name: "Enroll in benefits",
    description: "Health, dental, insurance options",
    dueDaysOffset: 7,
    requireAck: true,
    category: "hr",
  },
  {
    name: "Submit emergency contacts",
    description: "Emergency contact information form",
    dueDaysOffset: 1,
    requireAck: false,
    category: "hr",
  },
  // IT Setup
  {
    name: "Provision laptop/workstation",
    description: "Order and configure hardware",
    dueDaysOffset: 0,
    requireAck: false,
    category: "it",
  },
  {
    name: "Create email account",
    description: "Setup corporate email",
    dueDaysOffset: 0,
    requireAck: false,
    category: "it",
  },
  {
    name: "Grant system access",
    description: "VPN, internal tools, repos",
    dueDaysOffset: 1,
    requireAck: false,
    category: "it",
  },
  {
    name: "Security training completion",
    description: "Complete cybersecurity awareness course",
    dueDaysOffset: 7,
    requireAck: true,
    category: "it",
  },
  {
    name: "Setup development environment",
    description: "IDE, SDKs, local database",
    dueDaysOffset: 1,
    requireAck: false,
    category: "it",
  },
  // Training
  {
    name: "Company orientation",
    description: "Company history, mission, values",
    dueDaysOffset: 1,
    requireAck: false,
    category: "training",
  },
  {
    name: "Compliance training",
    description: "Code of conduct, policies",
    dueDaysOffset: 7,
    requireAck: true,
    category: "training",
  },
  {
    name: "Product/service overview",
    description: "Overview of products and services",
    dueDaysOffset: 3,
    requireAck: false,
    category: "training",
  },
  {
    name: "Role-specific training",
    description: "Skills and tools for the role",
    dueDaysOffset: 7,
    requireAck: false,
    category: "training",
  },
  {
    name: "Safety & workplace guidelines",
    description: "Health and safety procedures",
    dueDaysOffset: 1,
    requireAck: true,
    category: "training",
  },
  // Team Integration
  {
    name: "Meet the team",
    description: "Introduction to team members",
    dueDaysOffset: 1,
    requireAck: false,
    category: "team",
  },
  {
    name: "Assign onboarding buddy",
    description: "Pair with experienced colleague",
    dueDaysOffset: 0,
    requireAck: false,
    category: "team",
  },
  {
    name: "1:1 with manager",
    description: "Initial goals and expectations discussion",
    dueDaysOffset: 3,
    requireAck: false,
    category: "team",
  },
  {
    name: "Tour office/workspace",
    description: "Facilities walkthrough",
    dueDaysOffset: 1,
    requireAck: false,
    category: "team",
  },
  {
    name: "30-day check-in",
    description: "Review progress and feedback",
    dueDaysOffset: 30,
    requireAck: true,
    category: "team",
  },
];

// ── Template presets (full pre-built templates) ───────────────────────────────
export interface TemplatePreset {
  key: string;
  nameKey: string;
  descKey: string;
  icon: string; // emoji
  checklists: (Omit<ChecklistDraft, "id"> & { tasks: TaskDraft[] })[];
}

const mkTasks = (
  items: { name: string; desc: string; due: number; ack?: boolean }[],
): TaskDraft[] =>
  items.map((t, i) => ({
    id: `preset-task-${i}`,
    name: t.name,
    description: t.desc,
    dueDaysOffset: t.due,
    requireAck: t.ack ?? false,
  }));

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    key: "standard",
    nameKey: "onboarding.template.preset.standard.name",
    descKey: "onboarding.template.preset.standard.desc",
    icon: "🏢",
    checklists: [
      {
        name: "Pre-boarding",
        stageType: "PRE_BOARDING",
        tasks: mkTasks([
          {
            name: "Sign employment contract",
            desc: "Review and sign offer letter",
            due: 0,
            ack: true,
          },
          {
            name: "Collect personal documents",
            desc: "ID, tax forms, bank details",
            due: 0,
            ack: true,
          },
          {
            name: "Provision laptop/workstation",
            desc: "Order and configure hardware",
            due: 0,
          },
          {
            name: "Create email account",
            desc: "Setup corporate email",
            due: 0,
          },
        ]),
      },
      {
        name: "Day 1",
        stageType: "DAY_1",
        tasks: mkTasks([
          {
            name: "Company orientation",
            desc: "Company history, mission, values",
            due: 1,
          },
          {
            name: "Meet the team",
            desc: "Introduction to team members",
            due: 1,
          },
          {
            name: "Tour office/workspace",
            desc: "Facilities walkthrough",
            due: 1,
          },
          {
            name: "Grant system access",
            desc: "VPN, internal tools, repos",
            due: 1,
          },
        ]),
      },
      {
        name: "First week",
        stageType: "DAY_7",
        tasks: mkTasks([
          {
            name: "Compliance training",
            desc: "Code of conduct, policies",
            due: 7,
            ack: true,
          },
          {
            name: "Role-specific training",
            desc: "Skills and tools for the role",
            due: 7,
          },
          {
            name: "1:1 with manager",
            desc: "Initial goals and expectations",
            due: 3,
          },
        ]),
      },
      {
        name: "First month",
        stageType: "DAY_30",
        tasks: mkTasks([
          {
            name: "30-day check-in",
            desc: "Review progress and feedback",
            due: 30,
            ack: true,
          },
          {
            name: "Enroll in benefits",
            desc: "Health, dental, insurance options",
            due: 7,
            ack: true,
          },
        ]),
      },
      {
        name: "60-day review",
        stageType: "DAY_60",
        tasks: mkTasks([
          {
            name: "60-day performance review",
            desc: "Manager reviews employee performance against initial goals",
            due: 60,
            ack: true,
          },
          {
            name: "Career development goal setting",
            desc: "Define 3-month and 6-month career goals together",
            due: 60,
            ack: true,
          },
          {
            name: "Complete onboarding survey",
            desc: "Employee feedback on onboarding experience quality",
            due: 60,
            ack: true,
          },
          {
            name: "Confirm team integration",
            desc: "Assess cultural fit and social integration with the team",
            due: 60,
          },
        ]),
      },
    ],
  },
  {
    key: "it_department",
    nameKey: "onboarding.template.preset.it.name",
    descKey: "onboarding.template.preset.it.desc",
    icon: "💻",
    checklists: [
      {
        name: "Pre-boarding",
        stageType: "PRE_BOARDING",
        tasks: mkTasks([
          {
            name: "Sign employment contract",
            desc: "Review and sign offer letter",
            due: 0,
            ack: true,
          },
          {
            name: "Provision laptop/workstation",
            desc: "Order and configure hardware",
            due: 0,
          },
          {
            name: "Create email account",
            desc: "Setup corporate email",
            due: 0,
          },
          {
            name: "Grant system access",
            desc: "VPN, repos, CI/CD, cloud console",
            due: 0,
          },
        ]),
      },
      {
        name: "Day 1",
        stageType: "DAY_1",
        tasks: mkTasks([
          {
            name: "Setup development environment",
            desc: "IDE, SDKs, local database",
            due: 1,
          },
          {
            name: "Codebase walkthrough",
            desc: "Architecture, conventions, branching",
            due: 1,
          },
          {
            name: "Meet the team",
            desc: "Introduction to engineering team",
            due: 1,
          },
        ]),
      },
      {
        name: "First week",
        stageType: "DAY_7",
        tasks: mkTasks([
          {
            name: "Security training completion",
            desc: "Cybersecurity awareness course",
            due: 7,
            ack: true,
          },
          {
            name: "First code review",
            desc: "Submit and review first PR",
            due: 5,
          },
          {
            name: "On-call & incident process",
            desc: "Learn alerting and escalation",
            due: 7,
          },
        ]),
      },
      {
        name: "First month",
        stageType: "DAY_30",
        tasks: mkTasks([
          {
            name: "Ship first feature",
            desc: "Complete first assigned task end-to-end",
            due: 14,
          },
          {
            name: "30-day check-in",
            desc: "Review progress and feedback",
            due: 30,
            ack: true,
          },
        ]),
      },
      {
        name: "60-day review",
        stageType: "DAY_60",
        tasks: mkTasks([
          {
            name: "Code quality review",
            desc: "Assess code quality, test coverage, and PR contribution velocity",
            due: 60,
            ack: true,
          },
          {
            name: "Architecture contribution",
            desc: "Propose or contribute to one architectural improvement",
            due: 60,
          },
          {
            name: "Mentor pairing progress",
            desc: "Review mentorship outcomes and technical growth areas",
            due: 60,
            ack: true,
          },
          {
            name: "Complete onboarding survey",
            desc: "Engineering-specific feedback on tooling, processes, and team",
            due: 60,
            ack: true,
          },
        ]),
      },
    ],
  },
  {
    key: "sales_team",
    nameKey: "onboarding.template.preset.sales.name",
    descKey: "onboarding.template.preset.sales.desc",
    icon: "📈",
    checklists: [
      {
        name: "Pre-boarding",
        stageType: "PRE_BOARDING",
        tasks: mkTasks([
          {
            name: "Sign employment contract",
            desc: "Review and sign offer letter",
            due: 0,
            ack: true,
          },
          {
            name: "CRM account setup",
            desc: "Create CRM account and import contacts",
            due: 0,
          },
          {
            name: "Create email account",
            desc: "Setup corporate email",
            due: 0,
          },
        ]),
      },
      {
        name: "Day 1",
        stageType: "DAY_1",
        tasks: mkTasks([
          {
            name: "Product/service overview",
            desc: "Deep-dive into offerings",
            due: 1,
          },
          {
            name: "Sales process training",
            desc: "Pipeline, stages, methodology",
            due: 1,
          },
          { name: "Meet the team", desc: "Introduction to sales team", due: 1 },
        ]),
      },
      {
        name: "First week",
        stageType: "DAY_7",
        tasks: mkTasks([
          {
            name: "Shadow senior rep",
            desc: "Observe demo calls and negotiations",
            due: 5,
          },
          {
            name: "Practice pitch deck",
            desc: "Rehearse company presentation",
            due: 7,
          },
          {
            name: "Compliance training",
            desc: "Sales ethics and policies",
            due: 7,
            ack: true,
          },
        ]),
      },
      {
        name: "First month",
        stageType: "DAY_30",
        tasks: mkTasks([
          {
            name: "First solo demo",
            desc: "Conduct first client demo independently",
            due: 14,
          },
          {
            name: "30-day check-in",
            desc: "Review pipeline and feedback",
            due: 30,
            ack: true,
          },
        ]),
      },
      {
        name: "60-day review",
        stageType: "DAY_60",
        tasks: mkTasks([
          {
            name: "Pipeline performance review",
            desc: "Analyze opportunities created, conversion rate, and revenue contribution",
            due: 60,
            ack: true,
          },
          {
            name: "OKR alignment review",
            desc: "Assess progress against 60-day sales targets and OKRs",
            due: 60,
            ack: true,
          },
          {
            name: "Key account assignment",
            desc: "Assign first set of key accounts to manage independently",
            due: 60,
          },
          {
            name: "Complete onboarding survey",
            desc: "Sales process and tooling feedback survey",
            due: 60,
            ack: true,
          },
        ]),
      },
    ],
  },
];
