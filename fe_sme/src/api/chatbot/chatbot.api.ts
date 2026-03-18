import { gatewayRequest } from "../core/gateway";
import type {
  ChatbotAskRequest,
  ChatbotAskResponse,
  ChatbotAskViewResponse,
} from "@/interface/chatbot";

/** com.sme.ai.assistant.ask */
export const apiChatbotAsk = async (payload: {
  query: string;
}): Promise<ChatbotAskViewResponse> => {
  const result = await gatewayRequest<ChatbotAskRequest, ChatbotAskResponse>(
    "com.sme.ai.assistant.ask",
    { question: payload.query },
  );

  return {
    answer: result.answer,
    sources: (result.sourceDocumentNames ?? []).map((name) => ({
      title: name,
      snippet: "",
    })),
  };
};
