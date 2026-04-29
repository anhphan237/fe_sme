/**
 * Billing module — data mappers (shared by Pages)
 * Transforms raw gateway responses into typed UI models.
 */
import type {
  BillingPlan,
  Invoice,
  PaymentIntent,
  PaymentProvider,
  PaymentTransaction,
  Subscription,
  UsageMetric,
} from "@/shared/types";

// ── Types ────────────────────────────────────────────────────

type AnyObj = Record<string, unknown>;

// ── Helpers ─────────────────────────────────────────────────

const isObject = (value: unknown): value is AnyObj =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asObject = (value: unknown): AnyObj => {
  return isObject(value) ? value : {};
};

const unwrapValue = (res: unknown): unknown => {
  if (!isObject(res)) return res;

  const root = res;
  const data = root.data;

  if (isObject(data) && "data" in data) {
    return data.data;
  }

  if (data !== undefined) {
    return data;
  }

  return root;
};

const unwrapObject = (res: unknown): AnyObj => {
  return asObject(unwrapValue(res));
};

const getString = (
  obj: AnyObj,
  key: string,
  fallback = "",
): string => {
  const value = obj[key];

  if (value === null || value === undefined) return fallback;
  return String(value);
};

const getBoolean = (
  obj: AnyObj,
  key: string,
  fallback = false,
): boolean => {
  const value = obj[key];

  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return fallback;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getNumber = (
  obj: AnyObj,
  key: string,
  fallback = 0,
): number => {
  return toNumber(obj[key], fallback);
};

const getFirstNumber = (
  obj: AnyObj,
  keys: string[],
  fallback = 0,
): number => {
  for (const key of keys) {
    const value = obj[key];

    if (value !== undefined && value !== null) {
      return toNumber(value, fallback);
    }
  }

  return fallback;
};

const getFirstString = (
  obj: AnyObj,
  keys: string[],
  fallback = "",
): string => {
  for (const key of keys) {
    const value = obj[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
};

const getNestedObject = (
  obj: AnyObj,
  keys: string[],
): AnyObj => {
  for (const key of keys) {
    const value = obj[key];

    if (isObject(value)) {
      return value;
    }
  }

  return {};
};

const calcPercent = (used: number, limit: number): number => {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
};

export const formatVnd = (amount?: number | null): string =>
  amount == null
    ? "0 ₫"
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(amount);

export const formatBytes = (bytes?: number | null): string => {
  const value = toNumber(bytes);

  if (value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size = size / 1024;
    unitIndex += 1;
  }

  const fixed = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(fixed)} ${units[unitIndex]}`;
};

export const INVOICE_STATUS_MAP: Record<string, Invoice["status"]> = {
  DRAFT: "Draft",
  ISSUED: "Open",
  PAID: "Paid",
  VOID: "Void",
  OVERDUE: "Overdue",
};

const normalizeUsageStatus = (
  used: number,
  limit: number,
  alertLevel?: string,
): UsageMetric["status"] => {
  const normalizedAlert = String(alertLevel ?? "").toUpperCase();

  if (normalizedAlert === "EXCEEDED") return "EXCEEDED";
  if (normalizedAlert === "WARNING") return "WARNING";
  if (!limit || limit <= 0) return "OK";

  const percent = Math.round((used / limit) * 100);

  if (percent >= 100) return "EXCEEDED";
  if (percent >= 80) return "WARNING";

  return "OK";
};

const parseBackendFeatures = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;

      if (isObject(item)) {
        return (
          getString(item, "name") ||
          getString(item, "featureName") ||
          getString(item, "featureCode") ||
          getString(item, "code")
        );
      }

      return "";
    })
    .filter(Boolean);
};

// ── Mappers ─────────────────────────────────────────────────

export const mapPlan = (input: unknown): BillingPlan => {
  const p = unwrapObject(input);

  const employeeLimit = getFirstNumber(p, [
    "employeeLimitPerMonth",
    "employeeLimit",
  ]);

  const onboardingTemplateLimit = getNumber(p, "onboardingTemplateLimit");
  const eventTemplateLimit = getNumber(p, "eventTemplateLimit");
  const documentLimit = getNumber(p, "documentLimit");
  const storageLimitBytes = getNumber(p, "storageLimitBytes");

  const priceRaw = getNumber(p, "priceVndMonthly");
  const priceYearlyRaw = getNumber(p, "priceVndYearly");

  return {
    id: getFirstString(p, ["planId", "id"]),
    code: getString(p, "code"),
    name: getString(p, "name"),
    status: getString(p, "status"),

    price: formatVnd(priceRaw),
    priceYearly: formatVnd(priceYearlyRaw),
    priceRaw,
    priceYearlyRaw,

    employeeLimit,
    onboardingTemplateLimit,
    eventTemplateLimit,
    documentLimit,
    storageLimitBytes,
    storageLimitText: formatBytes(storageLimitBytes),

    limits:
      employeeLimit > 0
        ? `Tối đa ${employeeLimit} nhân viên/tháng`
        : "",

    features: [],
    current: false,
    recommended: getBoolean(p, "recommended"),
  };
};

export const mapCurrentPlan = (input: unknown): BillingPlan | null => {
  const data = unwrapObject(input);

  const rawPlan =
    data.plan ??
    data.currentPlan ??
    data.activePlan ??
    getNestedObject(data, ["subscription"]).plan ??
    data;

  const planObject = asObject(rawPlan);

  if (Object.keys(planObject).length === 0) return null;

  return mapPlan(planObject);
};

export const mapInvoice = (input: unknown): Invoice => {
  const inv = unwrapObject(input);

  const amountTotal = getFirstNumber(inv, ["amountTotal", "amount"]);
  const statusRaw = getString(inv, "status").toUpperCase();

  const issuedAt = getString(inv, "issuedAt");
  const dueAt = getString(inv, "dueAt");

  return {
    id: getFirstString(inv, ["invoiceId", "id"]),
    invoiceNo:
      getString(inv, "invoiceNo") ||
      getFirstString(inv, ["invoiceId", "id"]),

    amount: formatVnd(amountTotal),
    amountRaw: amountTotal,
    currency: getString(inv, "currency", "VND"),

    status: INVOICE_STATUS_MAP[statusRaw] ?? "Open",

    date: issuedAt
      ? new Date(issuedAt).toLocaleDateString("vi-VN")
      : getString(inv, "date"),

    dueDate: dueAt ? new Date(dueAt).toLocaleDateString("vi-VN") : undefined,

    companyId: getString(inv, "companyId") || null,
    eInvoiceUrl: getString(inv, "eInvoiceUrl") || undefined,
  };
};

const makeUsageMetric = (params: {
  key: string;
  label: string;
  used: number;
  limit: number;
  month?: string;
  unit?: UsageMetric["unit"];
  description?: string;
  alertLevel?: string;
}): UsageMetric => {
  const percent = calcPercent(params.used, params.limit);
  const status = normalizeUsageStatus(
    params.used,
    params.limit,
    params.alertLevel,
  );

  return {
    key: params.key,
    label: params.label,
    used: params.used,
    limit: params.limit,

    month: params.month,
    unit: params.unit,
    description: params.description,

    alertLevel: params.alertLevel,
    limitPercent: percent,
    percent,
    unlimited: params.limit <= 0,
    status,
  };
};

const mapUsageArrayItem = (item: unknown): UsageMetric => {
  const m = asObject(item);

  return makeUsageMetric({
    key: getFirstString(m, ["key", "code", "label"]),
    label: getFirstString(m, ["label", "name", "key"]),
    used: getFirstNumber(m, ["used", "currentUsage"]),
    limit: getFirstNumber(m, ["limit", "max"]),
    month: getString(m, "month") || undefined,
    unit: getString(m, "unit") || undefined,
    description: getString(m, "description") || undefined,
    alertLevel: getString(m, "alertLevel") || undefined,
  });
};

export const mapUsage = (input: unknown): UsageMetric[] => {
  const unwrapped = unwrapValue(input);

  if (Array.isArray(unwrapped)) {
    return unwrapped.map(mapUsageArrayItem);
  }

  const data = asObject(unwrapped);

  if (Array.isArray(data.metrics)) {
    return data.metrics.map(mapUsageArrayItem);
  }

  const usageRaw =
    data.usage ??
    data.currentUsageData ??
    data.usageData ??
    data.currentUsage ??
    data;

  const usage = isObject(usageRaw) ? usageRaw : data;

  const plan =
    getNestedObject(data, ["plan", "currentPlan", "activePlan"]) ||
    getNestedObject(getNestedObject(data, ["subscription"]), ["plan"]);

  const fallbackPlan =
    Object.keys(plan).length > 0
      ? plan
      : data;

  const month =
    getString(data, "month") ||
    getString(usage, "month") ||
    undefined;

  const employeeUsed =
    typeof data.currentUsage === "number" || typeof data.currentUsage === "string"
      ? toNumber(data.currentUsage)
      : getFirstNumber(usage, [
          "currentUsage",
          "onboardedEmployeeCount",
          "employeeUsedThisMonth",
          "employeeUsage",
          "usedEmployeeCount",
        ]);

  return [
    makeUsageMetric({
      key: "employee",
      label: "Employees onboarded",
      used: employeeUsed,
      limit: getFirstNumber(fallbackPlan, [
        "employeeLimitPerMonth",
        "employeeLimit",
      ]),
      month,
      description: "Số nhân viên đã tạo onboarding trong tháng hiện tại",
      alertLevel: getString(data, "alertLevel") || undefined,
    }),

    makeUsageMetric({
      key: "onboarding_template",
      label: "Onboarding templates",
      used: getFirstNumber(usage, [
        "onboardingTemplateCount",
        "usedOnboardingTemplateCount",
        "onboardingTemplateUsed",
      ]),
      limit: getNumber(fallbackPlan, "onboardingTemplateLimit"),
      month,
      description: "Số mẫu onboarding đã tạo so với giới hạn gói",
    }),

    makeUsageMetric({
      key: "event_template",
      label: "Event templates",
      used: getFirstNumber(usage, [
        "eventTemplateCount",
        "usedEventTemplateCount",
        "eventTemplateUsed",
      ]),
      limit: getNumber(fallbackPlan, "eventTemplateLimit"),
      month,
      description: "Số mẫu sự kiện đã tạo so với giới hạn gói",
    }),

    makeUsageMetric({
      key: "document",
      label: "Documents",
      used: getFirstNumber(usage, [
        "documentCount",
        "usedDocumentCount",
        "documentUsed",
      ]),
      limit: getNumber(fallbackPlan, "documentLimit"),
      month,
      description: "Số tài liệu đã upload vào hệ thống",
    }),

    makeUsageMetric({
      key: "storage",
      label: "Storage",
      used: getFirstNumber(usage, [
        "storageUsedBytes",
        "usedStorageBytes",
        "storageBytesUsed",
      ]),
      limit: getNumber(fallbackPlan, "storageLimitBytes"),
      month,
      unit: "bytes",
      description: "Dung lượng file/tài liệu đã sử dụng",
    }),
  ];
};

export const mapProvider = (input: unknown): PaymentProvider => {
  const p = unwrapObject(input);

  return {
    name: getString(p, "name"),
    status: getString(p, "status") === "ACTIVE" ? "Connected" : "Disconnected",
    accountId: getString(p, "accountId") || undefined,
    lastSync: getString(p, "lastSync") || undefined,
  };
};

export const mapPaymentIntent = (input: unknown): PaymentIntent => {
  const p = unwrapObject(input);

  return {
    id: getFirstString(p, ["paymentIntentId", "id"]),
    paymentTransactionId: getString(p, "paymentTransactionId") || undefined,
    clientSecret: getString(p, "clientSecret"),
    gateway: getString(p, "gateway") || undefined,
    amount: getNumber(p, "amount"),
    currency: getString(p, "currency", "VND"),
    status: getString(p, "status").toLowerCase() as PaymentIntent["status"],
    invoiceId: getString(p, "invoiceId"),
  };
};

export const mapTransaction = (input: unknown): PaymentTransaction => {
  const t = unwrapObject(input);
  const amountRaw = t.amount;

  return {
    id: getString(t, "id"),
    invoiceId: getString(t, "invoiceId"),
    amount:
      typeof amountRaw === "number"
        ? formatVnd(amountRaw)
        : getString(t, "amount"),
    currency: getString(t, "currency", "VND"),
    status: getString(t, "status", "pending").toLowerCase() as PaymentTransaction["status"],
    provider: getString(t, "provider"),
    createdAt: getString(t, "createdAt"),
    companyId: getString(t, "companyId") || null,
  };
};

export const mapSubscription = (input: unknown): Subscription => {
  const s = unwrapObject(input);
  const plan = getNestedObject(s, ["plan"]);

  return {
    subscriptionId: getString(s, "subscriptionId"),
    planCode: getString(s, "planCode") || getString(plan, "code"),
    planName: getString(s, "planName") || getString(plan, "name"),

    status: getString(s, "status"),
    billingCycle: getString(s, "billingCycle") as Subscription["billingCycle"],

    currentPeriodStart: getString(s, "currentPeriodStart") || undefined,
    currentPeriodEnd: getString(s, "currentPeriodEnd") || undefined,
    autoRenew: getBoolean(s, "autoRenew"),

    prorateCreditVnd: getNumber(s, "prorateCreditVnd"),
    prorateChargeVnd: getNumber(s, "prorateChargeVnd"),

    invoiceId: getString(s, "invoiceId") || undefined,

    paymentRequired: getBoolean(s, "paymentRequired"),
    paymentInvoiceId: getString(s, "paymentInvoiceId") || null,
    pendingChangeId: getString(s, "pendingChangeId") || null,
    pendingPlanCode: getString(s, "pendingPlanCode") || null,
    pendingBillingCycle: getString(s, "pendingBillingCycle") || null,
  };
};