"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  Radio,
  Camera,
  Activity,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import { formatUptime } from "@/lib/formatters";
import { Indicator } from "@/components/shared/Indicator";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import type { ThreatTier, ConnectionStatus } from "@/lib/types";

interface HeaderProps {
  threatTier?: ThreatTier;
  wsStatus?: ConnectionStatus;
}

export function Header({ threatTier = "NORMAL", wsStatus = "connected" }: HeaderProps) {
  const { status, refresh } = useSystemStatus(10000);
  const [uptime, setUptime] = useState(status?.uptime_sec || 0);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    if (status?.uptime_sec) {
      setUptime(status.uptime_sec);
    }
  }, [status?.uptime_sec]);

  // Local uptime incrementer & real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev: number) => prev + 1);
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const threatBg = {
    NORMAL: "border-[#3b9a6d]/20 bg-[#3b9a6d]/10 text-[#3b9a6d]",
    WARNING: "border-[#c48830]/30 bg-[#c48830]/15 text-[#c48830]",
    CRITICAL: "border-[#c0392b]/30 bg-[#c0392b]/20 text-[#c0392b] animate-pulse",
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#18181b]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: System Status & Camera Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Indicator
            status={wsStatus === "connected" ? "online" : "connecting"}
            pulse={wsStatus === "connected"}
          />
          <span className="text-xs font-mono text-[#9b9590]">
            WS: {wsStatus.toUpperCase()}
          </span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#9b9590]" />
          <span className="text-xs text-[#9b9590]">
            CAM-01:{" "}
            <span className={status?.camera_connected ? "text-[#3b9a6d]" : "text-[#c0392b]"}>
              {status?.camera_connected ? "STREAMING" : "OFFLINE"}
            </span>
          </span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#5a7d9a]" />
          <span className="text-xs font-mono text-[#9b9590]">
            YOLOv8 + ByteTrack
          </span>
        </div>
      </div>

      {/* Right: Threat Tier Badge + Time + Uptime */}
      <div className="flex items-center gap-4">
        {/* Threat Tier Status Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${threatBg[threatTier]}`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>STATUS: {threatTier}</span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Uptime */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#9b9590]">
          <Clock className="w-3.5 h-3.5 text-[#66635f]" />
          <span>UPTIME: {formatUptime(uptime)}</span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Real-time Clock */}
        <div className="font-mono text-xs text-[#e8e5e0] bg-white/5 px-2.5 py-1 rounded border border-white/5">
          {currentTime || "00:00:00"}
        </div>

        {/* Manual Refresh */}
        <button
          onClick={() => refresh()}
          className="p-1.5 text-[#66635f] hover:text-[#e8e5e0] hover:bg-white/5 rounded transition-colors"
          title="Refresh Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
