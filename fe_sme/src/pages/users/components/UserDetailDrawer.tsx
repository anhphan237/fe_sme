import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Drawer, Form, Skeleton, Tag } from "antd";
import dayjs from "dayjs";
import BaseButton from "@/components/button";
import BaseDatePicker from "@core/components/DatePicker";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import { UserStatusTag } from "@core/components/Status/StatusTag";
import { notify } from "@/utils/notify";
import { useLocale } from "@/i18n";
import { getPrimaryRole, ROLE_LABELS } from "@/shared/rbac";
import type { Role, User } from "@/shared/types";
import type { DepartmentItem } from "@/interface/company";
import {
  apiAssignRole,
  apiDisableUser,
  apiGetUserById,
  apiRevokeRole,
  apiUpdateUser,
} from "@/api/identity/identity.api";
import { mapUserDetail } from "@/utils/mappers/identity";
import { ROLE_BADGE_STYLES, ROLE_OPTIONS } from "../constants";

interface EditForm {
  fullName: string;
  phone: string;
  departmentId: string;
  managerUserId: string;
  jobTitle: string;
  workLocation: string;
  startDate: dayjs.Dayjs | null;
  roleCode: string;
}

export interface UserDetailDrawerProps {
  userId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
  users: User[];
  departments: DepartmentItem[];
}

const DASH = "—";

const cleanText = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizeDateForApi = (
  value: dayjs.Dayjs | string | null | undefined,
): string | undefined => {
  if (!value) return undefined;
  if (dayjs.isDayjs(value)) return value.format("YYYY-MM-DD");
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : undefined;
};

const renderDate = (value?: string | null): string => {
  if (!value) return DASH;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value.slice(0, 10);
  return parsed.format("YYYY-MM-DD");
};

const SectionLabel = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => (
  <div className={`mb-3 flex items-center gap-2 ${className ?? ""}`}>
    <span className="text-xs font-semibold uppercase tracking-wider text-[#758BA5]">{label}</span>
    <div className="h-px flex-1 bg-[#E8EDF3]" />
  </div>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
    <span className="shrink-0 text-slate-500">{label}</span>
    <span className={`text-right font-medium ${value ? "text-slate-800" : "text-slate-300"}`}>
      {value || DASH}
    </span>
  </div>
);

export const UserDetailDrawer = ({
  userId,
  onClose,
  onUpdated,
  users,
  departments,
}: UserDetailDrawerProps) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<EditForm>();

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const initializedRef = useRef<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res) => mapUserDetail(res as Parameters<typeof mapUserDetail>[0]),
  });

  const selectedDeptId = Form.useWatch("departmentId", form);

  const managerOptions = useMemo(() => {
    const filteredUsers = selectedDeptId
      ? users.filter((user) => user.departmentId === selectedDeptId)
      : users;
    return filteredUsers.map((user) => ({
      value: user.id,
      label: user.name || user.email,
    }));
  }, [users, selectedDeptId]);

  const roleOptions = useMemo(
    () =>
      ROLE_OPTIONS.filter((option) => !option.isPlatform).map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  useEffect(() => {
    setMode("view");
    setSaveError(null);
    initializedRef.current = null;
  }, [userId]);

  useEffect(() => {
    if (!data || !userId || initializedRef.current === userId) return;

    const listUser = users.find((user) => user.id === userId);
    const roleCode = listUser ? getPrimaryRole(listUser.roles) : "EMPLOYEE";

    form.setFieldsValue({
      fullName: data.fullName ?? "",
      phone: data.phone ?? "",
      departmentId: data.departmentId ?? undefined,
      managerUserId: data.managerUserId ?? undefined,
      jobTitle: data.jobTitle ?? "",
      workLocation: data.workLocation ?? "",
      startDate: data.startDate ? dayjs(data.startDate) : null,
      roleCode,
    });

    initializedRef.current = userId;
  }, [data, form, userId, users]);

  const listUser = users.find((user) => user.id === userId);
  const currentRole = listUser ? getPrimaryRole(listUser.roles) : null;
  const createdAt = listUser?.createdAt;
  const isActive = data?.status === "ACTIVE" || data?.status === "INVITED";

  const departmentName =
    departments.find((department) => department.departmentId === data?.departmentId)?.name ??
    data?.departmentId;
  const managerName =
    users.find((user) => user.id === data?.managerUserId)?.name ??
    users.find((user) => user.id === data?.managerUserId)?.email ??
    data?.managerUserId;

  const handleEdit = () => {
    setSaveError(null);
    setMode("edit");
  };

  const handleCancelEdit = () => {
    setSaveError(null);
    setMode("view");
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const values = await form.validateFields();

      await apiUpdateUser({
        userId: data.userId,
        fullName: cleanText(values.fullName),
        phone: cleanText(values.phone),
        departmentId: cleanText(values.departmentId),
        managerUserId: cleanText(values.managerUserId),
        jobTitle: cleanText(values.jobTitle),
        workLocation: cleanText(values.workLocation),
        startDate: normalizeDateForApi(values.startDate),
      });

      // Keep current FE flow as requested: revoke old role then assign new role.
      if (values.roleCode && values.roleCode !== currentRole) {
        if (currentRole) await apiRevokeRole(data.userId, currentRole as Role);
        await apiAssignRole(data.userId, values.roleCode as Role);
      }

      notify.success(t("user.update.success"));
      initializedRef.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-detail", userId] }),
        queryClient.invalidateQueries({ queryKey: ["users"] }),
      ]);
      onUpdated?.();
      setMode("view");
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      setSaveError(err instanceof Error ? err.message : t("user.error.update_failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data) return;
    setToggling(true);
    try {
      if (isActive) {
        await apiDisableUser(data.userId);
        notify.success(t("user.disable.success"));
      } else {
        await apiUpdateUser({ userId: data.userId, status: "ACTIVE" });
        notify.success(t("user.enable.success"));
      }
      initializedRef.current = null;
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      onUpdated?.();
    } finally {
      setToggling(false);
    }
  };

  const footer = data ? (
    mode === "view" ? (
      <div className="flex items-center justify-between gap-2">
        <BaseButton
          type="text"
          danger={isActive}
          loading={toggling}
          onClick={handleToggleStatus}
          label={isActive ? "user.disable" : "user.enable"}
        />
        <BaseButton
          type="primary"
          icon={<Pencil className="h-3.5 w-3.5" />}
          onClick={handleEdit}
          label="global.edit"
        />
      </div>
    ) : (
      <div className="flex justify-end gap-2">
        <BaseButton htmlType="button" onClick={handleCancelEdit} label="global.cancel" />
        <BaseButton
          type="primary"
          htmlType="button"
          loading={saving}
          onClick={handleSave}
          label={saving ? "user.saving" : "global.save"}
        />
      </div>
    )
  ) : null;

  return (
    <Drawer
      open={Boolean(userId)}
      title={mode === "edit" ? t("user.detail.edit_title") : t("user.detail.title")}
      onClose={onClose}
      width={560}
      destroyOnClose
      footer={footer}>
      {isLoading ? (
        <div className="py-2">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      ) : data ? (
        <div data-testid="user-detail-content">
          <div className="mb-5 flex items-start gap-4 rounded-xl border border-[#E8EDF3] bg-[#F5F8FC] p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#3684DB]/10 text-2xl font-bold text-[#3684DB]">
              {(data.fullName?.[0] ?? data.email?.[0] ?? "?").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-[#223A59]">{data.fullName}</p>
              <p className="mt-0.5 truncate text-sm text-[#758BA5]">{data.email}</p>
              {data.jobTitle || departmentName ? (
                <p className="mt-0.5 truncate text-xs text-[#9BAEC2]">
                  {[data.jobTitle, departmentName].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <UserStatusTag status={data.status} />
                {currentRole ? (
                  <Tag
                    className={`text-xs ${ROLE_BADGE_STYLES[currentRole] ?? ROLE_BADGE_STYLES.EMPLOYEE}`}>
                    {ROLE_LABELS[currentRole]}
                  </Tag>
                ) : null}
                {data.employeeCode ? (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-500">
                    {data.employeeCode}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {mode === "view" ? (
            <>
              <SectionLabel label={t("user.section.profile")} />
              <div className="rounded-lg border border-slate-100 px-4">
                <DetailRow label={t("user.detail.phone")} value={data.phone} />
                <DetailRow label={t("user.detail.job_title")} value={data.jobTitle} />
                <DetailRow label={t("user.detail.work_location")} value={data.workLocation} />
                <DetailRow label={t("user.detail.start_date")} value={renderDate(data.startDate)} />
                <DetailRow label={t("user.detail.created_at")} value={renderDate(createdAt)} />
              </div>

              <SectionLabel label={t("user.section.organization")} className="mt-4" />
              <div className="rounded-lg border border-slate-100 px-4">
                <DetailRow label={t("user.detail.department")} value={departmentName} />
                <DetailRow label={t("user.detail.manager")} value={managerName} />
              </div>

              <SectionLabel label={t("user.section.employee")} className="mt-4" />
              <div className="rounded-lg border border-slate-100 px-4">
                <DetailRow label={t("user.detail.employee_id")} value={data.employeeId} />
                <DetailRow label={t("user.detail.employee_code")} value={data.employeeCode} />
              </div>
            </>
          ) : (
            <Form form={form} layout="vertical">
              {saveError ? (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {saveError}
                </div>
              ) : null}

              <SectionLabel label={t("user.section.profile")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <BaseInput name="fullName" label={t("user.name")} />
                <BaseInput name="phone" label={t("user.detail.phone")} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <BaseInput name="jobTitle" label={t("user.detail.job_title")} />
                <BaseInput name="workLocation" label={t("user.detail.work_location")} />
              </div>
              <BaseDatePicker
                name="startDate"
                label={t("user.detail.start_date")}
                format="DD/MM/YYYY"
                className="w-full"
              />

              <SectionLabel label={t("user.section.organization")} className="mt-4" />
              <BaseSelect name="roleCode" label={t("user.detail.role")} options={roleOptions} />
              <div className="grid gap-3 sm:grid-cols-2">
                <BaseSelect
                  name="departmentId"
                  label={t("user.invite.department_id")}
                  allowClear
                  placeholder={t("user.invite.department_placeholder")}
                  options={departments.map((department) => ({
                    value: department.departmentId,
                    label: department.name,
                  }))}
                  onChange={() => form.setFieldValue("managerUserId", undefined)}
                />
                <BaseSelect
                  name="managerUserId"
                  label={t("user.invite.manager_id")}
                  showSearch
                  allowClear
                  options={managerOptions}
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </div>
            </Form>
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">{t("user.error.load_failed")}</p>
      )}
    </Drawer>
  );
};
