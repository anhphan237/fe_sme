import { gatewayRequest } from "../core/gateway";
import type { PlatformSubscriptionMetricsRequest } from "@/interface/admin";

/** com.sme.analytics.platform.subscription.metrics */
export const apiGetPlatformSubscriptionMetrics = (
  payload: PlatformSubscriptionMetricsRequest,
) => gatewayRequest("com.sme.analytics.platform.subscription.metrics", payload);
