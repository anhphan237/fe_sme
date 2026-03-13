import { useState } from "react";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Table } from "@core/components/ui/Table";
import { EmptyState } from "@core/components/ui/EmptyState";
import { Skeleton } from "@core/components/ui/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiGetPaymentTransactions } from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapTransaction } from "@/utils/mappers/billing";
import type { PaymentTransaction } from "@/shared/types";

const usePaymentTransactionsQuery = () =>
  useQuery({
    queryKey: ["payment-transactions"],
    queryFn: apiGetPaymentTransactions,
    select: (res: any) =>
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
  const { data, isLoading, isError, refetch } = usePaymentTransactionsQuery();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? data
      : data?.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Lookup"
        subtitle="Review and troubleshoot payment transactions."
      />

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted">
          Filter by status:
        </label>
        <select
          className="rounded-xl border border-stroke bg-white px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="succeeded">Succeeded</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
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
            Failed to load transactions.{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : filtered && filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No transactions found"
              description="Payment transactions will appear here once payments are processed."
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
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
          </Table>
        )}
      </Card>
    </div>
  );
};

export default PlatformPayments;
