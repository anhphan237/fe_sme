import { Card, Skeleton } from "antd";
import BaseButton from "@/components/button";
import { notify } from "@/utils/notify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetPaymentProviders,
  apiConnectPayment,
  apiCreatePaymentIntent,
} from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapProvider } from "@/utils/mappers/billing";
import type { PaymentProvider } from "@/shared/types";

const usePaymentProvidersQuery = () =>
  useQuery({
    queryKey: ["payment-providers"],
    queryFn: apiGetPaymentProviders,
    select: (res: unknown) =>
      extractList(res, "providers", "items").map(
        mapProvider,
      ) as PaymentProvider[],
  });
const useConnectPayment = () => useMutation({ mutationFn: apiConnectPayment });
const useCreatePaymentIntent = () =>
  useMutation({ mutationFn: apiCreatePaymentIntent });

const PROVIDER_ICONS: Record<string, string> = {
  Stripe: "S",
  MoMo: "M",
  ZaloPay: "Z",
  VNPay: "V",
};

const BillingPayment = () => {
  const {
    data: providers,
    isLoading,
    isError,
    refetch,
  } = usePaymentProvidersQuery();
  const connectPayment = useConnectPayment();
  const testCharge = useCreatePaymentIntent();
  const queryClient = useQueryClient();

  const handleToggle = (providerName: string) => {
    connectPayment.mutate(
      { provider: providerName },
      {
        onSuccess: () => {
          notify.success(`${providerName} connection updated.`);
          queryClient.invalidateQueries({ queryKey: ["payment-providers"] });
        },
        onError: (err) => {
          notify.error(`Failed to update ${providerName}: ${err.message}`);
        },
      },
    );
  };

  const handleTestCharge = (providerName: string) => {
    testCharge.mutate("test-charge", {
      onSuccess: () =>
        notify.success(`${providerName} test charge created successfully.`),
      onError: (err) =>
        notify.error(`${providerName} test charge failed: ${err.message}`),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Payment Providers
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Connect and manage payment providers for billing.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-9 w-24" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <p className="text-sm">
            Failed to load payment providers.{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {providers?.map((provider) => (
            <Card key={provider.name}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-lg font-bold text-brand">
                  {PROVIDER_ICONS[provider.name] ?? provider.name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{provider.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={
                        provider.status === "Connected"
                          ? "inline-block h-2 w-2 rounded-full bg-green-500"
                          : "inline-block h-2 w-2 rounded-full bg-slate-300"
                      }
                    />
                    <span className="text-sm text-muted">
                      {provider.status}
                    </span>
                  </div>
                  {provider.lastSync && provider.lastSync !== "—" && (
                    <p className="mt-0.5 text-xs text-muted">
                      Last sync: {provider.lastSync}
                    </p>
                  )}
                  {provider.accountId && (
                    <p className="mt-0.5 text-xs text-muted">
                      Account: {provider.accountId}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <BaseButton
                  type={provider.status === "Connected" ? "default" : "primary"}
                  danger={provider.status === "Connected"}
                  disabled={connectPayment.isPending}
                  onClick={() => handleToggle(provider.name)}>
                  {provider.status === "Connected" ? "Disconnect" : "Connect"}
                </BaseButton>
                {provider.status === "Connected" && (
                  <BaseButton
                    type="text"
                    disabled={testCharge.isPending}
                    onClick={() => handleTestCharge(provider.name)}>
                    {testCharge.isPending ? "Testing..." : "Test charge"}
                  </BaseButton>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingPayment;
