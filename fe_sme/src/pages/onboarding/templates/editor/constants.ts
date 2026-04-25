// ── Shared draft types ────────────────────────────────────────────────────────
export interface TaskDraft {
  id: string;
  /** BE taskTemplateId — null/undefined for newly added tasks (BE will create) */
  taskTemplateId?: string;
  name: string;
  description: string;
  dueDaysOffset: number;
  requireAck: boolean;
  requireDoc: boolean;
  requiresManagerApproval: boolean;
  /** Designated approver user ID — overrides default manager when requiresManagerApproval=true */
  approverUserId?: string;
  /** Display name for approverUserId — FE-only, not sent to BE */
  approverUserName?: string;
  /** Document IDs required for this task (fetched from com.sme.content.document.list) */
  requiredDocumentIds?: string[];
  /** Document display names — FE-only, not sent to BE */
  requiredDocumentNames?: string[];
  assignee: "HR" | "MANAGER" | "EMPLOYEE" | "IT";
}

export interface ChecklistDraft {
  id: string;
  /** BE checklistTemplateId — null/undefined for newly added checklists (BE will create) */
  checklistTemplateId?: string;
  name: string;
  stageType: string;
  /** Deadline in days from onboarding start date */
  deadlineDays?: number;
  tasks: TaskDraft[];
}

// ── Event draft (sự kiện chung) ───────────────────────────────────────────────
export interface EventDraft {
  id: string;
  /** Populated after the event template is created on BE */
  eventTemplateId?: string;
  name: string;
  /** Agenda / content of the event */
  content: string;
  description?: string;
  /** Day offset from onboarding start date (0 = first day) */
  dueDaysOffset: number;
  /** Duration in hours */
  durationHours?: number;
}

export interface EditorForm {
  name: string;
  description: string;
  checklists: ChecklistDraft[];
  /** Common events applied to all employees in this onboarding template */
  events: EventDraft[];
}

// ── Stage options ──────────────────────────────────────────────────────────────
export const STAGE_OPTIONS = [
  { value: "PRE_BOARDING", label: "onboarding.template.stage.pre_boarding" },
  { value: "DAY_1", label: "onboarding.template.stage.day_1" },
  { value: "DAY_7", label: "onboarding.template.stage.day_7" },
  { value: "DAY_30", label: "onboarding.template.stage.day_30" },
  { value: "DAY_60", label: "onboarding.template.stage.day_60" },
  { value: "CUSTOM", label: "onboarding.template.stage.custom" },
] as const;

export type StageType = (typeof STAGE_OPTIONS)[number]["value"];

export const STAGE_COLORS: Record<string, string> = {
  PRE_BOARDING: "bg-indigo-50 text-indigo-700 border-indigo-100",
  DAY_1: "bg-sky-50 text-sky-700 border-sky-100",
  DAY_7: "bg-teal-50 text-teal-700 border-teal-100",
  DAY_30: "bg-emerald-50 text-emerald-700 border-emerald-100",
  DAY_60: "bg-amber-50 text-amber-700 border-amber-100",
  CUSTOM: "bg-slate-50 text-slate-600 border-slate-200",
};

// ── Stage metadata (phase + day range + theme) ────────────────────────────────
/**
 * Rich metadata used by the stage picker, sidebar, task panel banner and
 * template view modal. Keep `value` aligned with STAGE_OPTIONS so the stored
 * stage string remains compatible with BE.
 */
export interface StageMeta {
  value: StageType;
  order: number;
  /** Short uppercase phase code rendered in compact chips (PRE / D1 / WK1 …). */
  code: string;
  /** i18n key for the stage short name (also used in Select label). */
  labelKey: string;
  /** i18n key for the onboarding phase (Preparation / Orientation / …). */
  phaseKey: string;
  /** i18n key for the 1-line description shown in the picker / banner. */
  descKey: string;
  /** i18n key for the day-range chip (e.g. "D-14 → D-1", "D+0"). */
  dayRangeKey: string;
  /** Suggested default stage name (i18n key) when user picks this stage. */
  defaultNameKey: string;
  /** Suggested dueDaysOffset for tasks created inside this stage. */
  defaultDueOffset: number;
  /** Single color token for the stage (used to derive bg / border / text). */
  accent: "indigo" | "sky" | "teal" | "emerald" | "amber" | "slate";
}

export const STAGE_META: Record<StageType, StageMeta> = {
  PRE_BOARDING: {
    value: "PRE_BOARDING",
    order: 0,
    code: "PRE",
    labelKey: "onboarding.template.stage.pre_boarding",
    phaseKey: "onboarding.template.stage.phase.preparation",
    descKey: "onboarding.template.stage.desc.pre_boarding",
    dayRangeKey: "onboarding.template.stage.range.pre_boarding",
    defaultNameKey: "onboarding.template.stage.default_name.pre_boarding",
    defaultDueOffset: 0,
    accent: "indigo",
  },
  DAY_1: {
    value: "DAY_1",
    order: 1,
    code: "D1",
    labelKey: "onboarding.template.stage.day_1",
    phaseKey: "onboarding.template.stage.phase.orientation",
    descKey: "onboarding.template.stage.desc.day_1",
    dayRangeKey: "onboarding.template.stage.range.day_1",
    defaultNameKey: "onboarding.template.stage.default_name.day_1",
    defaultDueOffset: 1,
    accent: "sky",
  },
  DAY_7: {
    value: "DAY_7",
    order: 2,
    code: "WK1",
    labelKey: "onboarding.template.stage.day_7",
    phaseKey: "onboarding.template.stage.phase.immersion",
    descKey: "onboarding.template.stage.desc.day_7",
    dayRangeKey: "onboarding.template.stage.range.day_7",
    defaultNameKey: "onboarding.template.stage.default_name.day_7",
    defaultDueOffset: 7,
    accent: "teal",
  },
  DAY_30: {
    value: "DAY_30",
    order: 3,
    code: "MO1",
    labelKey: "onboarding.template.stage.day_30",
    phaseKey: "onboarding.template.stage.phase.ramp_up",
    descKey: "onboarding.template.stage.desc.day_30",
    dayRangeKey: "onboarding.template.stage.range.day_30",
    defaultNameKey: "onboarding.template.stage.default_name.day_30",
    defaultDueOffset: 30,
    accent: "emerald",
  },
  DAY_60: {
    value: "DAY_60",
    order: 4,
    code: "MO2",
    labelKey: "onboarding.template.stage.day_60",
    phaseKey: "onboarding.template.stage.phase.evaluation",
    descKey: "onboarding.template.stage.desc.day_60",
    dayRangeKey: "onboarding.template.stage.range.day_60",
    defaultNameKey: "onboarding.template.stage.default_name.day_60",
    defaultDueOffset: 60,
    accent: "amber",
  },
  CUSTOM: {
    value: "CUSTOM",
    order: 5,
    code: "CUS",
    labelKey: "onboarding.template.stage.custom",
    phaseKey: "onboarding.template.stage.phase.custom",
    descKey: "onboarding.template.stage.desc.custom",
    dayRangeKey: "onboarding.template.stage.range.custom",
    defaultNameKey: "onboarding.template.stage.default_name.custom",
    defaultDueOffset: 0,
    accent: "slate",
  },
};

export const STAGE_META_ORDERED: StageMeta[] = Object.values(STAGE_META).sort(
  (a, b) => a.order - b.order,
);

/** Tailwind tokens derived from the accent color, used by all stage consumers. */
export const STAGE_ACCENTS: Record<
  StageMeta["accent"],
  {
    /** Pill / chip background + text + border (kept muted, HRM-style) */
    chip: string;
    /** Soft tinted background for banner / card */
    soft: string;
    /** Solid dot used for timeline rail / side-strip */
    dot: string;
    /** Subtle border */
    border: string;
    /** Foreground text tone */
    text: string;
  }
> = {
  indigo: {
    chip: "bg-indigo-50 text-indigo-700 border-indigo-100",
    soft: "bg-indigo-50/50",
    dot: "bg-indigo-500",
    border: "border-indigo-100",
    text: "text-indigo-700",
  },
  sky: {
    chip: "bg-sky-50 text-sky-700 border-sky-100",
    soft: "bg-sky-50/50",
    dot: "bg-sky-500",
    border: "border-sky-100",
    text: "text-sky-700",
  },
  teal: {
    chip: "bg-teal-50 text-teal-700 border-teal-100",
    soft: "bg-teal-50/50",
    dot: "bg-teal-500",
    border: "border-teal-100",
    text: "text-teal-700",
  },
  emerald: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
    soft: "bg-emerald-50/50",
    dot: "bg-emerald-500",
    border: "border-emerald-100",
    text: "text-emerald-700",
  },
  amber: {
    chip: "bg-amber-50 text-amber-700 border-amber-100",
    soft: "bg-amber-50/50",
    dot: "bg-amber-500",
    border: "border-amber-100",
    text: "text-amber-700",
  },
  slate: {
    chip: "bg-slate-50 text-slate-600 border-slate-200",
    soft: "bg-slate-50/60",
    dot: "bg-slate-400",
    border: "border-slate-200",
    text: "text-slate-600",
  },
};

export const getStageMeta = (stage: string | undefined): StageMeta =>
  STAGE_META[(stage as StageType) ?? "CUSTOM"] ?? STAGE_META.CUSTOM;

// ── Task library (categorized prebuilt tasks) ─────────────────────────────────
export type TaskCategory = "hr" | "it" | "training" | "team";

export interface LibraryTask {
  name: string;
  description: string;
  dueDaysOffset: number;
  requireAck: boolean;
  requireDoc: boolean;
  requiresManagerApproval: boolean;
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
    name: "Thu thập hồ sơ cá nhân",
    description: "CMND/CCCD, mẫu thuế, thông tin ngân hàng",
    dueDaysOffset: 0,
    requireAck: true,
    requireDoc: true,
    requiresManagerApproval: false,
    category: "hr",
    assignee: "HR",
  },
  {
    name: "Ký hợp đồng lao động",
    description: "Xem xét và ký thư mời làm việc",
    dueDaysOffset: 0,
    requireAck: true,
    requireDoc: true,
    requiresManagerApproval: false,
    category: "hr",
    assignee: "HR",
  },
  {
    name: "Thiết lập bảng lương",
    description: "Đăng ký vào hệ thống tính lương",
    dueDaysOffset: 1,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "hr",
    assignee: "HR",
  },
  {
    name: "Đăng ký phúc lợi",
    description: "Bảo hiểm y tế, nha khoa và các lựa chọn bảo hiểm",
    dueDaysOffset: 7,
    requireAck: true,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "hr",
    assignee: "HR",
  },
  {
    name: "Nộp thông tin liên hệ khẩn cấp",
    description: "Mẫu thông tin liên hệ khẩn cấp",
    dueDaysOffset: 1,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "hr",
    assignee: "EMPLOYEE",
  },
  // IT Setup
  {
    name: "Cấp phát laptop/máy trạm",
    description: "Đặt hàng và cấu hình phần cứng",
    dueDaysOffset: 0,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "it",
    assignee: "IT",
  },
  {
    name: "Tạo tài khoản email",
    description: "Thiết lập email công ty",
    dueDaysOffset: 0,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "it",
    assignee: "IT",
  },
  {
    name: "Cấp quyền truy cập hệ thống",
    description: "VPN, công cụ nội bộ, kho lưu trữ",
    dueDaysOffset: 1,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "it",
    assignee: "IT",
  },
  {
    name: "Hoàn thành đào tạo bảo mật",
    description: "Hoàn thành khóa học nhận thức an ninh mạng",
    dueDaysOffset: 7,
    requireAck: true,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "it",
    assignee: "EMPLOYEE",
  },
  {
    name: "Thiết lập môi trường phát triển",
    description: "IDE, SDK, cơ sở dữ liệu cục bộ",
    dueDaysOffset: 1,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "it",
    assignee: "IT",
  },
  // Training
  {
    name: "Định hướng công ty",
    description: "Lịch sử, sứ mệnh và giá trị công ty",
    dueDaysOffset: 1,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "training",
    assignee: "EMPLOYEE",
  },
  {
    name: "Đào tạo tuân thủ",
    description: "Quy tắc ứng xử, chính sách",
    dueDaysOffset: 7,
    requireAck: true,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "training",
    assignee: "EMPLOYEE",
  },
  {
    name: "Tổng quan sản phẩm/dịch vụ",
    description: "Tổng quan về sản phẩm và dịch vụ",
    dueDaysOffset: 3,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "training",
    assignee: "EMPLOYEE",
  },
  {
    name: "Đào tạo theo vị trí công việc",
    description: "Kỹ năng và công cụ cho vị trí",
    dueDaysOffset: 7,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "training",
    assignee: "EMPLOYEE",
  },
  {
    name: "Hướng dẫn an toàn & nơi làm việc",
    description: "Quy trình sức khỏe và an toàn",
    dueDaysOffset: 1,
    requireAck: true,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "training",
    assignee: "EMPLOYEE",
  },
  // Team Integration
  {
    name: "Gặp gỡ đồng nghiệp",
    description: "Giới thiệu với các thành viên trong nhóm",
    dueDaysOffset: 1,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "team",
    assignee: "EMPLOYEE",
  },
  {
    name: "Phân công người hướng dẫn",
    description: "Ghép với đồng nghiệp có kinh nghiệm",
    dueDaysOffset: 0,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "team",
    assignee: "MANAGER",
  },
  {
    name: "Họp 1:1 với quản lý",
    description: "Thảo luận về mục tiêu và kỳ vọng ban đầu",
    dueDaysOffset: 3,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "team",
    assignee: "MANAGER",
  },
  {
    name: "Tham quan văn phòng/không gian làm việc",
    description: "Hướng dẫn tham quan cơ sở vật chất",
    dueDaysOffset: 1,
    requireAck: false,
    requireDoc: false,
    requiresManagerApproval: false,
    category: "team",
    assignee: "EMPLOYEE",
  },
  {
    name: "Đánh giá sau 30 ngày",
    description: "Xem xét tiến độ và phản hồi",
    dueDaysOffset: 30,
    requireAck: true,
    requireDoc: false,
    requiresManagerApproval: true,
    category: "team",
    assignee: "MANAGER",
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
  items: {
    name: string;
    desc: string;
    due: number;
    ack?: boolean;
    doc?: boolean;
    approval?: boolean;
    assignee?: TaskDraft["assignee"];
  }[],
): TaskDraft[] =>
  items.map((t, i) => ({
    id: `preset-task-${i}`,
    name: t.name,
    description: t.desc,
    dueDaysOffset: t.due,
    requireAck: t.ack ?? false,
    requireDoc: t.doc ?? false,
    requiresManagerApproval: t.approval ?? false,
    assignee: t.assignee ?? "EMPLOYEE",
  }));

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    key: "standard",
    nameKey: "onboarding.template.preset.standard.name",
    descKey: "onboarding.template.preset.standard.desc",
    icon: "🏢",
    checklists: [
      {
        name: "Trước khi nhận việc",
        stageType: "PRE_BOARDING",
        tasks: mkTasks([
          {
            name: "Ký hợp đồng lao động",
            desc: "Xem xét và ký thư mời làm việc",
            due: 0,
            ack: true,
            doc: true,
            assignee: "HR",
          },
          {
            name: "Thu thập hồ sơ cá nhân",
            desc: "CMND/CCCD, mẫu thuế, thông tin ngân hàng",
            due: 0,
            ack: true,
            doc: true,
            assignee: "HR",
          },
          {
            name: "Cấp phát laptop/máy trạm",
            desc: "Đặt hàng và cấu hình phần cứng",
            due: 0,
            assignee: "IT",
          },
          {
            name: "Tạo tài khoản email",
            desc: "Thiết lập email công ty",
            due: 0,
            assignee: "IT",
          },
        ]),
      },
      {
        name: "Ngày 1",
        stageType: "DAY_1",
        tasks: mkTasks([
          {
            name: "Định hướng công ty",
            desc: "Lịch sử, sứ mệnh và giá trị công ty",
            due: 1,
          },
          {
            name: "Gặp gỡ đồng nghiệp",
            desc: "Giới thiệu với các thành viên trong nhóm",
            due: 1,
          },
          {
            name: "Tham quan văn phòng/không gian làm việc",
            desc: "Hướng dẫn tham quan cơ sở vật chất",
            due: 1,
          },
          {
            name: "Cấp quyền truy cập hệ thống",
            desc: "VPN, công cụ nội bộ, kho lưu trữ",
            due: 1,
            assignee: "IT",
          },
        ]),
      },
      {
        name: "Tuần đầu tiên",
        stageType: "DAY_7",
        tasks: mkTasks([
          {
            name: "Đào tạo tuân thủ",
            desc: "Quy tắc ứng xử, chính sách",
            due: 7,
            ack: true,
          },
          {
            name: "Đào tạo theo vị trí công việc",
            desc: "Kỹ năng và công cụ cho vị trí",
            due: 7,
          },
          {
            name: "Họp 1:1 với quản lý",
            desc: "Mục tiêu và kỳ vọng ban đầu",
            due: 3,
            assignee: "MANAGER",
          },
        ]),
      },
      {
        name: "Tháng đầu tiên",
        stageType: "DAY_30",
        tasks: mkTasks([
          {
            name: "Đánh giá sau 30 ngày",
            desc: "Xem xét tiến độ và phản hồi",
            due: 30,
            ack: true,
            approval: true,
            assignee: "MANAGER",
          },
          {
            name: "Đăng ký phúc lợi",
            desc: "Bảo hiểm y tế, nha khoa và các lựa chọn bảo hiểm",
            due: 7,
            ack: true,
            assignee: "HR",
          },
        ]),
      },
      {
        name: "Đánh giá 60 ngày",
        stageType: "DAY_60",
        tasks: mkTasks([
          {
            name: "Đánh giá hiệu suất 60 ngày",
            desc: "Quản lý đánh giá hiệu suất nhân viên so với mục tiêu ban đầu",
            due: 60,
            ack: true,
            approval: true,
            assignee: "MANAGER",
          },
          {
            name: "Thiết lập mục tiêu phát triển nghề nghiệp",
            desc: "Cùng nhau xác định mục tiêu nghề nghiệp 3 tháng và 6 tháng",
            due: 60,
            ack: true,
            assignee: "MANAGER",
          },
          {
            name: "Hoàn thành khảo sát hội nhập",
            desc: "Phản hồi của nhân viên về chất lượng trải nghiệm hội nhập",
            due: 60,
            ack: true,
          },
          {
            name: "Xác nhận hội nhập nhóm",
            desc: "Đánh giá sự phù hợp văn hóa và hội nhập xã hội với nhóm",
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
        name: "Trước khi nhận việc",
        stageType: "PRE_BOARDING",
        tasks: mkTasks([
          {
            name: "Ký hợp đồng lao động",
            desc: "Xem xét và ký thư mời làm việc",
            due: 0,
            ack: true,
            doc: true,
            assignee: "HR",
          },
          {
            name: "Cấp phát laptop/máy trạm",
            desc: "Đặt hàng và cấu hình phần cứng",
            due: 0,
            assignee: "IT",
          },
          {
            name: "Tạo tài khoản email",
            desc: "Thiết lập email công ty",
            due: 0,
            assignee: "IT",
          },
          {
            name: "Cấp quyền truy cập hệ thống",
            desc: "VPN, kho lưu trữ, CI/CD, bảng điều khiển đám mây",
            due: 0,
            assignee: "IT",
          },
        ]),
      },
      {
        name: "Ngày 1",
        stageType: "DAY_1",
        tasks: mkTasks([
          {
            name: "Thiết lập môi trường phát triển",
            desc: "IDE, SDK, cơ sở dữ liệu cục bộ",
            due: 1,
            assignee: "IT",
          },
          {
            name: "Hướng dẫn codebase",
            desc: "Kiến trúc, quy ước, phân nhánh",
            due: 1,
            assignee: "MANAGER",
          },
          {
            name: "Gặp gỡ đồng nghiệp",
            desc: "Giới thiệu với nhóm kỹ thuật",
            due: 1,
          },
        ]),
      },
      {
        name: "Tuần đầu tiên",
        stageType: "DAY_7",
        tasks: mkTasks([
          {
            name: "Hoàn thành đào tạo bảo mật",
            desc: "Khóa học nhận thức an ninh mạng",
            due: 7,
            ack: true,
          },
          {
            name: "Review code lần đầu tiên",
            desc: "Nộp và xem xét PR đầu tiên",
            due: 5,
          },
          {
            name: "Quy trình trực tuyến & xử lý sự cố",
            desc: "Tìm hiểu cảnh báo và leo thang xử lý",
            due: 7,
          },
        ]),
      },
      {
        name: "Tháng đầu tiên",
        stageType: "DAY_30",
        tasks: mkTasks([
          {
            name: "Hoàn thành tính năng đầu tiên",
            desc: "Hoàn thành nhiệm vụ được giao đầu tiên từ đầu đến cuối",
            due: 14,
          },
          {
            name: "Đánh giá sau 30 ngày",
            desc: "Xem xét tiến độ và phản hồi",
            due: 30,
            ack: true,
            approval: true,
            assignee: "MANAGER",
          },
        ]),
      },
      {
        name: "Đánh giá 60 ngày",
        stageType: "DAY_60",
        tasks: mkTasks([
          {
            name: "Đánh giá chất lượng code",
            desc: "Đánh giá chất lượng code, độ bao phủ test và tốc độ đóng góp PR",
            due: 60,
            ack: true,
            approval: true,
            assignee: "MANAGER",
          },
          {
            name: "Đóng góp kiến trúc",
            desc: "Đề xuất hoặc đóng góp một cải tiến kiến trúc",
            due: 60,
          },
          {
            name: "Tiến độ kèm cặp với mentor",
            desc: "Xem xét kết quả kèm cặp và các lĩnh vực phát triển kỹ thuật",
            due: 60,
            ack: true,
            assignee: "MANAGER",
          },
          {
            name: "Hoàn thành khảo sát hội nhập",
            desc: "Phản hồi cụ thể về công cụ, quy trình và nhóm kỹ thuật",
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
        name: "Trước khi nhận việc",
        stageType: "PRE_BOARDING",
        tasks: mkTasks([
          {
            name: "Ký hợp đồng lao động",
            desc: "Xem xét và ký thư mời làm việc",
            due: 0,
            ack: true,
            doc: true,
            assignee: "HR",
          },
          {
            name: "Thiết lập tài khoản CRM",
            desc: "Tạo tài khoản CRM và nhập danh bạ",
            due: 0,
            assignee: "IT",
          },
          {
            name: "Tạo tài khoản email",
            desc: "Thiết lập email công ty",
            due: 0,
            assignee: "IT",
          },
        ]),
      },
      {
        name: "Ngày 1",
        stageType: "DAY_1",
        tasks: mkTasks([
          {
            name: "Tổng quan sản phẩm/dịch vụ",
            desc: "Tìm hiểu sâu về sản phẩm/dịch vụ",
            due: 1,
          },
          {
            name: "Đào tạo quy trình bán hàng",
            desc: "Pipeline, các giai đoạn, phương pháp luận",
            due: 1,
          },
          {
            name: "Gặp gỡ đồng nghiệp",
            desc: "Giới thiệu với đội ngũ bán hàng",
            due: 1,
          },
        ]),
      },
      {
        name: "Tuần đầu tiên",
        stageType: "DAY_7",
        tasks: mkTasks([
          {
            name: "Theo dõi nhân viên kinh doanh kỳ cựu",
            desc: "Quan sát cuộc gọi demo và đàm phán",
            due: 5,
          },
          {
            name: "Luyện tập bài thuyết trình",
            desc: "Luyện tập bài thuyết trình công ty",
            due: 7,
          },
          {
            name: "Đào tạo tuân thủ",
            desc: "Đạo đức kinh doanh và chính sách",
            due: 7,
            ack: true,
          },
        ]),
      },
      {
        name: "Tháng đầu tiên",
        stageType: "DAY_30",
        tasks: mkTasks([
          {
            name: "Demo độc lập đầu tiên",
            desc: "Thực hiện demo cho khách hàng đầu tiên một mình",
            due: 14,
          },
          {
            name: "Đánh giá sau 30 ngày",
            desc: "Xem xét pipeline và phản hồi",
            due: 30,
            ack: true,
            approval: true,
            assignee: "MANAGER",
          },
        ]),
      },
      {
        name: "Đánh giá 60 ngày",
        stageType: "DAY_60",
        tasks: mkTasks([
          {
            name: "Đánh giá hiệu suất pipeline",
            desc: "Phân tích cơ hội được tạo ra, tỷ lệ chuyển đổi và đóng góp doanh thu",
            due: 60,
            ack: true,
            approval: true,
            assignee: "MANAGER",
          },
          {
            name: "Đánh giá sự phù hợp OKR",
            desc: "Đánh giá tiến độ so với mục tiêu bán hàng 60 ngày và OKR",
            due: 60,
            ack: true,
            assignee: "MANAGER",
          },
          {
            name: "Phân công tài khoản khách hàng chính",
            desc: "Phân công bộ tài khoản khách hàng chính đầu tiên để quản lý độc lập",
            due: 60,
          },
          {
            name: "Hoàn thành khảo sát hội nhập",
            desc: "Khảo sát phản hồi về quy trình bán hàng và công cụ",
            due: 60,
            ack: true,
          },
        ]),
      },
    ],
  },
];
