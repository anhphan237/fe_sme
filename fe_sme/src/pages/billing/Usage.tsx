import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Progress } from "@core/components/ui/Progress";
import { useQuery } from "@tanstack/react-query";
import { apiGetUsage } from "@/api/billing/billing.api";
import { mapUsage } from "@/utils/mappers/billing";

const useUsageQuery = (month?: string) =>
  useQuery({
    queryKey: ["usage", month],
    queryFn: () => apiGetUsage(month),
    select: (res: any) => mapUsage(res),
  });
import { Skeleton } from "@core/components/ui/Skeleton";

const BillingUsage = () => {
  const { data, isLoading } = useUsageQuery();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage"
        subtitle="Track consumption against plan limits."
      />

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
                  <Progress value={(metric.used / metric.limit) * 100} />
                </div>
              </Card>
            ))}
          </div>

          <Card className="border border-amber-200 bg-amber-50">
            <p className="text-sm font-semibold text-amber-700">Usage alert</p>
            <p className="text-sm text-amber-700">
              You are at 86% of your onboarding limit. Consider upgrading.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">
              This month onboarded employees
            </h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-stroke pb-2 text-muted">
                <span>Employee</span>
                <span>Department</span>
                <span>Start date</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Leah Porter</span>
                <span>Sales</span>
                <span>2025-01-12</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Jin Park</span>
                <span>Engineering</span>
                <span>2025-01-14</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default BillingUsage;
