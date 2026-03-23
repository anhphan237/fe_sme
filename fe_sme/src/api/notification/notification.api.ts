import { gatewayRequest } from "../core/gateway";
import type {
  NotificationListRequest,
  NotificationMarkReadRequest,
  NotificationListResponse,
  NotificationMarkReadResponse,
} from "@/interface/notification";

/** com.sme.notification.list — params nested inside payload */
export const apiListNotifications = (params?: NotificationListRequest) =>
  gatewayRequest<NotificationListRequest, NotificationListResponse>(
    "com.sme.notification.list",
    params ?? {},
  );

/**
 * com.sme.notification.markRead
 * Pass a single id or the special string "ALL" to mark every notification read.
 * "ALL" is resolved to the full id list inside useNotifications hook before
 * calling this function.
 */
export const apiMarkNotificationRead = (notificationIds: string[]) =>
  gatewayRequest<NotificationMarkReadRequest, NotificationMarkReadResponse>(
    "com.sme.notification.markRead",
    { notificationIds },
  );
