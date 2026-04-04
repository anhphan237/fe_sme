import { gatewayRequest } from "../core/gateway";
import type {
  PlanListResponse,
  PlanGetResponse,
  SubscriptionUpdateRequest,
  PaymentCreateIntentResponse,
} from "@/interface/billing";

// ── Subscription ────────────────────────────────────────────

/** com.sme.billing.subscription.create */
export const apiCreateSubscription = (
  companyId: string,
  planCode: string,
  billingCycle?: string,
) =>
  gatewayRequest<
    { companyId: string; planCode: string; billingCycle?: string },
    unknown
  >("com.sme.billing.subscription.create", {
    companyId,
    planCode,
    ...(billingCycle && { billingCycle }),
  });

/** com.sme.billing.subscription.update */
export const apiUpdateSubscription = (payload: SubscriptionUpdateRequest) =>
  gatewayRequest<SubscriptionUpdateRequest, unknown>(
    "com.sme.billing.subscription.update",
    {
      subscriptionId: payload.subscriptionId,
      planCode: payload.planCode,
      billingCycle: payload.billingCycle,
      status: payload.status ?? "ACTIVE",
    },
  );

/** com.sme.billing.subscription.getCurrent */
export const apiGetSubscription = (companyId?: string) =>
  gatewayRequest<{ companyId?: string }, unknown>(
    "com.sme.billing.subscription.getCurrent",
    companyId ? { companyId } : {},
  );

// ── Plan ────────────────────────────────────────────────────

/** com.sme.billing.plan.list */
export const apiGetPlans = (status?: string): Promise<PlanListResponse> =>
  gatewayRequest<{ status?: string }, PlanListResponse>(
    "com.sme.billing.plan.list",
    status ? { status } : {},
  );

/** com.sme.billing.plan.get */
export const apiGetCurrentPlan = (planId?: string): Promise<PlanGetResponse> =>
  gatewayRequest<{ planId?: string }, PlanGetResponse>(
    "com.sme.billing.plan.get",
    planId ? { planId } : {},
  );

// ── Usage ───────────────────────────────────────────────────

/** com.sme.billing.usage.track */
export const apiTrackUsage = (
  subscriptionId: string,
  usageType: string,
  quantity: number,
) =>
  gatewayRequest<
    { subscriptionId: string; usageType: string; quantity: number },
    unknown
  >("com.sme.billing.usage.track", { subscriptionId, usageType, quantity });

/** com.sme.billing.usage.check */
export const apiGetUsage = (month?: string) =>
  gatewayRequest<{ month?: string }, unknown>(
    "com.sme.billing.usage.check",
    month ? { month } : {},
  );

/** com.sme.billing.usage.summary */
export const apiGetUsageSummary = (subscriptionId?: string, month?: string) =>
  gatewayRequest<{ subscriptionId?: string; month?: string }, unknown>(
    "com.sme.billing.usage.summary",
    {
      ...(subscriptionId && { subscriptionId }),
      ...(month && { month }),
    },
  );

// ── Invoice ─────────────────────────────────────────────────

/** com.sme.billing.invoice.generate */
export const apiGenerateInvoice = (
  subscriptionId: string,
  periodStart: string,
  periodEnd: string,
) =>
  gatewayRequest<
    { subscriptionId: string; periodStart: string; periodEnd: string },
    unknown
  >("com.sme.billing.invoice.generate", {
    subscriptionId,
    periodStart,
    periodEnd,
  });

/** com.sme.billing.invoice.list */
export const apiGetInvoices = (subscriptionId?: string, status?: string) =>
  gatewayRequest<{ subscriptionId?: string; status?: string }, unknown>(
    "com.sme.billing.invoice.list",
    {
      ...(subscriptionId && { subscriptionId }),
      ...(status && { status }),
    },
  );

/** com.sme.billing.invoice.get */
export const apiGetInvoiceById = (invoiceId: string) =>
  gatewayRequest<{ invoiceId: string }, unknown>(
    "com.sme.billing.invoice.get",
    { invoiceId },
  );

// ── Payment ─────────────────────────────────────────────────

/** com.sme.billing.payment.createIntent */
export const apiCreatePaymentIntent = (invoiceId: string) =>
  gatewayRequest<{ invoiceId: string }, PaymentCreateIntentResponse>(
    "com.sme.billing.payment.createIntent",
    { invoiceId },
  );

/** com.sme.billing.payment.connect */
export const apiConnectPayment = (payload: { provider: string }) =>
  gatewayRequest<{ provider: string }, unknown>(
    "com.sme.billing.payment.connect",
    payload,
  );

/** com.sme.billing.payment.providers */
export const apiGetPaymentProviders = () =>
  gatewayRequest<Record<string, never>, unknown>(
    "com.sme.billing.payment.providers",
    {},
  );

/** com.sme.billing.payment.status */
export const apiGetPaymentStatus = (
  paymentIntentId: string,
  invoiceId?: string,
) =>
  gatewayRequest<{ paymentIntentId: string; invoiceId?: string }, unknown>(
    "com.sme.billing.payment.status",
    { paymentIntentId, ...(invoiceId ? { invoiceId } : {}) },
  );

/** com.sme.billing.payment.transactions */
export const apiGetPaymentTransactions = () =>
  gatewayRequest<Record<string, never>, unknown>(
    "com.sme.billing.payment.transactions",
    {},
  );

// ── Dunning ─────────────────────────────────────────────────

/** com.sme.billing.dunning.retry */
export const apiDunningRetry = (
  dunningCaseId?: string,
  subscriptionId?: string,
) =>
  gatewayRequest<{ dunningCaseId?: string; subscriptionId?: string }, unknown>(
    "com.sme.billing.dunning.retry",
    {
      ...(dunningCaseId && { dunningCaseId }),
      ...(subscriptionId && { subscriptionId }),
    },
  );

// ── Subscription ────────────────────────────────────────────
