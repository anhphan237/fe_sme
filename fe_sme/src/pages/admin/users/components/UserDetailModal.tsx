import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Input, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseButton from "@/components/button";
import { Skeleton } from "../../../../components/ui/Skeleton";
import { Badge } from "../../../../components/ui/Badge";
import { useToast } from "../../../../components/ui/Toast";
import {
  apiGetUserById,
  apiUpdateUser,
  apiAssignRole,
  apiRevokeRole,
  apiDisableUser,
} from "@/api/identity/identity.api";
import { mapUserDetail } from "@/utils/mappers/identity";
import { useLocale } from "@/i18n";
import { statusVariant } from "../../shared";
import { ManagerPicker } from "../../components/ManagerPicker";
import { getPrimaryRole, ROLE_LABELS } from "@/shared/rbac";
import { useUsersQuery, useDepartmentsQuery } from "../../hooks";
import type { Role } from "@/shared/types";

const EDITABLE_ROLES: Role[] = ["EMPLOYEE", "HR", "MANAGER", "IT", "ADMIN"];

interface EditForm {
  fullName: string;
  phone: string;
  departmentId: string;
  managerUserId: string;
  jobTitle: string;
  workLocation: string;
  startDate: string;
  roleCode: string;
}

const EMPTY_FORM: EditForm = {
  fullName: "",
  phone: "",
  departmentId: "",
  managerUserId: "",
  jobTitle: "",
  workLocation: "",
  startDate: "",
  roleCode: "EMPLOYEE",
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

export interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function UserDetailModal({
  userId,
  onClose,
  onUpdated,
}: UserDetailModalProps) {
  const { t } = useLocale();
  const toast = useToast();
  const queryClient = useQueryClient();
  const enabled = Boolean(userId);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  // Tracks which userId we've already initialized the form for
  const initializedRef = useRef<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled,
    select: (res) => mapUserDetail(res as Parameters<typeof mapUserDetail>[0]),
  });

  const { data: users = [] } = useUsersQuery();
  const { data: departments = [] } = useDepartmentsQuery();

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
    setEditForm({
      fullName: data.fullName ?? "",
      phone: data.phone ?? "",
      departmentId: data.departmentId ?? "",
      managerUserId: data.managerUserId ?? "",
      jobTitle: data.jobTitle ?? "",
      workLocation: data.workLocation ?? "",
      startDate: data.startDate?.slice(0, 10) ?? "",
      roleCode: role ?? "EMPLOYEE",
    });
    initializedRef.current = userId;
  }, [data, users, userId]);

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

  const field = (key: keyof EditForm, value: string) =>
    setEditForm((f) => ({ ...f, [key]: value }));

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
      await apiUpdateUser({
        userId: data.userId,
        fullName: editForm.fullName.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        departmentId: editForm.departmentId || undefined,
        managerUserId: editForm.managerUserId || undefined,
        jobTitle: editForm.jobTitle.trim() || undefined,
        workLocation: editForm.workLocation.trim() || undefined,
        startDate: editForm.startDate || undefined,
      });
      // Handle role change
      if (editForm.roleCode && editForm.roleCode !== currentRole) {
        if (currentRole) {
          await apiRevokeRole(data.userId, currentRole as Role);
        }
        await apiAssignRole(data.userId, editForm.roleCode as Role);
      }
      toast(t("user.update.success"));
      initializedRef.current = null; // allow re-init after save
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-detail", userId] }),
        queryClient.invalidateQueries({ queryKey: ["users"] }),
      ]);
      onUpdated?.();
      setMode("view");
    } catch (err) {
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
      const isActive = data.status === "ACTIVE" || data.status === "INVITED";
      if (isActive) {
        await apiDisableUser(data.userId);
        toast(t("user.disable.success"));
      } else {
        await apiUpdateUser({ userId: data.userId, status: "ACTIVE" });
        toast(t("user.enable.success"));
      }
      initializedRef.current = null;
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      onUpdated?.();
    } finally {
      setToggling(false);
    }
  };

  const isActive = data?.status === "ACTIVE" || data?.status === "INVITED";

  return (
    <BaseModal
      open={Boolean(userId)}
      title={
        mode === "edit" ? t("user.detail.edit_title") : t("user.detail.title")
      }
      onCancel={onClose}>
      {isLoading ? (
        <div className="space-y-3 py-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Avatar + name header */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
              {(data.fullName?.[0] ?? data.email?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {data.fullName}
              </p>
              <p className="text-sm text-slate-500">{data.email}</p>
              <Badge
                variant={statusVariant(data.status)}
                className="mt-1 text-xs">
                {t(`user.status.${data.status.toLowerCase()}`)}
              </Badge>
            </div>
          </div>

          {mode === "view" ? (
            /* ── View mode ── */
            <>
              <div className="rounded-lg border border-slate-100 px-4">
                <DetailRow
                  label={t("user.detail.role")}
                  value={currentRole ? ROLE_LABELS[currentRole] : undefined}
                />
                <DetailRow label={t("user.detail.phone")} value={data.phone} />
                <DetailRow
                  label={t("user.detail.job_title")}
                  value={data.jobTitle}
                />
                <DetailRow
                  label={t("user.detail.department")}
                  value={deptName}
                />
                <DetailRow
                  label={t("user.detail.manager")}
                  value={managerName}
                />
                <DetailRow
                  label={t("user.detail.work_location")}
                  value={data.workLocation}
                />
                <DetailRow
                  label={t("user.detail.start_date")}
                  value={data.startDate?.slice(0, 10)}
                />
                <DetailRow
                  label={t("user.detail.employee_id")}
                  value={data.employeeId}
                />
                <DetailRow
                  label={t("user.detail.employee_code")}
                  value={data.employeeCode}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={toggling}
                  onClick={handleToggleStatus}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                    isActive
                      ? "text-red-500 hover:bg-red-50 hover:text-red-700"
                      : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}>
                  {toggling
                    ? "…"
                    : isActive
                      ? t("user.disable")
                      : t("user.enable")}
                </button>
                <BaseButton
                  type="primary"
                  icon={<Pencil className="h-3.5 w-3.5" />}
                  onClick={handleEdit}
                  label="global.edit"
                />
              </div>
            </>
          ) : (
            /* ── Edit mode ── */
            <div className="space-y-3">
              {saveError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {saveError}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.name")}
                  </label>
                  <Input
                    value={editForm.fullName}
                    onChange={(e) => field("fullName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.detail.phone")}
                  </label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => field("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.detail.role")}
                  </label>
                  <Select
                    className="w-full"
                    value={editForm.roleCode}
                    onChange={(v) => field("roleCode", v)}
                    options={EDITABLE_ROLES.map((r) => ({
                      value: r,
                      label: ROLE_LABELS[r],
                    }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.invite.department_id")}
                  </label>
                  <Select
                    className="w-full"
                    allowClear
                    value={editForm.departmentId || undefined}
                    onChange={(v) => field("departmentId", v ?? "")}
                    options={departments.map((d) => ({
                      value: d.departmentId,
                      label: d.name,
                    }))}
                    placeholder="—"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  {t("user.invite.manager_id")}
                </label>
                <ManagerPicker
                  value={editForm.managerUserId}
                  onChange={(id) => field("managerUserId", id)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.detail.job_title")}
                  </label>
                  <Input
                    value={editForm.jobTitle}
                    onChange={(e) => field("jobTitle", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.detail.work_location")}
                  </label>
                  <Input
                    value={editForm.workLocation}
                    onChange={(e) => field("workLocation", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  {t("user.detail.start_date")}
                </label>
                <DatePicker
                  className="w-full"
                  value={editForm.startDate ? dayjs(editForm.startDate) : null}
                  onChange={(d) =>
                    field("startDate", d ? d.format("YYYY-MM-DD") : "")
                  }
                  format="DD/MM/YYYY"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <BaseButton
                  htmlType="button"
                  onClick={handleCancelEdit}
                  label="global.cancel"
                />
                <BaseButton
                  type="primary"
                  htmlType="button"
                  disabled={saving}
                  onClick={handleSave}
                  label={saving ? "user.saving" : "global.save"}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">
          {t("user.error.load_failed")}
        </p>
      )}
    </BaseModal>
  );
}
