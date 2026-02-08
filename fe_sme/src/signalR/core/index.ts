import * as signalR from "@microsoft/signalr";

import { APP_CONFIG, ENV_CONFIG } from "@/constants/global";
import { SignalRResponse } from "@/interface/signalR";

export const SIGNAL_METHOD = {
  HUB_PUBLIC: "hubs/unauth",
  HUB_PRIVATE: "hubs",
} as const;
export type SIGNAL_METHOD = (typeof SIGNAL_METHOD)[keyof typeof SIGNAL_METHOD];
type Connections = {
  [K in SIGNAL_METHOD]: signalR.HubConnection;
};
const connections = {} as Connections;

export interface Message {
  data: SignalRResponse;
  message: string;
}

export const startConnection = (
  { method, channel }: { method: SIGNAL_METHOD; channel: string },
  onReceiveMessage: (message: Message) => void,
): void => {
  // Check if the connection already exists. Handle channels only
  if (connections[method]) {
    connections[method].on(
      channel,
      (data: SignalRResponse, message: string) => {
        onReceiveMessage({ data, message });
      },
    );
    return;
  }

  // Register new connection
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${ENV_CONFIG.API}/${method}`, {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
      accessTokenFactory: () => {
        const token = localStorage.getItem(APP_CONFIG.ACCESS_TOKEN);
        if (!token) {
          console.error("Access token not found.");
        }
        return token || "";
      },
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Error)
    .build();

  connection
    .start()
    .then(() => {
      console.log("SignalR Connected.");
      connections[method] = connection;
    })
    .catch((err: Error) => {
      console.error("SignalR Connection Error: ", err);
    });

  connection.on(channel, (data: SignalRResponse, message: string) => {
    onReceiveMessage({ data, message });
  });
};

export const sendMessage = async (
  method: SIGNAL_METHOD,
  body: { data: string; message: string },
) => {
  const matched = connections[method];
  if (!matched) {
    throw new Error(`No connection found for method: ${method}`);
  }
  const { data, message } = body;
  return matched
    .invoke("SendMessage", data, message)
    .catch((err: Error) => console.error("SendMessage Error: ", err));
};
