export const ToastMessageStatus = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

export type ToastMessageStatus =
  (typeof ToastMessageStatus)[keyof typeof ToastMessageStatus];
