import { type FormEvent, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "antd";

interface CheckoutFormProps {
  amount: string;
  invoiceId: string;
  returnUrl: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export const CheckoutForm = ({
  amount,
  invoiceId,
  returnUrl,
  onSuccess,
  onError,
}: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      const msg = error.message ?? "An unexpected error occurred.";
      setErrorMessage(msg);
      onError?.(msg);
      setProcessing(false);
    } else {
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-stroke bg-slate-50 p-4">
        <div className="mb-1 text-sm text-muted">Invoice #{invoiceId}</div>
        <div className="text-2xl font-bold text-ink">{amount}</div>
      </div>

      <PaymentElement />

      {errorMessage && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <Button
        type="primary"
        htmlType="submit"
        disabled={!stripe || processing}
        block>
        {processing ? "Processing..." : `Pay ${amount}`}
      </Button>
    </form>
  );
};
