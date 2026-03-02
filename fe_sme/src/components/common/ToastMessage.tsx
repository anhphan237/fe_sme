/**
 * ToastMessage — global message display component (ported from PMS)
 * Uses eventBus to decouple notification calls from component tree.
 *
 * Usage:
 *   1. Mount <ToastMessage /> once at app root (e.g. App.tsx)
 *   2. Call notify.success('Done!') / notify.error('Fail') anywhere
 */
import { message } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { useEffect } from "react";
import { EventTypes, ToastMessageStatus } from "@/constants";
import { eventBus } from "@/utils/eventBus";

// ─── Singleton message API ────────────────────────────────────────────────────
let messageApi: MessageInstance | null = null;

export interface ToastPayload {
  type: ToastMessageStatus;
  content: string;
  duration?: number;
}

const showMessage = (payload: ToastPayload) => {
  if (!messageApi) return;
  const { type, content, duration = 3 } = payload;
  switch (type) {
    case ToastMessageStatus.SUCCESS:
      messageApi.success(content, duration);
      break;
    case ToastMessageStatus.ERROR:
      messageApi.error(content, duration);
      break;
    case ToastMessageStatus.WARNING:
      messageApi.warning(content, duration);
      break;
    case ToastMessageStatus.INFO:
    default:
      messageApi.info(content, duration);
  }
};

// ─── Public notify API ────────────────────────────────────────────────────────
export const notify = {
  success: (content: string, duration?: number) =>
    eventBus.emit(EventTypes.SHOW_MESSAGE, {
      type: ToastMessageStatus.SUCCESS,
      content,
      duration,
    }),
  error: (content: string, duration?: number) =>
    eventBus.emit(EventTypes.SHOW_MESSAGE, {
      type: ToastMessageStatus.ERROR,
      content,
      duration,
    }),
  warning: (content: string, duration?: number) =>
    eventBus.emit(EventTypes.SHOW_MESSAGE, {
      type: ToastMessageStatus.WARNING,
      content,
      duration,
    }),
  info: (content: string, duration?: number) =>
    eventBus.emit(EventTypes.SHOW_MESSAGE, {
      type: ToastMessageStatus.INFO,
      content,
      duration,
    }),
};

// ─── Component ────────────────────────────────────────────────────────────────
const ToastMessage = () => {
  const [api, contextHolder] = message.useMessage();

  useEffect(() => {
    messageApi = api;

    const handler = (payload: ToastPayload) => showMessage(payload);
    eventBus.on(EventTypes.SHOW_MESSAGE, handler);

    return () => {
      eventBus.off(EventTypes.SHOW_MESSAGE, handler);
      messageApi = null;
    };
  }, [api]);

  return <>{contextHolder}</>;
};

export default ToastMessage;
