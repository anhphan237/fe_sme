import { gatewayRequest } from "../core/gateway";
import type {
  ChatbotAskRequest,
  ChatbotAskResponse,
  ChatbotAskViewResponse,
  ChatSessionCreateRequest,
  ChatSessionCreateResponse,
  ChatSessionListResponse,
  ChatMessageListResponse,
} from "@/interface/chatbot";

/** com.sme.chat.session.create */
export const apiChatSessionCreate = async (
  payload: { channel: "WEB" },
): Promise<ChatSessionCreateResponse> => {
  return gatewayRequest<
    ChatSessionCreateRequest,
    ChatSessionCreateResponse
  >("com.sme.chat.session.create", payload);
};

/** com.sme.chat.session.list */
export const apiChatSessionList = async (): Promise<ChatSessionListResponse> => {
  return gatewayRequest<Record<string, never>, ChatSessionListResponse>(
    "com.sme.chat.session.list",
    {},
  );
};

/** com.sme.chat.message.list */
export const apiChatMessageList = async (payload: {
  chatSessionId: string;
}): Promise<ChatMessageListResponse> => {
  return gatewayRequest<
    { chatSessionId: string },
    ChatMessageListResponse
  >("com.sme.chat.message.list", payload);
};

/** com.sme.ai.assistant.ask */
export const apiChatbotAsk = async (payload: {
  question: string;
  chatSessionId: string;
}): Promise<ChatbotAskViewResponse> => {
  const result = await gatewayRequest<ChatbotAskRequest, ChatbotAskResponse>(
    "com.sme.ai.assistant.ask",
    payload,
  );

  return {
    answer: result.answer,
    sources: (result.sourceDocumentNames ?? []).map((name) => ({
      title: name,
      snippet: "",
    })),
  };
};
