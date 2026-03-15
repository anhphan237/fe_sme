import { Card, Progress } from "antd";
import { useLocale } from "@/i18n";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { InstanceStatusBadge } from "../InstanceStatusBadge";
import type { OnboardingInstance, User } from "@/shared/types";

interface InfoCardProps {
  instance: OnboardingInstance;
  template?: { name?: string; description?: string };
  employeeDisplayName: string;
  employeeDisplayEmail: string | null;
  employee?: User;
  managerDisplayName: string;
  completedCount: number;
  totalTasks: number;
  progressPercent: number;
}

export const InfoCard = ({
  instance,
  template,
  employeeDisplayName,
  employeeDisplayEmail,
  employee,
  managerDisplayName,
  completedCount,
  totalTasks,
  progressPercent,
}: InfoCardProps) => {
  const { t } = useLocale();
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.template")}
          </p>
          <p className="font-semibold">{template?.name ?? "-"}</p>
          {template?.description && (
            <p className="line-clamp-2 text-sm text-muted">
              {template.description}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.status")}
          </p>
          <InstanceStatusBadge status={instance.status} />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.start_date")}
          </p>
          <p className="font-medium">{instance.startDate || "-"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.progress")}
          </p>
          <Progress percent={progressPercent} showInfo={false} size="small" />
          <p className="text-sm text-muted">
            {t("onboarding.detail.info.tasks_summary", {
              completed: completedCount,
              total: totalTasks,
            })}
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 border-t border-stroke pt-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.employee")}
          </p>
          <p className="font-semibold">{employeeDisplayName}</p>
          {employeeDisplayEmail && (
            <p className="text-sm text-muted">{employeeDisplayEmail}</p>
          )}
          {employee && (
            <p className="text-sm text-muted">
              {ROLE_LABELS[getPrimaryRole(employee.roles)]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted">
            {t("onboarding.detail.info.manager")}
          </p>
          <p className="font-medium">{managerDisplayName}</p>
        </div>
      </div>
    </Card>
  );
};
