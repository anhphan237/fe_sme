export const ERROR_CODE = {
  // ── Identity / Auth ────────────────────────────────────────
  INVALID_LOGIN: "AUTH_ERR_001",
  TOKEN_EXPIRED: "AUTH_ERR_002",
  USER_NOT_FOUND: "USR_ERR_001",
  EMAIL_EXISTS: "USR_ERR_002",
  USER_DISABLED: "USR_ERR_003",

  // ── Company ────────────────────────────────────────────────
  COMPANY_NOT_FOUND: "COM_ERR_001",
  COMPANY_DUPLICATE: "COM_ERR_002",
  DEPARTMENT_NOT_FOUND: "DEP_ERR_001",
  DEPARTMENT_DUPLICATE: "DEP_ERR_002",

  // ── Billing ────────────────────────────────────────────────
  PLAN_NOT_FOUND: "PLN_ERR_001",
  SUBSCRIPTION_NOT_FOUND: "SUB_ERR_001",
  SUBSCRIPTION_EXPIRED: "SUB_ERR_002",
  INVOICE_NOT_FOUND: "INV_ERR_001",
  PAYMENT_FAILED: "PAY_ERR_001",

  // ── Onboarding ─────────────────────────────────────────────
  TEMPLATE_NOT_FOUND: "OBD_ERR_001",
  INSTANCE_NOT_FOUND: "OBD_ERR_002",
  TASK_NOT_FOUND: "OBD_ERR_003",

  // ── Document ───────────────────────────────────────────────
  DOCUMENT_NOT_FOUND: "DOC_ERR_001",
  DOCUMENT_UPLOAD_FAILED: "DOC_ERR_002",

  // ── Notification ───────────────────────────────────────────
  NOTIFICATION_NOT_FOUND: "NTF_ERR_001",

  // ── Survey ─────────────────────────────────────────────────
  SURVEY_NOT_FOUND: "SRV_ERR_001",

  // ── Common ─────────────────────────────────────────────────
  UNKNOWN_ERROR: "SYS_ERR_000",
  VALIDATION_ERROR: "SYS_ERR_001",
  UNAUTHORIZED: "SYS_ERR_403",
  NOT_FOUND: "SYS_ERR_404",
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
