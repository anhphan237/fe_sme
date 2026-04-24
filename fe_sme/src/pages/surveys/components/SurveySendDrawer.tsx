import { Drawer, Form, DatePicker, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { ClipboardList, UserRound, Users } from "lucide-react";

import BaseButton from "@/components/button";
import BaseSelect from "@core/components/Select/BaseSelect";
import { extractList } from "@/api/core/types";
import {
  apiListSurveyTemplates,
  apiScheduleSurvey,
} from "@/api/survey/survey.api";
import type { SurveyTemplateSummary } from "@/interface/survey";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import SelectOnboardingModal, {
  type SelectedOnboardingItem,
} from "./SelectOnboardingModal";

interface Props {
  open: boolean;
  onClose: () => void;
}

type FormValues = {
  onboardingIds: string[];
  templateId: string;
  scheduledAt?: Dayjs;
  selectedOnboardings?: SelectedOnboardingItem[];
};

type TemplateRole = "EMPLOYEE" | "MANAGER";

const normalizeStage = (value?: string | null) => {
  const stage = (value ?? "").trim().toUpperCase().replace(/\s+/g, "_");

  if (stage === "DAY_7" || stage === "D7") return "D7";
  if (stage === "DAY_30" || stage === "D30") return "D30";
  if (stage === "DAY_60" || stage === "D60") return "D60";
  if (stage === "CUSTOM") return "CUSTOM";

  return stage;
};

const getTemplateTargetRole = (template: unknown): TemplateRole => {
  const t = (template ?? {}) as Record<string, unknown>;

  const rawRole =
    t.targetRole ??
    t.target_role ??
    t.roleTarget ??
    t.role_target ??
    null;

  const normalizedRole = String(rawRole ?? "").trim().toUpperCase();

  if (normalizedRole === "MANAGER") return "MANAGER";
  if (normalizedRole === "EMPLOYEE") return "EMPLOYEE";

  const managerOnly = t.managerOnly ?? t.manager_only;
  if (managerOnly === true || String(managerOnly).toLowerCase() === "true") {
    return "MANAGER";
  }

  const name = String(t.name ?? "").trim().toLowerCase();
  if (name.includes("manager")) {
    return "MANAGER";
  }

  return "EMPLOYEE";
};

const SurveySendDrawer = ({ open, onClose }: Props) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();

  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectedOnboardings, setSelectedOnboardings] = useState<
    SelectedOnboardingItem[]
  >([]);

  const {
    data: templatesRaw,
    isLoading: isTemplatesLoading,
  } = useQuery({
    queryKey: ["survey-templates-for-send"],
    queryFn: () => apiListSurveyTemplates(),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const templates = extractList<SurveyTemplateSummary>(
    templatesRaw,
    "items",
    "templates",
  );

  const manualTemplates = useMemo(
    () =>
      templates.filter((template) => {
        const stage = normalizeStage((template as { stage?: string }).stage);
        const status = String(
          (template as { status?: string }).status ?? "",
        ).trim().toUpperCase();

        return stage === "CUSTOM" && status === "ACTIVE";
      }),
    [templates],
  );

  const templateOptions = useMemo(
    () =>
      manualTemplates.map((template) => {
        const role = getTemplateTargetRole(template);

        return {
          value: template.templateId,
          label: `${template.name} (${role})`,
        };
      }),
    [manualTemplates],
  );

  const selectedTemplateId = Form.useWatch("templateId", form);

  const selectedTemplate = useMemo(
    () =>
      manualTemplates.find((item) => item.templateId === selectedTemplateId),
    [manualTemplates, selectedTemplateId],
  );

  const modalTargetRole: TemplateRole = useMemo(
    () => getTemplateTargetRole(selectedTemplate),
    [selectedTemplate],
  );

  const latestStartDate =
    selectedOnboardings.length > 0
      ? selectedOnboardings
          .map((item) => item.startDate)
          .filter(Boolean)
          .map((date) => dayjs(date as string))
          .filter((date) => date.isValid())
          .reduce((latest, current) =>
            current.isAfter(latest, "day") ? current : latest,
          )
      : null;

  const recipientBlockTitle =
    modalTargetRole === "MANAGER" ? "Quản lý nhận khảo sát" : "Nhân viên nhận khảo sát";

  const recipientBlockSubtitle =
    selectedTemplateId
      ? modalTargetRole === "MANAGER"
        ? "Chọn quản lý phù hợp với mẫu khảo sát đã chọn"
        : "Chọn nhân viên phù hợp với mẫu khảo sát đã chọn"
      : "Vui lòng chọn mẫu khảo sát trước khi chọn người nhận";

  const selectRecipientButtonLabel =
    modalTargetRole === "MANAGER" ? "Chọn quản lý" : "Chọn nhân viên";

  const emptyRecipientLabel =
    modalTargetRole === "MANAGER"
      ? "Chưa có quản lý nào được chọn"
      : "Chưa có nhân viên nào được chọn";

  const summaryRecipientLabel =
    modalTargetRole === "MANAGER" ? "Quản lý" : "Người nhận";

  const scheduleMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!selectedTemplate) {
        throw new Error("Template not found");
      }

      if (
        !values.selectedOnboardings ||
        values.selectedOnboardings.length === 0
      ) {
        throw new Error("Vui lòng chọn người nhận khảo sát");
      }

      const buildScheduledAt = (value?: Dayjs) => {
        if (!value) return undefined;

        const now = dayjs();

        if (value.isSame(now, "day")) {
          return now.toISOString();
        }

        return value.startOf("day").toISOString();
      };

      const results = await Promise.allSettled(
        values.selectedOnboardings.map((item) => {
          if (!item.recipientUserId) {
            throw new Error("Recipient user not found");
          }

          return apiScheduleSurvey({
            onboardingId: item.instanceId,
            templateId: values.templateId,
            scheduledAt: buildScheduledAt(values.scheduledAt),
            responderUserId: item.recipientUserId,
            targetRole: item.recipientRole ?? modalTargetRole,
          });
        }),
      );

      const fulfilled = results.filter(
        (r): r is PromiseFulfilledResult<unknown> => r.status === "fulfilled",
      );

      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );

      const successCount = fulfilled.length;
      const failedCount = rejected.length;

      const duplicateCount = rejected.filter((r) => {
        const message = String(
          r.reason?.message || r.reason || "",
        ).toLowerCase();

        return (
          message.includes("already sent") ||
          message.includes("already scheduled") ||
          message.includes("already sent or scheduled")
        );
      }).length;

      return { successCount, failedCount, duplicateCount };
    },

    onSuccess: async ({ successCount, failedCount, duplicateCount }) => {
      if (successCount > 0 && failedCount === 0) {
        notify.success(
          successCount === 1
            ? t("survey.send.success")
            : `${successCount} ${t("survey.send.success_many")}`,
        );
      } else if (successCount > 0 && failedCount > 0) {
        if (duplicateCount > 0) {
          notify.success(
            `${successCount} ${t("survey.send.success_many")}, ${duplicateCount} ${t("survey.send.duplicate_partial")}`,
          );
        } else {
          notify.success(
            `${successCount} ${t("survey.send.success_partial")}, ${failedCount} ${t("survey.send.failed_partial")}`,
          );
        }
      } else {
        if (duplicateCount > 0) {
          notify.error(t("survey.send.duplicate_error"));
        } else {
          notify.error(t("survey.send.error"));
        }
        return;
      }

      form.resetFields();
      setSelectedOnboardings([]);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["survey-instances"] }),
        queryClient.invalidateQueries({
          queryKey: ["survey-templates-for-send"],
        }),
        queryClient.invalidateQueries({ queryKey: ["survey-templates"] }),
      ]);

      onClose();
    },

    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("survey.send.error");

      const normalized = String(message).toLowerCase();

      if (
        normalized.includes("already sent") ||
        normalized.includes("already scheduled") ||
        normalized.includes("already sent or scheduled")
      ) {
        notify.error(t("survey.send.duplicate_error"));
        return;
      }

      notify.error(message);
    },
  });

  const handleReset = () => {
    form.resetFields();
    setSelectedOnboardings([]);
    setSelectModalOpen(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleConfirmEmployees = (items: SelectedOnboardingItem[]) => {
    setSelectedOnboardings(items);
    form.setFieldValue(
      "onboardingIds",
      items.map((item) => item.instanceId),
    );

    const currentScheduledAt = form.getFieldValue("scheduledAt");
    if (
      currentScheduledAt &&
      latestStartDate &&
      dayjs(currentScheduledAt).isBefore(latestStartDate, "day")
    ) {
      form.setFieldValue("scheduledAt", undefined);
    }

    setSelectModalOpen(false);
  };

  const handleTemplateChange = (value?: string) => {
    const nextTemplate = manualTemplates.find((item) => item.templateId === value);
    const nextRole = getTemplateTargetRole(nextTemplate);

    const hasSelectedRecipients = selectedOnboardings.length > 0;
    const roleChanged =
      hasSelectedRecipients &&
      selectedOnboardings.some((item) => item.recipientRole !== nextRole);

    form.setFieldValue("templateId", value);

    if (roleChanged || hasSelectedRecipients) {
      setSelectedOnboardings([]);
      form.setFieldValue("onboardingIds", []);
    }
  };

  const handleFinish = async (values: FormValues) => {
    if (!selectedTemplateId) {
      notify.error("Vui lòng chọn mẫu khảo sát");
      return;
    }

    if (!selectedOnboardings.length) {
      notify.error(t("survey.send.validation.onboarding_required"));
      return;
    }

    await scheduleMutation.mutateAsync({
      ...values,
      onboardingIds: selectedOnboardings.map((item) => item.instanceId),
      selectedOnboardings,
    });
  };

  return (
    <>
      <Drawer
        title={t("survey.send.title")}
        open={open}
        onClose={handleClose}
        width={540}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <BaseButton label="global.cancel" onClick={handleClose} />
            <BaseButton
              type="primary"
              htmlType="submit"
              loading={scheduleMutation.isPending}
              label="survey.send.schedule"
              onClick={() => form.submit()}
            />
          </div>
        }
      >
        <Form<FormValues> form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="onboardingIds" hidden>
            <input />
          </Form.Item>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 text-sm font-semibold text-slate-800">
              Mẫu khảo sát
            </div>
            <div className="text-xs text-slate-500 mb-3">
              Chọn mẫu trước để hệ thống xác định đúng đối tượng nhận khảo sát
            </div>

            <BaseSelect
              name="templateId"
              label=""
              options={templateOptions}
              loading={isTemplatesLoading}
              placeholder="Chọn mẫu khảo sát"
              onChange={handleTemplateChange}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: t("survey.send.validation.template_required"),
                  },
                ],
              }}
            />

            {selectedTemplate && (
              <div className="mt-3 flex items-center gap-2">
                <Tag color={modalTargetRole === "MANAGER" ? "purple" : "blue"}>
                  {modalTargetRole}
                </Tag>
                <span className="text-xs text-slate-500">
                  Template đang gửi cho{" "}
                  <span className="font-medium text-slate-700">
                    {modalTargetRole === "MANAGER" ? "quản lý" : "nhân viên"}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-600">
                  {modalTargetRole === "MANAGER" ? (
                    <UserRound className="h-4 w-4" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {recipientBlockTitle}
                  </div>
                  <div className="text-xs text-slate-500">
                    {recipientBlockSubtitle}
                  </div>
                </div>
              </div>

              <BaseButton
                type="primary"
                label={selectRecipientButtonLabel}
                disabled={!selectedTemplateId}
                onClick={() => {
                  if (!selectedTemplateId) {
                    notify.error("Vui lòng chọn mẫu khảo sát trước");
                    return;
                  }
                  setSelectModalOpen(true);
                }}
              />
            </div>

            {selectedOnboardings.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                {emptyRecipientLabel}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700">
                  Đã chọn: {selectedOnboardings.length}
                </div>

                <div className="max-h-56 space-y-2 overflow-auto pr-1">
                  {selectedOnboardings.map((item) => (
                    <div
                      key={item.onboardingId}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-800">
                            {item.employeeName}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">
                            {item.email || "-"}
                          </div>
                        </div>

                        <Tag color={item.recipientRole === "MANAGER" ? "purple" : "blue"}>
                          {item.recipientRole || "-"}
                        </Tag>
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-500">
                        <div>
                          Ngày bắt đầu:{" "}
                          <span className="font-medium text-slate-700">
                            {item.startDate
                              ? dayjs(item.startDate).format("DD-MM-YYYY")
                              : "-"}
                          </span>
                        </div>
                        <div>
                          Quản lý:{" "}
                          <span className="font-medium text-slate-700">
                            {item.managerName || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Form.Item<FormValues>
              name="scheduledAt"
              label={t("survey.send.scheduled_at_label")}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();

                    if (dayjs(value).isBefore(dayjs(), "day")) {
                      return Promise.reject("Không được chọn ngày trong quá khứ");
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                className="w-full"
                format="DD-MM-YYYY"
                placeholder={t("survey.send.scheduled_at_placeholder")}
                disabledDate={(current) => {
                  const today = dayjs().startOf("day");

                  if (current && current.isBefore(today, "day")) {
                    return true;
                  }

                  if (latestStartDate) {
                    return current.isBefore(
                      latestStartDate.startOf("day"),
                      "day",
                    );
                  }

                  return false;
                }}
              />
            </Form.Item>

            {latestStartDate && (
              <div className="text-xs text-slate-500">
                Ngày gửi sớm nhất:{" "}
                <span className="font-medium text-slate-700">
                  {latestStartDate.format("DD-MM-YYYY")}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ClipboardList className="h-4 w-4" />
              Tóm tắt gửi khảo sát
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between gap-3">
                <span>{summaryRecipientLabel}</span>
                <span className="font-medium text-slate-800">
                  {selectedOnboardings.length}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span>Mẫu khảo sát</span>
                <span className="text-right font-medium text-slate-800">
                  {selectedTemplate?.name || "-"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span>Vai trò template</span>
                <Tag color={modalTargetRole === "MANAGER" ? "purple" : "blue"} className="m-0">
                  {modalTargetRole}
                </Tag>
              </div>

              <div className="flex justify-between gap-3">
                <span>Ngày dự kiến gửi</span>
                <span className="font-medium text-slate-800">
                  {form.getFieldValue("scheduledAt")
                    ? dayjs(form.getFieldValue("scheduledAt")).format("DD-MM-YYYY")
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </Form>
      </Drawer>

      {selectModalOpen && (
        <SelectOnboardingModal
          open={selectModalOpen}
          selectedIds={selectedOnboardings.map((item) => item.instanceId)}
          targetRole={modalTargetRole}
          onClose={() => setSelectModalOpen(false)}
          onConfirm={handleConfirmEmployees}
        />
      )}
    </>
  );
};

export default SurveySendDrawer;