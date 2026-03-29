import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, Skeleton } from "antd";
import BaseButton from "@/components/button";
import { StripeProvider } from "../../components/payment/StripeProvider";
import { CheckoutForm } from "../../components/payment/CheckoutForm";
import { useMutation } from "@tanstack/react-query";
import { apiCreatePaymentIntent } from "@/api/billing/billing.api";
import { isValidStripeSecret } from "@/lib/stripe";
import { notify } from "@/utils/notify";
import { useLocale } from "@/i18n";

const BillingCheckout = () => {
  const { t } = useLocale();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const createIntent = useMutation({ mutationFn: apiCreatePaymentIntent });
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const amount = searchParams.get("amount") ?? "$0.00";
  const from = searchParams.get("from");

  useEffect(() => {
    if (!invoiceId) return;
    createIntent.mutate(invoiceId, {
      onSuccess: (data) => {
        const secret =
          (data as { clientSecret?: string })?.clientSecret ?? null;
        setClientSecret(secret);
      },
      onError: (err) => {
        notify.error(t("billing.checkout.no_session") + ` (${err.message})`);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const returnUrl = `${window.location.origin}/billing/payment/confirmation?invoiceId=${encodeURIComponent(invoiceId ?? "")}${from ? `&from=${encodeURIComponent(from)}` : ""}`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800">
          {t("billing.checkout.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("billing.checkout.complete").replace("{id}", invoiceId ?? "")}
        </p>
      </div>

      <Card>
        {createIntent.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-40" />
            <Skeleton className="h-10" />
          </div>
        ) : createIntent.isError ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-red-600">
              {t("billing.checkout.no_session")}
            </p>
            <BaseButton onClick={() => navigate("/billing/invoices")}>
              {t("billing.checkout.back")}
            </BaseButton>
          </div>
        ) : clientSecret && isValidStripeSecret(clientSecret) ? (
          <StripeProvider clientSecret={clientSecret}>
            <CheckoutForm
              amount={amount}
              invoiceId={invoiceId ?? ""}
              returnUrl={returnUrl}
              onError={(msg) => notify.error(msg)}
            />
          </StripeProvider>
        ) : clientSecret ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-amber-600">
              {t("billing.checkout.not_configured")}
            </p>
            <BaseButton onClick={() => navigate("/billing/invoices")}>
              {t("billing.checkout.back")}
            </BaseButton>
          </div>
        ) : null}
      </Card>

      <div className="text-center">
        <BaseButton type="text" onClick={() => navigate("/billing/invoices")}>
          {t("billing.checkout.cancel")}
        </BaseButton>
      </div>
    </div>
  );
};

export default BillingCheckout;
