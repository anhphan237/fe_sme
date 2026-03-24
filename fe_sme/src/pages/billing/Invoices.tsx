import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Empty, Modal, Skeleton } from "antd";
import BaseButton from "@/components/button";
import { useQuery } from "@tanstack/react-query";
import { apiGetInvoices, apiGetInvoiceById } from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapInvoice } from "@/utils/mappers/billing";
import { useLocale } from "@/i18n";
import type { Invoice } from "@/shared/types";

const statusBadge = (status: string) => {
  if (status === "Paid")
    return "inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700";
  if (status === "Overdue" || status === "Void")
    return "inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700";
  if (status === "Draft")
    return "inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600";
  return "inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700";
};

const BillingInvoices = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiGetInvoices(),
    select: (res: unknown) =>
      extractList(res, "invoices", "items").map(mapInvoice) as Invoice[],
    refetchOnMount: "always",
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["invoice", detailId],
    queryFn: () => apiGetInvoiceById(detailId!),
    enabled: Boolean(detailId),
    select: (res: unknown) => mapInvoice(res),
  });

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
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          {t("billing.invoices.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("billing.invoices.subtitle")}
        </p>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            {t("billing.invoices.error")}{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              {t("billing.invoices.retry")}
            </button>
          </div>
        ) : data && data.length === 0 ? (
          <div className="p-6">
            <Empty description={t("billing.invoices.empty")} />
            <div className="mt-4 text-center">
              <BaseButton onClick={() => navigate("/billing/plan")}>
                {t("billing.invoices.view_plan")}
              </BaseButton>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">{t("billing.invoice")}</th>
                <th className="px-4 py-3">{t("billing.amount")}</th>
                <th className="px-4 py-3">{t("billing.status")}</th>
                <th className="px-4 py-3">{t("billing.issued_date")}</th>
                <th className="px-4 py-3">{t("billing.action")}</th>
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
                    <span className={statusBadge(invoice.status)}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{invoice.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <BaseButton
                        type="text"
                        onClick={() => setDetailId(invoice.id)}>
                        {t("billing.view")}
                      </BaseButton>
                      {(invoice.status === "Open" ||
                        invoice.status === "Overdue") && (
                        <BaseButton
                          type="primary"
                          onClick={() =>
                            navigate(
                              `/billing/payment?invoiceId=${invoice.id}&amount=${encodeURIComponent(invoice.amount)}`,
                            )
                          }>
                          {t("billing.pay_now")}
                        </BaseButton>
                      )}
                      <BaseButton
                        type="text"
                        onClick={() => handleDownload(invoice.id)}>
                        {t("billing.download")}
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={!!detailId}
        title={t("billing.invoice_detail")}
        onCancel={() => setDetailId(null)}
        footer={null}>
        {detailLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-20" />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted">{t("billing.invoice_no")}</dt>
                <dd className="font-medium">{detail.invoiceNo || detail.id}</dd>
              </div>
              <div>
                <dt className="text-muted">{t("billing.amount")}</dt>
                <dd className="font-medium">
                  {detail.amount} {detail.currency}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t("billing.status")}</dt>
                <dd>
                  <span className={statusBadge(detail.status)}>
                    {detail.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t("billing.issued_date")}</dt>
                <dd>{detail.date}</dd>
              </div>
              {detail.dueDate && (
                <div>
                  <dt className="text-muted">{t("billing.due_date")}</dt>
                  <dd>{detail.dueDate}</dd>
                </div>
              )}
              {detail.eInvoiceUrl && (
                <div>
                  <dt className="text-muted">{t("billing.e_invoice")}</dt>
                  <dd>
                    <a
                      href={detail.eInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink underline hover:no-underline">
                      {t("billing.e_invoice")}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap gap-3 pt-2">
              {(detail.status === "Open" || detail.status === "Overdue") && (
                <BaseButton
                  type="primary"
                  onClick={() => {
                    setDetailId(null);
                    navigate(
                      `/billing/checkout/${detail.id}?amount=${encodeURIComponent(detail.amount)}`,
                    );
                  }}>
                  {t("billing.pay_now")}
                </BaseButton>
              )}
              <BaseButton onClick={() => setDetailId(null)}>
                {t("billing.close")}
              </BaseButton>
            </div>
          </div>
        ) : (
          <p className="py-4 text-sm text-muted">
            {t("billing.invoices.detail_error")}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default BillingInvoices;
