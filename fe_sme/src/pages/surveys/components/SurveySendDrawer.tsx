import { Drawer, Form, DatePicker } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";

import BaseButton from "@/components/button";
import BaseSelect from "@core/components/Select/BaseSelect";
import { extractList } from "@/api/core/types";
import {
  apiListSurveyTemplates,
  apiScheduleSurvey,
} from "@/api/survey/survey.api";
import type {

  SurveyTemplateSummary,
} from "@/interface/survey";
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

const SurveySendDrawer = ({ open, onClose }: Props) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();

  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectedOnboardings, setSelectedOnboardings] = useState<
    SelectedOnboardingItem[]
  >([]);

  const { data: templatesRaw, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["survey-templates-for-send"],
    queryFn: () => apiListSurveyTemplates(),
    enabled: open,
  });

  const templates = extractList<SurveyTemplateSummary>(
    templatesRaw,
    "items",
    "templates",
  );

  const normalizeStage = (value?: string | null) =>
  (value ?? "").trim().toUpperCase().replace(/\s+/g, "_");

  
const manualTemplates = templates.filter((template) => {
  const stage = normalizeStage(template.stage);
  const status = (template.status ?? "").trim().toUpperCase();

  return stage === "CUSTOM" && status === "ACTIVE";
});
  const templateOptions = manualTemplates.map((template) => ({
    value: template.templateId,
    label: template.name,
  }));

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

  const selectedTemplateId = Form.useWatch("templateId", form);
  const selectedTemplate = manualTemplates.find(
    (item) => item.templateId === selectedTemplateId,
    
  );

 const scheduleMutation = useMutation({
  mutationFn: async (values: FormValues) => {
     console.log("MUTATION_FN_START", values, selectedTemplate, selectedOnboardings);

    if (!selectedTemplate) {
      throw new Error("Template not found");
    }
      if (!selectedTemplate) {
        throw new Error("Template not found");
      }

      if (!values.selectedOnboardings || values.selectedOnboardings.length === 0) {
        throw new Error("Vui lòng chọn onboarding");
      }

   const results = await Promise.allSettled(
  values.selectedOnboardings.flatMap((item) => {
    const payloads = [];
    const rawRole = selectedTemplate.targetRole;
    const role =
  rawRole === "EMPLOYEE" || rawRole === "MANAGER" || rawRole === "BOTH"
    ? rawRole
    : "EMPLOYEE";

    if (role === "EMPLOYEE" || role === "BOTH") {
      payloads.push(
        apiScheduleSurvey({
          onboardingId: item.onboardingId,
          templateId: values.templateId,
          scheduledAt: values.scheduledAt?.toISOString(),
          responderUserId: item.userId,
          targetRole: "EMPLOYEE",
        }),
      );
    }

    if (role === "MANAGER" || role === "BOTH") {
      payloads.push(
        apiScheduleSurvey({
          onboardingId: item.onboardingId,
          templateId: values.templateId,
          scheduledAt: values.scheduledAt?.toISOString(),
          responderUserId: item.userId,
          targetRole: "MANAGER",
        }),
      );
    }

    return payloads;
  }),
    );

    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failedCount = results.filter(r => r.status === "rejected").length;

    return { successCount, failedCount };

    },
    onSuccess: async ({ successCount, failedCount }) => {
      if (successCount > 0 && failedCount === 0) {
        notify.success(
          successCount === 1
            ? t("survey.send.success")
            : `${successCount} ${t("survey.send.success_many")}`,
        );
      } else if (successCount > 0 && failedCount > 0) {
        notify.success(
          `${successCount} ${t("survey.send.success_partial")}, ${failedCount} ${t("survey.send.failed_partial")}`,
        );
      } else {
        notify.error(t("survey.send.error"));
        return;
      }

      form.resetFields();
      setSelectedOnboardings([]);

      await queryClient.invalidateQueries({
        queryKey: ["survey-instances"],
      });

      onClose();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("survey.send.error");
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

  const handleFinish = async (values: FormValues) => {
    if (!selectedOnboardings.length) {
      console.log("HANDLE_FINISH", values, selectedOnboardings, selectedTemplate);
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
        width={520}
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

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {t("survey.send.employee_label")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("survey.send.employee_selection_hint")}
                </div>
              </div>

              <BaseButton
                type="primary"
                label="survey.send.select_employees"
                onClick={() => setSelectModalOpen(true)}
              />
            </div>

            {selectedOnboardings.length === 0 ? (
              <div className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">
                {t("survey.send.no_employee_selected")}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">
                  {t("survey.send.selected_count")}: {selectedOnboardings.length}
                </div>

                <div className="max-h-52 space-y-2 overflow-auto">
                  {selectedOnboardings.map((item) => (
                    <div
                      key={item.instanceId}
                      className="rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <div className="font-medium text-slate-800">
                        {item.employeeName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.email || "-"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {t("survey.send.start_date_column")}:{" "}
                        {item.startDate
                          ? dayjs(item.startDate).format("DD-MM-YYYY")
                          : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <BaseSelect
              name="templateId"
              label={t("survey.send.template_label")}
              options={templateOptions}
              loading={isTemplatesLoading}
              placeholder={t("global.select")}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: t("survey.send.validation.template_required"),
                  },
                ],
              }}
            />
          </div>

          <div className="mt-4">
            <Form.Item<FormValues>
              name="scheduledAt"
              label={t("survey.send.scheduled_at_label")}
            >
              <DatePicker
                className="w-full"
                format="DD-MM-YYYY"
                placeholder={t("survey.send.scheduled_at_placeholder")}
                disabledDate={(current) => {
                  if (!latestStartDate) return false;
                  return current.isBefore(latestStartDate.startOf("day"), "day");
                }}
              />
            </Form.Item>

            {latestStartDate && (
              <div className="text-xs text-slate-500">
                {t("survey.send.min_schedule_hint")}{" "}
                <span className="font-medium">
                  {latestStartDate.format("DD-MM-YYYY")}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-800">
              {t("survey.send.summary_title")}
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div>
                <span className="font-medium">{t("survey.send.employee_label")}:</span>{" "}
                {selectedOnboardings.length}
              </div>
              <div>
                <span className="font-medium">{t("survey.send.template_label")}:</span>{" "}
                {selectedTemplate?.name || "-"}
              </div>
              <div>
                <span className="font-medium">{t("survey.send.scheduled_at_label")}:</span>{" "}
                {form.getFieldValue("scheduledAt")
                  ? dayjs(form.getFieldValue("scheduledAt")).format("DD-MM-YYYY")
                  : "-"}
              </div>
            </div>
          </div>
        </Form>
      </Drawer>

      {selectModalOpen && (
      <SelectOnboardingModal
        open={selectModalOpen}
        selectedIds={selectedOnboardings.map((item) => item.instanceId)}
        onClose={() => setSelectModalOpen(false)}
        onConfirm={handleConfirmEmployees}
      />
    )}
    </>
  );
};

export default SurveySendDrawer;