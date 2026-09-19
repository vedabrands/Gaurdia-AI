"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Maximize2,
  Minimize2,
  RefreshCw,
  CameraOff,
  Crosshair,
  Download,
  Sparkles,
  ShieldAlert,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { useGuardiaStore } from "@/hooks/useGuardiaStore";
import { guardiaStore } from "@/lib/store";
import type { ThreatTier, BoundingBox } from "@/lib/types";

interface LiveFeedProps {
  threatTier?: ThreatTier;
  personCount?: number;
  weaponCount?: number;
  fps?: number;
}

export function LiveFeed({
  threatTier,
  personCount,
  weaponCount,
  fps,
}: LiveFeedProps) {
  const store = useGuardiaStore();
  const currentThreatTier = threatTier || store.threatTier;
  const currentPersonCount = personCount !== undefined ? personCount : store.personCount;
  const currentWeaponCount = weaponCount !== undefined ? weaponCount : store.weaponCount;
  const currentFps = fps !== undefined ? fps : store.fps;
  const isDemo = store.isDemo;

  const [streamError, setStreamError] = useState(false);
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [streamUrl, setStreamUrl] = useState("/api/stream");

  const handleRefresh = useCallback(() => {
    setStreamError(false);
    setKey((prev) => prev + 1);
    setStreamUrl(`/api/stream?t=${Date.now()}`);
    guardiaStore.forceReconnect();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Snapshot capture handler
  const handleCaptureSnapshot = useCallback(() => {
    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 200);

    const container = containerRef.current;
    if (!container) return;

    // Create virtual canvas to export composite snapshot
    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = 1280;
    captureCanvas.height = 720;
    const ctx = captureCanvas.getContext("2d");
    if (!ctx) return;

    // Draw dark surveillance background
    ctx.fillStyle = "#0f0f11";
    ctx.fillRect(0, 0, 1280, 720);

    // If demo canvas is active, draw it
    if (isDemo && demoCanvasRef.current) {
      ctx.drawImage(demoCanvasRef.current, 0, 0, 1280, 720);
    }

    // Draw HUD overlay
    if (overlayCanvasRef.current) {
      ctx.drawImage(overlayCanvasRef.current, 0, 0, 1280, 720);
    }

    // Add timestamp watermarking
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#3b9a6d";
    ctx.fillText(`GUARDIA AI | ${new Date().toISOString()} | SECTOR A1`, 30, 40);

    const link = document.createElement("a");
    link.download = `GUARDIA-SNAPSHOT-${Date.now()}.png`;
    link.href = captureCanvas.toDataURL("image/png");
    link.click();
  }, [isDemo]);

  // Global Keyboard Shortcuts (F, R, S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRefresh();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleCaptureSnapshot();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen, handleRefresh, handleCaptureSnapshot]);

  // Fullscreen change tracking
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Demo Simulation Canvas Video Generator
  useEffect(() => {
    if (!isDemo) return;
    const canvas = demoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark tactical background
      ctx.fillStyle = "#0c0c10";
      ctx.fillRect(0, 0, w, h);

      // Grid matrix
      ctx.strokeStyle = "rgba(59, 154, 109, 0.08)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Simulated moving subject silhouette
      const cx = w * 0.35 + Math.sin(tick * 0.02) * (w * 0.1);
      const cy = h * 0.5;

      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 50, 120, 0, 0, Math.PI * 2);
      ctx.fill();

      // Scanline sweep
      const scanY = (tick * 3) % h;
      ctx.fillStyle = "rgba(59, 154, 109, 0.1)";
      ctx.fillRect(0, scanY, w, 2);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isDemo]);

  // Synced Canvas Bounding Box & Skeleton HUD Overlay
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const boxes: BoundingBox[] = store.activeBoundingBoxes || [];

    boxes.forEach((box) => {
      const bx = box.x * w;
      const by = box.y * h;
      const bw = box.width * w;
      const bh = box.height * h;

      const isHazard = box.type === "weapon" || box.type === "violence";
      const mainColor = isHazard ? "#c0392b" : "#3b9a6d";

      // Tactical Corner Brackets (instead of solid box)
      const bracketLen = Math.min(bw, bh) * 0.25;
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + bracketLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + bracketLen, by);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - bracketLen, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + bracketLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - bracketLen);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx + bracketLen, by + bh);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - bracketLen, by + bh);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + bw, by + bh - bracketLen);
      ctx.stroke();

      // Label Tag
      ctx.fillStyle = mainColor;
      ctx.fillRect(bx, by - 20, Math.max(bw, 100), 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`${box.label} [${Math.round(box.confidence * 100)}%]`, bx + 6, by - 6);

      // Skeleton Keypoints & Connections
      if (box.keypoints && box.keypoints.length > 0) {
        ctx.fillStyle = "#3b9a6d";
        ctx.strokeStyle = "rgba(59, 154, 109, 0.6)";
        ctx.lineWidth = 1.5;

        box.keypoints.forEach(([kx, ky, conf]) => {
          if (conf > 0.3) {
            ctx.beginPath();
            ctx.arc(kx * w, ky * h, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
    });
  }, [store.activeBoundingBoxes]);

  const borderColors = {
    NORMAL: "border-white/10 group-hover:border-[#3b9a6d]/30",
    WARNING: "border-[#c48830]/40 shadow-[0_0_25px_rgba(196,136,48,0.15)]",
    CRITICAL: "border-[#c0392b]/60 shadow-[0_0_35px_rgba(192,57,43,0.25)] animate-pulse",
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-[#0a0a0c] rounded-xl border ${borderColors[currentThreatTier]} overflow-hidden flex flex-col justify-between group transition-all duration-300 shadow-2xl ${
        isCapturing ? "ring-4 ring-white" : ""
      }`}
    >
      {/* HUD Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
        {/* Top Left: Cam Info & REC */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-[#f0ede6]">
            <span className="w-2 h-2 rounded-full bg-[#c0392b] animate-ping" />
            <span className="font-bold text-[#c0392b]">REC</span>
            <span className="text-[#66625c]">|</span>
            <span>CAM-01 [MAIN]</span>
          </div>

          <Badge
            variant={
              currentThreatTier === "CRITICAL"
                ? "critical"
                : currentThreatTier === "WARNING"
                ? "warning"
                : "normal"
            }
            size="sm"
            dot
          >
            {currentThreatTier}
          </Badge>
        </div>

        {/* Top Right: Actions & Overlays */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-[#9f9a93]">
            <span className="tabular-nums font-semibold text-[#f0ede6]">
              {currentFps.toFixed(1)} FPS
            </span>
            <span className="text-[#66625c]">·</span>
            <span>{currentPersonCount} TRACKED</span>
            {currentWeaponCount > 0 && (
              <>
                <span className="text-[#66625c]">·</span>
                <span className="text-[#c0392b] font-bold">
                  {currentWeaponCount} WEAPON
                </span>
              </>
            )}
          </div>

          {/* Snapshot Button (S) */}
          <button
            type="button"
            onClick={handleCaptureSnapshot}
            className="p-1.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/10 transition-colors active:scale-95"
            title="Capture Snapshot (S)"
            aria-label="Capture Snapshot"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Refresh Button (R) */}
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/10 transition-colors active:scale-95"
            title="Reload Video Stream (R)"
            aria-label="Reload Video Stream"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle Button (F) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/10 transition-colors active:scale-95"
            title="Toggle Fullscreen (F)"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Center Video Container */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0c]">
        {isDemo ? (
          <canvas
            ref={demoCanvasRef}
            width={1280}
            height={720}
            className="w-full h-full object-contain"
          />
        ) : !streamError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={key}
            src={streamUrl}
            alt="Live Surveillance MJPEG Stream"
            onError={() => setStreamError(true)}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-6 max-w-md space-y-4 surface-card border border-white/10 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#9f9a93]">
              <CameraOff className="w-6 h-6 text-[#c48830]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f0ede6]">
                Camera Feed Standby
              </h3>
              <p className="text-xs text-[#9f9a93] mt-1">
                Waiting for Python backend video pipeline at{" "}
                <code className="text-[#3b9a6d] font-mono">/api/stream</code>
              </p>
              {guardiaStore.reconnectCountdown > 0 && (
                <p className="text-xs font-mono text-[#c48830] mt-1.5 animate-pulse">
                  Auto-retrying in {guardiaStore.reconnectCountdown}s...
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#3b9a6d] text-[#0a0a0c] font-semibold text-xs hover:bg-[#3b9a6d]/90 transition-all inline-flex items-center justify-center gap-2 btn-press"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reconnect Feed (R)
              </button>
              <button
                type="button"
                onClick={() => guardiaStore.toggleDemo()}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#f0ede6] hover:bg-white/10 font-semibold text-xs transition-all inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#c48830]" /> Simulate Demo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Bounding Box & Skeleton Keypoints Overlay Canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

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
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-between pointer-events-none text-xs font-mono text-[#9f9a93]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#3b9a6d]">
            <Crosshair className="w-3.5 h-3.5" /> SKELETON POSE: ACTIVE
          </span>
          <span className="hidden sm:inline text-[#66625c]">·</span>
          <span className="hidden sm:inline">BYTE-TRACK: LOCKED</span>
        </div>

        <div className="flex items-center gap-2">
          <span>YOLO-WORLD HAZARD: ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
