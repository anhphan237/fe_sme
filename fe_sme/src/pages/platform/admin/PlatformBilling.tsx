import { useState } from "react";
import { Card, Empty, Skeleton, Modal, message, DatePicker } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, DollarSign, TrendingUp, Users, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";
import {
  apiGetPlatformPaymentList,
  apiGetPlatformFinancialDashboard,
  apiGetPlatformInvoiceList,
  apiGetPlatformSubscriptionList,
  apiRetryDunning,
} from "@/api/platform/platform.api";
import type {
  PlatformPaymentItem,
  PlatformInvoiceItem,
  PlatformSubscriptionItem,
} from "@/interface/platform";
import { useLocale } from "@/i18n";

const { RangePicker } = DatePicker;

const PAGE_SIZE = 50;
const DEFAULT_START = dayjs().subtract(30, "day").format("YYYY-MM-DD");
const DEFAULT_END = dayjs().format("YYYY-MM-DD");

type Tab = "payments" | "invoices" | "subscriptions";

// ── Status color maps ──────────────────────────────────────────────
const PAYMENT_STATUS_STYLE: Record<string, string> = {
  SUCCEEDED: "bg-green-100 text-green-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  PENDING: "bg-slate-100 text-slate-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
};

const INVOICE_STATUS_STYLE: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  UNPAID: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-slate-100 text-slate-500",
  DRAFT: "bg-blue-100 text-blue-700",
};

const SUBSCRIPTION_STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIAL: "bg-blue-100 text-blue-700",
  PAST_DUE: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  SUSPENDED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
};

// ── Table state helper ─────────────────────────────────────────────
const TableState = ({
  isLoading,
  isError,
  isEmpty,
  emptyText,
  errorText,
  retryText,
  onRefetch,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyText: string;
  errorText: string;
  retryText: string;
  onRefetch: () => void;
}) => {
  if (isLoading)
    return (
      <div className="space-y-3 p-6">
        <Skeleton active />
        <Skeleton active />
        <Skeleton active />
      </div>
    );
  if (isError)
    return (
      <div className="p-6 text-sm">
        {errorText}{" "}
        <button className="font-semibold" onClick={onRefetch}>
          {retryText}
        </button>
      </div>
    );
  if (isEmpty)
    return (
      <div className="p-6">
        <Empty description={emptyText} />
      </div>
    );
  return null;
};

const PlatformBilling = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("payments");
  const [dateRange, setDateRange] = useState<[string, string]>([DEFAULT_START, DEFAULT_END]);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [retryTarget, setRetryTarget] = useState<PlatformSubscriptionItem | null>(null);

  // ── Status label helpers (dùng t() key, không hiện raw status) ────
  const paymentStatusLabel = (status: string) =>
    ({
      SUCCEEDED: t("platform.payments.status_succeeded"),
      PROCESSING: t("platform.payments.status_processing"),
      PENDING: t("platform.payments.status_pending"),
      FAILED: t("platform.payments.status_failed"),
      REFUNDED: t("platform.payments.status_refunded"),
    }[status] ?? status);

  const invoiceStatusLabel = (status: string) =>
    ({
      PAID: t("platform.invoices.status_paid"),
      UNPAID: t("platform.invoices.status_unpaid"),
      OVERDUE: t("platform.invoices.status_overdue"),
      VOID: t("platform.invoices.status_void"),
      DRAFT: t("platform.invoices.status_draft"),
    }[status] ?? status);

  const subscriptionStatusLabel = (status: string) =>
    ({
      ACTIVE: t("platform.subscriptions.status_active"),
      TRIAL: t("platform.subscriptions.status_trial"),
      PAST_DUE: t("platform.subscriptions.status_past_due"),
      CANCELLED: t("platform.subscriptions.status_cancelled"),
      SUSPENDED: t("platform.subscriptions.status_suspended"),
      EXPIRED: t("platform.subscriptions.status_expired"),
    }[status] ?? status);

  const billingCycleLabel = (cycle: string) =>
    ({
      MONTHLY: t("platform.billing.monthly"),
      YEARLY: t("platform.billing.yearly"),
    }[cycle] ?? cycle);

  // ── Queries ────────────────────────────────────────────────────────
  const financialQuery = useQuery({
    queryKey: ["platform-financial-dashboard", dateRange],
    queryFn: () =>
      apiGetPlatformFinancialDashboard({ startDate: dateRange[0], endDate: dateRange[1] }),
    select: (res: any) => res?.data ?? res,
  });
  const fin = financialQuery.data as any;

  const paymentsQuery = useQuery({
    queryKey: ["platform-payment-list", paymentStatus],
    queryFn: () =>
      apiGetPlatformPaymentList({ page: 0, size: PAGE_SIZE, status: paymentStatus || undefined }),
    select: (res: any) => (res?.data?.items ?? res?.items ?? []) as PlatformPaymentItem[],
    enabled: activeTab === "payments",
  });

  const invoicesQuery = useQuery({
    queryKey: ["platform-invoice-list", invoiceStatus],
    queryFn: () =>
      apiGetPlatformInvoiceList({ page: 0, size: PAGE_SIZE, status: invoiceStatus || undefined }),
    select: (res: any) => (res?.data?.items ?? res?.items ?? []) as PlatformInvoiceItem[],
    enabled: activeTab === "invoices",
  });

  const subscriptionsQuery = useQuery({
    queryKey: ["platform-subscription-list", subscriptionStatus],
    queryFn: () =>
      apiGetPlatformSubscriptionList({
        page: 0,
        size: PAGE_SIZE,
        status: subscriptionStatus || undefined,
      }),
    select: (res: any) => (res?.data?.items ?? res?.items ?? []) as PlatformSubscriptionItem[],
    enabled: activeTab === "subscriptions",
  });

  // ── Retry dunning ──────────────────────────────────────────────────
  const retryMutation = useMutation({
    mutationFn: (subscriptionId: string) => apiRetryDunning({ subscriptionId }),
    onSuccess: () => {
      message.success(t("platform.subscriptions.retry_success"));
      queryClient.invalidateQueries({ queryKey: ["platform-subscription-list"] });
    },
    onError: () => message.error(t("platform.subscriptions.retry_error")),
  });

  const TABS: { key: Tab; label: string }[] = [
    { key: "payments", label: t("nav.platform.payments") },
    { key: "invoices", label: t("nav.platform.invoices") },
    { key: "subscriptions", label: t("nav.platform.subscriptions") },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("platform.billing.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {t("platform.billing.subtitle")}
          </p>
        </div>
        <RangePicker
          defaultValue={[dayjs(DEFAULT_START), dayjs(DEFAULT_END)]}
          onChange={(_, strs) => {
            if (strs[0] && strs[1]) setDateRange([strs[0], strs[1]]);
          }}
        />
      </div>

      {/* ── Financial summary ─────────────────────────────────────── */}
      <Card
        title={
          <span className="text-sm font-semibold">
            {t("platform.payments.financial_title")}
          </span>
        }>
        {financialQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl bg-emerald-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">
                  {t("platform.dashboard.mrr")}
                </span>
              </div>
              <p className="text-lg font-bold text-emerald-700">
                {fin?.mrr != null ? Number(fin.mrr).toLocaleString("vi-VN") + "₫" : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  {t("platform.dashboard.total_revenue")}
                </span>
              </div>
              <p className="text-lg font-bold text-blue-700">
                {fin?.totalRevenue != null
                  ? Number(fin.totalRevenue).toLocaleString("vi-VN") + "₫"
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <Users className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-medium text-violet-700">
                  {t("platform.payments.active_subs")}
                </span>
              </div>
              <p className="text-lg font-bold text-violet-700">
                {fin?.activeSubscriptions ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-sky-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-sky-600" />
                <span className="text-xs font-medium text-sky-700">
                  {t("platform.payments.new_subs")}
                </span>
              </div>
              <p className="text-lg font-bold text-sky-700">
                {fin?.newSubscriptions ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">
                  {t("platform.dashboard.churn_rate")}
                </span>
              </div>
              <p className="text-lg font-bold text-amber-700">
                {fin?.churnRate != null ? `${(fin.churnRate * 100).toFixed(1)}%` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span className="text-xs font-medium text-rose-700">
                  {t("platform.payments.failed_payments")}
                </span>
              </div>
              <p className="text-lg font-bold text-rose-700">
                {fin?.failedPayments ?? "—"}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex gap-1 border-b border-stroke">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-slate-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {/* ── TAB: Giao dịch (Payments) ─────────────────────────── */}
          {activeTab === "payments" && (
            <>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted">
                  {t("platform.payments.filter_label")}
                </label>
                <select
                  className="rounded-xl border border-stroke bg-white px-3 py-1.5 text-sm"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}>
                  <option value="">{t("platform.payments.status_all")}</option>
                  <option value="SUCCEEDED">{t("platform.payments.status_succeeded")}</option>
                  <option value="PROCESSING">{t("platform.payments.status_processing")}</option>
                  <option value="PENDING">{t("platform.payments.status_pending")}</option>
                  <option value="FAILED">{t("platform.payments.status_failed")}</option>
                  <option value="REFUNDED">{t("platform.payments.status_refunded")}</option>
                </select>
              </div>
              <Card className="p-0">
                <TableState
                  isLoading={paymentsQuery.isLoading}
                  isError={paymentsQuery.isError}
                  isEmpty={!paymentsQuery.data?.length}
                  emptyText={t("platform.payments.empty")}
                  errorText={t("platform.payments.load_error")}
                  retryText={t("global.retry")}
                  onRefetch={paymentsQuery.refetch}
                />
                {!paymentsQuery.isLoading && !paymentsQuery.isError && !!paymentsQuery.data?.length && (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
                      <tr>
                        <th className="px-4 py-3">{t("platform.payments.col_transaction")}</th>
                        <th className="px-4 py-3">{t("platform.payments.col_company")}</th>
                        <th className="px-4 py-3">{t("platform.payments.col_invoice")}</th>
                        <th className="px-4 py-3">{t("platform.payments.col_amount")}</th>
                        <th className="px-4 py-3">{t("platform.payments.col_provider")}</th>
                        <th className="px-4 py-3">{t("platform.payments.col_status")}</th>
                        <th className="px-4 py-3">{t("platform.payments.col_date")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsQuery.data.map((tx) => (
                        <tr
                          key={tx.paymentId}
                          className="border-t border-stroke hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-muted">
                            {tx.paymentId}
                          </td>
                          <td className="px-4 py-3 font-medium">{tx.companyName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted">
                            {tx.invoiceId}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {tx.amount?.toLocaleString("vi-VN")} {tx.currency?.toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-muted capitalize">{tx.provider}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_STYLE[tx.status] ?? "bg-slate-100 text-slate-700"}`}>
                              {paymentStatusLabel(tx.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted">{tx.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </>
          )}

          {/* ── TAB: Hóa đơn (Invoices) ───────────────────────────── */}
          {activeTab === "invoices" && (
            <>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted">
                  {t("platform.invoices.filter_label")}:
                </label>
                <select
                  className="rounded-xl border border-stroke bg-white px-3 py-1.5 text-sm"
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}>
                  <option value="">{t("platform.payments.status_all")}</option>
                  <option value="PAID">{t("platform.invoices.status_paid")}</option>
                  <option value="UNPAID">{t("platform.invoices.status_unpaid")}</option>
                  <option value="OVERDUE">{t("platform.invoices.status_overdue")}</option>
                  <option value="VOID">{t("platform.invoices.status_void")}</option>
                  <option value="DRAFT">{t("platform.invoices.status_draft")}</option>
                </select>
              </div>
              <Card className="p-0">
                <TableState
                  isLoading={invoicesQuery.isLoading}
                  isError={invoicesQuery.isError}
                  isEmpty={!invoicesQuery.data?.length}
                  emptyText={t("platform.invoices.empty")}
                  errorText={t("platform.invoices.load_error")}
                  retryText={t("global.retry")}
                  onRefetch={invoicesQuery.refetch}
                />
                {!invoicesQuery.isLoading && !invoicesQuery.isError && !!invoicesQuery.data?.length && (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
                      <tr>
                        <th className="px-4 py-3">{t("platform.invoices.col_invoice")}</th>
                        <th className="px-4 py-3">{t("platform.invoices.col_company")}</th>
                        <th className="px-4 py-3">{t("platform.invoices.col_amount")}</th>
                        <th className="px-4 py-3">{t("platform.invoices.col_status")}</th>
                        <th className="px-4 py-3">{t("platform.invoices.col_due_date")}</th>
                        <th className="px-4 py-3">{t("platform.invoices.col_paid_at")}</th>
                        <th className="px-4 py-3">{t("platform.invoices.col_created")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicesQuery.data.map((inv) => (
                        <tr
                          key={inv.invoiceId}
                          className="border-t border-stroke hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-muted">
                            {inv.invoiceId}
                          </td>
                          <td className="px-4 py-3 font-medium">{inv.companyName}</td>
                          <td className="px-4 py-3 font-medium">
                            {inv.amount?.toLocaleString("vi-VN")} {inv.currency?.toUpperCase()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${INVOICE_STATUS_STYLE[inv.status] ?? "bg-slate-100 text-slate-700"}`}>
                              {invoiceStatusLabel(inv.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted">{inv.dueDate ?? "—"}</td>
                          <td className="px-4 py-3 text-muted">{inv.paidAt ?? "—"}</td>
                          <td className="px-4 py-3 text-muted">{inv.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </>
          )}

          {/* ── TAB: Đăng ký (Subscriptions) ──────────────────────── */}
          {activeTab === "subscriptions" && (
            <>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted">
                  {t("platform.subscriptions.filter_status")}:
                </label>
                <select
                  className="rounded-xl border border-stroke bg-white px-3 py-1.5 text-sm"
                  value={subscriptionStatus}
                  onChange={(e) => setSubscriptionStatus(e.target.value)}>
                  <option value="">{t("platform.payments.status_all")}</option>
                  <option value="ACTIVE">{t("platform.subscriptions.status_active")}</option>
                  <option value="TRIAL">{t("platform.subscriptions.status_trial")}</option>
                  <option value="PAST_DUE">{t("platform.subscriptions.status_past_due")}</option>
                  <option value="CANCELLED">{t("platform.subscriptions.status_cancelled")}</option>
                  <option value="SUSPENDED">{t("platform.subscriptions.status_suspended")}</option>
                  <option value="EXPIRED">{t("platform.subscriptions.status_expired")}</option>
                </select>
              </div>
              <Card className="p-0">
                <TableState
                  isLoading={subscriptionsQuery.isLoading}
                  isError={subscriptionsQuery.isError}
                  isEmpty={!subscriptionsQuery.data?.length}
                  emptyText={t("platform.subscriptions.empty")}
                  errorText={t("platform.subscriptions.load_error")}
                  retryText={t("global.retry")}
                  onRefetch={subscriptionsQuery.refetch}
                />
                {!subscriptionsQuery.isLoading &&
                  !subscriptionsQuery.isError &&
                  !!subscriptionsQuery.data?.length && (
                    <table className="w-full">
                      <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
                        <tr>
                          <th className="px-4 py-3">{t("platform.subscriptions.col_company")}</th>
                          <th className="px-4 py-3">{t("platform.subscriptions.col_plan")}</th>
                          <th className="px-4 py-3">{t("platform.subscriptions.col_status")}</th>
                          <th className="px-4 py-3">{t("platform.subscriptions.col_billing")}</th>
                          <th className="px-4 py-3">{t("platform.subscriptions.col_renewal")}</th>
                          <th className="px-4 py-3 text-right">{t("global.action")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptionsQuery.data.map((sub) => (
                          <tr
                            key={sub.subscriptionId}
                            className="border-t border-stroke hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium">{sub.companyName}</td>
                            <td className="px-4 py-3 text-muted">{sub.planCode}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${SUBSCRIPTION_STATUS_STYLE[sub.status] ?? "bg-slate-100 text-slate-700"}`}>
                                {subscriptionStatusLabel(sub.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted">
                              {billingCycleLabel(sub.billingCycle)}
                            </td>
                            <td className="px-4 py-3 text-muted">{sub.currentPeriodEnd}</td>
                            <td className="px-4 py-3 text-right">
                              {(sub.status === "PAST_DUE" || sub.status === "SUSPENDED") && (
                                <button
                                  className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                                  onClick={() => setRetryTarget(sub)}>
                                  <RefreshCw className="h-3 w-3" />
                                  {t("platform.subscriptions.retry_payment")}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ── Retry modal ───────────────────────────────────────────── */}
      <Modal
        open={!!retryTarget}
        title={t("platform.subscriptions.retry_confirm_title")}
        okText={t("platform.subscriptions.retry_payment")}
        okButtonProps={{ loading: retryMutation.isPending }}
        onOk={() => {
          if (retryTarget) retryMutation.mutate(retryTarget.subscriptionId);
          setRetryTarget(null);
        }}
        onCancel={() => setRetryTarget(null)}>
        <p>{t("platform.subscriptions.retry_confirm_body")}</p>
        <p className="mt-1 font-medium">
          {retryTarget?.companyName} — {retryTarget?.planCode}
        </p>
      </Modal>
    </div>
  );
};

export default PlatformBilling;
