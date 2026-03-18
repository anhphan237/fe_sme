import { Tag } from "antd";
import { useLocale } from "@/i18n";

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "success",
  COMPLETED: "default",
  CANCELLED: "warning",
};

const STATUS_I18N: Record<string, string> = {
  ACTIVE: "onboarding.status.active",
  COMPLETED: "onboarding.status.completed",
  CANCELLED: "onboarding.status.cancelled",
};

interface InstanceStatusBadgeProps {
  status: string;
}

export const InstanceStatusBadge = ({ status }: InstanceStatusBadgeProps) => {
  const { t } = useLocale();
  const key = status.toUpperCase();
  const color = STATUS_COLOR[key] ?? "default";
  const label = STATUS_I18N[key] ? t(STATUS_I18N[key]) : status;
  return <Tag color={color}>{label}</Tag>;
};
