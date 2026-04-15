// ── Shared draft types ────────────────────────────────────────────────────────
export interface TaskDraft {
  id: string;
  name: string;
  description: string;
  dueDaysOffset: number;
  requireAck: boolean;
  requireDoc: boolean;
  requiresManagerApproval: boolean;
  assignee: "HR" | "MANAGER" | "EMPLOYEE" | "IT";
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
  requireDoc: boolean;
  requiresManagerApproval: boolean;
  category: TaskCategory;
  assignee: "HR" | "MANAGER" | "EMPLOYEE" | "IT";
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
