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
  companyId: string;
  planCode: string;
  billingCycle?: string;
  paymentMethodId?: string;
  couponCode?: string;
}

/** com.sme.billing.subscription.update */
export interface SubscriptionUpdateRequest {
  subscriptionId: string;
  planCode?: string;
  billingCycle?: string;
  status?: string;
}

/** com.sme.billing.subscription.update → response data */
export interface SubscriptionUpdateResponse {
  subscriptionId: string;
  planCode: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  autoRenew: boolean | null;
  /** true khi upgrade trả phí — cần gọi payment.createIntent với paymentInvoiceId */
  paymentRequired: boolean;
  /** invoiceId của invoice chờ thanh toán (chỉ có khi paymentRequired=true) */
  paymentInvoiceId: string | null;
  pendingChangeId: string | null;
  pendingPlanCode: string | null;
  pendingBillingCycle: string | null;
  prorateChargeVnd: number | null;
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

/** com.sme.billing.subscription.history / com.sme.billing.subscription.planTimeline */
export interface SubscriptionHistoryRequest {
  companyId?: string;
  subscriptionId?: string;
  /** Calendar year (system TZ); intersects with fromDate/toDate when present */
  year?: number;
  /** yyyy-MM-dd — range filter on effective period vs calendar day */
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

/** com.sme.billing.subscription.history */
export interface SubscriptionHistoryItem {
  historyId: string;
  subscriptionId: string;
  oldPlanCode: string | null;
  newPlanCode: string | null;
  billingCycle: string;
  changedBy: string | null;
  /** Resolved from tenant users; null/omit if Stripe/system or unknown */
  changedByName?: string | null;
  changedAt: string;
  effectiveFrom: string | null;
  /** null = current segment until next change */
  effectiveTo: string | null;
}

/** Paging metadata returned with history + planTimeline */
export interface SubscriptionBillingListPaging {
  /** 0-based page index */
  page: number;
  /** Applied page size (after BE clamp) */
  size: number;
  /** Total rows matching filter */
  total: number;
  /** ceil(total/size), 0 if total === 0 */
  totalPages: number;
}

export interface SubscriptionHistoryResponse extends SubscriptionBillingListPaging {
  items: SubscriptionHistoryItem[];
}

/** com.sme.billing.subscription.planTimeline — same payload as history */
export type SubscriptionPlanTimelineRequest = SubscriptionHistoryRequest;

/** com.sme.billing.subscription.planTimeline */
export interface SubscriptionPlanTimelineSegment {
  subscriptionId: string;
  planId: string;
  planCode: string;
  planName: string;
  billingCycle: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  historyId: string;
  changedBy?: string | null;
  changedByName?: string | null;
  changedAt?: string;
}

export interface SubscriptionPlanTimelineResponse
  extends SubscriptionBillingListPaging {
  segments: SubscriptionPlanTimelineSegment[];
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
  paymentIntentId: string;
  paymentTransactionId?: string;
  gateway?: string;
  amount?: number;
  currency?: string;
  status?: string;
  invoiceId?: string;
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
