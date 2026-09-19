"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WS_URL } from "@/lib/constants";
import type { WSMessage, Telemetry, AlertEvent, ConnectionStatus } from "@/lib/types";

interface UseWebSocketOptions {
  url?: string;
  onAlert?: (alert: AlertEvent) => void;
  onTelemetry?: (telemetry: Telemetry) => void;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
}

export function useWebSocket({
  url = WS_URL,
  onAlert,
  onTelemetry,
  reconnectInterval = 1000,
  maxReconnectInterval = 10000,
}: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [lastTelemetry, setLastTelemetry] = useState<Telemetry | null>(null);
  const [lastAlert, setLastAlert] = useState<AlertEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIntervalRef = useRef<number>(reconnectInterval);
  const onAlertRef = useRef(onAlert);
  const onTelemetryRef = useRef(onTelemetry);

  // Keep callback refs updated to prevent reconnect cycles on handler changes
  useEffect(() => {
    onAlertRef.current = onAlert;
    onTelemetryRef.current = onTelemetry;
  }, [onAlert, onTelemetry]);

  const connect = useCallback(() => {
    // If already open or connecting, do nothing
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      setStatus("connecting");
      // If relative or standard URL
      const socketUrl = url.startsWith("ws://") || url.startsWith("wss://")
        ? url
        : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${url}`;

      const ws = new WebSocket(socketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        currentIntervalRef.current = reconnectInterval; // Reset backoff on successful connect
      };

      ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          setLastMessage(data);

          if (data.type === "telemetry") {
            setLastTelemetry(data);
            if (onTelemetryRef.current) {
              onTelemetryRef.current(data);
            }
          } else if (data.type === "alert") {
            setLastAlert(data);
            if (onAlertRef.current) {
              onAlertRef.current(data);
            }
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = () => {
        setStatus("error");
      };

      ws.onclose = (event) => {
        setStatus("disconnected");
        wsRef.current = null;

        // Auto reconnect with exponential backoff
        if (!event.wasClean) {
          const nextInterval = Math.min(
            currentIntervalRef.current * 1.5,
            maxReconnectInterval
          );
          currentIntervalRef.current = nextInterval;

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, nextInterval);
        }
      };
    } catch (err) {
      console.error("WebSocket initialization error:", err);
      setStatus("error");
    }
  }, [url, reconnectInterval, maxReconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return {
    status,
    lastMessage,
    lastTelemetry,
    lastAlert,
    send,
    reconnect: connect,
  };
}
