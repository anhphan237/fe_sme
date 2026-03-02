// ============================================================
// Admin Module Interfaces
// Maps to BE: modules/analytics, admin endpoints
// Operations: com.sme.analytics.*
// ============================================================

// ---------------------------
// Platform Subscription Metrics
// ---------------------------

/** com.sme.analytics.platform.subscription.metrics */
export interface PlatformSubscriptionMetricsRequest {
  startDate: string;
  endDate: string;
}

/** com.sme.analytics.platform.subscription.metrics → response data */
export interface PlatformSubscriptionMetricsResponse {
  totalSubscriptions: number;
  activeSubscriptions: number;
  mrr: number;
  churn: number;
  [key: string]: unknown;
}
