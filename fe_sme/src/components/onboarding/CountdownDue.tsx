import React from "react";
import { Tag, Tooltip } from "antd";
import { Clock, AlertCircle } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface Props {
  dueDate?: string;
  dueInHours?: number;
  overdue?: boolean;
  dueCategory?: string;
}

export const CountdownDue: React.FC<Props> = ({
  dueDate,
  dueInHours,
  overdue,
  dueCategory,
}) => {
  if (!dueDate && dueInHours === undefined) return null;

  const isOverdue = overdue ?? (dueInHours !== undefined && dueInHours < 0);

  let label: string;
  if (isOverdue) {
    label = dueDate
      ? `Quá hạn ${dayjs().from(dayjs(dueDate), true)}`
      : "Quá hạn";
  } else if (dueInHours !== undefined) {
    if (dueInHours < 24) {
      label = `Còn ${Math.max(0, Math.round(dueInHours))} giờ`;
    } else {
      label = `Còn ${Math.round(dueInHours / 24)} ngày`;
    }
  } else if (dueCategory === "TODAY") {
    label = "Hôm nay";
  } else {
    label = dueDate ? `Hạn: ${dayjs(dueDate).format("DD/MM/YYYY")}` : "";
  }

  const title = dueDate ? dayjs(dueDate).format("DD/MM/YYYY HH:mm") : undefined;

  return (
    <Tooltip title={title}>
      <Tag
        color={isOverdue ? "error" : dueInHours !== undefined && dueInHours < 24 ? "warning" : "default"}
        icon={isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        {label}
      </Tag>
    </Tooltip>
  );
};
