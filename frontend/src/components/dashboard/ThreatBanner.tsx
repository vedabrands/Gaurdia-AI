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
  Radio,
} from "lucide-react";
import { useGuardiaStore } from "@/hooks/useGuardiaStore";
import type { ThreatTier, Telemetry } from "@/lib/types";

interface ThreatBannerProps {
  telemetry?: Telemetry;
}

export function ThreatBanner({ telemetry }: ThreatBannerProps) {
  const store = useGuardiaStore();

  const threat_tier: ThreatTier = telemetry ? telemetry.threat_tier : store.threatTier;
  const fight_detected = telemetry
    ? telemetry.fight_detected
    : store.violenceStatus === "FIGHTING";
  const neck_hold_detected = telemetry
    ? telemetry.neck_hold_detected
    : store.violenceStatus === "CHOKING";
  const weapon_count = telemetry ? telemetry.weapon_count : store.weaponCount;
  const fallen_count = telemetry ? telemetry.fallen_count : store.fallenCount;

  const config = {
    NORMAL: {
      bg: "bg-[#3b9a6d]/10 border-[#3b9a6d]/25 text-[#3b9a6d]",
      title: "ALL SECTORS SECURED",
      description: "Continuous real-time neural vision active. Zero security anomalies detected across active sectors.",
      icon: ShieldCheck,
      badge: "STATUS: NOMINAL",
      badgeClass: "bg-[#3b9a6d]/20 text-[#3b9a6d] border-[#3b9a6d]/30",
    },
    WARNING: {
      bg: "bg-[#c48830]/15 border-[#c48830]/35 text-[#c48830] warning-pulse",
      title: "SECURITY THREAT ADVISORY",
      description: "Behavioral anomaly or proximity alert triggered. Multi-target neural monitoring escalated.",
      icon: AlertTriangle,
      badge: "STATUS: ELEVATED",
      badgeClass: "bg-[#c48830]/25 text-[#c48830] border-[#c48830]/40",
    },
    CRITICAL: {
      bg: "bg-[#c0392b]/20 border-[#c0392b]/50 text-[#c0392b] threat-pulse",
      title: "CRITICAL THREAT ENGAGED",
      description: "Violent engagement or armed threat detected! Multi-channel emergency response dispatched.",
      icon: ShieldAlert,
      badge: "STATUS: CRITICAL BREACH",
      badgeClass: "bg-[#c0392b]/30 text-[#c0392b] border-[#c0392b]/50 animate-pulse",
    },
  };

  const current = config[threat_tier] || config.NORMAL;
  const Icon = current.icon;

  return (
    <section
      className={`rounded-xl border p-4 transition-all duration-300 ${current.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm`}
      role="region"
      aria-live="assertive"
      aria-label="Threat Status Banner"
    >
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-lg bg-black/30 border border-current/20 shrink-0 shadow-inner">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold tracking-wide text-[#f0ede6]">
              {current.title}
            </h2>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${current.badgeClass}`}
            >
              {current.badge}
            </span>
          </div>
          <p className="text-xs text-[#9f9a93] mt-0.5 max-w-2xl">{current.description}</p>
        </div>
      </div>

      {/* Active Threat Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {fight_detected && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#c0392b]/20 text-[#c0392b] border border-[#c0392b]/40 text-xs font-bold animate-pulse">
            <Swords className="w-3.5 h-3.5" /> FIGHT DETECTED
          </span>
        )}

        {neck_hold_detected && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#c0392b]/25 text-[#c0392b] border border-[#c0392b]/50 text-xs font-bold animate-pulse">
            <Skull className="w-3.5 h-3.5" /> CHOKING / NECK HOLD
          </span>
        )}

        {weapon_count > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#c48830]/20 text-[#c48830] border border-[#c48830]/40 text-xs font-bold">
            <Flame className="w-3.5 h-3.5" /> {weapon_count} WEAPON{weapon_count > 1 ? "S" : ""}
          </span>
        )}

        {fallen_count > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#5a7d9a]/20 text-[#7ba3c4] border border-[#5a7d9a]/35 text-xs font-bold">
            <UserX className="w-3.5 h-3.5" /> {fallen_count} FALL{fallen_count > 1 ? "S" : ""}
          </span>
        )}

        {!fight_detected && !neck_hold_detected && weapon_count === 0 && fallen_count === 0 && (
          <span className="text-xs font-mono text-[#3b9a6d] flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md border border-[#3b9a6d]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b9a6d] shadow-[0_0_6px_#3b9a6d]" /> ALL SENSORS NOMINAL
          </span>
        )}
      </div>
    </section>
  );
}
