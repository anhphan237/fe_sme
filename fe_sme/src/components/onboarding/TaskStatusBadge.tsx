import React from "react";
import { Tag } from "antd";

export type TaskStatus =
  | "TODO"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAIT_ACK"
  | "PENDING_APPROVAL"
  | "DONE"
  | "CANCELLED";

const STATUS_CONFIG: Record<
  TaskStatus,
  { color: string; label: string }
> = {
  TODO: { color: "default", label: "Chưa bắt đầu" },
  ASSIGNED: { color: "blue", label: "Đã phân công" },
  IN_PROGRESS: { color: "processing", label: "Đang thực hiện" },
  WAIT_ACK: { color: "warning", label: "Chờ xác nhận" },
  PENDING_APPROVAL: { color: "orange", label: "Chờ duyệt" },
  DONE: { color: "success", label: "Hoàn thành" },
  CANCELLED: { color: "error", label: "Đã huỷ" },
};

interface Props {
  status: string;
  size?: "small" | "default";
}

export const TaskStatusBadge: React.FC<Props> = ({ status }) => {
  const config = STATUS_CONFIG[status as TaskStatus] ?? {
    color: "default",
    label: status,
  };
  return <Tag color={config.color}>{config.label}</Tag>;
};
