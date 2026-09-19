"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Users,
  Flame,
  Swords,
  UserX,
  Zap,
} from "lucide-react";
import { useGuardiaStore } from "@/hooks/useGuardiaStore";
import type { Telemetry } from "@/lib/types";

interface TelemetryBarProps {
  telemetry?: Telemetry;
}

/**
 * Animated Number Counter component
 */
function AnimatedCounter({ value, className = "" }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.round(start + (end - start) * progress);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, displayValue]);

  return <span className={className}>{displayValue}</span>;
}

export function TelemetryBar({ telemetry }: TelemetryBarProps) {
  const store = useGuardiaStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fps = telemetry ? telemetry.fps : store.fps;
  const person_count = telemetry ? telemetry.person_count : store.personCount;
  const weapon_count = telemetry ? telemetry.weapon_count : store.weaponCount;
  const fight_detected = telemetry
    ? telemetry.fight_detected
    : store.violenceStatus === "FIGHTING";
  const neck_hold_detected = telemetry
    ? telemetry.neck_hold_detected
    : store.violenceStatus === "CHOKING";
  const fallen_count = telemetry ? telemetry.fallen_count : store.fallenCount;
  const fpsHistory = store.fpsHistory;

  // Render mini 60-second FPS sparkline on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (fpsHistory.length < 2) return;

    const maxFps = 35;
    const step = width / (fpsHistory.length - 1);

    ctx.beginPath();
    fpsHistory.forEach((val, index) => {
      const x = index * step;
      const normalized = Math.min(Math.max(val / maxFps, 0), 1);
      const y = height - normalized * (height - 4) - 2;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    const isGoodFps = fps >= 22;
    ctx.strokeStyle = isGoodFps ? "rgba(59, 154, 109, 0.85)" : "rgba(196, 136, 48, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill gradient underneath sparkline
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, isGoodFps ? "rgba(59, 154, 109, 0.25)" : "rgba(196, 136, 48, 0.25)");
    grad.addColorStop(1, "rgba(59, 154, 109, 0)");
    ctx.fillStyle = grad;
    ctx.fill();
  }, [fpsHistory, fps]);

  const fpsColor =
    fps >= 22 ? "text-[#3b9a6d]" : fps >= 12 ? "text-[#c48830]" : "text-[#c0392b]";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. FPS & Processing Speed with Mini Sparkline */}
      <div className="surface-card p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-[#9f9a93]">
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="w-4 h-4 text-[#3b9a6d]" /> Stream Rate
          </span>
          <span className="font-mono text-[10px] text-[#66625c]">Target: 30 FPS</span>
        </div>

        <div className="mt-2 flex items-baseline justify-between z-10">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono tabular-nums ${fpsColor}`}>
              {fps > 0 ? fps.toFixed(1) : "0.0"}
            </span>
            <span className="text-[10px] text-[#66625c] font-mono">FPS</span>
          </div>
          <span className="text-[10px] font-mono text-[#3b9a6d] bg-[#3b9a6d]/10 px-1.5 py-0.5 rounded border border-[#3b9a6d]/20">
            60s Live
          </span>
        </div>

        {/* 60s Sparkline Canvas */}
        <div className="mt-2 h-7 w-full overflow-hidden relative">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </div>

      {/* 2. Tracked Persons */}
      <div className="surface-card p-4 rounded-xl flex flex-col justify-between group">
        <div className="flex items-center justify-between text-xs text-[#9f9a93]">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-4 h-4 text-[#5a7d9a]" /> Persons
          </span>
          <span className="font-mono text-[10px] text-[#66625c]">ByteTrack</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <AnimatedCounter
            value={person_count}
            className="text-2xl font-bold font-mono tabular-nums text-[#f0ede6]"
          />
          <span className="text-[11px] text-[#9f9a93] font-mono">
            {person_count === 1 ? "1 Subject" : `${person_count} Subjects`}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[#66625c] truncate">
          {person_count > 0 ? "Tracking active keypoints" : "No subjects in frame"}
        </p>
      </div>

      {/* 3. Hazardous Objects / Weapons */}
      <div
        className={`surface-card p-4 rounded-xl flex flex-col justify-between transition-all ${
          weapon_count > 0
            ? "border-[#c0392b]/50 bg-[#c0392b]/10 threat-pulse"
            : ""
        }`}
      >
        <div className="flex items-center justify-between text-xs text-[#9f9a93]">
          <span className="flex items-center gap-1.5 font-medium">
            <Flame
              className={`w-4 h-4 ${
                weapon_count > 0 ? "text-[#c0392b] animate-pulse" : "text-[#9f9a93]"
              }`}
            />
            Weapons
          </span>
          <span className="font-mono text-[10px] text-[#66625c]">YOLO-World</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <AnimatedCounter
            value={weapon_count}
            className={`text-2xl font-bold font-mono tabular-nums ${
              weapon_count > 0 ? "text-[#c0392b]" : "text-[#f0ede6]"
            }`}
          />
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              weapon_count > 0
                ? "bg-[#c0392b]/20 text-[#c0392b] border-[#c0392b]/30"
                : "bg-[#3b9a6d]/10 text-[#3b9a6d] border-[#3b9a6d]/20"
            }`}
          >
            {weapon_count > 0 ? "DETECTED" : "CLEAR"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[#66625c] truncate">
          {weapon_count > 0 ? "Hazard item active" : "Zero weapons visible"}
        </p>
      </div>

      {/* 4. Violent Action Recognition */}
      <div
        className={`surface-card p-4 rounded-xl flex flex-col justify-between transition-all ${
          fight_detected || neck_hold_detected
            ? "border-[#c0392b]/50 bg-[#c0392b]/10 threat-pulse"
            : ""
        }`}
      >
        <div className="flex items-center justify-between text-xs text-[#9f9a93]">
          <span className="flex items-center gap-1.5 font-medium">
            <Swords
              className={`w-4 h-4 ${
                fight_detected || neck_hold_detected
                  ? "text-[#c0392b] animate-pulse"
                  : "text-[#9f9a93]"
              }`}
            />
            Violence
          </span>
          <span className="font-mono text-[10px] text-[#66625c]">Pose Heuristics</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span
            className={`text-base font-bold font-mono uppercase truncate ${
              neck_hold_detected
                ? "text-[#c0392b]"
                : fight_detected
                ? "text-[#c0392b]"
                : "text-[#3b9a6d]"
            }`}
          >
            {neck_hold_detected
              ? "CHOKING"
              : fight_detected
              ? "FIGHTING"
              : "INACTIVE"}
          </span>
          <span className="text-[10px] text-[#66625c] font-mono">STATUS</span>
        </div>
        <p className="mt-2 text-[11px] text-[#66625c] truncate">
          {neck_hold_detected || fight_detected
            ? "Physical altercation alert"
            : "No violent movement"}
        </p>
      </div>

      {/* 5. Fall Detection */}
      <div
        className={`surface-card p-4 rounded-xl flex flex-col justify-between transition-all ${
          fallen_count > 0
            ? "border-[#5a7d9a]/50 bg-[#5a7d9a]/10"
            : ""
        }`}
      >
        <div className="flex items-center justify-between text-xs text-[#9f9a93]">
          <span className="flex items-center gap-1.5 font-medium">
            <UserX
              className={`w-4 h-4 ${
                fallen_count > 0 ? "text-[#7ba3c4] animate-pulse" : "text-[#9f9a93]"
              }`}
            />
            Fall Assist
          </span>
          <span className="font-mono text-[10px] text-[#66625c]">Aspect Ratio</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <AnimatedCounter
            value={fallen_count}
            className={`text-2xl font-bold font-mono tabular-nums ${
              fallen_count > 0 ? "text-[#7ba3c4]" : "text-[#f0ede6]"
            }`}
          />
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              fallen_count > 0
                ? "bg-[#5a7d9a]/20 text-[#7ba3c4] border-[#5a7d9a]/30"
                : "bg-[#3b9a6d]/10 text-[#3b9a6d] border-[#3b9a6d]/20"
            }`}
          >
            {fallen_count > 0 ? "FALLEN" : "NOMINAL"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[#66625c] truncate">
          {fallen_count > 0 ? "Fall event in progress" : "No fallen subjects"}
        </p>
      </div>
    </div>
  );
}
