import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useUserStore } from "@/stores/user.store";

interface WebSocketContextValue {
  isConnected: boolean;
  subscribe: (
    destination: string,
    callback: (body: string) => void,
  ) => StompSubscription | null;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  isConnected: false,
  subscribe: () => null,
});

const WS_RECONNECT_DELAY = 5000;

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const token = useUserStore((s) => s.token);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token) {
      clientRef.current?.deactivate();
      clientRef.current = null;
      setIsConnected(false);
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
    const wsUrl = `${baseUrl}/ws?token=${encodeURIComponent(token)}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: WS_RECONNECT_DELAY,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onStompError: () => setIsConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  const subscribe = useCallback(
    (
      destination: string,
      callback: (body: string) => void,
    ): StompSubscription | null => {
      if (!clientRef.current?.connected) return null;
      return clientRef.current.subscribe(destination, (message) =>
        callback(message.body),
      );
    },
    [],
  );

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => useContext(WebSocketContext);
