import { gatewayRequest } from "../core/gateway";
import type {
  DocumentListResponse,
  UploadDocumentRequest,
  UploadDocumentResponse,
  AcknowledgeDocumentRequest,
  AcknowledgeDocumentResponse,
} from "@/interface/document";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const getBaseUrl = (): string =>
  import.meta.env.DEV && BASE_URL ? "" : BASE_URL.replace(/\/$/, "");
const getToken = () => localStorage.getItem("auth_token");

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
  return (json.data ?? json) as UploadDocumentResponse;
};

/** @deprecated Use apiUploadDocumentFile for real file upload */
export const apiSaveDocument = (payload: UploadDocumentRequest) =>
  gatewayRequest<UploadDocumentRequest, UploadDocumentResponse>(
    "com.sme.content.document.upload",
    payload,
  );

/** com.sme.document.acknowledgment.list */
export const apiListAcknowledgments = () =>
  gatewayRequest<Record<string, never>, unknown>(
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
