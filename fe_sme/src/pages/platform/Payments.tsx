import { useState } from "react";
import { Card, Empty, Skeleton, DatePicker } from "antd";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, AlertTriangle, Users } from "lucide-react";
import dayjs from "dayjs";
import {
  apiGetPlatformPaymentList,
  apiGetPlatformFinancialDashboard,
} from "@/api/platform/platform.api";
import type { PlatformPaymentItem } from "@/interface/platform";
import { useLocale } from "@/i18n";

const { RangePicker } = DatePicker;

const DEFAULT_START = dayjs().subtract(30, "day").format("YYYY-MM-DD");
const DEFAULT_END = dayjs().format("YYYY-MM-DD");

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
  const [dateRange, setDateRange] = useState<[string, string]>([
    DEFAULT_START,
    DEFAULT_END,
  ]);

  const financialQuery = useQuery({
    queryKey: ["platform-financial-dashboard", dateRange],
    queryFn: () =>
      apiGetPlatformFinancialDashboard({
        startDate: dateRange[0],
        endDate: dateRange[1],
      }),
    select: (res: any) => res?.data ?? res,
  });

  const fin = financialQuery.data as any;

  const { data, isLoading, isError, refetch } =
    usePaymentListQuery(statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("platform.payments.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {t("platform.payments.subtitle")}
          </p>
        </div>
        <RangePicker
          defaultValue={[dayjs(DEFAULT_START), dayjs(DEFAULT_END)]}
          onChange={(_, strs) => {
            if (strs[0] && strs[1]) setDateRange([strs[0], strs[1]]);
          }}
        />
      </div>

      {/* Financial Summary */}
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
                {fin?.totalRevenue != null ? Number(fin.totalRevenue).toLocaleString("vi-VN") + "₫" : "—"}
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
