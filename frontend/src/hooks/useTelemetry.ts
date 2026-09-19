"use client";

import { useState } from "react";
import { useWebSocket } from "./useWebSocket";
import type { Telemetry, AlertEvent, ConnectionStatus } from "@/lib/types";

export function useTelemetry(onAlertReceived?: (alert: AlertEvent) => void) {
  const [telemetry, setTelemetry] = useState<Telemetry>({
    type: "telemetry",
    fps: 0,
    person_count: 0,
    weapon_count: 0,
    threat_tier: "NORMAL",
    fight_detected: false,
    neck_hold_detected: false,
    fallen_count: 0,
    timestamp: new Date().toISOString(),
  });

  const { status, lastAlert, reconnect } = useWebSocket({
    onTelemetry: (data) => {
      setTelemetry(data);
    },
    onAlert: (alert) => {
      if (onAlertReceived) {
        onAlertReceived(alert);
      }
    },
  });

  return {
    telemetry,
    lastAlert,
    connectionStatus: status as ConnectionStatus,
    reconnect,
  };
}
