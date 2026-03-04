import { useQuery } from "@tanstack/react-query";
import { Modal } from "../../../components/ui/Modal";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Badge } from "../../../components/ui/Badge";
import { clsx } from "clsx";
import { apiGetUserById } from "@/api/identity/identity.api";
import { mapUserDetail } from "@/utils/mappers/identity";
import { useLocale } from "@/i18n";
import type { UserDetail } from "@/shared/types";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INVITED: "bg-amber-50 text-amber-700",
  DISABLED: "bg-red-50 text-red-600",
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

function UserDetailContent({ detail }: { detail: UserDetail }) {
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
          {(detail.fullName?.[0] ?? detail.email?.[0] ?? "?").toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {detail.fullName}
          </p>
          <p className="text-sm text-slate-500">{detail.email}</p>
          <Badge
            className={clsx(
              "mt-1 text-xs",
              STATUS_STYLES[detail.status] ?? "bg-slate-100 text-slate-600",
            )}>
            {t(`user.status.${detail.status.toLowerCase()}`)}
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 px-4">
        <DetailRow label={t("user.detail.phone")} value={detail.phone} />
        <DetailRow
          label={t("user.detail.employee_id")}
          value={detail.employeeId}
        />
        <DetailRow
          label={t("user.detail.employee_code")}
          value={detail.employeeCode}
        />
        <DetailRow label={t("user.detail.job_title")} value={detail.jobTitle} />
        <DetailRow
          label={t("user.detail.department")}
          value={detail.departmentId}
        />
        <DetailRow
          label={t("user.detail.manager")}
          value={detail.managerUserId}
        />
        <DetailRow
          label={t("user.detail.start_date")}
          value={detail.startDate}
        />
        <DetailRow
          label={t("user.detail.work_location")}
          value={detail.workLocation}
        />
      </div>
    </div>
  );
}

export interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
}

export function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const { t } = useLocale();

  const { data, isLoading } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res) => mapUserDetail(res as Parameters<typeof mapUserDetail>[0]),
  });

  return (
    <Modal
      open={Boolean(userId)}
      title={t("user.detail.title")}
      onClose={onClose}>
      {isLoading ? (
        <div className="space-y-3 py-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ) : data ? (
        <UserDetailContent detail={data} />
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">
          {t("user.error.load_failed")}
        </p>
      )}
    </Modal>
  );
}
