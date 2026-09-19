"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  Camera,
  Activity,
  RefreshCw,
  Volume2,
  VolumeX,
  HelpCircle,
  Radio,
  Zap,
} from "lucide-react";
import { formatUptime } from "@/lib/formatters";
import { Indicator } from "@/components/shared/Indicator";
import { useGuardiaStore } from "@/hooks/useGuardiaStore";
import { guardiaStore } from "@/lib/store";
import { useSystemStatus } from "@/hooks/useSystemStatus";

interface HeaderProps {
  onOpenShortcuts?: () => void;
}

export function Header({ onOpenShortcuts }: HeaderProps) {
  const { wsStatus, cameraStatus, threatTier, isMuted, isDemo } = useGuardiaStore();
  const { status, refresh } = useSystemStatus(10000);
  const [uptime, setUptime] = useState(status?.uptime_sec || 0);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    if (status?.uptime_sec) {
      setUptime(status.uptime_sec);
    }
  }, [status?.uptime_sec]);

  // Real-time precision clock & session uptime
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const threatBg = {
    NORMAL: "border-[#3b9a6d]/30 bg-[#3b9a6d]/10 text-[#3b9a6d]",
    WARNING: "border-[#c48830]/40 bg-[#c48830]/15 text-[#c48830] warning-pulse",
    CRITICAL: "border-[#c0392b]/50 bg-[#c0392b]/20 text-[#c0392b] threat-pulse",
  };

  const isCamOnline = isDemo || cameraStatus === "online" || status?.camera_connected;

  return (
    <header className="h-16 border-b border-white/5 bg-[#121216]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: System Status & Camera Status */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2">
        {/* WebSocket Status Pill */}
        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
          <Indicator
            status={isDemo || wsStatus === "connected" ? "online" : wsStatus === "connecting" ? "connecting" : "offline"}
            pulse={isDemo || wsStatus === "connected"}
          />
          <span className="text-[11px] font-mono text-[#9f9a93] uppercase">
            WS:{" "}
            <span
              className={
                isDemo || wsStatus === "connected"
                  ? "text-[#3b9a6d] font-semibold"
                  : wsStatus === "connecting"
                  ? "text-[#c48830]"
                  : "text-[#c0392b]"
              }
            >
              {isDemo ? "SIMULATED" : wsStatus}
            </span>
          </span>
        </div>

        {/* CAM-01 Status Pill */}
        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
          <Camera className="w-3.5 h-3.5 text-[#9f9a93]" />
          <span className="text-[11px] font-mono text-[#9f9a93]">
            CAM-01:{" "}
            <span className={isCamOnline ? "text-[#3b9a6d] font-semibold" : "text-[#c0392b]"}>
              {isCamOnline ? "ONLINE" : "STANDBY"}
            </span>
          </span>
        </div>

        {/* AI Pipeline Architecture */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#9f9a93] px-2">
          <Activity className="w-3.5 h-3.5 text-[#5a7d9a]" />
          <span className="text-[11px] text-[#66625c]">
            YOLOv8 + ByteTrack + World
          </span>
        </div>
      </div>

      {/* Right: Threat Tier Badge + Audio Mute + Shortcuts + Time */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Threat Tier Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
            threatBg[threatTier]
          }`}
          role="status"
          aria-live="polite"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{threatTier}</span>
        </div>

        <div className="hidden sm:block h-4 w-px bg-white/10" />

        {/* Mute / Audio Alarm Toggle */}
        <button
          type="button"
          onClick={() => guardiaStore.toggleMute()}
          className={`p-1.5 rounded-lg border transition-all ${
            isMuted
              ? "bg-white/5 text-[#66625c] border-white/5 hover:text-[#9f9a93]"
              : "bg-[#3b9a6d]/10 text-[#3b9a6d] border-[#3b9a6d]/30 shadow-[0_0_8px_rgba(59,154,109,0.2)]"
          }`}
          title={`Audio Alarms: ${isMuted ? "MUTED (Press M to unmute)" : "ENABLED (Press M to mute)"}`}
          aria-label="Toggle Audio Mute"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Shortcuts Reference Modal Trigger */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/10 transition-colors"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Manual Reconnect / Refresh */}
        <button
          type="button"
          onClick={() => {
            guardiaStore.forceReconnect();
            refresh();
          }}
          className="p-1.5 text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/10 rounded-lg border border-white/5 transition-colors"
          title="Force Reconnect & Refresh Status (R)"
          aria-label="Force Reconnect"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="hidden sm:block h-4 w-px bg-white/10" />

        {/* Real-time Precision Clock */}
        <div className="hidden sm:flex flex-col items-end font-mono">
          <span className="text-xs text-[#f0ede6] font-semibold tracking-wide">
            {currentTime || "00:00:00"}
          </span>
          <span className="text-[9px] text-[#66625c] uppercase">
            {currentDate || "LIVE FEED"}
          </span>
        </div>
      </div>
    </header>
  );
}
