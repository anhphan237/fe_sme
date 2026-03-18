// ============================================================
// Chatbot Module Interfaces
// Maps to BE: modules/ai
// Operations: com.sme.ai.assistant.*
// ============================================================

/** com.sme.ai.assistant.ask */
export interface ChatbotAskRequest {
  question: string;
}

/** Source reference in chatbot response */
export interface ChatbotSource {
  title: string;
  snippet: string;
}

/** com.sme.ai.assistant.ask → response data */
export interface ChatbotAskResponse {
  answer: string;
  sourceDocumentNames?: string[];
}

/** FE-normalized shape used by chatbot page */
export interface ChatbotAskViewResponse {
  answer: string;
  sources: ChatbotSource[];
}
