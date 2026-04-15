import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  Empty,
  Input,
  Modal,
  Pagination,
  Skeleton,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  ReceiptText,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  apiGetInvoices,
  apiGetInvoiceById,
  apiGetPaymentTransactions,
} from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapInvoice, mapTransaction } from "@/utils/mappers/billing";
import { useLocale } from "@/i18n";
import BaseButton from "@/components/button";
import type { Invoice, PaymentTransaction } from "@/shared/types";

// ── Constants ────────────────────────────────────────────────

const INV_PAGE_SIZE = 10;
const TX_PAGE_SIZE = 20;

const INV_STATUS_FILTERS = [
  "",
  "Open",
  "Overdue",
  "Paid",
  "Draft",
  "Void",
] as const;
type InvStatusFilter = (typeof INV_STATUS_FILTERS)[number];

const TX_STATUS_FILTERS = [
  "",
  "init",
  "pending",
  "succeeded",
  "failed",
  "refunded",
] as const;
type TxStatusFilter = (typeof TX_STATUS_FILTERS)[number];

const INV_STATUS_COLOR: Record<string, string> = {
  Paid: "success",
  Overdue: "error",
  Void: "default",
  Draft: "default",
  Open: "warning",
};

const TX_STATUS_COLOR: Record<string, string> = {
  succeeded: "success",
  failed: "error",
  pending: "warning",
  processing: "processing",
  refunded: "purple",
  init: "default",
};

const INV_PILL_ACTIVE: Record<InvStatusFilter, string> = {
  "": "bg-slate-800 text-white shadow-sm",
  Open: "bg-amber-500 text-white shadow-sm",
  Overdue: "bg-red-500 text-white shadow-sm",
  Paid: "bg-emerald-500 text-white shadow-sm",
  Draft: "bg-slate-500 text-white shadow-sm",
  Void: "bg-slate-400 text-white shadow-sm",
};

const TX_PILL_ACTIVE: Record<TxStatusFilter, string> = {
  "": "bg-slate-800 text-white shadow-sm",
  init: "bg-slate-500 text-white shadow-sm",
  pending: "bg-amber-500 text-white shadow-sm",
  succeeded: "bg-emerald-500 text-white shadow-sm",
  failed: "bg-red-500 text-white shadow-sm",
  refunded: "bg-violet-500 text-white shadow-sm",
};

const isPayable = (status: string) =>
  status === "Open" || status === "Overdue" || status === "Issued";

// ── Sub-components ───────────────────────────────────────────

const StatCard = ({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  </div>
);

const StatSkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
        <Skeleton active paragraph={{ rows: 1 }} />
      </div>
    ))}
  </div>
);

// ── Page ─────────────────────────────────────────────────────

const BillingInvoices = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab =
    searchParams.get("tab") === "transactions" ? "transactions" : "invoices";
  const setActiveTab = (tab: string) =>
    setSearchParams({ tab }, { replace: true });

  // ── Invoice state ──
  const [detailId, setDetailId] = useState<string | null>(null);
  const [invFilter, setInvFilter] = useState<InvStatusFilter>("");
  const [invSearch, setInvSearch] = useState("");
  const [invPage, setInvPage] = useState(1);

  // ── Transaction state ──
  const [txFilter, setTxFilter] = useState<TxStatusFilter>("");
  const [txSearch, setTxSearch] = useState("");
  const [txPage, setTxPage] = useState(1);

  // ── Queries ──
  const {
    data: invoices,
    isLoading: invLoading,
    isError: invError,
    refetch: invRefetch,
  } = useQuery({
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

  const {
    data: txData,
    isLoading: txLoading,
    isError: txError,
    refetch: txRefetch,
    isFetching: txFetching,
    dataUpdatedAt: txUpdatedAt,
  } = useQuery({
    queryKey: ["billing-transactions", txPage],
    queryFn: () => apiGetPaymentTransactions(txPage, TX_PAGE_SIZE),
    select: (res: unknown) => {
      const raw = res as any;
      const items = extractList(raw, "transactions", "items").map(
        mapTransaction,
      ) as PaymentTransaction[];
      const total = raw?.data?.total ?? raw?.total ?? items.length;
      return { items, total };
    },
    refetchOnMount: "always",
  });

  // ── Invoice derived values ──
  const allInvoices = invoices ?? [];
  const invPaid = allInvoices.filter((i) => i.status === "Paid").length;
  const invOpen = allInvoices.filter(
    (i) => i.status === "Open" || i.status === "Overdue",
  ).length;
  const invDraft = allInvoices.filter(
    (i) => i.status === "Draft" || i.status === "Void",
  ).length;

  const filteredInvoices = invFilter
    ? allInvoices.filter((i) => i.status === invFilter)
    : allInvoices;
  const displayInvoices = invSearch.trim()
    ? filteredInvoices.filter(
        (i) =>
          i.invoiceNo.toLowerCase().includes(invSearch.toLowerCase()) ||
          i.id.toLowerCase().includes(invSearch.toLowerCase()),
      )
    : filteredInvoices;
  const paginatedInvoices = displayInvoices.slice(
    (invPage - 1) * INV_PAGE_SIZE,
    invPage * INV_PAGE_SIZE,
  );

  // ── Transaction derived values ──
  const txItems = txData?.items ?? [];
  const txSucceeded = txItems.filter((tx) => tx.status === "succeeded").length;
  const txFailed = txItems.filter((tx) => tx.status === "failed").length;
  const txPending = txItems.filter(
    (tx) => tx.status === "pending" || (tx.status as string) === "init",
  ).length;

  const txFiltered = txFilter
    ? txItems.filter((tx) => tx.status === txFilter)
    : txItems;
  const txDisplay = txSearch.trim()
    ? txFiltered.filter(
        (tx) =>
          tx.id.toLowerCase().includes(txSearch.toLowerCase()) ||
          tx.invoiceId?.toLowerCase().includes(txSearch.toLowerCase()),
      )
    : txFiltered;

  const txLastUpdated = txUpdatedAt
    ? new Date(txUpdatedAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  // ── Handlers ──
  const statusLabel = (status: string) => {
    const key = `billing.status.${status.toLowerCase()}`;
    const translated = t(key as any);
    return translated === key ? status : translated;
  };

  const handleViewInvoiceFromTx = (invoiceId: string) => {
    setActiveTab("invoices");
    // slight delay so tab switch renders before modal opens
    setTimeout(() => setDetailId(invoiceId), 50);
  };

  const handleRetryTx = (tx: PaymentTransaction) => {
    const inv = allInvoices.find((i) => i.id === tx.invoiceId);
    if (inv) {
      navigate(
        `/billing/checkout/${inv.id}?amount=${encodeURIComponent(inv.amount)}`,
      );
    } else {
      setActiveTab("invoices");
    }
  };

  // ── Filter labels ──
  const invFilterLabels: Record<InvStatusFilter, string> = {
    "": t("billing.transactions.status_all"),
    Open: t("billing.status.open"),
    Overdue: t("billing.status.overdue"),
    Paid: t("billing.status.paid"),
    Draft: t("billing.status.draft"),
    Void: t("billing.status.void"),
  };

  const txFilterLabels: Record<TxStatusFilter, string> = {
    "": t("billing.transactions.status_all"),
    init: t("billing.transactions.status_init"),
    pending: t("billing.transactions.status_pending"),
    succeeded: t("billing.transactions.status_succeeded"),
    failed: t("billing.transactions.status_failed"),
    refunded: t("billing.transactions.status_refunded"),
  };

  // ── Render: Invoices tab content ─────────────────────────

  const renderInvoices = () => (
    <div className="space-y-5">
      {/* Stats */}
      {invLoading ? (
        <StatSkeletonGrid />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<FileText className="h-4 w-4 text-slate-600" />}
            iconBg="bg-slate-100"
            label={t("billing.transactions.stat_total")}
            value={allInvoices.length}
            sub={t("billing.transactions.stat_total_sub")}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            iconBg="bg-emerald-50"
            label={t("billing.invoices.stat_paid")}
            value={invPaid}
          />
          <StatCard
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            iconBg="bg-amber-50"
            label={t("billing.invoices.stat_open")}
            value={invOpen}
            sub={t("billing.invoices.stat_open_sub")}
          />
          <StatCard
            icon={<FileText className="h-4 w-4 text-slate-400" />}
            iconBg="bg-slate-50"
            label={t("billing.invoices.stat_draft")}
            value={invDraft}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {INV_STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setInvFilter(s);
                setInvSearch("");
                setInvPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                invFilter === s
                  ? INV_PILL_ACTIVE[s]
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {invFilterLabels[s]}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Input
            prefix={<Search className="h-3.5 w-3.5 text-slate-400" />}
            placeholder={t("billing.invoices.search_placeholder")}
            value={invSearch}
            onChange={(e) => {
              setInvSearch(e.target.value);
              setInvPage(1);
            }}
            allowClear
            className="w-56 rounded-xl text-sm"
            size="small"
          />
          <button
            type="button"
            onClick={() => invRefetch()}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0 shadow-sm">
        {invLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        ) : invError ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <XCircle className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              {t("billing.invoices.error")}
            </p>
            <BaseButton
              onClick={() => invRefetch()}
              icon={<RefreshCw className="h-3.5 w-3.5" />}>
              {t("billing.invoices.retry")}
            </BaseButton>
          </div>
        ) : displayInvoices.length === 0 ? (
          <div className="p-16">
            <Empty
              image={
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <FileText className="h-7 w-7 text-slate-400" />
                </div>
              }
              imageStyle={{ height: "auto" }}
              description={
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-semibold text-slate-700">
                    {t("billing.invoices.empty")}
                  </p>
                  {invFilter && (
                    <p className="text-xs text-slate-400">
                      {t("billing.transactions.empty_filter_hint")}
                    </p>
                  )}
                </div>
              }>
              {invFilter ? (
                <BaseButton
                  onClick={() => {
                    setInvFilter("");
                    setInvSearch("");
                  }}>
                  {t("billing.transactions.clear_filter")}
                </BaseButton>
              ) : (
                <BaseButton onClick={() => navigate("/billing/plan")}>
                  {t("billing.invoices.view_plan")}
                </BaseButton>
              )}
            </Empty>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-2.5">
              <span className="text-xs text-slate-400">
                {t("billing.transactions.showing")}{" "}
                <span className="font-semibold text-slate-600">
                  {displayInvoices.length}
                </span>{" "}
                {t("billing.transactions.of")}{" "}
                <span className="font-semibold text-slate-600">
                  {allInvoices.length}
                </span>{" "}
                {t("billing.transactions.stat_total").toLowerCase()}
              </span>
              {(invFilter || invSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setInvFilter("");
                    setInvSearch("");
                  }}
                  className="text-xs text-slate-400 underline hover:text-slate-600">
                  {t("billing.transactions.clear_filter")}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.invoice_no")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.amount")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.status")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.issued_date")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.due_date")}
                    </th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="group transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          className="font-medium text-slate-700 hover:text-brand hover:underline"
                          onClick={() => setDetailId(invoice.id)}>
                          {invoice.invoiceNo || invoice.id}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {invoice.amount}
                      </td>
                      <td className="px-6 py-4">
                        <Tag
                          color={INV_STATUS_COLOR[invoice.status] ?? "default"}
                          className="!m-0">
                          {statusLabel(invoice.status)}
                        </Tag>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                        {invoice.date || "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                        {invoice.dueDate || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <BaseButton
                            type="text"
                            size="small"
                            icon={<ArrowUpRight className="h-3 w-3" />}
                            onClick={() => setDetailId(invoice.id)}>
                            {t("billing.view")}
                          </BaseButton>
                          {isPayable(invoice.status) && (
                            <BaseButton
                              type="primary"
                              size="small"
                              icon={<CreditCard className="h-3 w-3" />}
                              onClick={() =>
                                navigate(
                                  `/billing/checkout/${invoice.id}?amount=${encodeURIComponent(invoice.amount)}`,
                                )
                              }>
                              {t("billing.pay_now")}
                            </BaseButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Pagination */}
      {!invLoading && !invError && displayInvoices.length > INV_PAGE_SIZE && (
        <div className="flex justify-end">
          <Pagination
            current={invPage}
            pageSize={INV_PAGE_SIZE}
            total={displayInvoices.length}
            onChange={(p) => setInvPage(p)}
            showSizeChanger={false}
            showTotal={(total, range) => `${range[0]}–${range[1]} / ${total}`}
          />
        </div>
      )}
    </div>
  );

  // ── Render: Transactions tab content ─────────────────────

  const renderTransactions = () => (
    <div className="space-y-5">
      {/* Stats */}
      {txLoading ? (
        <StatSkeletonGrid />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<ReceiptText className="h-4 w-4 text-slate-600" />}
            iconBg="bg-slate-100"
            label={t("billing.transactions.stat_total")}
            value={txData?.total ?? 0}
            sub={t("billing.transactions.stat_total_sub")}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            iconBg="bg-emerald-50"
            label={t("billing.transactions.stat_succeeded")}
            value={txSucceeded}
            sub={t("billing.transactions.stat_page_note")}
          />
          <StatCard
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            iconBg="bg-red-50"
            label={t("billing.transactions.stat_failed")}
            value={txFailed}
            sub={t("billing.transactions.stat_page_note")}
          />
          <StatCard
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            iconBg="bg-amber-50"
            label={t("billing.transactions.stat_pending")}
            value={txPending}
            sub={t("billing.transactions.stat_page_note")}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TX_STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setTxFilter(s);
                setTxSearch("");
                setTxPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                txFilter === s
                  ? TX_PILL_ACTIVE[s]
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {txFilterLabels[s]}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Input
            prefix={<Search className="h-3.5 w-3.5 text-slate-400" />}
            placeholder={t("billing.transactions.search_placeholder")}
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            allowClear
            className="w-56 rounded-xl text-sm"
            size="small"
          />
          <Tooltip
            title={
              txLastUpdated
                ? `${t("billing.transactions.last_updated")} ${txLastUpdated}`
                : undefined
            }>
            <button
              type="button"
              onClick={() => txRefetch()}
              disabled={txFetching}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw
                className={`h-3.5 w-3.5 ${txFetching ? "animate-spin" : ""}`}
              />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0 shadow-sm">
        {txLoading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton.Input
                  active
                  size="small"
                  className="!w-24 !rounded-lg"
                />
                <Skeleton.Input
                  active
                  size="small"
                  className="!w-20 !rounded-lg"
                />
                <Skeleton.Input
                  active
                  size="small"
                  className="!w-28 !rounded-lg"
                />
                <Skeleton.Input
                  active
                  size="small"
                  className="!w-16 !rounded-lg"
                />
              </div>
            ))}
          </div>
        ) : txError ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <XCircle className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              {t("billing.transactions.error")}
            </p>
            <BaseButton
              onClick={() => txRefetch()}
              icon={<RefreshCw className="h-3.5 w-3.5" />}>
              {t("billing.invoices.retry")}
            </BaseButton>
          </div>
        ) : txDisplay.length === 0 ? (
          <div className="p-16">
            <Empty
              image={
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <ReceiptText className="h-7 w-7 text-slate-400" />
                </div>
              }
              imageStyle={{ height: "auto" }}
              description={
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-semibold text-slate-700">
                    {t("billing.transactions.empty")}
                  </p>
                  {(txFilter || txSearch) && (
                    <p className="text-xs text-slate-400">
                      {t("billing.transactions.empty_filter_hint")}
                    </p>
                  )}
                </div>
              }>
              {(txFilter || txSearch) && (
                <BaseButton
                  onClick={() => {
                    setTxFilter("");
                    setTxSearch("");
                  }}>
                  {t("billing.transactions.clear_filter")}
                </BaseButton>
              )}
            </Empty>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-2.5">
              <span className="text-xs text-slate-400">
                {t("billing.transactions.showing")}{" "}
                <span className="font-semibold text-slate-600">
                  {txDisplay.length}
                </span>{" "}
                {t("billing.transactions.of")}{" "}
                <span className="font-semibold text-slate-600">
                  {txData?.total ?? txItems.length}
                </span>{" "}
                {t("billing.transactions.stat_total").toLowerCase()}
              </span>
              {(txFilter || txSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setTxFilter("");
                    setTxSearch("");
                  }}
                  className="text-xs text-slate-400 underline hover:text-slate-600">
                  {t("billing.transactions.clear_filter")}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.transactions.col_id")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.transactions.col_invoice")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.transactions.col_amount")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.transactions.col_status")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.transactions.col_provider")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("billing.transactions.col_date")}
                    </th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {txDisplay.map((tx) => (
                    <tr
                      key={tx.id}
                      className="group transition-colors hover:bg-slate-50/70">
                      {/* Transaction ID */}
                      <td className="px-6 py-4">
                        <Tooltip title={tx.id} placement="topLeft">
                          <span className="cursor-default select-none rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
                            #{tx.id.slice(0, 8)}
                          </span>
                        </Tooltip>
                      </td>

                      {/* Invoice ID — click to open invoice detail */}
                      <td className="px-6 py-4">
                        {tx.invoiceId ? (
                          <Tooltip title={tx.invoiceId}>
                            <button
                              type="button"
                              className="rounded-md bg-blue-50 px-2.5 py-1 font-mono text-xs text-blue-600 transition-colors hover:bg-blue-100"
                              onClick={() =>
                                handleViewInvoiceFromTx(tx.invoiceId)
                              }>
                              #{tx.invoiceId.slice(0, 8)}
                            </button>
                          </Tooltip>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">
                          {tx.amount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Tag
                          color={TX_STATUS_COLOR[tx.status] ?? "default"}
                          className="!m-0 font-medium capitalize">
                          {tx.status}
                        </Tag>
                      </td>

                      {/* Provider */}
                      <td className="px-6 py-4">
                        {tx.provider ? (
                          <span className="inline-flex items-center gap-1.5 capitalize text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            {tx.provider.toLowerCase()}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                        {tx.createdAt ? (
                          <span>
                            {new Date(tx.createdAt).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
                            <span className="ml-1.5 text-xs text-slate-400">
                              {new Date(tx.createdAt).toLocaleTimeString(
                                "vi-VN",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {tx.status === "failed" && (
                            <BaseButton
                              type="text"
                              size="small"
                              icon={<RefreshCw className="h-3 w-3" />}
                              onClick={() => handleRetryTx(tx)}>
                              {t("billing.transactions.retry")}
                            </BaseButton>
                          )}
                          {tx.invoiceId && (
                            <BaseButton
                              type="text"
                              size="small"
                              icon={<ArrowUpRight className="h-3 w-3" />}
                              onClick={() =>
                                handleViewInvoiceFromTx(tx.invoiceId)
                              }>
                              {t("billing.view")}
                            </BaseButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Pagination */}
      {!txLoading && !txError && (txData?.total ?? 0) > TX_PAGE_SIZE && (
        <div className="flex justify-end">
          <Pagination
            current={txPage}
            pageSize={TX_PAGE_SIZE}
            total={txData?.total ?? 0}
            onChange={(p) => setTxPage(p)}
            showSizeChanger={false}
            showTotal={(total, range) => `${range[0]}–${range[1]} / ${total}`}
          />
        </div>
      )}
    </div>
  );

  // ── Main render ──────────────────────────────────────────

  return (
    <div className="space-y-5">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="billing-history-tabs"
        items={[
          {
            key: "invoices",
            label: (
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {t("billing.invoices.tab_invoices")}
              </span>
            ),
            children: renderInvoices(),
          },
          {
            key: "transactions",
            label: (
              <span className="flex items-center gap-1.5">
                <ReceiptText className="h-3.5 w-3.5" />
                {t("billing.invoices.tab_transactions")}
              </span>
            ),
            children: renderTransactions(),
          },
        ]}
      />

      {/* Invoice detail modal */}
      <Modal
        open={!!detailId}
        title={
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <span>{t("billing.invoice_detail")}</span>
          </div>
        }
        onCancel={() => setDetailId(null)}
        footer={null}
        width={620}>
        {detailLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        ) : detail ? (
          <div className="space-y-5 pt-1">
            {/* Fields */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="mb-0.5 text-xs uppercase tracking-wide text-slate-400">
                  {t("billing.invoice_no")}
                </dt>
                <dd className="font-semibold text-slate-800">
                  {detail.invoiceNo || detail.id}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-xs uppercase tracking-wide text-slate-400">
                  {t("billing.status")}
                </dt>
                <dd>
                  <Tag
                    color={INV_STATUS_COLOR[detail.status] ?? "default"}
                    className="!m-0">
                    {statusLabel(detail.status)}
                  </Tag>
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-xs uppercase tracking-wide text-slate-400">
                  {t("billing.amount")}
                </dt>
                <dd className="text-base font-semibold text-slate-800">
                  {detail.amount}
                  {detail.currency && (
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      {detail.currency}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-xs uppercase tracking-wide text-slate-400">
                  {t("billing.issued_date")}
                </dt>
                <dd className="text-slate-700">{detail.date || "—"}</dd>
              </div>
              {detail.dueDate && (
                <div>
                  <dt className="mb-0.5 text-xs uppercase tracking-wide text-slate-400">
                    {t("billing.due_date")}
                  </dt>
                  <dd className="text-slate-700">{detail.dueDate}</dd>
                </div>
              )}
              {detail.eInvoiceUrl && (
                <div className="col-span-2">
                  <dt className="mb-0.5 text-xs uppercase tracking-wide text-slate-400">
                    {t("billing.e_invoice")}
                  </dt>
                  <dd>
                    <a
                      href={detail.eInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand underline hover:no-underline">
                      {t("billing.e_invoice")}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            {/* Related transactions (from already-loaded page data) */}
            {(() => {
              const related = txItems.filter(
                (tx) => tx.invoiceId === detail.id,
              );
              if (related.length === 0) return null;
              return (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t("billing.invoices.related_transactions")}
                  </p>
                  <div className="space-y-2">
                    {related.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-mono text-xs text-slate-500">
                          #{tx.id.slice(0, 10)}
                        </span>
                        <span className="font-medium text-slate-700">
                          {tx.amount}
                        </span>
                        <Tag
                          color={TX_STATUS_COLOR[tx.status] ?? "default"}
                          className="!m-0 capitalize">
                          {tx.status}
                        </Tag>
                        {tx.createdAt && (
                          <span className="text-xs text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              {isPayable(detail.status) && (
                <BaseButton
                  type="primary"
                  icon={<CreditCard className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setDetailId(null);
                    navigate(
                      `/billing/checkout/${detail.id}?amount=${encodeURIComponent(detail.amount)}`,
                    );
                  }}>
                  {t("billing.pay_now")}
                </BaseButton>
              )}
              {detail.eInvoiceUrl && (
                <a
                  href={detail.eInvoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download>
                  <BaseButton icon={<Download className="h-3.5 w-3.5" />}>
                    {t("billing.download")}
                  </BaseButton>
                </a>
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
