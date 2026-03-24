import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Skeleton } from "antd";
import BaseButton from "@/components/button";
import { stripePromise } from "@/lib/stripe";
import { apiGetPaymentStatus } from "@/api/billing/billing.api";

type Status = "loading" | "succeeded" | "processing" | "failed";

const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clientSecret = searchParams.get("payment_intent_client_secret");
  const paymentIntentId = searchParams.get("payment_intent");
  const isFromRegister = searchParams.get("from") === "register";
  const [status, setStatus] = useState<Status>(
    clientSecret ? "loading" : "failed",
  );

  useEffect(() => {
    if (!clientSecret) {
      return;
    }

    stripePromise.then(async (stripe) => {
      if (!stripe) {
        setStatus("failed");
        return;
      }

      const { paymentIntent } =
        await stripe.retrievePaymentIntent(clientSecret);

      switch (paymentIntent?.status) {
        case "succeeded":
          setStatus("succeeded");
          // Sync backend so the invoice status is updated in the DB
          if (paymentIntentId) {
            apiGetPaymentStatus(paymentIntentId).catch(() => {
              // Silently ignore — backend may update via webhook too
            });
          }
          // Invalidate caches so Invoices page shows fresh data immediately
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["subscription"] });
          break;
        case "processing":
          setStatus("processing");
          // Still invalidate so the page refetches when user navigates
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          break;
        default:
          setStatus("failed");
          break;
      }
    });
  }, [clientSecret, paymentIntentId, queryClient]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-center text-2xl font-semibold text-slate-800">
        Kết quả thanh toán
      </h1>

      <Card className="text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-6 w-48" />
            <Skeleton className="mx-auto h-4 w-64" />
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
            <h2 className="text-xl font-bold text-ink">
              Thanh toán thành công
            </h2>
            <p className="text-sm text-muted">
              {isFromRegister
                ? "Chào mừng bạn! Tài khoản đã được kích hoạt. Hóa đơn của bạn đã được cập nhật."
                : "Thanh toán đã được xử lý thành công. Trạng thái hóa đơn đã được cập nhật."}
            </p>
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
            <h2 className="text-xl font-bold text-ink">
              Đang xử lý thanh toán
            </h2>
            <p className="text-sm text-muted">
              Thanh toán đang được xử lý. Trạng thái hóa đơn sẽ được cập nhật
              sau khi xác nhận.
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
            <h2 className="text-xl font-bold text-ink">Thanh toán thất bại</h2>
            <p className="text-sm text-muted">
              Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc sử
              dụng phương thức thanh toán khác.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          {status === "succeeded" ? (
            <BaseButton
              type="primary"
              onClick={() =>
                navigate(isFromRegister ? "/dashboard" : "/billing/invoices")
              }>
              {isFromRegister ? "Đến Dashboard" : "Xem hóa đơn"}
            </BaseButton>
          ) : (
            <BaseButton onClick={() => navigate("/billing/invoices")}>
              Quản lý hóa đơn
            </BaseButton>
          )}
          {status === "failed" && (
            <BaseButton type="primary" onClick={() => navigate(-1)}>
              Thử lại
            </BaseButton>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentConfirmation;
