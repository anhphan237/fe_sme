import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Badge } from "../../../components/ui/Badge";
import { useToast } from "../../../components/ui/Toast";
import {
  apiGetUserById,
  apiUpdateUser,
  apiAssignRole,
  apiRevokeRole,
  apiDisableUser,
} from "@/api/identity/identity.api";
import { mapUserDetail } from "@/utils/mappers/identity";
import { useLocale } from "@/i18n";
import { statusVariant } from "../shared";
import { ManagerPicker } from "./ManagerPicker";
import { getPrimaryRole, ROLE_LABELS } from "@/shared/rbac";
import { useUsersQuery, useDepartmentsQuery } from "../hooks";
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
    <Modal
      open={Boolean(userId)}
      title={
        mode === "edit" ? t("user.detail.edit_title") : t("user.detail.title")
      }
      onClose={onClose}>
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
                <Button variant="primary" onClick={handleEdit}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  {t("global.edit")}
                </Button>
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
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => field("fullName", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.detail.phone")}
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => field("phone", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.detail.role")}
                  </label>
                  <select
                    value={editForm.roleCode}
                    onChange={(e) => field("roleCode", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                    {EDITABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.invite.department_id")}
                  </label>
                  <select
                    value={editForm.departmentId}
                    onChange={(e) => field("departmentId", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                    <option value="">—</option>
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.name}
                      </option>
                    ))}
                  </select>
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
                  <input
                    type="text"
                    value={editForm.jobTitle}
                    onChange={(e) => field("jobTitle", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t("user.detail.work_location")}
                  </label>
                  <input
                    type="text"
                    value={editForm.workLocation}
                    onChange={(e) => field("workLocation", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  {t("user.detail.start_date")}
                </label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => field("startDate", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}>
                  {t("global.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={saving}
                  onClick={handleSave}>
                  {saving ? t("user.saving") : t("global.save")}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">
          {t("user.error.load_failed")}
        </p>
      )}
    </Modal>
  );
}
