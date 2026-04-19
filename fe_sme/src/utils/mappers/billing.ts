/**
 * Billing module — data mappers (shared by Pages)
 * Transforms raw gateway responses into typed UI models.
 */
import type {
  BillingPlan,
  Invoice,
  PaymentIntent,
  PaymentProvider,
  PaymentTransaction,
  Subscription,
  UsageMetric,
} from "@/shared/types";

// ── Helpers ─────────────────────────────────────────────────

export const formatVnd = (amount?: number | null): string =>
  amount == null
    ? "0 ₫"
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount);

export const INVOICE_STATUS_MAP: Record<string, Invoice["status"]> = {
  DRAFT: "Draft",
  ISSUED: "Open",
  PAID: "Paid",
  VOID: "Void",
  OVERDUE: "Overdue",
};

// ── Mappers ─────────────────────────────────────────────────

export const mapPlan = (p: any): BillingPlan => {
  const limit = p.employeeLimitPerMonth ?? 0;
  const priceRaw = p.priceVndMonthly ?? 0;
  const priceYearlyRaw = p.priceVndYearly ?? 0;
  return {
    id: p.planId ?? p.id ?? "",
    code: p.code ?? "",
    name: p.name ?? "",
    status: p.status ?? "",
    price: formatVnd(p.priceVndMonthly),
    priceYearly: formatVnd(p.priceVndYearly),
    priceRaw,
    priceYearlyRaw,
    employeeLimit: limit,
    limits: limit > 0 ? `Tối đa ${limit} nhân viên/tháng` : "",
    features: [
      limit > 0 ? `Tối đa ${limit} nhân viên mỗi tháng` : "",
      p.priceVndYearly ? `Gói năm: ${formatVnd(p.priceVndYearly)}` : "",
    ].filter(Boolean),
    current: false,
    recommended: p.recommended ?? false,
  };
};

export const mapInvoice = (inv: any): Invoice => ({
  id: inv.invoiceId ?? inv.id ?? "",
  invoiceNo: inv.invoiceNo ?? inv.invoiceId ?? inv.id ?? "",
  amount: formatVnd(inv.amountTotal ?? inv.amount),
  amountRaw:
    typeof inv?.amountTotal === "number"
      ? inv.amountTotal
      : Number(inv?.amount) || 0,
  currency: inv.currency ?? "VND",
  status: INVOICE_STATUS_MAP[String(inv?.status ?? "").toUpperCase()] ?? "Open",
  date: inv.issuedAt
    ? new Date(inv.issuedAt).toLocaleDateString("vi-VN")
    : (inv.date ?? ""),
  dueDate: inv.dueAt
    ? new Date(inv.dueAt).toLocaleDateString("vi-VN")
    : undefined,
  companyId: inv.companyId ?? null,
  eInvoiceUrl: inv.eInvoiceUrl,
});

export const mapUsage = (res: any): UsageMetric[] => [
  {
    label: "Employees onboarded",
    used: res.currentUsage ?? 0,
    limit: res.employeeLimitPerMonth ?? 0,
    alertLevel: res.alertLevel,
    limitPercent: res.limitPercent,
    month: res.month,
  },
];

export const mapProvider = (p: any): PaymentProvider => ({
  name: p.name ?? "",
  status: p.status === "ACTIVE" ? "Connected" : "Disconnected",
  accountId: p.accountId,
  lastSync: p.lastSync,
});

export const mapPaymentIntent = (p: any): PaymentIntent => ({
  id: p.paymentIntentId ?? p.id ?? "",
  paymentTransactionId: p.paymentTransactionId,
  clientSecret: p.clientSecret ?? "",
  gateway: p.gateway,
  amount: p.amount ?? 0,
  currency: p.currency ?? "VND",
  status: (p.status ?? "").toLowerCase() as PaymentIntent["status"],
  invoiceId: p.invoiceId ?? "",
});

export const mapTransaction = (t: any): PaymentTransaction => ({
  id: t.id ?? "",
  invoiceId: t.invoiceId ?? "",
  amount: typeof t.amount === "number" ? formatVnd(t.amount) : (t.amount ?? ""),
  currency: t.currency ?? "VND",
  status: (t.status?.toLowerCase() ??
    "pending") as PaymentTransaction["status"],
  provider: t.provider ?? "",
  createdAt: t.createdAt ?? "",
  companyId: t.companyId ?? null,
});

export const mapSubscription = (s: any): Subscription => ({
  subscriptionId: s.subscriptionId ?? "",
  planCode: s.planCode ?? "",
  status: s.status ?? "",
  billingCycle: s.billingCycle,
  currentPeriodStart: s.currentPeriodStart,
  currentPeriodEnd: s.currentPeriodEnd,
  autoRenew: s.autoRenew,
  prorateCreditVnd: s.prorateCreditVnd,
  prorateChargeVnd: s.prorateChargeVnd,
  invoiceId: s.invoiceId,
  paymentRequired: s.paymentRequired ?? false,
  paymentInvoiceId: s.paymentInvoiceId ?? null,
  pendingChangeId: s.pendingChangeId ?? null,
  pendingPlanCode: s.pendingPlanCode ?? null,
  pendingBillingCycle: s.pendingBillingCycle ?? null,
});
