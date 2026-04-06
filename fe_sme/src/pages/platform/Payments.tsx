import { useState } from "react";
import { Card, Empty, Skeleton } from "antd";
import { useQuery } from "@tanstack/react-query";
import { apiGetPaymentTransactions } from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapTransaction } from "@/utils/mappers/billing";
import type { PaymentTransaction } from "@/shared/types";
import { useLocale } from "@/i18n";

const usePaymentTransactionsQuery = () =>
  useQuery({
    queryKey: ["payment-transactions"],
    queryFn: apiGetPaymentTransactions,
    select: (res: unknown) =>
      extractList(res, "transactions", "items").map(
        mapTransaction,
      ) as PaymentTransaction[],
  });

const STATUS_STYLES: Record<string, string> = {
  succeeded: "bg-green-100 text-green-700",
  processing: "bg-yellow-100 text-yellow-700",
  pending: "bg-slate-100 text-slate-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const PlatformPayments = () => {
  const { t } = useLocale();
  const { data, isLoading, isError, refetch } = usePaymentTransactionsQuery();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? data
      : data?.filter((tx) => tx.status === statusFilter);

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
          <option value="all">{t("platform.payments.status_all")}</option>
          <option value="succeeded">
            {t("platform.payments.status_succeeded")}
          </option>
          <option value="processing">
            {t("platform.payments.status_processing")}
          </option>
          <option value="pending">
            {t("platform.payments.status_pending")}
          </option>
          <option value="failed">{t("platform.payments.status_failed")}</option>
          <option value="refunded">
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
        ) : filtered && filtered.length === 0 ? (
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
              {filtered?.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm">{tx.id}</td>
                  <td className="px-4 py-3 text-muted">{tx.invoiceId}</td>
                  <td className="px-4 py-3 font-medium">
                    {tx.amount} {tx.currency.toUpperCase()}
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
