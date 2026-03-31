import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Empty, Modal, Skeleton, Tag } from "antd";
import { FileText, Download, CreditCard, RefreshCw } from "lucide-react";
import BaseButton from "@/components/button";
import { useQuery } from "@tanstack/react-query";
import { apiGetInvoices, apiGetInvoiceById } from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapInvoice } from "@/utils/mappers/billing";
import { useLocale } from "@/i18n";
import type { Invoice } from "@/shared/types";

type TagColor = "success" | "error" | "warning" | "default" | "processing";

const STATUS_COLOR: Record<string, TagColor> = {
  Paid: "success",
  Overdue: "error",
  Void: "error",
  Draft: "default",
  Open: "warning",
  Issued: "warning",
};

const StatusBadge = ({ status, label }: { status: string; label: string }) => (
  <Tag color={STATUS_COLOR[status] ?? "default"} className="!m-0">
    {label}
  </Tag>
);

const isPayable = (status: string) =>
  status === "Open" || status === "Overdue" || status === "Issued";

const BillingInvoices = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [detailId, setDetailId] = useState<string | null>(null);

  const statusLabel = (status: string) => {
    const key = `billing.status.${status.toLowerCase()}`;
    const translated = t(key as any);
    // Fall back to raw status if key not found (returns key itself)
    return translated === key ? status : translated;
  };

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
        <p className="mt-1 text-sm text-slate-500">
          {t("billing.invoices.subtitle")}
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <RefreshCw className="w-8 h-8 text-slate-300" />
            <p className="text-sm text-slate-500">{t("billing.invoices.error")}</p>
            <BaseButton onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              {t("billing.invoices.retry")}
            </BaseButton>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-10">
            <Empty
              image={<FileText className="w-12 h-12 text-slate-300 mx-auto" />}
              imageStyle={{ height: "auto" }}
              description={
                <span className="text-sm text-slate-500">
                  {t("billing.invoices.empty")}
                </span>
              }>
              <BaseButton onClick={() => navigate("/billing/plan")}>
                {t("billing.invoices.view_plan")}
              </BaseButton>
            </Empty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("billing.invoice")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("billing.amount")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("billing.status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("billing.issued_date")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("billing.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        className="font-medium text-slate-700 hover:text-brand hover:underline text-sm"
                        onClick={() => setDetailId(invoice.id)}>
                        {invoice.invoiceNo || invoice.id}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">
                      {invoice.amount}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={invoice.status}
                        label={statusLabel(invoice.status)}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">
                      {invoice.date}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2 items-center">
                        <BaseButton
                          type="text"
                          onClick={() => setDetailId(invoice.id)}>
                          {t("billing.view")}
                        </BaseButton>
                        {isPayable(invoice.status) && (
                          <BaseButton
                            type="primary"
                            icon={<CreditCard className="w-3.5 h-3.5" />}
                            onClick={() =>
                              navigate(
                                `/billing/checkout/${invoice.id}?amount=${encodeURIComponent(invoice.amount)}`,
                              )
                            }>
                            {t("billing.pay_now")}
                          </BaseButton>
                        )}
                        <BaseButton
                          type="text"
                          icon={<Download className="w-3.5 h-3.5" />}
                          onClick={() => handleDownload(invoice.id)}>
                          {t("billing.download")}
                        </BaseButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!detailId}
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{t("billing.invoice_detail")}</span>
          </div>
        }
        onCancel={() => setDetailId(null)}
        footer={null}
        width={480}>
        {detailLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        ) : detail ? (
          <div className="space-y-5 pt-1">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                  {t("billing.invoice_no")}
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.invoiceNo || detail.id}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                  {t("billing.status")}
                </dt>
                <dd>
                  <StatusBadge
                    status={detail.status}
                    label={statusLabel(detail.status)}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                  {t("billing.amount")}
                </dt>
                <dd className="font-semibold text-slate-800 text-base">
                  {detail.amount}{" "}
                  {detail.currency && (
                    <span className="text-xs font-normal text-slate-400">
                      {detail.currency}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                  {t("billing.issued_date")}
                </dt>
                <dd className="text-slate-700">{detail.date}</dd>
              </div>
              {detail.dueDate && (
                <div>
                  <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                    {t("billing.due_date")}
                  </dt>
                  <dd className="text-slate-700">{detail.dueDate}</dd>
                </div>
              )}
              {detail.eInvoiceUrl && (
                <div className="col-span-2">
                  <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                    {t("billing.e_invoice")}
                  </dt>
                  <dd>
                    <a
                      href={detail.eInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand underline hover:no-underline text-sm">
                      {t("billing.e_invoice")}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
              {isPayable(detail.status) && (
                <BaseButton
                  type="primary"
                  icon={<CreditCard className="w-3.5 h-3.5" />}
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
          <p className="py-4 text-sm text-slate-500">
            {t("billing.invoices.detail_error")}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default BillingInvoices;
