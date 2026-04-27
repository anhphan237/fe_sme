import React from "react";
import { Tag } from "antd";

export type ScheduleStatus =
  | "UNSCHEDULED"
  | "PROPOSED"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "MISSED";

const SCHEDULE_CONFIG: Record<ScheduleStatus, { color: string; label: string }> = {
  UNSCHEDULED: { color: "default", label: "Chưa lên lịch" },
  PROPOSED: { color: "warning", label: "Đã đề xuất" },
  CONFIRMED: { color: "success", label: "Đã xác nhận" },
  RESCHEDULED: { color: "blue", label: "Đổi lịch" },
  CANCELLED: { color: "error", label: "Đã huỷ" },
  MISSED: { color: "volcano", label: "Không xuất hiện" },
};

interface Props {
  status: string;
}

export const ScheduleStatusBadge: React.FC<Props> = ({ status }) => {
  const config = SCHEDULE_CONFIG[status as ScheduleStatus] ?? {
    color: "default",
    label: status,
  };
  return <Tag color={config.color}>{config.label}</Tag>;
};
