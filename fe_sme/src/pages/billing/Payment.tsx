import { Card, Skeleton } from "antd";
import BaseButton from "@/components/button";
import { notify } from "@/utils/notify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  apiGetPaymentProviders,
  apiConnectPayment,
  apiCreatePaymentIntent,
} from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapProvider } from "@/utils/mappers/billing";
import { useLocale } from "@/i18n";
import type { PaymentProvider } from "@/shared/types";

const PROVIDER_ICONS: Record<string, string> = {
  Stripe: "S",
  MoMo: "M",
  ZaloPay: "Z",
  VNPay: "V",
};

const BillingPayment = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const invoiceAmount = searchParams.get("amount");
  const {
    data: providers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["payment-providers"],
    queryFn: apiGetPaymentProviders,
    select: (res: unknown) =>
      extractList(res, "providers", "items").map(
        mapProvider,
      ) as PaymentProvider[],
  });
  const connectPayment = useMutation({ mutationFn: apiConnectPayment });
  const testCharge = useMutation({ mutationFn: apiCreatePaymentIntent });
  const queryClient = useQueryClient();

  const handleToggle = (providerName: string) => {
    connectPayment.mutate(
      { provider: providerName },
      {
        onSuccess: () => {
          notify.success(
            t("billing.payment.connect_success").replace(
              "{name}",
              providerName,
            ),
          );
          queryClient.invalidateQueries({ queryKey: ["payment-providers"] });
        },
        onError: (err) => {
          notify.error(
            t("billing.payment.connect_error")
              .replace("{name}", providerName)
              .replace("{msg}", err.message),
          );
        },
      },
    );
  };

  const handleTestCharge = (providerName: string) => {
    testCharge.mutate("test-charge", {
      onSuccess: () =>
        notify.success(
          t("billing.payment.test_success").replace("{name}", providerName),
        ),
      onError: (err) =>
        notify.error(
          t("billing.payment.test_error")
            .replace("{name}", providerName)
            .replace("{msg}", err.message),
        ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("billing.payment.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {invoiceId
              ? t("billing.payment.subtitle_invoice").replace("{id}", invoiceId)
              : t("billing.payment.subtitle")}
          </p>
        </div>
        {invoiceId && (
          <BaseButton
            type="default"
            onClick={() => navigate("/billing/invoices")}>
            {t("billing.checkout.back")}
          </BaseButton>
        )}
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
            {t("billing.payment.load_error")}{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              {t("billing.invoices.retry")}
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
                      {t("billing.payment.last_sync")}: {provider.lastSync}
                    </p>
                  )}
                  {provider.accountId && (
                    <p className="mt-0.5 text-xs text-muted">
                      {t("billing.payment.account")}: {provider.accountId}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <BaseButton
                  type={provider.status === "Connected" ? "default" : "primary"}
                  danger={provider.status === "Connected"}
                  disabled={connectPayment.isPending}
                  onClick={() => handleToggle(provider.name)}>
                  {provider.status === "Connected"
                    ? t("billing.payment.disconnect")
                    : t("billing.payment.connect")}
                </BaseButton>
                {provider.status === "Connected" && (
                  <BaseButton
                    type="text"
                    disabled={testCharge.isPending}
                    onClick={() => handleTestCharge(provider.name)}>
                    {testCharge.isPending
                      ? t("billing.payment.testing")
                      : t("billing.payment.test_charge")}
                  </BaseButton>
                )}
                {invoiceId && provider.status === "Connected" && (
                  <BaseButton
                    type="primary"
                    onClick={() =>
                      navigate(
                        `/billing/checkout/${invoiceId}?amount=${encodeURIComponent(invoiceAmount ?? "")}`,
                      )
                    }>
                    {t("billing.pay_now")}
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
