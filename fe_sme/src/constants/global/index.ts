export const APP_CONFIG = {
  ACCESS_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  DEFAULT_PAGE_SIZE: 20,
  GATEWAY_PATH: "/api/v1/gateway",
} as const;

export const EventTypes = {
  SHOW_MESSAGE: "SHOW_MESSAGE",
  LOGOUT: "LOGOUT",
  RELOAD_USER: "RELOAD_USER",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export const USER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  INVITED: "Đã mời",
  DISABLED: "Đã khóa",
};

export const ENTITY_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
};
