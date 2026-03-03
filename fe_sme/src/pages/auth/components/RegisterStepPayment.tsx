import { StripeProvider } from "@/components/payment/StripeProvider";
import { CheckoutForm } from "@/components/payment/CheckoutForm";

interface RegisterStepPaymentProps {
  clientSecret: string;
  invoiceId: string;
  amount: string;
  onError: (message: string) => void;
}

const isValidStripeSecret = (s: string) =>
  s.startsWith("pi_") &&
  s.includes("_secret_") &&
  !s.toLowerCase().includes("mock");

export function RegisterStepPayment({
  clientSecret,
  invoiceId,
  amount,
  onError,
}: RegisterStepPaymentProps) {
  const returnUrl = `${window.location.origin}/billing/payment/confirmation`;

  if (!isValidStripeSecret(clientSecret)) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-4 text-sm text-amber-700 text-center">
        Payment is not configured for this invoice. Please contact support or
        check your invoices later.
      </div>
    );
  }

  return (
    <StripeProvider clientSecret={clientSecret}>
      <CheckoutForm
        amount={amount}
        invoiceId={invoiceId}
        returnUrl={returnUrl}
        onError={onError}
      />
    </StripeProvider>
  );
}
