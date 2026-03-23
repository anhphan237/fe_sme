import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import { useUserStore } from "@/stores/user.store";
import {
  apiListNotifications,
  apiMarkNotificationRead,
} from "@/api/notification/notification.api";
import type {
  NotificationItem,
  NotificationItemRaw,
} from "@/interface/notification";

/** Normalise a raw REST item to the display model used by the UI & WebSocket push */
function normalise(raw: NotificationItemRaw): NotificationItem {
  return {
    notificationId: raw.notificationId,
    title: raw.title,
    body: raw.content,
    read: raw.status?.toUpperCase() === "READ",
    createdAt: raw.createdAt,
    type: raw.type,
    refType: raw.refType,
    refId: raw.refId,
  };
}

interface UseNotificationsReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string | "ALL") => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const userId = useUserStore((s) => s.currentUser?.id);
  const { isConnected, subscribe } = useWebSocket();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const subscribedRef = useRef(false);

  // Derived: count items that are not yet read
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Initial fetch — load up to 30 most recent notifications
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiListNotifications({ limit: 30, offset: 0 })
      .then((data) => {
        if (cancelled) return;
        if (data?.items) {
          setNotifications(data.items.map(normalise));
        }
      })
      .catch(() => {
        // swallow — user may not be authenticated yet
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to live push when WS is connected
  useEffect(() => {
    if (!isConnected || !userId || subscribedRef.current) return;

    const destination = `/queue/notifications/${userId}`;
    const sub = subscribe(destination, (body) => {
      try {
        // WsNotificationPayload already uses body/read fields — no normalisation needed
        const item: NotificationItem = JSON.parse(body);
        setNotifications((prev) => [item, ...prev]);
      } catch {
        // ignore malformed payload
      }
    });

    if (sub) {
      subscribedRef.current = true;
    }

    return () => {
      sub?.unsubscribe();
      subscribedRef.current = false;
    };
  }, [isConnected, userId, subscribe]);

  const markAsRead = useCallback(
    async (id: string | "ALL") => {
      // Resolve ids to send to BE (accepts string[] only)
      const ids =
        id === "ALL" ? notifications.map((n) => n.notificationId) : [id];

      if (ids.length === 0) return;

      await apiMarkNotificationRead(ids);

      // Optimistic update
      setNotifications((prev) =>
        id === "ALL"
          ? prev.map((n) => ({ ...n, read: true }))
          : prev.map((n) =>
              n.notificationId === id ? { ...n, read: true } : n,
            ),
      );
    },
    [notifications],
  );

  return { notifications, unreadCount, loading, markAsRead };
}
