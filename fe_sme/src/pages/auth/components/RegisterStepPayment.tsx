import { CreditCard, Package } from "lucide-react";
import { StripeProvider } from "@/components/payment/StripeProvider";
import { CheckoutForm } from "@/components/payment/CheckoutForm";
import { isValidStripeSecret } from "@/lib/stripe";

interface RegisterStepPaymentProps {
  clientSecret: string;
  invoiceId: string;
  amount: string;
  planName?: string;
  onError: (message: string) => void;
}

export const RegisterStepPayment = ({
  clientSecret,
  invoiceId,
  amount,
  planName,
  onError,
}: RegisterStepPaymentProps) => {
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
    <div className="flex flex-col gap-4">
      {/* Order summary */}
      <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-800">
              {planName ?? "Gói đăng ký"}
            </p>
            <p className="text-[11px] text-gray-400">Thanh toán một lần</p>
          </div>
        </div>
        <span className="text-[15px] font-bold text-gray-900 shrink-0">
          {amount}
        </span>
      </div>

      {/* Stripe payment form */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden p-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <CreditCard className="w-4 h-4 text-gray-400" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-gray-700">
            Thông tin thanh toán
          </span>
        </div>
        <StripeProvider clientSecret={clientSecret}>
          <CheckoutForm
            amount={amount}
            invoiceId={invoiceId}
            returnUrl={returnUrl}
            onError={onError}
            showSummary={false}
          />
        </StripeProvider>
      </div>
    </div>
  );
};
