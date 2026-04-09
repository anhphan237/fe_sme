import { useMemo, useState } from "react";
import { Skeleton, Tag } from "antd";
import BaseButton from "@/components/button";
import { useUserStore } from "@/stores/user.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetUserById, apiUpdateUser } from "@/api/identity/identity.api";
import { mapUserDetail } from "@/utils/mappers/identity";
import { notify } from "@/utils/notify";
import type { GetUserResponse } from "@/interface/identity";
import { ROLE_LABELS, getPrimaryRole } from "../../shared/rbac";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  Hash,
  Building2,
  UserCheck,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

// ── Queries / Mutations ────────────────────────────────────────────────────────

const useUserDetailQuery = (userId: string | undefined) =>
  useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res: unknown) => mapUserDetail(res as GetUserResponse),
  });

const useUpdateProfile = () =>
  useMutation({
    mutationFn: (v: {
      id: string;
      fullName: string;
      phone: string;
      email: string;
    }) =>
      apiUpdateUser({
        userId: v.id,
        fullName: v.fullName,
        phone: v.phone,
        email: v.email,
      }),
  });

const useChangePassword = () =>
  useMutation({
    mutationFn: (v: { id: string; newPassword: string }) =>
      apiUpdateUser({ userId: v.id, newPassword: v.newPassword }),
  });

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: "Đang hoạt động",  color: "#16a34a", bg: "#f0fdf4" },
  Active:   { label: "Đang hoạt động",  color: "#16a34a", bg: "#f0fdf4" },
  INACTIVE: { label: "Không hoạt động", color: "#d97706", bg: "#fffbeb" },
  Inactive: { label: "Không hoạt động", color: "#d97706", bg: "#fffbeb" },
  INVITED:  { label: "Chờ xác nhận",    color: "#2563eb", bg: "#eff6ff" },
  Invited:  { label: "Chờ xác nhận",    color: "#2563eb", bg: "#eff6ff" },
  DISABLED: { label: "Đã khóa",         color: "#dc2626", bg: "#fef2f2" },
};

const INPUT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400";

// ── Shared sub-components ──────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}
const InfoRow = ({ icon, label, value }: InfoRowProps) => (
  <div className="flex items-center gap-3 border-b border-slate-100 py-2 last:border-0">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      {icon}
    </span>
    <span className="w-28 shrink-0 text-xs text-slate-500">{label}</span>
    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
      {value || <span className="font-normal text-slate-400">—</span>}
    </span>
  </div>
);

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  suffix?: React.ReactNode;
}
const Field = ({ label, value, onChange, type = "text", placeholder, disabled, suffix }: FieldProps) => (
  <label className="block text-xs">
    <span className="mb-1 block text-slate-500">{label}</span>
    <div className="relative">
      <input
        type={type}
        className={INPUT_CLS + (suffix ? " pr-10" : "")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  </label>
);

// ── Main component ─────────────────────────────────────────────────────────────

const Profile = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const setUser = useUserStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const { data: detail, isLoading: detailLoading } = useUserDetailQuery(currentUser?.id);

  // Personal info state
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ fullName: string; phone: string; email: string } | null>(null);

  // Password state
  const changePassword = useChangePassword();
  const [pwEdit, setPwEdit] = useState(false);
  const [pwDraft, setPwDraft] = useState({ newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const seed = useMemo(
    () => ({
      fullName: detail?.fullName ?? currentUser?.name ?? "",
      phone:    detail?.phone    ?? "",
      email:    detail?.email    ?? currentUser?.email ?? "",
    }),
    [detail?.fullName, detail?.phone, detail?.email, currentUser?.name, currentUser?.email],
  );

  // ── Personal handlers ──────────────────────────────────────────────────────
  const handleEdit = () => {
    setDraft({ fullName: seed.fullName, phone: seed.phone, email: seed.email });
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(null);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!currentUser?.id || !draft) return;
    try {
      await updateProfile.mutateAsync({
        id:       currentUser.id,
        fullName: draft.fullName.trim(),
        phone:    draft.phone.trim(),
        email:    draft.email.trim(),
      });
      // Sync store & localStorage so TopBar name/email updates immediately
      if (currentUser) {
        const updated = {
          ...currentUser,
          name:  draft.fullName.trim() || currentUser.name,
          email: draft.email.trim()    || currentUser.email,
        };
        setUser(updated);
        localStorage.setItem("auth_user", JSON.stringify(updated));
      }
      setDraft(null);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["user-detail", currentUser.id] });
      notify.success("Cập nhật thông tin thành công.");
    } catch {
      notify.error("Cập nhật thất bại, vui lòng thử lại.");
    }
  };

  // ── Password handlers ──────────────────────────────────────────────────────
  const handlePwCancel = () => {
    setPwDraft({ newPassword: "", confirmPassword: "" });
    setPwError(null);
    setPwEdit(false);
  };

  const handlePwSave = async () => {
    if (!currentUser?.id) return;
    setPwError(null);
    if (pwDraft.newPassword.length < 6) {
      setPwError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (pwDraft.newPassword !== pwDraft.confirmPassword) {
      setPwError("Mật khẩu xác nhận không khớp.");
      return;
    }
    try {
      await changePassword.mutateAsync({ id: currentUser.id, newPassword: pwDraft.newPassword });
      setPwDraft({ newPassword: "", confirmPassword: "" });
      setPwEdit(false);
      notify.success("Đổi mật khẩu thành công.");
    } catch {
      notify.error("Đổi mật khẩu thất bại, vui lòng thử lại.");
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const primaryRole = currentUser?.roles?.length ? getPrimaryRole(currentUser.roles) : null;
  const roleLabel   = primaryRole ? ROLE_LABELS[primaryRole] : null;
  const initial     = (currentUser?.name ?? currentUser?.email ?? "?").charAt(0).toUpperCase();
  const statusCfg   = STATUS_CONFIG[detail?.status ?? currentUser?.status ?? ""] ?? STATUS_CONFIG["ACTIVE"];

  const d = draft ?? seed;

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      {/* ── Identity banner ────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white shadow">
          {initial}
        </div>
        {currentUser ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {currentUser.name || currentUser.email}
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Mail className="h-3 w-3 shrink-0" />
                {currentUser.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {detail?.employeeCode && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-px text-[11px] text-slate-500">
                  <Hash className="h-2.5 w-2.5" />{detail.employeeCode}
                </span>
              )}
              {roleLabel && (
                <Tag
                  style={{
                    margin: 0, fontSize: 11, lineHeight: "18px",
                    padding: "0 7px", borderRadius: 6,
                    background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8",
                  }}>
                  <Shield className="mr-1 inline h-2.5 w-2.5" />
                  {roleLabel}
                </Tag>
              )}
              <span
                className="inline-flex items-center rounded-md px-2 py-px text-[11px] font-medium"
                style={{
                  background: statusCfg.bg,
                  color: statusCfg.color,
                  border: `1px solid ${statusCfg.color}22`,
                }}>
                {statusCfg.label}
              </span>
            </div>
          </div>
        ) : (
          <Skeleton active paragraph={{ rows: 1 }} className="flex-1" />
        )}
      </div>

      {/* ── Main layout: left col (personal + password) | right col (work) ── */}
      <div className="grid gap-3 lg:grid-cols-[2fr_3fr]">
        {/* ── Left column ─────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Personal info (editable) */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Thông tin cá nhân</span>
              </div>
              {!editing ? (
                <button
                  onClick={handleEdit}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    onClick={handleCancel}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                    Hủy
                  </button>
                  <BaseButton
                    type="primary"
                    onClick={handleSave}
                    disabled={updateProfile.isPending || !currentUser?.id}
                    className="!h-auto !rounded-md !px-2.5 !py-1 !text-xs">
                    {updateProfile.isPending ? "Đang lưu…" : "Lưu"}
                  </BaseButton>
                </div>
              )}
            </div>
            <div className="px-3 py-2">
              {editing ? (
                <div className="space-y-2.5">
                  <Field
                    label="Họ và tên"
                    value={d.fullName}
                    onChange={(v) => setDraft((p) => ({ ...p!, fullName: v }))}
                    placeholder="Nhập họ và tên"
                  />
                  <Field
                    label="Email"
                    value={d.email}
                    onChange={(v) => setDraft((p) => ({ ...p!, email: v }))}
                    type="email"
                    placeholder="Nhập địa chỉ email"
                  />
                  <Field
                    label="Số điện thoại"
                    value={d.phone}
                    onChange={(v) => setDraft((p) => ({ ...p!, phone: v }))}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              ) : (
                <>
                  <InfoRow icon={<User className="h-3.5 w-3.5" />}  label="Họ và tên"  value={seed.fullName} />
                  <InfoRow icon={<Mail className="h-3.5 w-3.5" />}  label="Email"       value={seed.email} />
                  <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Điện thoại"  value={seed.phone || null} />
                </>
              )}
            </div>
          </div>

          {/* Change password */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Bảo mật</span>
              </div>
              {!pwEdit ? (
                <button
                  onClick={() => setPwEdit(true)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                  Đổi mật khẩu
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    onClick={handlePwCancel}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                    Hủy
                  </button>
                  <BaseButton
                    type="primary"
                    onClick={handlePwSave}
                    disabled={changePassword.isPending || !currentUser?.id}
                    className="!h-auto !rounded-md !px-2.5 !py-1 !text-xs">
                    {changePassword.isPending ? "Đang lưu…" : "Lưu"}
                  </BaseButton>
                </div>
              )}
            </div>
            <div className="px-3 py-2">
              {!pwEdit ? (
                <div className="flex items-center gap-3 py-1">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-700">Mật khẩu</p>
                    <p className="text-xs text-slate-400">••••••••</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Field
                    label="Mật khẩu mới"
                    type={showPw ? "text" : "password"}
                    value={pwDraft.newPassword}
                    onChange={(v) => { setPwDraft((p) => ({ ...p, newPassword: v })); setPwError(null); }}
                    placeholder="Tối thiểu 6 ký tự"
                    suffix={
                      <button type="button" onClick={() => setShowPw((s) => !s)} className="flex items-center">
                        {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    }
                  />
                  <Field
                    label="Xác nhận mật khẩu"
                    type={showConfirm ? "text" : "password"}
                    value={pwDraft.confirmPassword}
                    onChange={(v) => { setPwDraft((p) => ({ ...p, confirmPassword: v })); setPwError(null); }}
                    placeholder="Nhập lại mật khẩu"
                    suffix={
                      <button type="button" onClick={() => setShowConfirm((s) => !s)} className="flex items-center">
                        {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    }
                  />
                  {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: Work info ──────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Briefcase className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Thông tin công việc</span>
          </div>
          <div className="px-3 py-2">
            {detailLoading ? (
              <div className="space-y-2 py-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-lg bg-slate-100" />
                    <div className="h-3.5 flex-1 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <InfoRow icon={<Hash className="h-3.5 w-3.5" />}      label="Mã nhân viên"  value={detail?.employeeCode ?? detail?.employeeId?.toString()} />
                <InfoRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Chức danh"      value={detail?.jobTitle} />
                <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Phòng ban"      value={detail?.departmentId?.toString()} />
                <InfoRow icon={<Calendar className="h-3.5 w-3.5" />}  label="Ngày vào làm"   value={detail?.startDate ? new Date(detail.startDate).toLocaleDateString("vi-VN") : null} />
                <InfoRow icon={<MapPin className="h-3.5 w-3.5" />}    label="Địa điểm"       value={detail?.workLocation} />
                <InfoRow icon={<UserCheck className="h-3.5 w-3.5" />} label="Quản lý"        value={detail?.managerUserId ?? null} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
