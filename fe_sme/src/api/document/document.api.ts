import { gatewayRequest } from "../core/gateway";
import type {
  DocumentListResponse,
  UploadDocumentRequest,
  UploadDocumentResponse,
  AcknowledgeDocumentRequest,
  AcknowledgeDocumentResponse,
  AcknowledgmentListResponse,
} from "@/interface/document";
import { useUserStore } from "@/stores/user.store";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const getBaseUrl = (): string =>
  import.meta.env.DEV && BASE_URL ? "" : BASE_URL.replace(/\/$/, "");
const getToken = () =>
  localStorage.getItem("auth_token") || useUserStore.getState().token;

const readString = (
  value: unknown,
  ...keys: Array<string>
): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = obj[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
};

// ──────────────────────────────────────────────
// Document
// ──────────────────────────────────────────────

/** com.sme.content.document.list */
export const apiGetDocuments = (documentCategoryId?: string) =>
  gatewayRequest<{ documentCategoryId?: string }, DocumentListResponse>(
    "com.sme.content.document.list",
    documentCategoryId ? { documentCategoryId } : {},
  );

/**
 * POST /api/v1/documents/upload (multipart/form-data)
 * Uploads file to Cloudinary then saves document metadata.
 */
export const apiUploadDocumentFile = async (
  formData: FormData,
): Promise<UploadDocumentResponse> => {
  const token = getToken();
  const res = await fetch(`${getBaseUrl()}/api/v1/documents/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json.message ?? json.errorCode ?? `Upload failed (${res.status})`,
    );
  }

  const payload = (json.data ?? json) as unknown;
  const fileUrl =
    readString(payload, "fileUrl", "url", "secureUrl", "secure_url") ??
    readString(json, "fileUrl", "url", "secureUrl", "secure_url");

  if (!fileUrl) {
    throw new Error("Upload succeeded but file URL is missing");
  }

  return {
    documentId: readString(payload, "documentId", "id") ?? "",
    name: readString(payload, "name", "fileName") ?? "",
    fileUrl,
    description: readString(payload, "description") ?? "",
  };
};

/** @deprecated Use apiUploadDocumentFile for real file upload */
export const apiSaveDocument = (payload: UploadDocumentRequest) =>
  gatewayRequest<UploadDocumentRequest, UploadDocumentResponse>(
    "com.sme.content.document.upload",
    payload,
  );

/** com.sme.document.acknowledgment.list */
export const apiListAcknowledgments = () =>
  gatewayRequest<Record<string, never>, AcknowledgmentListResponse>(
    "com.sme.document.acknowledgment.list",
    {},
  );

export const apiAcknowledgeDocument = (
  documentId: string,
  onboardingId?: string,
) =>
  gatewayRequest<AcknowledgeDocumentRequest, AcknowledgeDocumentResponse>(
    "com.sme.content.document.acknowledge",
    { documentId, onboardingId },
  );
