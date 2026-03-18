import { EventTypes, ToastMessageStatus } from "@/constants";
import { eventBus } from "./eventBus";

export const notify = {
  success: (message: string) =>
    eventBus.emit(EventTypes.SHOW_MESSAGE, {
      type: ToastMessageStatus.SUCCESS,
      message,
    }),
  error: (message: string) =>
    eventBus.emit(EventTypes.SHOW_MESSAGE, {
      type: ToastMessageStatus.ERROR,
      message,
    }),
  warning: (message: string) =>
    eventBus.emit(EventTypes.SHOW_MESSAGE, {
      type: ToastMessageStatus.WARNING,
      message,
    }),
  info: (message: string) =>
    eventBus.emit(EventTypes.SHOW_MESSAGE, {
      type: ToastMessageStatus.INFO,
      message,
    }),
};
