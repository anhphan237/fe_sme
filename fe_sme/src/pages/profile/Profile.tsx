import { useState, useEffect } from "react";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Button } from "@core/components/ui/Button";
import { Badge } from "@core/components/ui/Badge";
import { Skeleton } from "@core/components/ui/Skeleton";
import { useToast } from "@core/components/ui/Toast";
import { useUserStore } from "@/stores/user.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetUserById, apiUpdateUser } from "@/api/identity/identity.api";
import { mapUserDetail } from "@/utils/mappers/identity";

const useUserDetailQuery = (userId: string | undefined) =>
  useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res: any) => mapUserDetail(res),
  });
const useUpdateUser = () =>
  useMutation({
    mutationFn: (v: { id: string; name?: string; phone?: string }) =>
      apiUpdateUser({ userId: v.id, fullName: v.name, phone: v.phone }),
  });
import { ROLE_LABELS } from "../../shared/rbac";
import { User, Mail, Phone, Briefcase, MapPin, Calendar } from "lucide-react";

const Profile = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const setUser = useUserStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: detail, isLoading: detailLoading } = useUserDetailQuery(
    currentUser?.id,
  );
  const updateUser = useUpdateUser();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (detail && "fullName" in detail) {
      setFullName(detail.fullName ?? "");
      setPhone(detail.phone ?? "");
    } else if (currentUser) {
      setFullName(currentUser.name ?? "");
      setPhone("");
    }
  }, [currentUser, detail]);

  const handleSave = async () => {
    if (!currentUser?.id) return;
    try {
      const updated = await updateUser.mutateAsync({
        id: currentUser.id,
        name: fullName,
        phone,
      });
      setUser(updated);
      queryClient.invalidateQueries({
        queryKey: ["user-detail", currentUser.id],
      });
      toast("Profile updated.");
    } catch {
      toast("Failed to update profile.");
    }
  };

  const isDetail = detail && "userId" in detail;
  const primaryRole = currentUser?.roles?.length ? currentUser.roles[0] : null;
  const roleLabel = primaryRole ? ROLE_LABELS[primaryRole] : null;
  const initial = (currentUser?.name ?? currentUser?.email ?? "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Your personal details and work information."
      />

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
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Phone</span>
              <input
                className="mt-1 w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-ink focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </label>
          </div>
          <div className="mt-6">
            <Button
              onClick={handleSave}
              disabled={updateUser.isPending || !currentUser?.id}>
              {updateUser.isPending ? "Saving…" : "Save changes"}
            </Button>
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
              {(detail as any).jobTitle && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Job title
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {(detail as any).jobTitle}
                  </dd>
                </div>
              )}
              {(detail as any).departmentId && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Department ID
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {(detail as any).departmentId}
                  </dd>
                </div>
              )}
              {(detail as any).employeeId && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Employee ID
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {(detail as any).employeeId}
                  </dd>
                </div>
              )}
              {(detail as any).startDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted" />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Start date
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">
                      {(detail as any).startDate}
                    </dd>
                  </div>
                </div>
              )}
              {(detail as any).workLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted" />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Work location
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">
                      {(detail as any).workLocation}
                    </dd>
                  </div>
                </div>
              )}
              {(detail as any).managerUserId && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Manager user ID
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {(detail as any).managerUserId}
                  </dd>
                </div>
              )}
              {![
                (detail as any).jobTitle,
                (detail as any).departmentId,
                (detail as any).employeeId,
                (detail as any).startDate,
                (detail as any).workLocation,
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
