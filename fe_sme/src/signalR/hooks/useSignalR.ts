import { useEffect, useRef, useCallback } from 'react';
import { startConnection, sendMessage, Message, SIGNAL_METHOD } from '../core/index';

interface UseSignalRProps {
    method: SIGNAL_METHOD;
    channel: string;
    onReceiveMessage: (message: Message) => void;
}

export const useSignalR = ({ method, channel, onReceiveMessage }: UseSignalRProps) => {
    const isConnected = useRef(false);

    // Start the SignalR connection
    const initializeConnection = useCallback(() => {
        if (!isConnected.current) {
            startConnection({ method, channel }, onReceiveMessage);
            isConnected.current = true;
        }
    }, [method, channel, onReceiveMessage]);

    // Send a message through SignalR
    const sendSignalRMessage = useCallback(
        async (body: { data: string; message: string }) => {
            try {
                await sendMessage(method, body);
            } catch (error) {
                console.error('Error sending SignalR message:', error);
            }
        },
        [method],
    );

    useEffect(() => {
        initializeConnection();

        // Cleanup connection on unmount
        return () => {
            isConnected.current = false;
        };
    }, [initializeConnection]);

    return { sendSignalRMessage };
};