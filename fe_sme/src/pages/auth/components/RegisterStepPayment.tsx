import { CreditCard, Package, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StripeProvider } from "@/components/payment/StripeProvider";
import { CheckoutForm } from "@/components/payment/CheckoutForm";
import { isValidStripeSecret } from "@/lib/stripe";
import { useLocale } from "@/i18n";

interface RegisterStepPaymentProps {
  clientSecret: string;
  invoiceId: string;
  amount: string;
  planName?: string;
  billingCycle?: "MONTHLY" | "YEARLY";
  onError: (message: string) => void;
}

export const RegisterStepPayment = ({
  clientSecret,
  invoiceId,
  amount,
  planName,
  billingCycle,
  onError,
}: RegisterStepPaymentProps) => {
  const navigate = useNavigate();
  const { t } = useLocale();

  const returnUrl = `${window.location.origin}/billing/payment/confirmation?from=register&invoiceId=${encodeURIComponent(invoiceId)}`;

  const cycleLabel =
    billingCycle === "YEARLY"
      ? t("billing.cycle.yearly")
      : t("billing.cycle.monthly");

  const now = new Date();
  const periodLabel = `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;

  const shortInvoiceId =
    invoiceId.length > 8
      ? invoiceId.slice(-8).toUpperCase()
      : invoiceId.toUpperCase();

  if (!isValidStripeSecret(clientSecret)) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-4 text-sm text-amber-700 text-center">
        {t("register.payment.not_configured")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Order summary */}
      <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4 flex flex-col gap-3">
        {/* Plan row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">
                {planName ?? t("register.payment.plan_default")}
              </p>
              <p className="text-[11px] text-gray-400">{cycleLabel}</p>
            </div>
          </div>
          <span className="text-[15px] font-bold text-gray-900 shrink-0">
            {amount}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Invoice & period details */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-500">{t("register.payment.invoice_no")}</span>
            <span className="font-medium text-gray-700">#{shortInvoiceId}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-500">{t("register.payment.billing_period")}</span>
            <span className="font-medium text-gray-700">{periodLabel}</span>
          </div>
        </div>
      </div>

      {/* Stripe payment form */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden p-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <CreditCard className="w-4 h-4 text-gray-400" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-gray-700">
            {t("register.payment.payment_info")}
          </span>
        </div>
        <StripeProvider clientSecret={clientSecret}>
          <CheckoutForm
            amount={amount}
            invoiceId={invoiceId}
            returnUrl={returnUrl}
            onError={onError}
            onSuccess={({ paymentIntentId }) => {
              // Payment completed inline (no browser redirect by Stripe).
              // Navigate to PaymentConfirmation with the same URL params that
              // Stripe would have appended on a redirect — so the success screen
              // and payment recording logic are reused for both paths.
              const params = new URLSearchParams({
                from: "register",
                invoiceId,
                payment_intent: paymentIntentId,
                payment_intent_client_secret: clientSecret,
                redirect_status: "succeeded",
              });
              const url = `/billing/payment/confirmation?${params.toString()}`;
              navigate(url, { replace: true });
            }}
            showSummary={false}
          />
        </StripeProvider>
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{t("register.payment.secure_note")}</span>
      </div>
    </div>
  );
};
