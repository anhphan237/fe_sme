export const STATUS_DONE = "Done";
export const STATUS_DONE_API = "DONE";

export const STATUS_TAG_COLOR: Record<string, string> = {
  TODO: "default",
  IN_PROGRESS: "processing",
  ASSIGNED: "geekblue",
  WAIT_ACK: "orange",
  PENDING_APPROVAL: "gold",
  DONE: "success",
};

export const STAGE_TAG_COLOR: Record<string, string> = {
  PRE_BOARDING: "purple",
  DAY_1: "blue",
  DAY_7: "cyan",
  DAY_30: "lime",
  DAY_60: "green",
};

export const APPROVAL_STATUS_COLOR: Record<string, string> = {
  NONE: "default",
  PENDING: "gold",
  APPROVED: "success",
  REJECTED: "error",
};

export const SCHEDULE_STATUS_COLOR: Record<string, string> = {
  UNSCHEDULED: "default",
  PROPOSED: "processing",
  CONFIRMED: "success",
  RESCHEDULED: "orange",
  CANCELLED: "error",
  MISSED: "volcano",
};
