import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Drawer, Form, Skeleton, Tag } from "antd";
import { notify } from "@/utils/notify";
import dayjs from "dayjs";
import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseDatePicker from "@core/components/DatePicker";
import { UserStatusTag } from "@core/components/Status/StatusTag";
import {
  apiGetUserById,
  apiUpdateUser,
  apiAssignRole,
  apiRevokeRole,
  apiDisableUser,
} from "@/api/identity/identity.api";
import { mapUserDetail } from "@/utils/mappers/identity";
import { useLocale } from "@/i18n";
import { getPrimaryRole, ROLE_LABELS } from "@/shared/rbac";
import { ROLE_BADGE_STYLES, ROLE_OPTIONS } from "../constants";
import type { Role, User } from "@/shared/types";
import type { DepartmentItem } from "@/interface/company";

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

const SectionLabel = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => (
  <div className={`mb-3 flex items-center gap-2 ${className ?? ""}`}>
    <span className="text-xs font-semibold uppercase tracking-wider text-[#758BA5]">
      {label}
    </span>
    <div className="h-px flex-1 bg-[#E8EDF3]" />
  </div>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
};

export interface UserDetailDrawerProps {
  userId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
  users: User[];
  departments: DepartmentItem[];
}

export const UserDetailDrawer = ({
  userId,
  onClose,
  onUpdated,
  users,
  departments,
}: UserDetailDrawerProps) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const enabled = Boolean(userId);

  const [form] = Form.useForm<EditForm>();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  // tracks which userId we've already initialized the form for
  const initializedRef = useRef<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled,
    select: (res) => mapUserDetail(res as Parameters<typeof mapUserDetail>[0]),
  });

  const selectedDeptId = Form.useWatch("departmentId", form);

  const managerOptions = useMemo(() => {
    const filtered = selectedDeptId
      ? users.filter((u) => u.departmentId === selectedDeptId)
      : users;
    return filtered.map((u) => ({ value: u.id, label: u.name || u.email }));
  }, [users, selectedDeptId]);

  // Reset mode when modal opens for a different user
  useEffect(() => {
    setMode("view");
    setSaveError(null);
    initializedRef.current = null;
  }, [userId]);

  // Populate edit form once per userId when data + users are ready
  useEffect(() => {
    if (!data || !userId || initializedRef.current === userId) return;
    const listUser = users.find((u) => u.id === userId);
    const role = listUser ? getPrimaryRole(listUser.roles) : "EMPLOYEE";
    form.setFieldsValue({
      fullName: data.fullName ?? "",
      phone: data.phone ?? "",
      departmentId: data.departmentId ?? undefined,
      managerUserId: data.managerUserId ?? undefined,
      jobTitle: data.jobTitle ?? "",
      workLocation: data.workLocation ?? "",
      startDate: data.startDate ? dayjs(data.startDate.slice(0, 10)) : null,
      roleCode: role ?? "EMPLOYEE",
    });
    initializedRef.current = userId;
  }, [data, users, userId, form]);

  // Resolved display values for view mode
  const deptName =
    departments.find((d) => d.departmentId === data?.departmentId)?.name ??
    data?.departmentId;
  const managerName =
    users.find((u) => u.id === data?.managerUserId)?.name ??
    users.find((u) => u.id === data?.managerUserId)?.email ??
    data?.managerUserId;
  const listUser = users.find((u) => u.id === userId);
  const currentRole = listUser ? getPrimaryRole(listUser.roles) : null;
  const isActive = data?.status === "ACTIVE" || data?.status === "INVITED";

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
        fullName: values.fullName?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        departmentId: values.departmentId || undefined,
        managerUserId: values.managerUserId || undefined,
        jobTitle: values.jobTitle?.trim() || undefined,
        workLocation: values.workLocation?.trim() || undefined,
        startDate: values.startDate
          ? dayjs.isDayjs(values.startDate)
            ? values.startDate.format("YYYY-MM-DD")
            : String(values.startDate)
          : undefined,
      });
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
      setSaveError(
        err instanceof Error ? err.message : t("user.error.update_failed"),
      );
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
        <BaseButton
          htmlType="button"
          onClick={handleCancelEdit}
          label="global.cancel"
        />
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
      title={
        mode === "edit" ? t("user.detail.edit_title") : t("user.detail.title")
      }
      onClose={onClose}
      width={560}
      destroyOnClose
      footer={footer}>
      {isLoading ? (
        <div className="py-2">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : data ? (
        <div data-testid="user-detail-content">
          {/* Header: avatar + name + status + role */}
          <div className="mb-4 flex items-center gap-4 rounded-xl border border-[#E8EDF3] bg-[#F5F8FC] p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#3684DB]/10 text-2xl font-bold text-[#3684DB]">
              {(data.fullName?.[0] ?? data.email?.[0] ?? "?").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[#223A59]">
                {data.fullName}
              </p>
              <p className="mt-0.5 truncate text-sm text-[#758BA5]">
                {data.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <UserStatusTag status={data.status} />
                {currentRole && (
                  <Tag
                    className={`text-xs ${ROLE_BADGE_STYLES[currentRole] ?? ROLE_BADGE_STYLES.EMPLOYEE}`}>
                    {ROLE_LABELS[currentRole]}
                  </Tag>
                )}
              </div>
            </div>
          </div>

          {mode === "view" ? (
            <>
              {/* Profile */}
              <SectionLabel label={t("user.section.profile")} />
              <div className="rounded-lg border border-slate-100 px-4">
                <DetailRow label={t("user.detail.phone")} value={data.phone} />
                <DetailRow
                  label={t("user.detail.job_title")}
                  value={data.jobTitle}
                />
                <DetailRow
                  label={t("user.detail.work_location")}
                  value={data.workLocation}
                />
                <DetailRow
                  label={t("user.detail.start_date")}
                  value={data.startDate?.slice(0, 10)}
                />
              </div>

              {/* Organization */}
              <SectionLabel
                label={t("user.section.organization")}
                className="mt-4"
              />
              <div className="rounded-lg border border-slate-100 px-4">
                <DetailRow
                  label={t("user.detail.department")}
                  value={deptName}
                />
                <DetailRow
                  label={t("user.detail.manager")}
                  value={managerName}
                />
              </div>

              {/* Employee */}
              <SectionLabel
                label={t("user.section.employee")}
                className="mt-4"
              />
              <div className="rounded-lg border border-slate-100 px-4">
                <DetailRow
                  label={t("user.detail.employee_id")}
                  value={data.employeeId}
                />
                <DetailRow
                  label={t("user.detail.employee_code")}
                  value={data.employeeCode}
                />
              </div>
            </>
          ) : (
            <Form form={form} layout="vertical">
              {saveError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {saveError}
                </div>
              )}

              {/* Profile */}
              <SectionLabel label={t("user.section.profile")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <BaseInput name="fullName" label={t("user.name")} />
                <BaseInput name="phone" label={t("user.detail.phone")} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <BaseInput name="jobTitle" label={t("user.detail.job_title")} />
                <BaseInput
                  name="workLocation"
                  label={t("user.detail.work_location")}
                />
              </div>
              <BaseDatePicker
                name="startDate"
                label={t("user.detail.start_date")}
                format="DD/MM/YYYY"
                className="w-full"
              />

              {/* Organization */}
              <SectionLabel
                label={t("user.section.organization")}
                className="mt-4"
              />
              <BaseSelect
                name="roleCode"
                label={t("user.detail.role")}
                options={ROLE_OPTIONS as { value: string; label: string }[]}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <BaseSelect
                  name="departmentId"
                  label={t("user.invite.department_id")}
                  allowClear
                  placeholder="—"
                  options={departments.map((d) => ({
                    value: d.departmentId,
                    label: d.name,
                  }))}
                  onChange={() =>
                    form.setFieldValue("managerUserId", undefined)
                  }
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
        <p className="py-4 text-center text-sm text-slate-400">
          {t("user.error.load_failed")}
        </p>
      )}
    </Drawer>
  );
};
