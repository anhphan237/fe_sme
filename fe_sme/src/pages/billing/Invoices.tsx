import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { EmptyState } from "@core/components/ui/EmptyState";
import { Table } from "@core/components/ui/Table";
import { Button } from "@core/components/ui/Button";
import { Skeleton } from "@core/components/ui/Skeleton";
import { Modal } from "@core/components/ui/Modal";
import { useQuery } from "@tanstack/react-query";
import { apiGetInvoices, apiGetInvoiceById } from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapInvoice } from "@/utils/mappers/billing";
import type { Invoice } from "@/shared/types";

const useInvoicesQuery = () =>
  useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiGetInvoices(),
    select: (res: any) =>
      extractList(res, "invoices", "items").map(mapInvoice) as Invoice[],
    refetchOnMount: "always",
  });
const useInvoiceQuery = (invoiceId?: string) =>
  useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => apiGetInvoiceById(invoiceId!),
    enabled: Boolean(invoiceId),
    select: (res: any) => mapInvoice(res),
  });

const BillingInvoices = () => {
  const navigate = useNavigate();
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useInvoicesQuery();
  const { data: detail, isLoading: detailLoading } = useInvoiceQuery(
    detailId ?? undefined,
  );

  const handleDownload = (id: string) => {
    const blob = new Blob([`Invoice ${id}`], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Track billing history and download invoices."
      />

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            Something went wrong.{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : data && data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No invoices available"
              description="Invoices will appear once billing cycles start."
              actionLabel="View plan"
              onAction={() => navigate("/billing/plan")}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="font-medium text-ink hover:underline"
                      onClick={() => setDetailId(invoice.id)}>
                      {invoice.id}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted">{invoice.amount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        invoice.status === "Paid"
                          ? "inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700"
                          : invoice.status === "Overdue" ||
                              invoice.status === "Void"
                            ? "inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700"
                            : invoice.status === "Draft"
                              ? "inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                              : "inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700"
                      }>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{invoice.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setDetailId(invoice.id)}>
                        View
                      </Button>
                      {(invoice.status === "Open" ||
                        invoice.status === "Overdue") && (
                        <Button
                          onClick={() =>
                            navigate(
                              `/billing/checkout/${invoice.id}?amount=${encodeURIComponent(invoice.amount)}`,
                            )
                          }>
                          Pay Now
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => handleDownload(invoice.id)}>
                        Download
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!detailId}
        title="Invoice detail"
        onClose={() => setDetailId(null)}>
        {detailLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-20" />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted">Invoice #</dt>
                <dd className="font-medium">{detail.invoiceNo || detail.id}</dd>
              </div>
              <div>
                <dt className="text-muted">Amount</dt>
                <dd className="font-medium">
                  {detail.amount} {detail.currency}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Status</dt>
                <dd>
                  <span
                    className={
                      detail.status === "Paid"
                        ? "inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700"
                        : detail.status === "Overdue" ||
                            detail.status === "Void"
                          ? "inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700"
                          : detail.status === "Draft"
                            ? "inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                            : "inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700"
                    }>
                    {detail.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted">Issued date</dt>
                <dd>{detail.date}</dd>
              </div>
              {detail.dueDate && (
                <div>
                  <dt className="text-muted">Due date</dt>
                  <dd>{detail.dueDate}</dd>
                </div>
              )}
              {detail.eInvoiceUrl && (
                <div>
                  <dt className="text-muted">E-Invoice</dt>
                  <dd>
                    <a
                      href={detail.eInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink underline hover:no-underline">
                      View e-invoice
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap gap-3 pt-2">
              {(detail.status === "Open" || detail.status === "Overdue") && (
                <Button
                  onClick={() => {
                    setDetailId(null);
                    navigate(
                      `/billing/checkout/${detail.id}?amount=${encodeURIComponent(detail.amount)}`,
                    );
                  }}>
                  Pay Now
                </Button>
              )}
              <Button variant="secondary" onClick={() => setDetailId(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <p className="py-4 text-sm text-muted">
            Could not load invoice details.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default BillingInvoices;
