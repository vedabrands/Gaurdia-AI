"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowRight,
  Radio,
  Image as ImageIcon,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Filter,
} from "lucide-react";
import type { AlertRecord } from "@/lib/types";
import { Badge } from "@/components/shared/Badge";
import { formatTimestamp } from "@/lib/formatters";
import { useGuardiaStore } from "@/hooks/useGuardiaStore";
import { guardiaStore } from "@/lib/store";
import { Lightbox } from "@/components/shared/Lightbox";

interface RecentAlertsProps {
  alerts?: AlertRecord[];
  loading?: boolean;
}

export function RecentAlerts({ alerts: propAlerts, loading = false }: RecentAlertsProps) {
  const store = useGuardiaStore();
  const rawAlerts = propAlerts || store.incidents;
  const cooldownRemaining = store.alertCooldownRemaining;
  const isDemo = store.isDemo;

  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "UNACK">("ALL");
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);

  const filteredAlerts = rawAlerts.filter((alert) => {
    if (filter === "CRITICAL") return alert.tier <= 2;
    if (filter === "WARNING") return alert.tier === 3;
    if (filter === "UNACK") return !alert.acknowledged;
    return true;
  });

  const unackCount = rawAlerts.filter((a) => !a.acknowledged).length;

  // Cooldown percentage for circular indicator (0 to 100)
  const cooldownPercent = ((15 - cooldownRemaining) / 15) * 100;
  const circumference = 2 * Math.PI * 10;
  const strokeDashoffset = circumference - (cooldownPercent / 100) * circumference;

  return (
    <div className="surface-card rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full group">
      <div>
        {/* Header with Title & Cooldown Gauge */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#c0392b]/10 text-[#c0392b] border border-[#c0392b]/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#f0ede6]">
                  Incident Log
                </h3>
                {unackCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#c0392b] text-white">
                    {unackCount} NEW
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#66625c]">
                Live threat notifications & telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 15s Alert Cooldown Circular Indicator */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] font-mono text-[#9f9a93]"
              title={
                cooldownRemaining > 0
                  ? `Alert cooldown active: ${cooldownRemaining}s remaining`
                  : "Alert system armed (zero cooldown)"
              }
            >
              <svg className="w-4 h-4 -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke={cooldownRemaining > 0 ? "#c48830" : "#3b9a6d"}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={cooldownRemaining > 0 ? strokeDashoffset : 0}
                  className="transition-all duration-300"
                />
              </svg>
              <span className={cooldownRemaining > 0 ? "text-[#c48830]" : "text-[#3b9a6d]"}>
                {cooldownRemaining > 0 ? `${cooldownRemaining}s` : "ARMED"}
              </span>
            </div>

            <Link
              href="/alerts"
              className="text-xs font-medium text-[#3b9a6d] hover:text-[#3b9a6d]/80 flex items-center gap-1 transition-colors p-1"
            >
              <span className="hidden sm:inline">All</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 my-3 text-[11px] font-mono overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filter === "ALL"
                ? "bg-white/15 text-[#f0ede6] font-semibold"
                : "text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/5"
            }`}
          >
            ALL ({rawAlerts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("UNACK")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filter === "UNACK"
                ? "bg-[#c0392b]/20 text-[#c0392b] border border-[#c0392b]/30 font-semibold"
                : "text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/5"
            }`}
          >
            UNACK ({unackCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("CRITICAL")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filter === "CRITICAL"
                ? "bg-[#c0392b]/20 text-[#c0392b] border border-[#c0392b]/30 font-semibold"
                : "text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/5"
            }`}
          >
            CRITICAL
          </button>
          <button
            type="button"
            onClick={() => setFilter("WARNING")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filter === "WARNING"
                ? "bg-[#c48830]/20 text-[#c48830] border border-[#c48830]/30 font-semibold"
                : "text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/5"
            }`}
          >
            WARNING
          </button>
        </div>

        {/* Alert List */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-white/5 animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-[#66625c]">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#3b9a6d]" />
              <p className="text-xs font-medium text-[#9f9a93]">Zero Active Alerts</p>
              <p className="text-[11px] mt-0.5">
                Surveillance pipeline is clean of security anomalies
              </p>
              {isDemo && (
                <button
                  type="button"
                  onClick={() => guardiaStore.toggleDemo()}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#f0ede6] border border-white/10 inline-flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c48830]" /> Generate Demo Incidents
                </button>
              )}
            </div>
          ) : (
            filteredAlerts.slice(0, 5).map((alert) => {
              const isCritical = alert.tier <= 2;
              const isAck = alert.acknowledged;

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer group flex items-center justify-between gap-3 ${
                    isAck
                      ? "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100"
                      : isCritical
                      ? "bg-[#c0392b]/5 border-[#c0392b]/20 hover:bg-[#c0392b]/10 hover:border-[#c0392b]/40"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Snapshot thumbnail or icon */}
                    <div className="w-11 h-11 rounded-md bg-black/50 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {alert.snapshot_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={alert.snapshot_url}
                          alt={alert.threat_type}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[#66625c]" />
                      )}
                    </div>

                    {/* Threat Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isCritical ? "text-[#f0ede6]" : "text-[#f0ede6]"
                          }`}
                        >
                          {alert.threat_type}
                        </span>
                        <Badge
                          variant={isCritical ? "critical" : "warning"}
                          size="sm"
                          dot
                        >
                          T{alert.tier}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#66625c] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#66625c]" />
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Acknowledge / Dismiss) */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!isAck ? (
                      <button
                        type="button"
                        onClick={() => guardiaStore.acknowledgeIncident(alert.id)}
                        className="p-1.5 rounded bg-[#3b9a6d]/10 hover:bg-[#3b9a6d]/20 text-[#3b9a6d] border border-[#3b9a6d]/30 transition-all active:scale-95"
                        title="Acknowledge Incident"
                        aria-label="Acknowledge Incident"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-[#3b9a6d] bg-[#3b9a6d]/10 px-1.5 py-0.5 rounded border border-[#3b9a6d]/20">
                        ACK
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => guardiaStore.dismissIncident(alert.id)}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-[#9f9a93] hover:text-[#c0392b] border border-white/5 transition-all active:scale-95"
                      title="Dismiss Incident"
                      aria-label="Dismiss Incident"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3.5 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#66625c] font-mono">
        <span className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-[#3b9a6d]" /> WS Event Channel
        </span>
        <span>Cooldown: 15s</span>
      </div>

      {/* Incident Detail Modal / Lightbox */}
      {selectedAlert && (
        <Lightbox
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          imageUrl={selectedAlert.snapshot_url || ""}
          threatType={selectedAlert.threat_type}
          tier={selectedAlert.tier}
          timestamp={selectedAlert.timestamp}
          channelsNotified={selectedAlert.channels_notified}
          message={selectedAlert.message}
        />
      )}
    </div>
  );
}
