import { Alert, Card, Progress, Skeleton, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  Gauge,
  Sparkles,
  Users,
} from "lucide-react";
import { apiGetUsage } from "@/api/billing/billing.api";
import { formatBytes, mapUsage } from "@/utils/mappers/billing";
import { useLocale } from "@/i18n";
import type { UsageMetric } from "@/shared/types";

type UsageStatus = "OK" | "WARNING" | "EXCEEDED";

const isUnlimitedMetric = (metric: UsageMetric) =>
  Boolean(metric.unlimited) || !metric.limit || metric.limit <= 0;

const getMetricIcon = (key?: string) => {
  const normalizedKey = String(key ?? "").toLowerCase();

  if (normalizedKey.includes("employee")) return <Users className="h-5 w-5" />;
  if (normalizedKey.includes("onboarding")) return <Sparkles className="h-5 w-5" />;
  if (normalizedKey.includes("event")) return <CheckCircle2 className="h-5 w-5" />;
  if (normalizedKey.includes("document")) return <FileText className="h-5 w-5" />;
  if (normalizedKey.includes("storage")) return <Database className="h-5 w-5" />;

  return <Gauge className="h-5 w-5" />;
};

const getMetricI18nKey = (metric: UsageMetric) => {
  const key = String(metric.key ?? "").toLowerCase();

  if (key.includes("employee")) return "employee";
  if (key.includes("onboarding")) return "onboarding_template";
  if (key.includes("event")) return "event_template";
  if (key.includes("document")) return "document";
  if (key.includes("storage")) return "storage";

  return "unknown";
};

const getMetricLabel = (metric: UsageMetric, t: (key: string) => string) => {
  const key = getMetricI18nKey(metric);

  if (key === "unknown") return metric.label;

  return t(`billing.usage.metric.${key}`);
};

const getMetricDescription = (
  metric: UsageMetric,
  t: (key: string) => string,
) => {
  const key = getMetricI18nKey(metric);

  if (key === "unknown") return metric.description;

  return t(`billing.usage.metric.${key}.description`);
};

const getMetricStatus = (metric: UsageMetric): UsageStatus => {
  if (isUnlimitedMetric(metric)) return "OK";

  if (
    metric.status === "OK" ||
    metric.status === "WARNING" ||
    metric.status === "EXCEEDED"
  ) {
    return metric.status;
  }

  const percent = Math.round((metric.used / metric.limit) * 100);

  if (percent >= 100) return "EXCEEDED";
  if (percent >= 80) return "WARNING";

  return "OK";
};

const getMetricPercent = (metric: UsageMetric) => {
  if (isUnlimitedMetric(metric)) return 0;

  if (typeof metric.percent === "number") {
    return Math.min(100, Math.max(0, metric.percent));
  }

  if (typeof metric.limitPercent === "number") {
    return Math.min(100, Math.max(0, metric.limitPercent));
  }

  return Math.min(100, Math.round((metric.used / metric.limit) * 100));
};

const getProgressStatus = (
  metric: UsageMetric,
): "normal" | "exception" | "active" => {
  const status = getMetricStatus(metric);

  if (status === "EXCEEDED") return "exception";
  if (status === "WARNING") return "active";

  return "normal";
};

const formatMetricValue = (metric: UsageMetric, value: number) => {
  if (metric.unit === "bytes" || metric.key === "storage") {
    return formatBytes(value);
  }

  return new Intl.NumberFormat("vi-VN").format(value);
};

const formatMetricLimit = (
  metric: UsageMetric,
  t: (key: string) => string,
) => {
  if (isUnlimitedMetric(metric)) {
    return t("billing.usage.unlimited");
  }

  return formatMetricValue(metric, metric.limit);
};

const getStatusTag = (metric: UsageMetric, t: (key: string) => string) => {
  const status = getMetricStatus(metric);

  if (isUnlimitedMetric(metric)) {
    return <Tag color="blue">{t("billing.usage.unlimited")}</Tag>;
  }

  if (status === "EXCEEDED") {
    return <Tag color="red">{t("billing.usage.exceeded")}</Tag>;
  }

  if (status === "WARNING") {
    return <Tag color="orange">{t("billing.usage.warning")}</Tag>;
  }

  return <Tag color="green">{t("billing.usage.ok")}</Tag>;
};

const UsageMetricCard = ({
  metric,
  t,
}: {
  metric: UsageMetric;
  t: (key: string) => string;
}) => {
  const percent = getMetricPercent(metric);
  const label = getMetricLabel(metric, t);
  const description = getMetricDescription(metric, t);

  return (
    <Card className="h-full rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
            {getMetricIcon(metric.key)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-600">
              {label}
            </p>

            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatMetricValue(metric, metric.used)}
              <span className="ml-1 text-sm font-normal text-slate-500">
                / {formatMetricLimit(metric, t)}
              </span>
            </p>
          </div>
        </div>

        {getStatusTag(metric, t)}
      </div>

      <div className="mt-4">
        <Progress
          percent={percent}
          status={getProgressStatus(metric)}
          showInfo
        />
      </div>

      {description ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {description}
        </p>
      ) : null}

      {metric.month ? (
        <p className="mt-2 text-xs text-slate-400">
          {t("billing.usage.month")}: {metric.month}
        </p>
      ) : null}
    </Card>
  );
};

const UsageBarChart = ({
  metrics,
  t,
}: {
  metrics: UsageMetric[];
  t: (key: string) => string;
}) => {
  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span>{t("billing.usage.chart_title")}</span>
        </div>
      }
      className="rounded-2xl border border-slate-200 shadow-sm"
    >
      <div className="space-y-5">
        {metrics.map((metric) => {
          const percent = getMetricPercent(metric);
          const status = getMetricStatus(metric);
          const unlimited = isUnlimitedMetric(metric);
          const label = getMetricLabel(metric, t);

          return (
            <div key={metric.key || metric.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">{label}</span>

                <span className="text-slate-500">
                  {unlimited
                    ? `${formatMetricValue(metric, metric.used)} / ${t(
                        "billing.usage.unlimited",
                      )}`
                    : `${percent}%`}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={[
                    "h-full rounded-full transition-all",
                    status === "EXCEEDED"
                      ? "bg-red-500"
                      : status === "WARNING"
                        ? "bg-amber-500"
                        : "bg-blue-500",
                  ].join(" ")}
                  style={{
                    width: `${unlimited ? 0 : percent}%`,
                  }}
                />
              </div>

              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>
                  {formatMetricValue(metric, metric.used)}{" "}
                  {t("billing.usage.used")}
                </span>
                <span>{formatMetricLimit(metric, t)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const UsageHealthChart = ({
  metrics,
  t,
}: {
  metrics: UsageMetric[];
  t: (key: string) => string;
}) => {
  const limitedMetrics = metrics.filter((metric) => !isUnlimitedMetric(metric));

  const averagePercent =
    limitedMetrics.length === 0
      ? 0
      : Math.round(
          limitedMetrics.reduce(
            (total, metric) => total + getMetricPercent(metric),
            0,
          ) / limitedMetrics.length,
        );

  const okCount = metrics.filter((metric) => getMetricStatus(metric) === "OK")
    .length;

  const warningCount = metrics.filter(
    (metric) => getMetricStatus(metric) === "WARNING",
  ).length;

  const exceededCount = metrics.filter(
    (metric) => getMetricStatus(metric) === "EXCEEDED",
  ).length;

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          <span>{t("billing.usage.health_title")}</span>
        </div>
      }
      className="rounded-2xl border border-slate-200 shadow-sm"
    >
      <div className="flex flex-col items-center gap-5 md:flex-row">
        <Progress
          type="circle"
          percent={averagePercent}
          status={
            exceededCount > 0
              ? "exception"
              : warningCount > 0
                ? "active"
                : "normal"
          }
          size={132}
        />

        <div className="grid flex-1 grid-cols-3 gap-3">
          <div className="rounded-xl bg-green-50 p-3 text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
            <p className="mt-1 text-xl font-semibold text-green-700">
              {okCount}
            </p>
            <p className="text-xs text-green-700">{t("billing.usage.ok")}</p>
          </div>

          <div className="rounded-xl bg-amber-50 p-3 text-center">
            <AlertTriangle className="mx-auto h-5 w-5 text-amber-600" />
            <p className="mt-1 text-xl font-semibold text-amber-700">
              {warningCount}
            </p>
            <p className="text-xs text-amber-700">
              {t("billing.usage.warning")}
            </p>
          </div>

          <div className="rounded-xl bg-red-50 p-3 text-center">
            <AlertTriangle className="mx-auto h-5 w-5 text-red-600" />
            <p className="mt-1 text-xl font-semibold text-red-700">
              {exceededCount}
            </p>
            <p className="text-xs text-red-700">
              {t("billing.usage.exceeded")}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

const BillingUsage = () => {
  const { t } = useLocale();

  const { data = [], isLoading } = useQuery({
    queryKey: ["billing", "usage"],
    queryFn: () => apiGetUsage(),
    select: (res: unknown) => mapUsage(res),
  });

  const limitedMetrics = data.filter((metric) => !isUnlimitedMetric(metric));

  const exceededMetrics = limitedMetrics.filter(
    (metric) => getMetricStatus(metric) === "EXCEEDED",
  );

  const warningMetrics = limitedMetrics.filter(
    (metric) => getMetricStatus(metric) === "WARNING",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          {t("billing.usage.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("billing.usage.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton active className="h-40" />

          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="rounded-2xl">
                <Skeleton active />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {exceededMetrics.length > 0 ? (
            <Alert
              type="error"
              showIcon
              message={t("billing.usage.status_exceeded_title")}
              description={t("billing.usage.status_exceeded_desc")}
            />
          ) : warningMetrics.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message={t("billing.usage.status_warning_title")}
              description={t("billing.usage.status_warning_desc")}
            />
          ) : (
            <Alert
              type="success"
              showIcon
              message={t("billing.usage.status_ok_title")}
              description={t("billing.usage.status_ok_desc")}
            />
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {data.map((metric) => (
              <UsageMetricCard
                key={metric.key || metric.label}
                metric={metric}
                t={t}
              />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <UsageBarChart metrics={data} t={t} />
            <UsageHealthChart metrics={data} t={t} />
          </div>
        </>
      )}
    </div>
  );
};

export default BillingUsage;