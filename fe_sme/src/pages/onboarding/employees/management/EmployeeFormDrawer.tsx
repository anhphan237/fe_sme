import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Drawer, Skeleton } from "antd";
import { notify } from "@/utils/notify";
import { useLocale } from "@/i18n";
import {
  apiCreateUser,
  apiGetUserById,
  apiUpdateUser,
} from "@/api/identity/identity.api";
import { apiListDepartments } from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import { mapUserDetail } from "@/utils/mappers/identity";
import { ROLE_LABELS } from "@/shared/rbac";
import type {
  CreateUserRequest,
  GetUserResponse,
  UpdateUserRequest,
} from "@/interface/identity";
import type { DepartmentItem } from "@/interface/company";
import type { Role } from "@/shared/types";

export type EmployeeDrawerMode = "create" | "edit" | null;

const EMPLOYEE_ROLES: Role[] = ["EMPLOYEE", "MANAGER", "HR"];
const FORM_ID = "employee-form";

function generateEmployeeCode(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `EMP-${year}-${rand}`;
}

const INITIAL_FORM = {
  email: "",
  fullName: "",
  phone: "",
  roleCode: "EMPLOYEE" as Role,
  password: "",
  departmentId: "",
  jobTitle: "",
  employeeCode: "",
  startDate: "",
  workLocation: "",
};

type FormState = typeof INITIAL_FORM;

export interface EmployeeFormDrawerProps {
  /** undefined = closed | null = create | string = edit */
  userId: string | null | undefined;
  onClose: () => void;
  onCreated?: (userId: string) => void;
}

const inputCls =
  "w-full rounded-xl border border-stroke px-4 py-2.5 text-[15px] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50 disabled:text-muted disabled:cursor-not-allowed";

const labelCls = "grid gap-1.5 text-sm font-medium text-ink";

const useEmployeeForm = (
  userId: string | null | undefined,
  onClose: () => void,
  onCreated?: (userId: string) => void,
) => {
  const isEdit = typeof userId === "string";
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: unknown) => extractList<DepartmentItem>(res, "items"),
  });

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: isEdit,
    select: (res: unknown) => mapUserDetail(res as GetUserResponse),
  });

  useEffect(() => {
    if (isEdit && userDetail) {
      setForm({
        email: userDetail.email ?? "",
        fullName: userDetail.fullName ?? "",
        phone: userDetail.phone ?? "",
        roleCode: "EMPLOYEE",
        password: "",
        departmentId: userDetail.departmentId ?? "",
        jobTitle: userDetail.jobTitle ?? "",
        employeeCode: userDetail.employeeCode ?? "",
        startDate: userDetail.startDate ?? "",
        workLocation: userDetail.workLocation ?? "",
      });
    } else {
      setForm({ ...INITIAL_FORM, employeeCode: generateEmployeeCode() });
    }
  }, [isEdit, userDetail]);

  const createUser = useMutation({
    mutationFn: (p: CreateUserRequest) => apiCreateUser(p),
  });
  const updateUser = useMutation({
    mutationFn: (p: UpdateUserRequest) => apiUpdateUser(p),
  });
  const isPending = createUser.isPending || updateUser.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleClose = () => {
    setForm(INITIAL_FORM);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.fullName.trim()) return;
    try {
      if (isEdit && userId) {
        await updateUser.mutateAsync({
          userId,
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
          departmentId: form.departmentId || undefined,
          jobTitle: form.jobTitle.trim() || undefined,
          employeeCode: form.employeeCode.trim() || undefined,
          startDate: form.startDate || undefined,
          workLocation: form.workLocation.trim() || undefined,
          ...(form.password ? { newPassword: form.password } : {}),
        });
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["user-detail", userId] });
        notify.success(t("onboarding.employee.form.update_success"));
      } else {
        const result = await createUser.mutateAsync({
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
          roleCode: form.roleCode,
          password: form.password || undefined,
          departmentId: form.departmentId || undefined,
          jobTitle: form.jobTitle.trim() || undefined,
          employeeCode: form.employeeCode.trim() || undefined,
          startDate: form.startDate || undefined,
          workLocation: form.workLocation.trim() || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["users"] });
        notify.success(t("onboarding.employee.form.create_success"));
        const newUserId =
          ((result as Record<string, unknown>)?.userId as string | undefined) ??
          ((result as Record<string, unknown>)?.id as string | undefined);
        if (newUserId) onCreated?.(newUserId);
      }
      handleClose();
    } catch (err) {
      notify.error(
        err instanceof Error
          ? err.message
          : t(
              isEdit
                ? "onboarding.employee.form.update_failed"
                : "onboarding.employee.form.create_failed",
            ),
      );
    }
  };

  return {
    isEdit,
    form,
    set,
    departments,
    isLoadingDetail: isEdit && Boolean(userId) && detailLoading,
    isPending,
    handleClose,
    handleSubmit,
  };
};

export const EmployeeFormDrawer = ({
  userId,
  onClose,
  onCreated,
}: EmployeeFormDrawerProps) => {
  const { t } = useLocale();
  const {
    isEdit,
    form,
    set,
    departments,
    isLoadingDetail,
    isPending,
    handleClose,
    handleSubmit,
  } = useEmployeeForm(userId, onClose, onCreated);

  const footer = (
    <div className="flex justify-end gap-3">
      <Button onClick={handleClose}>{t("global.cancel")}</Button>
      <Button
        type="primary"
        htmlType="submit"
        form={FORM_ID}
        loading={isPending}
        disabled={isPending}>
        {isPending
          ? isEdit
            ? t("onboarding.employee.form.updating")
            : t("onboarding.employee.form.creating")
          : isEdit
            ? t("global.save")
            : t("employee.add")}
      </Button>
    </div>
  );

  return (
    <Drawer
      open={userId !== undefined}
      title={isEdit ? t("employee.edit") : t("employee.add")}
      onClose={handleClose}
      footer={footer}>
      {isLoadingDetail ? (
        <div className="grid gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid gap-1.5">
              <Skeleton.Input active block size="small" />
              <Skeleton.Input active block />
            </div>
          ))}
        </div>
      ) : (
        <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-5">
          <label className={labelCls}>
            {t("auth.email")} *
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder={t("employee.form.email_placeholder")}
              required
              disabled={isEdit}
              autoFocus={!isEdit}
            />
          </label>

          <label className={labelCls}>
            {t("employee.full_name")} *
            <input
              type="text"
              className={inputCls}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder={t("employee.form.full_name_placeholder")}
              required
            />
          </label>

          <label className={labelCls}>
            {t("employee.mobile_phone")}
            <input
              type="tel"
              className={inputCls}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder={t("employee.form.phone_placeholder")}
            />
          </label>

          {!isEdit && (
            <label className={labelCls}>
              {t("onboarding.employee.col.role")}
              <select
                className={inputCls}
                value={form.roleCode}
                onChange={(e) => set("roleCode", e.target.value as Role)}>
                {EMPLOYEE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {departments && departments.length > 0 && (
            <label className={labelCls}>
              {t("employee.department")}
              <select
                className={inputCls}
                value={form.departmentId}
                onChange={(e) => set("departmentId", e.target.value)}>
                <option value="">
                  {t("global.select", { field: t("employee.department") })}
                </option>
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className={labelCls}>
            {t("employee.position")}
            <input
              type="text"
              className={inputCls}
              value={form.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)}
              placeholder={t("employee.position")}
            />
          </label>

          <label className={labelCls}>
            {t("employee.code")}
            <input
              type="text"
              className={inputCls}
              value={form.employeeCode}
              onChange={(e) => set("employeeCode", e.target.value)}
              placeholder={t("employee.form.code_placeholder")}
            />
          </label>

          <label className={labelCls}>
            {t("employee.hire_date")}
            <input
              type="date"
              className={inputCls}
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </label>

          <label className={labelCls}>
            {t("onboarding.employee.detail.work_location")}
            <input
              type="text"
              className={inputCls}
              value={form.workLocation}
              onChange={(e) => set("workLocation", e.target.value)}
              placeholder={t("employee.form.work_location_placeholder")}
            />
          </label>

          <label className={labelCls}>
            {t("onboarding.employee.form.password_optional")}
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={
                isEdit
                  ? t("onboarding.employee.form.password_change_hint")
                  : t("onboarding.employee.form.password_hint")
              }
              autoComplete="new-password"
            />
            <span className="text-xs text-muted">
              {isEdit
                ? t("onboarding.employee.form.password_change_hint")
                : t("onboarding.employee.form.password_hint")}
            </span>
          </label>
        </form>
      )}
    </Drawer>
  );
};
