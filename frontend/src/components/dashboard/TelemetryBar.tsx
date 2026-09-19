"use client";

import React from "react";
import {
  Activity,
  Users,
  Shield,
  Flame,
  Swords,
  UserX,
  Zap,
} from "lucide-react";
import type { Telemetry } from "@/lib/types";

interface TelemetryBarProps {
  telemetry: Telemetry;
}

export function TelemetryBar({ telemetry }: TelemetryBarProps) {
  const {
    fps,
    person_count,
    weapon_count,
    fight_detected,
    neck_hold_detected,
    fallen_count,
  } = telemetry;

  const fpsColor =
    fps >= 22 ? "text-[#3b9a6d]" : fps >= 12 ? "text-[#c48830]" : "text-[#c0392b]";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. FPS & Processing Speed */}
      <div className="bg-[#18181b] border border-white/5 p-4 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors group">
        <div className="flex items-center justify-between text-xs text-[#9b9590]">
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="w-4 h-4 text-[#3b9a6d]" /> Stream Rate
          </span>
          <span className="font-mono text-[11px] text-[#66635f]">Target: 30</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className={`text-2xl font-bold font-mono tabular-nums ${fpsColor}`}>
            {fps > 0 ? fps.toFixed(1) : "0.0"}
          </span>
          <span className="text-xs text-[#66635f] font-mono">FPS</span>
        </div>
        <div className="mt-2 w-full bg-white/5 h-1 rounded-full overflow-hidden">
          <div
            className="bg-[#3b9a6d] h-full transition-all duration-300"
            style={{ width: `${Math.min((fps / 30) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* 2. Tracked Persons */}
      <div className="bg-[#18181b] border border-white/5 p-4 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors group">
        <div className="flex items-center justify-between text-xs text-[#9b9590]">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-4 h-4 text-[#5a7d9a]" /> Persons
          </span>
          <span className="font-mono text-[11px] text-[#66635f]">ByteTrack</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono tabular-nums text-[#e8e5e0]">
            {person_count}
          </span>
          <span className="text-xs text-[#9b9590] font-mono">
            {person_count === 1 ? "Subject" : "Subjects"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[#66635f] truncate">
          {person_count > 0 ? "Tracking active keypoints" : "No subjects in frame"}
        </p>
      </div>

      {/* 3. Hazardous Objects / Weapons */}
      <div
        className={`bg-[#18181b] border p-4 rounded-xl flex flex-col justify-between transition-colors ${
          weapon_count > 0
            ? "border-[#c0392b]/40 bg-[#c0392b]/5"
            : "border-white/5 hover:border-white/10"
        }`}
      >
        <div className="flex items-center justify-between text-xs text-[#9b9590]">
          <span className="flex items-center gap-1.5 font-medium">
            <Flame
              className={`w-4 h-4 ${
                weapon_count > 0 ? "text-[#c0392b] animate-pulse" : "text-[#9b9590]"
              }`}
            />
            Weapons
          </span>
          <span className="font-mono text-[11px] text-[#66635f]">YOLO-World</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span
            className={`text-2xl font-bold font-mono tabular-nums ${
              weapon_count > 0 ? "text-[#c0392b]" : "text-[#e8e5e0]"
            }`}
          >
            {weapon_count}
          </span>
          <span
            className={`text-xs font-mono font-medium ${
              weapon_count > 0 ? "text-[#c0392b]" : "text-[#3b9a6d]"
            }`}
          >
            {weapon_count > 0 ? "DETECTED" : "CLEAR"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[#66635f] truncate">
          {weapon_count > 0 ? "Hazard detected" : "Zero weapons visible"}
        </p>
      </div>

      {/* 4. Violent Action Recognition */}
      <div
        className={`bg-[#18181b] border p-4 rounded-xl flex flex-col justify-between transition-colors ${
          fight_detected || neck_hold_detected
            ? "border-[#c0392b]/40 bg-[#c0392b]/5"
            : "border-white/5 hover:border-white/10"
        }`}
      >
        <div className="flex items-center justify-between text-xs text-[#9b9590]">
          <span className="flex items-center gap-1.5 font-medium">
            <Swords
              className={`w-4 h-4 ${
                fight_detected || neck_hold_detected
                  ? "text-[#c0392b] animate-pulse"
                  : "text-[#9b9590]"
              }`}
            />
            Violence
          </span>
          <span className="font-mono text-[11px] text-[#66635f]">Pose Heuristics</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
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
          <span className="text-xs text-[#66635f] font-mono">STATUS</span>
        </div>
        <p className="mt-2 text-[11px] text-[#66635f] truncate">
          {neck_hold_detected || fight_detected
            ? "Physical altercation alert"
            : "No violent movement"}
        </p>
      </div>

      {/* 5. Fall Detection */}
      <div
        className={`bg-[#18181b] border p-4 rounded-xl flex flex-col justify-between transition-colors ${
          fallen_count > 0
            ? "border-[#5a7d9a]/40 bg-[#5a7d9a]/5"
            : "border-white/5 hover:border-white/10"
        }`}
      >
        <div className="flex items-center justify-between text-xs text-[#9b9590]">
          <span className="flex items-center gap-1.5 font-medium">
            <UserX
              className={`w-4 h-4 ${
                fallen_count > 0 ? "text-[#7ba3c4] animate-pulse" : "text-[#9b9590]"
              }`}
            />
            Fall Assist
          </span>
          <span className="font-mono text-[11px] text-[#66635f]">Aspect Ratio</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span
            className={`text-2xl font-bold font-mono tabular-nums ${
              fallen_count > 0 ? "text-[#7ba3c4]" : "text-[#e8e5e0]"
            }`}
          >
            {fallen_count}
          </span>
          <span
            className={`text-xs font-mono font-medium ${
              fallen_count > 0 ? "text-[#7ba3c4]" : "text-[#3b9a6d]"
            }`}
          >
            {fallen_count > 0 ? "FALLEN" : "NOMINAL"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[#66635f] truncate">
          {fallen_count > 0 ? "Fall event in progress" : "No fallen subjects"}
        </p>
      </div>
    </div>
  );
}
