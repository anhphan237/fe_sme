import type { ReactNode } from "react";
import { Card, Progress, Tag, Tooltip } from "antd";
import { Briefcase, Calendar, CheckCircle2, MapPin, User2 } from "lucide-react";
import { useLocale } from "@/i18n";
import { InstanceStatusBadge } from "../../InstanceStatusBadge";
import type { OnboardingInstance, UserDetail } from "@/shared/types";

interface InfoCardProps {
  instance: OnboardingInstance;
  template?: { name?: string; description?: string };
  employeeDisplayName: string;
  employeeDisplayEmail: string | null;
  employeeDetail?: UserDetail;
  managerDisplayName: string;
  completedCount: number;
  totalTasks: number;
  progressPercent: number;
}

/** Build 2-letter initials from a display name */
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

/** Hue derived from name string for consistent avatar color */
const getAvatarHue = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
};

export const InfoCard = ({
  instance,
  template,
  employeeDisplayName,
  employeeDisplayEmail,
  employeeDetail,
  managerDisplayName,
  completedCount,
  totalTasks,
  progressPercent,
}: InfoCardProps) => {
  const { t } = useLocale();

  const initials =
    employeeDisplayName !== "-" ? getInitials(employeeDisplayName) : "?";
  const hue = getAvatarHue(employeeDisplayName);
  const avatarBg = `hsl(${hue}, 55%, 55%)`;

  const jobTitle = employeeDetail?.jobTitle ?? null;
  const workLocation = employeeDetail?.workLocation ?? null;

  return (
    <Card className="overflow-hidden p-0">
      {/* ── Hero row ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:gap-6">
        {/* Avatar */}
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
          style={{ background: avatarBg }}
          aria-hidden="true">
          {initials}
        </div>

        {/* Employee meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <h2 className="text-lg font-semibold leading-tight text-gray-900">
              {employeeDisplayName !== "-"
                ? employeeDisplayName
                : t("onboarding.detail.title_fallback")}
            </h2>
            <InstanceStatusBadge status={instance.status} />
          </div>

          {employeeDisplayEmail && (
            <p className="mt-0.5 text-sm text-gray-500">
              {employeeDisplayEmail}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {jobTitle && (
              <Tooltip title={t("onboarding.detail.info.employee_title")}>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                  {jobTitle}
                </span>
              </Tooltip>
            )}
            {workLocation && (
              <Tooltip title={t("onboarding.detail.info.work_location")}>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {workLocation}
                </span>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Right: template + task summary */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {template?.name && (
            <Tag
              icon={<span className="mr-1 text-[10px]">📋</span>}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              color="blue">
              {template.name}
            </Tag>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {completedCount}/{totalTasks}{" "}
            {t("onboarding.detail.info.tasks_label")}
          </span>
        </div>
      </div>

      {/* ── Metrics row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-y divide-stroke border-t border-stroke sm:grid-cols-4 sm:divide-y-0">
        {/* Start date */}
        <MetricCell
          label={t("onboarding.detail.info.start_date")}
          icon={<Calendar className="h-3.5 w-3.5 text-blue-400" />}>
          <span className="text-sm font-medium text-gray-800">
            {instance.startDate || "-"}
          </span>
        </MetricCell>

        {/* Template description */}
        <MetricCell
          label={t("onboarding.detail.info.template")}
          icon={<span className="text-xs">📋</span>}>
          <span className="line-clamp-1 text-sm font-medium text-gray-800">
            {template?.name ?? "-"}
          </span>
          {template?.description && (
            <Tooltip title={template.description}>
              <span className="line-clamp-1 cursor-help text-xs text-gray-400">
                {template.description}
              </span>
            </Tooltip>
          )}
        </MetricCell>

        {/* Manager */}
        <MetricCell
          label={t("onboarding.detail.info.manager")}
          icon={<User2 className="h-3.5 w-3.5 text-purple-400" />}>
          <span className="text-sm font-medium text-gray-800">
            {managerDisplayName}
          </span>
        </MetricCell>

        {/* Progress */}
        <MetricCell
          label={t("onboarding.detail.info.progress")}
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}>
          <div className="flex items-center gap-2">
            <Progress
              percent={progressPercent}
              size="small"
              showInfo={false}
              strokeColor={
                progressPercent >= 100
                  ? "#10b981"
                  : { "0%": "#3b82f6", "100%": "#6366f1" }
              }
              className="flex-1"
            />
            <span className="shrink-0 text-xs font-semibold text-gray-600">
              {progressPercent}%
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            {completedCount}/{totalTasks}{" "}
            {t("onboarding.detail.info.tasks_label")}
          </p>
        </MetricCell>
      </div>
    </Card>
  );
};

const MetricCell = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5 px-5 py-4">
    <div className="flex items-center gap-1.5">
      {icon}
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
    </div>
    <div>{children}</div>
  </div>
);
