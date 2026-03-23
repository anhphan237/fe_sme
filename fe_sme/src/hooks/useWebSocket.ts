import type { StompSubscription } from "@stomp/stompjs";
import type { Client } from "@stomp/stompjs";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

interface UseWebSocketReturn {
  stompClient: Client | null;
  isConnected: boolean;
  subscribe: (
    destination: string,
    callback: (body: string) => void,
  ) => StompSubscription | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const { isConnected, subscribe } = useWebSocketContext();
  return { stompClient: null, isConnected, subscribe };
}
