// ============================================================
// Document Module Interfaces
// Maps to BE: modules/content
// Operations: com.sme.content.document.*
// ============================================================

// ---------------------------
// Document
// ---------------------------

/** Maps to BE: DocumentListResponse.DocumentItem */
export interface DocumentItem {
  documentId: string;
  name: string;
  fileUrl: string;
  description: string;
  status: string;
  documentCategoryId?: string;
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
  documentCategoryId?: string;
}

/** com.sme.content.document.upload → response data */
export interface UploadDocumentResponse {
  documentId: string;
  name: string;
  fileUrl: string;
  description: string;
}

// ---------------------------
// Acknowledgment
// ---------------------------

/** com.sme.content.document.acknowledge */
export interface AcknowledgeDocumentRequest {
  documentId: string;
  onboardingId?: string;
  taskId?: string;
}

/** com.sme.content.document.acknowledge → response data */
export interface AcknowledgeDocumentResponse {
  documentAcknowledgementId: string;
  documentId: string;
  onboardingId?: string;
  taskMarkedDone: boolean;
}
