import { useUserStore } from "@/stores/user.store";
import type { GatewayRequestBody, GatewayResponse } from "@/interface/common";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const GATEWAY_PATH = "/api/v1/gateway";

function getBaseUrl(): string {
  return import.meta.env.DEV && BASE_URL ? "" : BASE_URL.replace(/\/$/, "");
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || useUserStore.getState().token;
}

function getTenantId(): string | null {
  const tenant = useUserStore.getState().currentTenant;
  return tenant?.id ?? null;
}

export interface GatewayRequestOptions {
  tenantId?: string | null;
  flatPayload?: boolean;
}

export async function gatewayRequest<TReq = unknown, TRes = unknown>(
  operationType: string,
  payload: TReq,
  options?: GatewayRequestOptions,
): Promise<TRes> {
  const url = `${getBaseUrl()}${GATEWAY_PATH}`;
  const tenantId =
    options?.tenantId !== undefined ? options.tenantId : getTenantId();

  const body: GatewayRequestBody<TReq> | Record<string, unknown> =
    options?.flatPayload &&
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload)
      ? { operationType, tenantId, ...(payload as Record<string, unknown>) }
      : { operationType, tenantId, payload };

  const token = getToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: GatewayResponse<TRes> = {};
  try {
    json = text ? (JSON.parse(text) as GatewayResponse<TRes>) : {};
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    const msg = json.message ?? json.errorCode ?? text;
    throw new Error(String(msg || `Gateway error ${res.status}`));
  }

  return (json.data !== undefined ? json.data : json) as TRes;
}
