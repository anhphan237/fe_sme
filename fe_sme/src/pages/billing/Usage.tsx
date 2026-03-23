import { Card, Progress, Skeleton } from "antd";
import { useQuery } from "@tanstack/react-query";
import { apiGetUsage } from "@/api/billing/billing.api";
import { mapUsage } from "@/utils/mappers/billing";
import { useLocale } from "@/i18n";

const BillingUsage = () => {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ["usage"],
    queryFn: () => apiGetUsage(),
    select: (res: unknown) => mapUsage(res),
  });

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
        <Skeleton className="h-40" />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {data?.map((metric) => (
              <Card key={metric.label}>
                <p className="text-sm text-muted">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {metric.used}/{metric.limit}
                </p>
                <div className="mt-3">
                  <Progress
                    percent={Math.round((metric.used / metric.limit) * 100)}
                    showInfo={false}
                  />
                </div>
              </Card>
            ))}
          </div>

          <Card className="border border-amber-200 bg-amber-50">
            <p className="text-sm font-semibold text-amber-700">
              {t("billing.usage.alert_title")}
            </p>
            <p className="text-sm text-amber-700">
              {t("billing.usage.alert_body")}
            </p>
          </Card>
        </>
      )}
    </div>
  );
};

export default BillingUsage;
