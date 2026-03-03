import { gatewayRequest } from "../core/gateway";
import type {
  NotificationListRequest,
  NotificationMarkReadRequest,
  NotificationListResponse,
  NotificationMarkReadResponse,
} from "@/interface/notification";

/** com.sme.notification.list */
export const apiListNotifications = (params?: NotificationListRequest) =>
  gatewayRequest<NotificationListRequest, NotificationListResponse>(
    "com.sme.notification.list",
    params ?? {},
    { flatPayload: true },
  );

/** com.sme.notification.markRead */
export const apiMarkNotificationRead = (notificationId: string | "ALL") =>
  gatewayRequest<NotificationMarkReadRequest, NotificationMarkReadResponse>(
    "com.sme.notification.markRead",
    { notificationId },
  );
