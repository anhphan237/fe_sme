import { gatewayRequest } from "../core/gateway";
import type {
  ChatbotAskRequest,
  ChatbotAskResponse,
} from "@/interface/chatbot";

/** com.sme.ai.assistant.ask */
export const apiChatbotAsk = (payload: { query: string }) =>
  gatewayRequest<ChatbotAskRequest, ChatbotAskResponse>(
    "com.sme.ai.assistant.ask",
    { question: payload.query },
  );
