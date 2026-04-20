import { useState } from "react";
import { Card, Table, Tag, Select, DatePicker, Tabs, Skeleton } from "antd";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Cpu,
  HardDrive,
  Activity,
} from "lucide-react";
import dayjs from "dayjs";
import {
  apiGetSystemHealth,
  apiGetSystemErrorLog,
  apiGetSystemActivityLog,
  apiGetPlatformAdminAuditLog,
  apiGetPlatformMonitoringMetrics,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type {
  PlatformSystemErrorLogItem,
  PlatformSystemActivityLogItem,
  PlatformAdminAuditLogItem,
} from "@/interface/platform";

const { RangePicker } = DatePicker;

const DEFAULT_FROM = dayjs().subtract(7, "day").format("YYYY-MM-DD");
const DEFAULT_TO = dayjs().format("YYYY-MM-DD");

const SEVERITY_COLOR: Record<string, string> = {
  ERROR: "red",
  WARN: "orange",
  INFO: "blue",
};

const SEVERITY_LABEL_KEY: Record<string, string> = {
  ERROR: "platform.system.severity_error",
  WARN: "platform.system.severity_warn",
  INFO: "platform.system.severity_info",
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
  const [auditPage, setAuditPage] = useState(1);
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

  const monitoringQuery = useQuery({
    queryKey: ["platform-monitoring-metrics"],
    queryFn: () => apiGetPlatformMonitoringMetrics(),
    select: (res: any) => res?.data ?? res,
    refetchInterval: 15_000,
  });

  const errorLogQuery = useQuery({
    queryKey: ["platform-system-error-log", errorPage, severity, dateRange],
    queryFn: () =>
      apiGetSystemErrorLog({
        page: errorPage - 1,
        size: 20,
      }),
    select: (res: any) => res?.data ?? res,
  });

  const activityLogQuery = useQuery({
    queryKey: ["platform-system-activity-log", activityPage, dateRange],
    queryFn: () =>
      apiGetSystemActivityLog({
        page: activityPage - 1,
        size: 20,
      }),
    select: (res: any) => res?.data ?? res,
  });

  const auditLogQuery = useQuery({
    queryKey: ["platform-admin-audit-log", auditPage],
    queryFn: () =>
      apiGetPlatformAdminAuditLog({
        page: auditPage - 1,
        size: 20,
      }),
    select: (res: any) => res?.data ?? res,
  });

  const health = healthQuery.data as any;
  const mon = monitoringQuery.data as any;
  const errorLogs: PlatformSystemErrorLogItem[] =
    errorLogQuery.data?.items ?? [];
  const activityLogs: PlatformSystemActivityLogItem[] =
    activityLogQuery.data?.items ?? [];
  const auditLogs: PlatformAdminAuditLogItem[] =
    auditLogQuery.data?.items ?? [];

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
        <Tag color={SEVERITY_COLOR[v] ?? "default"}>
          {t(SEVERITY_LABEL_KEY[v] ?? v)}
        </Tag>
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
      dataIndex: "createdAt",
      key: "createdAt",
      render: (
        v: string,
        r: PlatformSystemErrorLogItem & { timestamp?: string },
      ) => {
        const timestamp = v ?? r.timestamp;
        return timestamp ? new Date(timestamp).toLocaleString() : "—";
      },
    },
  ];

  const activityColumns = [
    {
      title: t("platform.system.col_actor"),
      dataIndex: "userId",
      key: "userId",
      render: (
        v: string,
        r: PlatformSystemActivityLogItem & { actorId?: string },
      ) => v ?? r.actorId ?? "—",
    },
    {
      title: t("platform.system.col_action"),
      dataIndex: "action",
      key: "action",
    },
    {
      title: t("platform.system.col_resource"),
      dataIndex: "entityType",
      key: "entityType",
      render: (
        v: string,
        r: PlatformSystemActivityLogItem & { resource?: string },
      ) => v ?? r.resource ?? "—",
    },
    {
      title: t("platform.system.col_timestamp"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (
        v: string,
        r: PlatformSystemActivityLogItem & { timestamp?: string },
      ) => {
        const timestamp = v ?? r.timestamp;
        return timestamp ? new Date(timestamp).toLocaleString() : "—";
      },
    },
  ];

  const auditColumns = [
    {
      title: t("platform.system.col_admin"),
      dataIndex: "adminUserId",
      key: "adminUserId",
      ellipsis: true,
    },
    {
      title: t("platform.system.col_action"),
      dataIndex: "action",
      key: "action",
    },
    {
      title: t("platform.system.col_target"),
      key: "target",
      render: (r: PlatformAdminAuditLogItem) =>
        r.targetType ? `${r.targetType}:${r.targetId}` : r.targetId,
    },
    {
      title: t("platform.system.col_detail"),
      dataIndex: "detail",
      key: "detail",
      ellipsis: true,
    },
    {
      title: t("platform.system.col_timestamp"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => (v ? new Date(v).toLocaleString() : "—"),
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

      {/* Monitoring Metrics */}
      <Card
        title={
          <span className="text-sm font-semibold">
            {t("platform.system.monitoring_title")}
          </span>
        }>
        {monitoringQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : mon ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl bg-blue-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <HardDrive className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  {t("platform.system.used_memory")}
                </span>
              </div>
              <p className="text-lg font-bold text-blue-700">
                {mon.usedMemoryMb != null ? `${mon.usedMemoryMb} MB` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <HardDrive className="h-3.5 w-3.5 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">
                  {t("platform.system.heap_usage")}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-700">
                {mon.heapUsagePercent != null
                  ? `${Number(mon.heapUsagePercent).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <Cpu className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-medium text-violet-700">
                  {t("platform.system.cpu")}
                </span>
              </div>
              <p className="text-lg font-bold text-violet-700">
                {mon.cpuUsagePercent != null
                  ? `${Number(mon.cpuUsagePercent).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">
                  {t("platform.system.threads")}
                </span>
              </div>
              <p className="text-lg font-bold text-emerald-700">
                {mon.threadCount ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <span className="text-xs font-medium text-amber-700">
                {t("platform.system.max_memory")}
              </span>
              <p className="text-lg font-bold text-amber-700 mt-1">
                {mon.maxMemoryMb != null ? `${mon.maxMemoryMb} MB` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3">
              <span className="text-xs font-medium text-rose-700">
                {t("platform.system.cpus")}
              </span>
              <p className="text-lg font-bold text-rose-700 mt-1">
                {mon.availableProcessors ?? "—"}
              </p>
            </div>
          </div>
        ) : null}
      </Card>

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
                      {
                        value: "ERROR",
                        label: t("platform.system.severity_error"),
                      },
                      {
                        value: "WARN",
                        label: t("platform.system.severity_warn"),
                      },
                      {
                        value: "INFO",
                        label: t("platform.system.severity_info"),
                      },
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
                  rowKey={(
                    r: PlatformSystemActivityLogItem & { timestamp?: string },
                  ) =>
                    `${r.logId ?? "unknown"}-${r.createdAt ?? r.timestamp ?? "unknown"}`
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
          {
            key: "audit",
            label: t("platform.system.tab_audit"),
            children: (
              <Card>
                <Table
                  dataSource={auditLogs}
                  columns={auditColumns}
                  rowKey="logId"
                  loading={auditLogQuery.isLoading}
                  pagination={{
                    current: auditPage,
                    pageSize: 20,
                    total: auditLogQuery.data?.total ?? 0,
                    onChange: setAuditPage,
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
