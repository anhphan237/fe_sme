import { gatewayRequest } from "../core/gateway";
import type {
  DocumentListResponse,
  UploadDocumentRequest,
  UploadDocumentResponse,
  AcknowledgeDocumentRequest,
  AcknowledgeDocumentResponse,
} from "@/interface/document";

// ──────────────────────────────────────────────
// Document
// ──────────────────────────────────────────────

/** com.sme.content.document.list */
export const apiGetDocuments = () =>
  gatewayRequest<Record<string, never>, DocumentListResponse>(
    "com.sme.content.document.list",
    {},
  );

/** com.sme.content.document.upload */
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
