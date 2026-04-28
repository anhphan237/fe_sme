import type { PlatformTemplateFormValue } from "@/shared/types";


export const PLATFORM_TEMPLATE_OPERATION =
  "com.sme.platform.template.create" as const;

export const stageOptions = [
  { labelKey: "platform.templates.stage.preboarding", value: "PREBOARDING" },
  { labelKey: "platform.templates.stage.first_day", value: "FIRST_DAY" },
  { labelKey: "platform.templates.stage.week1", value: "WEEK1" },
  { labelKey: "platform.templates.stage.month1", value: "MONTH1" },
  { labelKey: "platform.templates.stage.month2", value: "MONTH2" },
  { labelKey: "platform.templates.stage.custom", value: "CUSTOM" },
];

export const templateStatusOptions = [
  { labelKey: "platform.templates.status_draft", value: "DRAFT" },
  { labelKey: "platform.templates.status_active", value: "ACTIVE" },
];

export const itemStatusOptions = [
  { labelKey: "global.active", value: "ACTIVE" },
  { labelKey: "global.inactive", value: "INACTIVE" },
];

export const defaultPlatformTemplateValues: PlatformTemplateFormValue = {
  name: "Full template",
  description: "",
  status: "DRAFT",
  templateKind: "ONBOARDING",
  departmentTypeCode: "GENERAL",
  checklists: [
    {
      name: "Tuần 1",
      stage: "WEEK1",
      deadlineDays: 7,
      sortOrder: 0,
      status: "ACTIVE",
      tasks: [
        {
          title: "Điền hồ sơ",
          description: "",
          requireAck: false,
          requireDoc: false,
          requiresManagerApproval: false,
          sortOrder: 0,
          status: "ACTIVE",
        },
      ],
    },
  ],
};