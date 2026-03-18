import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, Skeleton } from "antd";
import BaseButton from "@/components/button";
import { StripeProvider } from "../../components/payment/StripeProvider";
import { CheckoutForm } from "../../components/payment/CheckoutForm";
import { useMutation } from "@tanstack/react-query";
import { apiCreatePaymentIntent } from "@/api/billing/billing.api";

const useCreatePaymentIntent = () =>
  useMutation({ mutationFn: apiCreatePaymentIntent });
import { useEffect, useState } from "react";
import { notify } from "@/utils/notify";

const BillingCheckout = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const createIntent = useCreatePaymentIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const amount = searchParams.get("amount") ?? "$0.00";

  /** Stripe expects pi_xxx_secret_yyy. Reject mock/invalid values to avoid Elements crash. */
  const isValidStripeSecret = (s: string) =>
    s.startsWith("pi_") &&
    s.includes("_secret_") &&
    !s.toLowerCase().includes("mock");

  useEffect(() => {
    if (!invoiceId) return;
    createIntent.mutate(invoiceId, {
      onSuccess: (data) => {
        setClientSecret(data.clientSecret);
      },
      onError: (err) => {
        notify.error(`Failed to initialize payment: ${err.message}`);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const returnUrl = `${window.location.origin}/billing/payment/confirmation`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800">Checkout</h1>
        <p className="mt-1 text-sm text-slate-600">
          Complete payment for Invoice #{invoiceId}
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
              Could not create payment session. Please try again.
            </p>
            <BaseButton onClick={() => navigate("/billing/invoices")}>
              Back to Invoices
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
              Payment is not configured for this invoice. Contact support or try
              again later.
            </p>
            <BaseButton onClick={() => navigate("/billing/invoices")}>
              Back to Invoices
            </BaseButton>
          </div>
        ) : null}
      </Card>

      <div className="text-center">
        <BaseButton type="text" onClick={() => navigate("/billing/invoices")}>
          Cancel and return to Invoices
        </BaseButton>
      </div>
    </div>
  );
};

export default BillingCheckout;
