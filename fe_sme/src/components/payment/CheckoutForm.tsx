import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "antd";
import { useLocale } from "@/i18n";

interface CheckoutFormProps {
  amount: string;
  invoiceId: string;
  returnUrl: string;
  /** Called when payment completes inline (no browser redirect). Provides the paymentIntentId. */
  onSuccess?: (data: { paymentIntentId: string }) => void;
  onError?: (message: string) => void;
  /** Set to false when the parent already renders its own order summary */
  showSummary?: boolean;
}

export const CheckoutForm = ({
  amount,
  invoiceId,
  returnUrl,
  onSuccess,
  onError,
  showSummary = true,
}: CheckoutFormProps) => {
  const { t } = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      // Only redirect when the payment method requires it (e.g. bank redirects).
      // For cards the payment resolves inline, avoiding a full page reload that
      // could break auth state after registration.
      redirect: "if_required",
    });

    const { error, paymentIntent } = result;

    if (error) {
      const msg = error.message ?? "An unexpected error occurred.";
      setErrorMessage(msg);
      onError?.(msg);
      setProcessing(false);
    } else if (paymentIntent) {
      // Payment completed inline — no browser redirect occurred.
      onSuccess?.({ paymentIntentId: paymentIntent.id });
      setProcessing(false);
    }
    // else: Stripe redirected the browser (bank redirect / 3DS) — nothing to do.
  };

  return (
    <div className="space-y-6">
      {showSummary && (
        <div className="rounded-2xl border border-stroke bg-slate-50 p-4">
          <div className="mb-1 text-sm text-muted">Invoice #{invoiceId}</div>
          <div className="text-2xl font-bold text-ink">{amount}</div>
        </div>
      )}

      <PaymentElement />

      {errorMessage && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <Button
        type="primary"
        onClick={handlePay}
        disabled={!stripe || processing}
        block>
        {processing
          ? t("billing.checkout.processing")
          : t("billing.checkout.pay", { amount })}
      </Button>
    </div>
  );
};
