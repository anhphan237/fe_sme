// ============================================================
// Document Module Interfaces
// Maps to BE: modules/content
// Operations: com.sme.content.document.*
// ============================================================

// ---------------------------
// Document
// ---------------------------

export interface DocumentItem {
  documentId: string;
  name: string;
  tags: string[];
  required: boolean;
  updatedAt: string;
  folder: string;
  companyId: string | null;
}

/** com.sme.content.document.list → response data */
export interface DocumentListResponse {
  items: DocumentItem[];
}

/** com.sme.content.document.upload */
export interface UploadDocumentRequest {
  name: string;
  fileUrl: string;
  description?: string;
}

/** com.sme.content.document.upload → response data */
export interface UploadDocumentResponse {
  documentId: string;
  name: string;
}

// ---------------------------
// Acknowledgment
// ---------------------------

/** com.sme.content.document.acknowledge */
export interface AcknowledgeDocumentRequest {
  documentId: string;
  onboardingId?: string;
}

/** com.sme.content.document.acknowledge → response data */
export interface AcknowledgeDocumentResponse {
  acknowledged: boolean;
}
