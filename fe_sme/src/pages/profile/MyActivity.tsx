import { useState } from "react";
import {
  Typography,
  Timeline,
  Select,
  DatePicker,
  Card,
  Tag,
  Empty,
  Spin,
  Alert,
} from "antd";
import { Activity, Calendar, User, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useUserStore } from "@/stores/user.store";
import { apiGetSystemActivityLog } from "@/api/platform/platform.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import type { PlatformSystemActivityLogItem } from "@/interface/platform";
import type { UserListItem } from "@/interface/identity";
import { useLocale } from "@/i18n";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ── Action color map ─────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  ACTIVATE: "cyan",
  ARCHIVE: "orange",
  LOGIN: "purple",
  LOGOUT: "default",
  ASSIGN: "geekblue",
  APPROVE: "success",
  REJECT: "error",
  COMPLETE: "green",
  CANCEL: "volcano",
};

const getActionColor = (action: string): string => {
  const upper = action?.toUpperCase() ?? "";
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (upper.includes(key)) return color;
  }
  return "default";
};

// ── Queries ──────────────────────────────────────────────────────────────────

const useActivityLogQuery = (
  targetUserId: string | undefined,
  fromTime: string | undefined,
  toTime: string | undefined,
) =>
  useQuery({
    queryKey: ["my-activity", targetUserId, fromTime, toTime],
    queryFn: () =>
      apiGetSystemActivityLog({
        userId: targetUserId,
        fromTime,
        toTime,
        page: 0,
        size: 100,
      }),
    select: (res: unknown) => {
      const data = res as {
        items?: PlatformSystemActivityLogItem[];
        total?: number;
      };
      return data?.items ?? [];
    },
  });

const useUsersQuery = (enabled: boolean) =>
  useQuery({
    queryKey: ["users-list-for-activity"],
    queryFn: () => apiSearchUsers({ keyword: "" }),
    enabled,
    select: (res: unknown) => {
      const data = res as { users?: UserListItem[] } | UserListItem[];
      return Array.isArray(data) ? data : (data?.users ?? []);
    },
  });

// ── Main Component ────────────────────────────────────────────────────────────

export default function MyActivity() {
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const roles: string[] = useUserStore((s) => s.roles ?? []);

  const isManagementView =
    roles.includes("HR") ||
    roles.includes("MANAGER") ||
    roles.includes("ADMIN");

  const [targetUserId, setTargetUserId] = useState<string | undefined>(
    undefined,
  );
  const [dateRange, setDateRange] = useState<[string?, string?]>([
    undefined,
    undefined,
  ]);

  const { data: users = [] } = useUsersQuery(isManagementView);

  const { data: logs = [], isLoading } = useActivityLogQuery(
    targetUserId,
    dateRange[0],
    dateRange[1],
  );

  // Group logs by date
  const grouped = logs.reduce<Record<string, PlatformSystemActivityLogItem[]>>(
    (acc, item) => {
      const dateKey = dayjs(item.createdAt).format("YYYY-MM-DD");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    },
    {},
  );

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const userOptions = users.map((u: UserListItem) => ({
    value: u.userId,
    label: `${u.fullName} (${u.email})`,
  }));

  const viewingUser = targetUserId
    ? users.find((u: UserListItem) => u.userId === targetUserId)
    : null;
  const displayName = viewingUser
    ? viewingUser.fullName
    : (currentUser?.fullName ?? t("profile.me"));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-blue-500" />
        <Title level={4} className="!mb-0">
          {t("profile.myActivity")}
        </Title>
      </div>

      {/* Permission note for non-management */}
      {!isManagementView && (
        <Alert
          type="warning"
          showIcon
          message={t("profile.activityLimitedAccess")}
        />
      )}

      {/* Filters */}
      <Card size="small">
        <div className="flex flex-wrap gap-3">
          {/* User picker — HR / MANAGER / ADMIN only */}
          {isManagementView && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <Select
                placeholder={t("profile.viewActivityOf")}
                value={targetUserId}
                onChange={(v) => setTargetUserId(v ?? undefined)}
                options={userOptions}
                allowClear
                showSearch
                filterOption={(input, opt) =>
                  (opt?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                style={{ minWidth: 220 }}
                size="small"
              />
            </div>
          )}

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <RangePicker
              size="small"
              value={
                dateRange[0]
                  ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                  : undefined
              }
              onChange={(vals) => {
                if (!vals) {
                  setDateRange([undefined, undefined]);
                } else {
                  setDateRange([
                    vals[0]?.toISOString(),
                    vals[1]?.toISOString(),
                  ]);
                }
              }}
            />
          </div>
        </div>
      </Card>

      {/* Activity timeline */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Text type="secondary">
            {t("profile.activityOf")}: <strong>{displayName}</strong>
          </Text>
          {logs.length > 0 && (
            <Text type="secondary" className="text-xs">
              {logs.length} {t("profile.events")}
            </Text>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : logs.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-8 w-8 text-gray-300" />
                <Text type="secondary">{t("profile.noActivityFound")}</Text>
              </div>
            }
          />
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                {/* Date header */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <Text type="secondary" className="text-xs font-medium">
                    {dayjs(dateKey).format("ddd, D MMM YYYY")}
                  </Text>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                {/* Timeline for this date */}
                <Timeline
                  mode="left"
                  items={grouped[dateKey].map((log) => ({
                    key: log.logId,
                    color: getActionColor(log.action),
                    label: (
                      <Text type="secondary" className="text-xs">
                        {dayjs(log.createdAt).format("HH:mm")}
                      </Text>
                    ),
                    children: (
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag
                            color={getActionColor(log.action)}
                            className="text-xs">
                            {log.action}
                          </Tag>
                          {log.entityType && (
                            <Tag className="text-xs" color="default">
                              {log.entityType}
                            </Tag>
                          )}
                        </div>
                        {log.detail && (
                          <Text className="text-sm text-gray-600">
                            {log.detail}
                          </Text>
                        )}
                        {log.entityId && (
                          <Text type="secondary" className="text-xs">
                            ID: {log.entityId}
                          </Text>
                        )}
                        <Text type="secondary" className="block text-xs">
                          {dayjs(log.createdAt).fromNow()}
                        </Text>
                      </div>
                    ),
                  }))}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
