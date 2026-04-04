import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Skeleton } from "antd";
import BaseButton from "@/components/button";
import { stripePromise } from "@/lib/stripe";
import { apiGetPaymentStatus } from "@/api/billing/billing.api";
import { useLocale } from "@/i18n";

type Status = "loading" | "succeeded" | "processing" | "failed";

const PaymentConfirmation = () => {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clientSecret = searchParams.get("payment_intent_client_secret");
  const paymentIntentId = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");
  const isFromRegister = searchParams.get("from") === "register";
  const invoiceId = searchParams.get("invoiceId");
  const [status, setStatus] = useState<Status>(
    clientSecret ? "loading" : "failed",
  );
  const [countdown, setCountdown] = useState(3);

  // Auto-navigate countdown when payment succeeded during registration
  useEffect(() => {
    if (status !== "succeeded" || !isFromRegister) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate("/dashboard", { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, isFromRegister, navigate]);

  useEffect(() => {
    if (!clientSecret) return;

    // Stripe never returns redirect_status="failed"; non-success values are
    // "requires_payment_method" or "requires_action". Still guard here to
    // skip the retrievePaymentIntent call when Stripe signals a clear failure.
    if (redirectStatus && redirectStatus !== "succeeded" && redirectStatus !== "processing") {
      setStatus("failed");
      return;
    }

    const checkStatus = async () => {
      try {
        const stripe = await stripePromise;
        if (!stripe) {
          setStatus("failed");
          return;
        }

        const { paymentIntent } =
          await stripe.retrievePaymentIntent(clientSecret);

        switch (paymentIntent?.status) {
          case "succeeded":
            if (paymentIntentId) {
              try {
                await apiGetPaymentStatus(paymentIntentId, invoiceId ?? undefined);
              } catch {
                // Backend may also update via webhook — non-blocking
              }
            }
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            if (invoiceId) {
              queryClient.invalidateQueries({
                queryKey: ["invoice", invoiceId],
              });
            }
            setStatus("succeeded");
            break;
          case "processing":
            setStatus("processing");
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            break;
          default:
            setStatus("failed");
            break;
        }
      } catch {
        setStatus("failed");
      }
    };

    checkStatus();
  }, [clientSecret, paymentIntentId, redirectStatus, queryClient, invoiceId]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <h1 className="text-center text-2xl font-semibold text-slate-800">
        {t("billing.confirmation.title")}
      </h1>

      <Card className="text-center shadow-sm">
        {status === "loading" && (
          <div className="space-y-4 py-4">
            <Skeleton.Avatar active size={64} className="mx-auto" />
            <Skeleton active paragraph={{ rows: 2 }} title={false} className="mx-auto max-w-xs" />
          </div>
        )}

        {status === "succeeded" && (
          <div className="space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {t("billing.confirmation.success.title")}
            </h2>
            <p className="text-sm text-slate-500">
              {isFromRegister
                ? t("billing.confirmation.success.register")
                : t("billing.confirmation.success.invoice")}
            </p>
            {isFromRegister && (
              <p className="text-xs text-slate-400">
                {t("billing.confirmation.redirect", { sec: String(countdown) })}
              </p>
            )}
          </div>
        )}

        {status === "processing" && (
          <div className="space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg
                className="h-8 w-8 animate-spin text-yellow-600"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {t("billing.confirmation.processing.title")}
            </h2>
            <p className="text-sm text-slate-500">
              {t("billing.confirmation.processing.body")}
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {t("billing.confirmation.failed.title")}
            </h2>
            <p className="text-sm text-slate-500">
              {isFromRegister
                ? t("billing.confirmation.failed.register")
                : t("billing.confirmation.failed.invoice")}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          {status === "succeeded" && (
            <BaseButton
              type="primary"
              onClick={() =>
                navigate(isFromRegister ? "/dashboard" : "/billing/invoices")
              }>
              {isFromRegister
                ? t("billing.confirmation.btn.dashboard")
                : t("billing.confirmation.btn.invoices")}
            </BaseButton>
          )}

          {(status === "processing" || status === "failed") && (
            <BaseButton onClick={() => navigate("/billing/invoices")}>
              {t("billing.confirmation.btn.invoices")}
            </BaseButton>
          )}

          {status === "failed" && (
            <BaseButton
              type="primary"
              onClick={() => navigate("/billing/invoices")}>
              {isFromRegister
                ? t("billing.confirmation.btn.pay_later")
                : t("billing.confirmation.btn.retry")}
            </BaseButton>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentConfirmation;
