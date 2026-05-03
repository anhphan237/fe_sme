import { apiGetInvoices } from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";

function rawInvoiceId(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const o = raw as Record<string, unknown>;
  const id = o.invoiceId ?? o.id;
  return typeof id === "string" && id.length > 0 ? id : "";
}

function rawInvoiceTime(raw: unknown): number {
  if (!raw || typeof raw !== "object") return 0;
  const o = raw as Record<string, unknown>;
  const t = o.issuedAt ?? o.createdAt ?? o.updatedAt;
  if (typeof t === "string" || typeof t === "number") {
    const n = new Date(t).getTime();
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Payable = not settled — excludes PAID / VOID */
function isUnsettledInvoice(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const st = String((raw as Record<string, unknown>).status ?? "").toUpperCase();
  if (st === "PAID" || st === "VOID") return false;
  return true;
}

/**
 * Latest invoice suitable for payment after company.register (paid plan).
 * Primary: invoice.list (ISSUED / tenant-scoped). Fallback: caller may use generate (idempotent).
 */
export async function pickLatestPayableInvoiceIdFromList(
  subscriptionId?: string,
): Promise<string | undefined> {
  const attempts: Array<() => Promise<unknown>> = [
    () => apiGetInvoices(undefined, "ISSUED"),
    () => apiGetInvoices(subscriptionId, "ISSUED"),
    () => apiGetInvoices(),
  ];

  for (const fetchList of attempts) {
    try {
      const res = await fetchList();
      const rawItems = extractList<unknown>(
        res,
        "invoices",
        "items",
        "content",
        "list",
      );
      const payable = rawItems.filter(isUnsettledInvoice);
      const pool = payable.length > 0 ? payable : rawItems;
      const sorted = [...pool].sort(
        (a, b) => rawInvoiceTime(b) - rawInvoiceTime(a),
      );
      for (const raw of sorted) {
        const id = rawInvoiceId(raw);
        if (id) return id;
      }
    } catch {
      /* try next strategy */
    }
  }

  return undefined;
}
