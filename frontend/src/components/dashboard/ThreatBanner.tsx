"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Swords,
  Skull,
  UserX,
} from "lucide-react";
import type { Telemetry } from "@/lib/types";

interface ThreatBannerProps {
  telemetry: Telemetry;
}

export function ThreatBanner({ telemetry }: ThreatBannerProps) {
  const { threat_tier, fight_detected, neck_hold_detected, weapon_count, fallen_count } =
    telemetry;

  const config = {
    NORMAL: {
      bg: "bg-[#3b9a6d]/10 border-[#3b9a6d]/20 text-[#3b9a6d]",
      title: "ALL SECTORS SECURED",
      description: "Continuous real-time neural surveillance active. Zero security anomalies detected.",
      icon: ShieldCheck,
      badge: "STATUS: NORMAL",
      badgeClass: "bg-[#3b9a6d]/20 text-[#3b9a6d] border-[#3b9a6d]/30",
    },
    WARNING: {
      bg: "bg-[#c48830]/10 border-[#c48830]/30 text-[#c48830]",
      title: "SECURITY THREAT ADVISORY",
      description: "Behavioral anomaly or proximity alert triggered. Monitoring escalated.",
      icon: AlertTriangle,
      badge: "STATUS: ELEVATED",
      badgeClass: "bg-[#c48830]/20 text-[#c48830] border-[#c48830]/40",
    },
    CRITICAL: {
      bg: "bg-[#c0392b]/15 border-[#c0392b]/40 text-[#c0392b] threat-pulse",
      title: "CRITICAL THREAT IN PROGRESS",
      description: "Violent engagement or armed threat detected! Multi-channel emergency alert dispatched.",
      icon: ShieldAlert,
      badge: "STATUS: CRITICAL BREACH",
      badgeClass: "bg-[#c0392b]/30 text-[#c0392b] border-[#c0392b]/50 animate-pulse",
    },
  };

  const current = config[threat_tier] || config.NORMAL;
  const Icon = current.icon;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${current.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
    >
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-lg bg-black/20 border border-current/20 shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold tracking-wide text-[#e8e5e0]">
              {current.title}
            </h2>
            <span
              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${current.badgeClass}`}
            >
              {current.badge}
            </span>
          </div>
          <p className="text-xs text-[#9b9590] mt-0.5">{current.description}</p>
        </div>
      </div>

      {/* Active Threat Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {fight_detected && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c0392b]/20 text-[#c0392b] border border-[#c0392b]/30 text-xs font-semibold animate-pulse">
            <Swords className="w-3.5 h-3.5" /> FIGHT DETECTED
          </span>
        )}

        {neck_hold_detected && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c0392b]/20 text-[#c0392b] border border-[#c0392b]/30 text-xs font-semibold animate-pulse">
            <Skull className="w-3.5 h-3.5" /> CHOKING / NECK HOLD
          </span>
        )}

        {weapon_count > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c48830]/20 text-[#c48830] border border-[#c48830]/30 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5" /> {weapon_count} WEAPON{weapon_count > 1 ? "S" : ""}
          </span>
        )}

        {fallen_count > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#5a7d9a]/20 text-[#7ba3c4] border border-[#5a7d9a]/30 text-xs font-semibold">
            <UserX className="w-3.5 h-3.5" /> {fallen_count} FALL{fallen_count > 1 ? "S" : ""}
          </span>
        )}

        {!fight_detected && !neck_hold_detected && weapon_count === 0 && fallen_count === 0 && (
          <span className="text-xs font-mono text-[#3b9a6d] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b9a6d]" /> SENSORS NOMINAL
          </span>
        )}
      </div>
    </div>
  );
}
