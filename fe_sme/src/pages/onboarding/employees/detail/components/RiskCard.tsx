import React from "react";
import { Badge, Card, List, Typography } from "antd";
import {
  AlertTriangle,
  CheckSquare,
  Clock,
} from "lucide-react";
import type { OnboardingTask } from "@/shared/types";

interface RiskCardProps {
  tasks: OnboardingTask[];
  /** Called when user clicks an overdue/pending task to open its detail */
  onTaskClick?: (taskId: string) => void;
}

export const RiskCard: React.FC<RiskCardProps> = ({ tasks, onTaskClick }) => {
  const overdueTasks = tasks.filter(
    (t) => t.overdue && t.rawStatus !== "DONE" && t.rawStatus !== "CANCELLED",
  );

  const pendingApprovalTasks = tasks.filter(
    (t) => t.rawStatus === "PENDING_APPROVAL",
  );

  const scheduleMissedTasks = tasks.filter(
    (t) => t.scheduleStatus === "MISSED" || t.scheduleStatus === "CANCELLED",
  );

  const totalRisks =
    overdueTasks.length + pendingApprovalTasks.length + scheduleMissedTasks.length;

  if (totalRisks === 0) return null;

  return (
    <Card
      size="small"
      className="border-red-200 bg-red-50"
      title={
        <span className="flex items-center gap-2 text-sm font-semibold text-red-700">
          <AlertTriangle size={14} />
          Cảnh báo rủi ro
          <Badge count={totalRisks} size="small" />
        </span>
      }
    >
      {overdueTasks.length > 0 && (
        <div className="mb-2">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <Clock size={12} />
            Quá hạn ({overdueTasks.length})
          </div>
          <List
            size="small"
            dataSource={overdueTasks.slice(0, 3)}
            renderItem={(task) => (
              <List.Item
                className="cursor-pointer px-0 py-1 hover:text-blue-600"
                onClick={() => onTaskClick?.(task.id)}
              >
                <Typography.Text
                  ellipsis
                  style={{ fontSize: 12, maxWidth: "100%", color: "#b91c1c" }}
                >
                  {task.title}
                </Typography.Text>
              </List.Item>
            )}
          />
          {overdueTasks.length > 3 && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              +{overdueTasks.length - 3} task khác
            </Typography.Text>
          )}
        </div>
      )}

      {pendingApprovalTasks.length > 0 && (
        <div className="mb-2">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <CheckSquare size={12} />
            Chờ phê duyệt ({pendingApprovalTasks.length})
          </div>
          <List
            size="small"
            dataSource={pendingApprovalTasks.slice(0, 3)}
            renderItem={(task) => (
              <List.Item
                className="cursor-pointer px-0 py-1 hover:text-blue-600"
                onClick={() => onTaskClick?.(task.id)}
              >
                <Typography.Text
                  ellipsis
                  style={{ fontSize: 12, maxWidth: "100%", color: "#92400e" }}
                >
                  {task.title}
                </Typography.Text>
              </List.Item>
            )}
          />
          {pendingApprovalTasks.length > 3 && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              +{pendingApprovalTasks.length - 3} task khác
            </Typography.Text>
          )}
        </div>
      )}

      {scheduleMissedTasks.length > 0 && (
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-orange-600">
            <AlertTriangle size={12} />
            Lịch bị huỷ/vắng ({scheduleMissedTasks.length})
          </div>
          <List
            size="small"
            dataSource={scheduleMissedTasks.slice(0, 2)}
            renderItem={(task) => (
              <List.Item
                className="cursor-pointer px-0 py-1 hover:text-blue-600"
                onClick={() => onTaskClick?.(task.id)}
              >
                <Typography.Text
                  ellipsis
                  style={{ fontSize: 12, maxWidth: "100%", color: "#9a3412" }}
                >
                  {task.title}
                </Typography.Text>
              </List.Item>
            )}
          />
          {scheduleMissedTasks.length > 2 && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              +{scheduleMissedTasks.length - 2} task khác
            </Typography.Text>
          )}
        </div>
      )}
    </Card>
  );
};
