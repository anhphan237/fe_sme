import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button, Drawer, Skeleton } from "antd";
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

const inputCls =
  "w-full rounded-xl border border-stroke px-4 py-2.5 text-[15px] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50 disabled:text-muted disabled:cursor-not-allowed";

const labelCls = "grid gap-1.5 text-sm font-medium text-ink";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.templateId || !form.managerId) return;

    try {
      const raw = (await createInstance.mutateAsync({
        employeeId: form.employeeId,
        templateId: form.templateId,
        managerId: form.managerId,
        itStaffUserId: form.itStaffId || undefined,
        startDate: form.startDate || undefined,
      })) as CreatedInstance;

      try {
        await apiActivateInstance(raw.instanceId);
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
    form.employeeId && form.templateId && form.managerId,
  );

  const managers = users.filter((u) => u.roles.includes("MANAGER"));
  const itStaff = users.filter((u) => u.roles.includes("IT"));

  const footer = (
    <div className="flex justify-end gap-3">
      <Button onClick={handleClose}>{t("global.cancel")}</Button>
      <Button
        type="primary"
        htmlType="submit"
        form={FORM_ID}
        disabled={isPending || !isFormValid}>
        {isPending
          ? t("onboarding.employee.drawer.submitting")
          : t("onboarding.employee.action.start")}
      </Button>
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

          <label className={labelCls}>
            {t("onboarding.employee.modal.employee")} *
            <select
              className={inputCls}
              value={form.employeeId}
              onChange={(e) => set("employeeId", e.target.value)}
              required>
              <option value="">—</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelCls}>
            {t("onboarding.employee.drawer.manager")} *
            <select
              className={inputCls}
              value={form.managerId}
              onChange={(e) => set("managerId", e.target.value)}
              required>
              <option value="">—</option>
              {(managers.length > 0 ? managers : users).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelCls}>
            {t("onboarding.employee.modal.template")} *
            <select
              className={inputCls}
              value={form.templateId}
              onChange={(e) => set("templateId", e.target.value)}
              required>
              <option value="">—</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelCls}>
            {t("onboarding.employee.modal.start_date")}
            <input
              type="date"
              className={inputCls}
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </label>

          <label className={labelCls}>
            {t("onboarding.employee.drawer.it_staff")}
            <select
              className={inputCls}
              value={form.itStaffId}
              onChange={(e) => set("itStaffId", e.target.value)}>
              <option value="">—</option>
              {(itStaff.length > 0 ? itStaff : users).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        </form>
      )}
    </Drawer>
  );
};
