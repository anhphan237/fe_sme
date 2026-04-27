import React from "react";
import { Progress as AntProgress, Tooltip } from "antd";

interface Props {
  percent: number;
  /** Show numeric label beside bar */
  showLabel?: boolean;
  size?: "small" | "default";
  /** Highlight overdue in red when true */
  overdue?: boolean;
}

export const ProgressBar: React.FC<Props> = ({
  percent,
  showLabel = true,
  size = "default",
  overdue = false,
}) => {
  const strokeColor = overdue
    ? "#ff4d4f"
    : percent >= 100
      ? "#52c41a"
      : "#1677ff";

  return (
    <Tooltip title={`${percent}%`}>
      <AntProgress
        percent={Math.min(Math.max(percent, 0), 100)}
        size={size}
        strokeColor={strokeColor}
        showInfo={showLabel}
        format={(p) => `${p}%`}
      />
    </Tooltip>
  );
};
