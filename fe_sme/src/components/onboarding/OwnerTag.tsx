import React from "react";
import { Tag, Tooltip } from "antd";
import {
  User,
  Users,
  Briefcase,
  Code2,
  Shield,
  Building2,
} from "lucide-react";

export type OwnerType =
  | "EMPLOYEE"
  | "MANAGER"
  | "HR"
  | "IT_STAFF"
  | "DEPARTMENT"
  | "USER";

const OWNER_CONFIG: Record<
  OwnerType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  EMPLOYEE: { label: "Nhân viên", icon: <User size={12} />, color: "blue" },
  MANAGER: { label: "Quản lý", icon: <Users size={12} />, color: "purple" },
  HR: { label: "HR", icon: <Shield size={12} />, color: "green" },
  IT_STAFF: { label: "IT", icon: <Code2 size={12} />, color: "cyan" },
  DEPARTMENT: { label: "Phòng ban", icon: <Building2 size={12} />, color: "geekblue" },
  USER: { label: "Cụ thể", icon: <Briefcase size={12} />, color: "gold" },
};

interface Props {
  ownerType: string;
  /** Display name of the actual owner (userId/dept name) */
  ownerName?: string;
}

export const OwnerTag: React.FC<Props> = ({ ownerType, ownerName }) => {
  const config = OWNER_CONFIG[ownerType as OwnerType] ?? {
    label: ownerType,
    icon: <User size={12} />,
    color: "default",
  };

  const tag = (
    <Tag
      color={config.color}
      icon={config.icon}
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      {ownerName ?? config.label}
    </Tag>
  );

  if (ownerName && ownerName !== config.label) {
    return <Tooltip title={`Loại: ${config.label}`}>{tag}</Tooltip>;
  }
  return tag;
};
