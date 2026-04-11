import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onGiveUp?: () => void;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const { reconnect = true, maxReconnectAttempts = 5 } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [hasGivenUp, setHasGivenUp] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const attemptsRef = useRef(0);
  const manualCloseRef = useRef(false);
  const { token } = useAuthStore();

  // Keep latest callbacks in refs so reconnect logic doesn't recreate WS on every render
  const onMessageRef = useRef(options.onMessage);
  const onErrorRef = useRef(options.onError);
  const onConnectRef = useRef(options.onConnect);
  const onGiveUpRef = useRef(options.onGiveUp);
  useEffect(() => {
    onMessageRef.current = options.onMessage;
    onErrorRef.current = options.onError;
    onConnectRef.current = options.onConnect;
    onGiveUpRef.current = options.onGiveUp;
  });

  const connect = useCallback(() => {
    if (!token) return;
    if (manualCloseRef.current) return;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      // URL malformee ou navigateur refuse la connexion
      return;
    }

    ws.onopen = () => {
      attemptsRef.current = 0;
      setIsConnected(true);
      setHasGivenUp(false);
      onConnectRef.current?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        onMessageRef.current?.(data);
      } catch {
        // ignore malformed payloads
      }
    };

    ws.onerror = (error) => {
      onErrorRef.current?.(error);
    };

    ws.onclose = (event) => {
      setIsConnected(false);

      if (manualCloseRef.current || !reconnect) return;

      attemptsRef.current += 1;
      if (attemptsRef.current >= maxReconnectAttempts) {
        // Stop hammering the server. Caller can fall back to polling.
        setHasGivenUp(true);
        onGiveUpRef.current?.();
        if (import.meta.env.DEV) {
          console.warn(
            `[useWebSocket] Giving up after ${attemptsRef.current} attempts. Last close code: ${event.code}`
          );
        }
        return;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped)
      const delay = Math.min(1000 * 2 ** (attemptsRef.current - 1), 16000);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    wsRef.current = ws;
  }, [url, token, reconnect, maxReconnectAttempts]);

  useEffect(() => {
    manualCloseRef.current = false;
    attemptsRef.current = 0;
    setHasGivenUp(false);
    connect();

    return () => {
      manualCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, hasGivenUp, lastMessage, sendMessage };
};
