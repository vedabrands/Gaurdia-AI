"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Radio,
  Eye,
  Crosshair,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import type { ThreatTier } from "@/lib/types";

interface LiveFeedProps {
  threatTier?: ThreatTier;
  personCount?: number;
  weaponCount?: number;
  fps?: number;
}

export function LiveFeed({
  threatTier = "NORMAL",
  personCount = 0,
  weaponCount = 0,
  fps = 0,
}: LiveFeedProps) {
  const [streamError, setStreamError] = useState(false);
  const [key, setKey] = useState(0); // Force img reload
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [streamUrl, setStreamUrl] = useState("/api/stream");

  const handleRefresh = () => {
    setStreamError(false);
    setKey((prev) => prev + 1);
    setStreamUrl(`/api/stream?t=${Date.now()}`);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error attempting to exit fullscreen:", err);
      });
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const borderColors = {
    NORMAL: "border-white/10 group-hover:border-[#3b9a6d]/30",
    WARNING: "border-[#c48830]/40 shadow-[0_0_20px_rgba(196,136,48,0.1)]",
    CRITICAL: "border-[#c0392b]/60 shadow-[0_0_30px_rgba(192,57,43,0.2)] animate-pulse",
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-[#0f0f11] rounded-xl border ${borderColors[threatTier]} overflow-hidden flex flex-col justify-between group transition-all duration-300 shadow-2xl`}
    >
      {/* HUD Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between pointer-events-none">
        {/* Top Left: Cam Info & REC */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-[#e8e5e0]">
            <span className="w-2 h-2 rounded-full bg-[#c0392b] animate-ping" />
            <span className="font-bold text-[#c0392b]">REC</span>
            <span className="text-[#66635f]">|</span>
            <span>CAM-01 [MAIN]</span>
          </div>

          <Badge
            variant={threatTier === "CRITICAL" ? "critical" : threatTier === "WARNING" ? "warning" : "normal"}
            size="sm"
            dot
          >
            {threatTier}
          </Badge>
        </div>

        {/* Top Right: Actions & Overlays */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-[#9b9590]">
            <span>{fps.toFixed(1)} FPS</span>
            <span className="text-[#66635f]">·</span>
            <span>{personCount} TRACKED</span>
            {weaponCount > 0 && (
              <>
                <span className="text-[#66635f]">·</span>
                <span className="text-[#c0392b] font-bold">{weaponCount} WEAPON</span>
              </>
            )}
          </div>

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[#9b9590] hover:text-[#e8e5e0] transition-colors"
            title="Reload Video Stream"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[#9b9590] hover:text-[#e8e5e0] transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Stream Image */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0c]">
        {!streamError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={key}
            src={streamUrl}
            alt="Live Surveillance MJPEG Stream"
            onError={() => setStreamError(true)}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-6 max-w-md space-y-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#9b9590]">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#e8e5e0]">
                Camera Feed Standby
              </h3>
              <p className="text-xs text-[#9b9590] mt-1">
                Waiting for Python backend video pipeline at{" "}
                <code className="text-[#3b9a6d] font-mono">/api/stream</code>
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-lg bg-[#3b9a6d] text-[#0f0f11] font-semibold text-xs hover:bg-[#3b9a6d]/90 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reconnect Feed
            </button>
          </div>
        )}
      </div>

      {/* Crosshair Graphic */}
      <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-white/40 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white/40 rounded-full" />
        </div>
        {/* Corner HUD markers */}
        <div className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-white/30" />
        <div className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-white/30" />
        <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-white/30" />
        <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-white/30" />
      </div>

      {/* HUD Footer Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-between pointer-events-none text-xs font-mono text-[#9b9590]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[#3b9a6d]" /> SKELETON POSE: ON
          </span>
          <span className="text-[#66635f]">·</span>
          <span>ACTION RECOGNITION: ACTIVE</span>
        </div>

        <div className="flex items-center gap-2">
          <span>YOLO-WORLD HAZARD: ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
