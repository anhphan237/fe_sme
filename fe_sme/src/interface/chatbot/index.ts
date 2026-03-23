// ============================================================
// Chatbot Module Interfaces
// Maps to BE: modules/ai
// Operations: com.sme.ai.assistant.*, com.sme.chat.session.*, com.sme.chat.message.*
// ============================================================

// ---------- Session Create ----------
/** com.sme.chat.session.create */
export interface ChatSessionCreateRequest {
  channel: "WEB";
}

export interface ChatSessionCreateResponse {
  chatSessionId: string;
}

// ---------- Session List ----------
/** com.sme.chat.session.list */
export interface ChatSessionListItem {
  chatSessionId: string;
  title?: string | null;
  channel: string;
  startedAt: string;
  endedAt: string | null;
}

export interface ChatSessionListResponse {
  sessions: ChatSessionListItem[];
}

// ---------- Message List ----------
/** com.sme.chat.message.list */
export interface ChatMessageItem {
  chatMessageId: string;
  sender: "USER" | "BOT";
  content: string;
  createdAt: string;
}

export interface ChatMessageListResponse {
  messages: ChatMessageItem[];
}

// ---------- Ask ----------
/** com.sme.ai.assistant.ask */
export interface ChatbotAskRequest {
  question: string;
  chatSessionId: string;
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
  chatSessionId?: string;
}

/** FE-normalized shape used by chatbot page */
export interface ChatbotAskViewResponse {
  answer: string;
  sources: ChatbotSource[];
}
