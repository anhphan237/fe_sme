// ============================================================
// Billing Module Interfaces
// Maps to BE: modules/billing
// Operations: com.sme.billing.*
// ============================================================

// ---------------------------
// Subscription
// ---------------------------

/** com.sme.billing.subscription.create */
export interface SubscriptionCreateRequest {
  planId: string;
  paymentMethodId?: string;
  couponCode?: string;
}

/** com.sme.billing.subscription.update */
export interface SubscriptionUpdateRequest {
  subscriptionId: string;
  planId?: string;
  status?: string;
}

/** com.sme.billing.subscription.getCurrent */
export interface SubscriptionGetCurrentRequest {
  tenantId?: string;
}

/** Subscription response */
export interface SubscriptionResponse {
  subscriptionId: string;
  planId: string;
  planName: string;
  status: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "TRIALING";
  currentPeriodEnd: string;
}

/** com.sme.billing.subscription.getCurrent → full response */
export interface SubscriptionCurrentResponse extends SubscriptionResponse {
  trialEnd: string | null;
  seats: number;
  usedSeats: number;
}

// ---------------------------
// Plan
// ---------------------------

/** com.sme.billing.plan.get */
export interface PlanGetRequest {
  planId: string;
}

/** com.sme.billing.plan.list */
export interface PlanListRequest {
  /** Filter by status e.g. "ACTIVE" | "INACTIVE" */
  status?: string;
}

/**
 * Matches BE: PlanSummaryResponse
 * Fields: planId, code, name, employeeLimitPerMonth, priceVndMonthly, priceVndYearly, status
 */
export interface PlanSummaryResponse {
  planId: string;
  code: string;
  name: string;
  employeeLimitPerMonth: number | null;
  priceVndMonthly: number | null;
  priceVndYearly: number | null;
  status: string;
}

/** com.sme.billing.plan.list → response data */
export interface PlanListResponse {
  plans: PlanSummaryResponse[];
}

/** com.sme.billing.plan.get → response data */
export interface PlanGetResponse extends PlanSummaryResponse {}

/**
 * @deprecated Use PlanSummaryResponse — kept for backward compatibility
 */
export interface PlanItem {
  planId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingCycle: "MONTHLY" | "YEARLY";
  features: string[];
  maxSeats: number | null;
}

// ---------------------------
// Invoice
// ---------------------------

/** com.sme.billing.invoice.generate */
export interface InvoiceGenerateRequest {
  subscriptionId?: string;
  periodStart?: string;
  periodEnd?: string;
}

/** com.sme.billing.invoice.list */
export interface InvoiceListRequest {
  status?: "PAID" | "UNPAID" | "VOID";
  page?: number;
  size?: number;
}

/** com.sme.billing.invoice.get */
export interface InvoiceGetRequest {
  invoiceId: string;
}

/** Invoice summary item */
export interface InvoiceSummary {
  invoiceId: string;
  amount: number;
  currency: string;
  status: "PAID" | "UNPAID" | "VOID";
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

/** com.sme.billing.invoice.list → response data */
export interface InvoiceListResponse {
  items: InvoiceSummary[];
  total: number;
}

/** com.sme.billing.invoice.get → full detail */
export interface InvoiceDetailResponse extends InvoiceSummary {
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  downloadUrl: string | null;
}

/** com.sme.billing.invoice.generate → response data */
export interface InvoiceGenerateResponse {
  invoiceId: string;
  status: string;
}

// ---------------------------
// Payment
// ---------------------------

/** com.sme.billing.payment.createIntent */
export interface PaymentCreateIntentRequest {
  amount: number;
  currency: string;
  invoiceId?: string;
}

/** com.sme.billing.payment.createIntent → response data */
export interface PaymentCreateIntentResponse {
  clientSecret: string;
  intentId: string;
}

/** com.sme.billing.payment.connect */
export interface PaymentConnectRequest {
  provider: "stripe" | "paypal" | "vnpay";
  code?: string;
}

/** com.sme.billing.payment.connect → response data */
export interface PaymentConnectResponse {
  connected: boolean;
  provider: string;
}

/** com.sme.billing.payment.providers */
export interface PaymentProvidersRequest {
  tenantId?: string;
}

/** com.sme.billing.payment.providers → response data */
export interface PaymentProvidersResponse {
  providers: { name: string; connected: boolean }[];
}

/** com.sme.billing.payment.status */
export interface PaymentStatusRequest {
  intentId?: string;
  invoiceId?: string;
}

/** com.sme.billing.payment.status → response data */
export interface PaymentStatusResponse {
  status: "SUCCEEDED" | "PENDING" | "FAILED";
  paidAt: string | null;
}

/** com.sme.billing.payment.transactions */
export interface PaymentTransactionsRequest {
  page?: number;
  size?: number;
}

/** Single payment transaction */
export interface PaymentTransaction {
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  invoiceId: string | null;
}

/** com.sme.billing.payment.transactions → response data */
export interface PaymentTransactionsResponse {
  items: PaymentTransaction[];
  total: number;
}

// ---------------------------
// Dunning
// ---------------------------

/** com.sme.billing.dunning.retry */
export interface DunningRetryRequest {
  invoiceId: string;
}

/** com.sme.billing.dunning.retry → response data */
export interface DunningRetryResponse {
  retried: boolean;
  newStatus: string;
}

// ---------------------------
// Usage
// ---------------------------

/** com.sme.billing.usage.track */
export interface UsageTrackRequest {
  feature: string;
  quantity?: number;
}

/** com.sme.billing.usage.track → response data */
export interface UsageTrackResponse {
  recorded: boolean;
}

/** com.sme.billing.usage.check */
export interface UsageCheckRequest {
  feature: string;
}

/** com.sme.billing.usage.check → response data */
export interface UsageCheckResponse {
  feature: string;
  allowed: boolean;
  current: number;
  limit: number | null;
}

/** com.sme.billing.usage.summary */
export interface UsageSummaryRequest {
  periodStart?: string;
  periodEnd?: string;
}

/** Feature usage summary item */
export interface FeatureUsageSummary {
  feature: string;
  used: number;
  limit: number | null;
  percentUsed: number | null;
}

/** com.sme.billing.usage.summary → response data */
export interface UsageSummaryResponse {
  items: FeatureUsageSummary[];
}
