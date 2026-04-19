import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DatePicker, Drawer, Select, Skeleton } from "antd";
import BaseButton from "@/components/button";
import { notify } from "@/utils/notify";
import { useLocale } from "@/i18n";
import {
  apiCreateInstance,
  apiActivateInstance,
  apiListTemplates,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapTemplate } from "@/utils/mappers/onboarding";
import type { OnboardingTemplate, User } from "@/shared/types";

const useTemplatesQuery = (status?: string) =>
  useQuery({
    queryKey: ["templates", status ?? ""],
    queryFn: () => apiListTemplates({ status }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
        "list",
      ).map(mapTemplate) as OnboardingTemplate[],
  });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StartOnboardingDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: (instanceId: string) => void;
  users: User[];
  defaultEmployeeId?: string;
}

interface CreatedInstance {
  instanceId: string;
  status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_ID = "start-onboarding-form";

const INITIAL_FORM = {
  employeeId: "",
  templateId: "",
  startDate: "",
  managerId: "",
  itStaffId: "",
};

type FormState = typeof INITIAL_FORM;

const fieldLabelCls = "text-sm font-medium text-ink";

// ─── Component ────────────────────────────────────────────────────────────────

export const StartOnboardingDrawer = ({
  open,
  onClose,
  onCreated,
  users,
  defaultEmployeeId,
}: StartOnboardingDrawerProps) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const { data: templates = [], isLoading: templatesLoading } =
    useTemplatesQuery("ACTIVE");

  const createInstance = useMutation({ mutationFn: apiCreateInstance });

  const isPending = createInstance.isPending;

  // Pre-fill employeeId when drawer is opened from the employee creation flow
  useEffect(() => {
    if (open && defaultEmployeeId) {
      setForm((p) => ({ ...p, employeeId: defaultEmployeeId }));
    }
  }, [open, defaultEmployeeId]);

  const handleClose = () => {
    setForm(INITIAL_FORM);
    onClose();
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const today = dayjs().startOf("day");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.templateId || !form.managerId) return;
    if (form.startDate && dayjs(form.startDate).isBefore(today)) return;

    try {
      const raw = (await createInstance.mutateAsync({
        employeeId: form.employeeId,
        templateId: form.templateId,
        managerId: form.managerId,
        itStaffUserId: form.itStaffId || undefined,
        startDate: form.startDate || undefined,
      })) as CreatedInstance;

      try {
        await apiActivateInstance({
          instanceId: raw.instanceId,
          managerUserId: form.managerId,
          itStaffUserId: form.itStaffId || undefined,
        });
      } catch (err) {
        notify.error(
          err instanceof Error
            ? err.message
            : t("onboarding.employee.toast.activate_failed"),
        );
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["instances"] });
      notify.success(t("onboarding.employee.toast.started"));
      handleClose();
      onCreated(raw.instanceId);
    } catch (err) {
      notify.error(
        err instanceof Error
          ? err.message
          : t("onboarding.employee.toast.create_failed"),
      );
    }
  };

  const isFormValid = Boolean(
    form.employeeId &&
      form.templateId &&
      form.managerId &&
      (!form.startDate || !dayjs(form.startDate).isBefore(today)),
  );

  const employees = users.filter((u) => u.roles.includes("EMPLOYEE"));
  const managers = users.filter((u) => u.roles.includes("MANAGER"));

  const footer = (
    <div className="flex justify-end gap-3">
      <BaseButton onClick={handleClose} label="global.cancel" />
      <BaseButton
        type="primary"
        htmlType="submit"
        form={FORM_ID}
        disabled={isPending || !isFormValid}>
        {isPending
          ? t("onboarding.employee.drawer.submitting")
          : t("onboarding.employee.action.start")}
      </BaseButton>
    </div>
  );

  return (
    <Drawer
      open={open}
      title={t("onboarding.employee.drawer.title")}
      onClose={handleClose}
      footer={footer}>
      {templatesLoading ? (
        <div className="grid gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid gap-1.5">
              <Skeleton.Input active block size="small" />
              <Skeleton.Input active block />
            </div>
          ))}
        </div>
      ) : (
        <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-6">
          <p className="text-sm text-muted">
            {t("onboarding.employee.drawer.description")}
          </p>

          <div className="grid gap-1.5">
            <span className={fieldLabelCls}>
              {t("onboarding.employee.modal.employee")} *
            </span>
            <Select
              className="w-full"
              value={form.employeeId || undefined}
              onChange={(v) => set("employeeId", v ?? "")}
              placeholder="—"
              options={employees.map((u) => ({ value: u.id, label: u.name }))}
            />
          </div>

          <div className="grid gap-1.5">
            <span className={fieldLabelCls}>
              {t("onboarding.employee.drawer.manager")} *
            </span>
            <Select
              className="w-full"
              value={form.managerId || undefined}
              onChange={(v) => set("managerId", v ?? "")}
              placeholder="—"
              options={(managers.length > 0 ? managers : users).map((u) => ({
                value: u.id,
                label: u.name,
              }))}
            />
          </div>

          <div className="grid gap-1.5">
            <span className={fieldLabelCls}>
              {t("onboarding.employee.modal.template")} *
            </span>
            <Select
              className="w-full"
              value={form.templateId || undefined}
              onChange={(v) => set("templateId", v ?? "")}
              placeholder="—"
              options={templates.map((tpl) => ({
                value: tpl.id,
                label: tpl.name,
              }))}
            />
          </div>

          <div className="grid gap-1.5">
            <span className={fieldLabelCls}>
              {t("onboarding.employee.modal.start_date")}
            </span>
            <DatePicker
              className="w-full"
              value={form.startDate ? dayjs(form.startDate) : null}
              onChange={(date) =>
                set("startDate", date ? date.format("YYYY-MM-DD") : "")
              }
              disabledDate={(current) => current && current.isBefore(today)}
            />
          </div>
        </form>
      )}
    </Drawer>
  );
};
