import { useState } from "react";
import { Card, Table, Tag, Select, DatePicker, Tabs } from "antd";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import dayjs from "dayjs";
import {
  apiGetSystemHealth,
  apiGetSystemErrorLog,
  apiGetSystemActivityLog,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type {
  PlatformSystemErrorLogItem,
  PlatformSystemActivityLogItem,
} from "@/interface/platform";

const { RangePicker } = DatePicker;

const DEFAULT_FROM = dayjs().subtract(7, "day").format("YYYY-MM-DD");
const DEFAULT_TO = dayjs().format("YYYY-MM-DD");

const SEVERITY_COLOR: Record<string, string> = {
  ERROR: "red",
  WARN: "orange",
  INFO: "blue",
};

const HealthStatusIcon = ({
  status,
}: {
  status: "UP" | "DEGRADED" | "DOWN";
}) => {
  if (status === "UP")
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "DEGRADED")
    return <AlertCircle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-rose-500" />;
};

const PlatformSystem = () => {
  const { t } = useLocale();
  const [errorPage, setErrorPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [severity, setSeverity] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string]>([
    DEFAULT_FROM,
    DEFAULT_TO,
  ]);

  const healthQuery = useQuery({
    queryKey: ["platform-system-health"],
    queryFn: () => apiGetSystemHealth(),
    select: (res: any) => res?.data ?? res,
    refetchInterval: 30_000,
  });

  const errorLogQuery = useQuery({
    queryKey: ["platform-system-error-log", errorPage, severity, dateRange],
    queryFn: () =>
      apiGetSystemErrorLog({
        page: errorPage,
        pageSize: 20,
        severity,
        from: dateRange[0],
        to: dateRange[1],
      }),
    select: (res: any) => res?.data ?? res,
  });

  const activityLogQuery = useQuery({
    queryKey: ["platform-system-activity-log", activityPage, dateRange],
    queryFn: () =>
      apiGetSystemActivityLog({
        page: activityPage,
        pageSize: 20,
        from: dateRange[0],
        to: dateRange[1],
      }),
    select: (res: any) => res?.data ?? res,
  });

  const health = healthQuery.data as any;
  const errorLogs: PlatformSystemErrorLogItem[] =
    errorLogQuery.data?.items ?? [];
  const activityLogs: PlatformSystemActivityLogItem[] =
    activityLogQuery.data?.items ?? [];

  const overallStatusColor =
    health?.status === "UP"
      ? "border-l-4 border-emerald-400 bg-emerald-50"
      : health?.status === "DEGRADED"
        ? "border-l-4 border-amber-400 bg-amber-50"
        : "border-l-4 border-rose-400 bg-rose-50";

  const errorColumns = [
    {
      title: t("platform.system.col_severity"),
      dataIndex: "severity",
      key: "severity",
      render: (v: string) => (
        <Tag color={SEVERITY_COLOR[v] ?? "default"}>{v}</Tag>
      ),
    },
    {
      title: t("platform.system.col_message"),
      dataIndex: "message",
      key: "message",
      ellipsis: true,
    },
    {
      title: t("platform.system.col_timestamp"),
      dataIndex: "timestamp",
      key: "timestamp",
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  const activityColumns = [
    {
      title: t("platform.system.col_actor"),
      dataIndex: "actorId",
      key: "actorId",
    },
    {
      title: t("platform.system.col_action"),
      dataIndex: "action",
      key: "action",
    },
    {
      title: t("platform.system.col_resource"),
      dataIndex: "resource",
      key: "resource",
    },
    {
      title: t("platform.system.col_timestamp"),
      dataIndex: "timestamp",
      key: "timestamp",
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          {t("platform.system.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("platform.system.subtitle")}
        </p>
      </div>

      {/* System Health */}
      <Card
        title={
          <span className="text-sm font-semibold">
            {t("platform.system.health_title")}
          </span>
        }>
        {healthQuery.isLoading ? (
          <p className="text-sm text-slate-400">{t("global.loading")}</p>
        ) : health ? (
          <div className="space-y-4">
            <div
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${overallStatusColor}`}>
              <HealthStatusIcon status={health.status} />
              <span className="font-semibold text-slate-800">
                {t("platform.system.overall_status")}: {health.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {(health.services ?? []).map((svc: any) => (
                <div
                  key={svc.name}
                  className="flex items-center gap-2 rounded-xl border border-stroke px-3 py-2">
                  <HealthStatusIcon status={svc.status} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {svc.name}
                    </p>
                    {svc.latencyMs != null && (
                      <p className="text-xs text-slate-400">
                        {svc.latencyMs}ms
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {t("platform.system.health_unavailable")}
          </p>
        )}
      </Card>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">
          {t("platform.system.date_range")}
        </span>
        <RangePicker
          defaultValue={[dayjs(DEFAULT_FROM), dayjs(DEFAULT_TO)]}
          onChange={(_, strs) => {
            if (strs[0] && strs[1]) setDateRange([strs[0], strs[1]]);
          }}
        />
      </div>

      {/* Logs Tabs */}
      <Tabs
        items={[
          {
            key: "errors",
            label: t("platform.system.tab_errors"),
            children: (
              <Card>
                <div className="mb-4">
                  <Select
                    allowClear
                    placeholder={t("platform.system.filter_severity")}
                    style={{ width: 160 }}
                    value={severity}
                    onChange={(v) => {
                      setSeverity(v);
                      setErrorPage(1);
                    }}
                    options={[
                      { value: "ERROR", label: "Error" },
                      { value: "WARN", label: "Warning" },
                      { value: "INFO", label: "Info" },
                    ]}
                  />
                </div>
                <Table
                  dataSource={errorLogs}
                  columns={errorColumns}
                  rowKey="logId"
                  loading={errorLogQuery.isLoading}
                  pagination={{
                    current: errorPage,
                    pageSize: 20,
                    total: errorLogQuery.data?.total ?? 0,
                    onChange: setErrorPage,
                    showSizeChanger: false,
                  }}
                  expandable={{
                    expandedRowRender: (record: PlatformSystemErrorLogItem) =>
                      record.stackTrace ? (
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
                          {record.stackTrace}
                        </pre>
                      ) : null,
                    rowExpandable: (record: PlatformSystemErrorLogItem) =>
                      !!record.stackTrace,
                  }}
                />
              </Card>
            ),
          },
          {
            key: "activity",
            label: t("platform.system.tab_activity"),
            children: (
              <Card>
                <Table
                  dataSource={activityLogs}
                  columns={activityColumns}
                  rowKey={(r: PlatformSystemActivityLogItem) =>
                    `${r.actorId}-${r.timestamp}`
                  }
                  loading={activityLogQuery.isLoading}
                  pagination={{
                    current: activityPage,
                    pageSize: 20,
                    total: activityLogQuery.data?.total ?? 0,
                    onChange: setActivityPage,
                    showSizeChanger: false,
                  }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default PlatformSystem;
