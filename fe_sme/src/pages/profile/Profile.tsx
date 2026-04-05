import { useMemo, useState } from "react";
import { Badge, Card, Skeleton } from "antd";
import BaseButton from "@/components/button";
import { useUserStore } from "@/stores/user.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetUserById, apiUpdateUser } from "@/api/identity/identity.api";
import { mapUserDetail } from "@/utils/mappers/identity";
import { notify } from "@/utils/notify";
import type { GetUserResponse } from "@/interface/identity";

const useUserDetailQuery = (userId: string | undefined) =>
  useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res: unknown) => mapUserDetail(res as GetUserResponse),
  });
const useUpdateUser = () =>
  useMutation({
    mutationFn: (v: { id: string; name?: string; phone?: string }) =>
      apiUpdateUser({ userId: v.id, fullName: v.name, phone: v.phone }),
  });
import { ROLE_LABELS } from "../../shared/rbac";
import { User, Mail, Briefcase, MapPin, Calendar } from "lucide-react";

const Profile = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const queryClient = useQueryClient();

  const { data: detail, isLoading: detailLoading } = useUserDetailQuery(
    currentUser?.id,
  );
  const updateUser = useUpdateUser();

  const [draft, setDraft] = useState<{
    fullName: string;
    phone: string;
  } | null>(null);

  const seed = useMemo(
    () => ({
      fullName: detail?.fullName ?? currentUser?.name ?? "",
      phone: detail?.phone ?? "",
    }),
    [detail?.fullName, detail?.phone, currentUser?.name],
  );

  const fullName = draft?.fullName ?? seed.fullName;
  const phone = draft?.phone ?? seed.phone;

  const handleSave = async () => {
    if (!currentUser?.id) return;
    try {
      await updateUser.mutateAsync({
        id: currentUser.id,
        name: fullName,
        phone,
      });
      setDraft(null);
      queryClient.invalidateQueries({
        queryKey: ["user-detail", currentUser.id],
      });
      notify.success("Profile updated.");
    } catch {
      notify.error("Failed to update profile.");
    }
  };

  const isDetail = Boolean(detail?.userId);
  const primaryRole = currentUser?.roles?.length ? currentUser.roles[0] : null;
  const roleLabel = primaryRole ? ROLE_LABELS[primaryRole] : null;
  const initial = (currentUser?.name ?? currentUser?.email ?? "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your personal details and work information.
        </p>
      </div>

      {/* Hero card: avatar + name + role */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 px-6 py-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-700 text-2xl font-semibold text-white shadow-md">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              {currentUser ? (
                <>
                  <h2 className="truncate text-xl font-semibold text-ink">
                    {currentUser.name || currentUser.email}
                  </h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roleLabel && <Badge>{roleLabel}</Badge>}
                    {currentUser.status && <Badge>{currentUser.status}</Badge>}
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="mt-2 h-4 w-64" />
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal – editable */}
        <Card>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <User className="h-4 w-4 text-muted" />
            Personal
          </h3>
          <p className="mt-1 text-sm text-muted">Information you can update.</p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="text-muted">Full name</span>
              <input
                className="mt-1 w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-ink focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={fullName}
                onChange={(e) =>
                  setDraft((prev) => ({
                    fullName: e.target.value,
                    phone: prev?.phone ?? seed.phone,
                  }))
                }
                placeholder="Your name"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Phone</span>
              <input
                className="mt-1 w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-ink focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={phone}
                onChange={(e) =>
                  setDraft((prev) => ({
                    fullName: prev?.fullName ?? seed.fullName,
                    phone: e.target.value,
                  }))
                }
                placeholder="Phone number"
              />
            </label>
          </div>
          <div className="mt-6">
            <BaseButton
              onClick={handleSave}
              disabled={updateUser.isPending || !currentUser?.id}>
              {updateUser.isPending ? "Saving…" : "Save changes"}
            </BaseButton>
          </div>
        </Card>

        {/* Work info – read-only from user.get */}
        <Card>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Briefcase className="h-4 w-4 text-muted" />
            Work
          </h3>
          <p className="mt-1 text-sm text-muted">From your employee record.</p>
          {detailLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isDetail ? (
            <dl className="mt-4 space-y-4">
              {detail?.jobTitle && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Job title
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {detail.jobTitle}
                  </dd>
                </div>
              )}
              {detail?.departmentId && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Department ID
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {detail.departmentId}
                  </dd>
                </div>
              )}
              {detail?.employeeId && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Employee ID
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {detail.employeeId}
                  </dd>
                </div>
              )}
              {detail?.startDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted" />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Start date
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">
                      {detail.startDate}
                    </dd>
                  </div>
                </div>
              )}
              {detail?.workLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted" />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Work location
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">
                      {detail.workLocation}
                    </dd>
                  </div>
                </div>
              )}
              {detail?.managerUserId && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Manager user ID
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {detail.managerUserId}
                  </dd>
                </div>
              )}
              {![
                detail?.jobTitle,
                detail?.departmentId,
                detail?.employeeId,
                detail?.startDate,
                detail?.workLocation,
              ].some(Boolean) && (
                <p className="text-sm text-muted">
                  No work details on file yet.
                </p>
              )}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Sign in to see work details.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Profile;
