import { useState } from "react";
import { Card, Empty, Skeleton } from "antd";
import { useQuery } from "@tanstack/react-query";
import { apiGetPlatformPaymentList } from "@/api/platform/platform.api";
import type { PlatformPaymentItem } from "@/interface/platform";
import { useLocale } from "@/i18n";

const PAGE_SIZE = 50;

const usePaymentListQuery = (statusFilter: string) =>
  useQuery({
    queryKey: ["platform-payment-list", statusFilter],
    queryFn: () =>
      apiGetPlatformPaymentList({
        page: 0,
        size: PAGE_SIZE,
        status: statusFilter || undefined,
      }),
    select: (res: any) =>
      (res?.data?.items ?? res?.items ?? []) as PlatformPaymentItem[],
  });

const STATUS_STYLES: Record<string, string> = {
  SUCCEEDED: "bg-green-100 text-green-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  PENDING: "bg-slate-100 text-slate-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
};

const PlatformPayments = () => {
  const { t } = useLocale();
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading, isError, refetch } =
    usePaymentListQuery(statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          {t("platform.payments.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("platform.payments.subtitle")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted">
          {t("platform.payments.filter_label")}
        </label>
        <select
          className="rounded-xl border border-stroke bg-white px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t("platform.payments.status_all")}</option>
          <option value="SUCCEEDED">
            {t("platform.payments.status_succeeded")}
          </option>
          <option value="PROCESSING">
            {t("platform.payments.status_processing")}
          </option>
          <option value="PENDING">
            {t("platform.payments.status_pending")}
          </option>
          <option value="FAILED">{t("platform.payments.status_failed")}</option>
          <option value="REFUNDED">
            {t("platform.payments.status_refunded")}
          </option>
        </select>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            {t("platform.payments.load_error")}{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              {t("global.retry")}
            </button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-6">
            <Empty description={t("platform.payments.empty")} />
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">
                  {t("platform.payments.col_transaction")}
                </th>
                <th className="px-4 py-3">
                  {t("platform.payments.col_company")}
                </th>
                <th className="px-4 py-3">
                  {t("platform.payments.col_invoice")}
                </th>
                <th className="px-4 py-3">
                  {t("platform.payments.col_amount")}
                </th>
                <th className="px-4 py-3">
                  {t("platform.payments.col_provider")}
                </th>
                <th className="px-4 py-3">
                  {t("platform.payments.col_status")}
                </th>
                <th className="px-4 py-3">{t("platform.payments.col_date")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((tx) => (
                <tr
                  key={tx.paymentId}
                  className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm">
                    {tx.paymentId}
                  </td>
                  <td className="px-4 py-3 text-muted">{tx.companyName}</td>
                  <td className="px-4 py-3 text-muted">{tx.invoiceId}</td>
                  <td className="px-4 py-3 font-medium">
                    {tx.amount?.toLocaleString()} {tx.currency?.toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-muted capitalize">
                    {tx.provider}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[tx.status] ?? "bg-slate-100 text-slate-700"}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{tx.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default PlatformPayments;
