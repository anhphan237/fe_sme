import { useLocale } from "@/i18n";
import { Tag } from "antd";

export const COMMON_STATUS = {
  PENDING: 0,
  PROCESSING: 1,
  PROCESSED: 2,
} as const;
export type COMMON_STATUS = (typeof COMMON_STATUS)[keyof typeof COMMON_STATUS];

const StatusTag = ({
  value,
  className,
}: {
  value: COMMON_STATUS;
  className?: string;
}) => {
  const { t } = useLocale();

  const statusMap: Record<COMMON_STATUS, { label: string; color: string }> = {
    [COMMON_STATUS.PENDING]: {
      label: t("global.status.pending"),
      color: "bg-gray-500",
    },
    [COMMON_STATUS.PROCESSING]: {
      label: t("global.status.processing"),
      color: "bg-yellow-500",
    },
    [COMMON_STATUS.PROCESSED]: {
      label: t("global.status.processed"),
      color: "bg-green-500",
    },
  };

  const status = statusMap[value];
  if (!status) return null;

  return (
    <Tag
      className={`inline-flex items-center px-2 py-1 text-xs font-medium text-white rounded ${status.color} ${className ?? ""}`}>
      {status.label}
    </Tag>
  );
};

export default StatusTag;

// ── User account status tag ──────────────────────────────────────────────────

const USER_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  INVITED: "bg-amber-500",
  INACTIVE: "bg-slate-400",
  DISABLED: "bg-red-500",
};

export const UserStatusTag = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => {
  const { t } = useLocale();
  const upper = status.toUpperCase();
  const color = USER_STATUS_COLOR[upper] ?? "bg-slate-400";
  return (
    <Tag
      className={`inline-flex items-center px-2 py-1 text-xs font-medium text-white rounded ${color} ${className ?? ""}`}>
      {t(`user.status.${status.toLowerCase()}`)}
    </Tag>
  );
};
