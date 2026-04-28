import React from "react";
import { Tag } from "antd";

export type ApprovalStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

const APPROVAL_CONFIG: Record<ApprovalStatus, { color: string; label: string }> = {
  NONE: { color: "default", label: "Không cần duyệt" },
  PENDING: { color: "warning", label: "Chờ duyệt" },
  APPROVED: { color: "success", label: "Đã duyệt" },
  REJECTED: { color: "error", label: "Từ chối" },
};

interface Props {
  status: string;
}

export const ApprovalStatusBadge: React.FC<Props> = ({ status }) => {
  const config = APPROVAL_CONFIG[status as ApprovalStatus] ?? {
    color: "default",
    label: status,
  };
  return <Tag color={config.color}>{config.label}</Tag>;
};
