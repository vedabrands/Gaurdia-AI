"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import {
  BarChart3,
  ShieldAlert,
  Clock,
  Flame,
  Users,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { formatUptime } from "@/lib/formatters";
import { getStats } from "@/lib/api";
import type { SystemStats } from "@/lib/types";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredHour, setHoveredHour] = useState<{ hour: string; count: number } | null>(
    null
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getStats();
      setStats(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load analytics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalAlerts = stats?.total_alerts || 0;
  const alertsByType = stats?.alerts_by_type || {};
  const alertsByHour = stats?.alerts_by_hour || [];

  // Find max count in alertsByHour for chart normalization
  const maxHourValue = Math.max(...alertsByHour, 5); // default min scale of 5

  const threatEntries = Object.entries(alertsByType).sort((a, b) => b[1] - a[1]);
  const weaponAlertsCount =
    (alertsByType["Weapon Detected"] || 0) +
    (alertsByType["Armed Violence"] || 0) +
    (alertsByType["Weapon"] || 0);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header />

      <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#5a7d9a]/10 text-[#7ba3c4] border border-[#5a7d9a]/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-[#e8e5e0]">
                Surveillance Intelligence & Analytics
              </h1>
            </div>
            <p className="text-xs text-[#9b9590] mt-1">
              Aggregated threat metrics, peak incident distribution, and sensor heuristics
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#e8e5e0] border border-white/10 text-xs font-medium flex items-center gap-2 transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#9b9590] ${loading ? "animate-spin" : ""}`} /> Refresh Metrics
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#c0392b]/15 border border-[#c0392b]/30 text-[#c0392b] text-xs font-medium">
            {error}
          </div>
        )}

        {/* Top 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Incidents */}
          <div className="bg-[#18181b] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between text-xs text-[#9b9590]">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldAlert className="w-4 h-4 text-[#c0392b]" /> Total Incidents
              </span>
              <Badge variant="critical" size="sm">
                Live Log
              </Badge>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-[#e8e5e0] tabular-nums">
                {totalAlerts}
              </span>
              <span className="text-xs text-[#66635f]">Dispatches</span>
            </div>
            <p className="text-[11px] text-[#66635f] mt-2">
              Total security events recorded across all tiers
            </p>
          </div>

          {/* Card 2: Peak Subjects */}
          <div className="bg-[#18181b] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between text-xs text-[#9b9590]">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-[#5a7d9a]" /> Peak Subjects
              </span>
              <Badge variant="info" size="sm">
                ByteTrack
              </Badge>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-[#e8e5e0] tabular-nums">
                {stats?.peak_person_count ?? 0}
              </span>
              <span className="text-xs text-[#66635f]">Persons Max</span>
            </div>
            <p className="text-[11px] text-[#66635f] mt-2">
              Peak concurrent human keypoint tracks identified
            </p>
          </div>

          {/* Card 3: Weapons Intercepted */}
          <div className="bg-[#18181b] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between text-xs text-[#9b9590]">
              <span className="flex items-center gap-1.5 font-medium">
                <Flame className="w-4 h-4 text-[#c48830]" /> Weapon Events
              </span>
              <Badge variant="warning" size="sm">
                YOLO-World
              </Badge>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-[#c48830] tabular-nums">
                {weaponAlertsCount}
              </span>
              <span className="text-xs text-[#66635f]">Incidents</span>
            </div>
            <p className="text-[11px] text-[#66635f] mt-2">
              Blades, firearms, and hazardous item triggers
            </p>
          </div>

          {/* Card 4: System Uptime */}
          <div className="bg-[#18181b] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between text-xs text-[#9b9590]">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-[#3b9a6d]" /> Engine Uptime
              </span>
              <Badge variant="normal" size="sm">
                Continuous
              </Badge>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#3b9a6d] tabular-nums">
                {formatUptime(stats?.uptime_sec || 0)}
              </span>
              <span className="text-xs text-[#66635f]">Online</span>
            </div>
            <p className="text-[11px] text-[#66635f] mt-2">
              Surveillance pipeline runtime
            </p>
          </div>
        </div>

        {/* Charts & Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 24-Hour Incident Activity Bar Chart */}
          <div className="lg:col-span-2 bg-[#18181b] border border-white/5 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-sm font-semibold text-[#e8e5e0] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#3b9a6d]" /> 24-Hour Incident Activity
                </h3>
                <p className="text-xs text-[#9b9590] mt-0.5">
                  Hourly distribution of security threat triggers (00:00 - 23:00)
                </p>
              </div>

              {hoveredHour && (
                <div className="text-xs font-mono bg-white/5 px-2.5 py-1 rounded border border-white/10 text-[#e8e5e0]">
                  Hour {hoveredHour.hour}:00 —{" "}
                  <span className="text-[#3b9a6d] font-bold">
                    {hoveredHour.count} incidents
                  </span>
                </div>
              )}
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-8 pb-4">
              <div className="h-48 flex items-end justify-between gap-1 sm:gap-2">
                {Array.from({ length: 24 }).map((_, i) => {
                  const hourKey = String(i).padStart(2, "0");
                  const count = alertsByHour[i] || 0;
                  const heightPercent =
                    maxHourValue > 0 ? (count / maxHourValue) * 100 : 0;

                  return (
                    <div
                      key={hourKey}
                      onMouseEnter={() =>
                        setHoveredHour({ hour: hourKey, count })
                      }
                      onMouseLeave={() => setHoveredHour(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#1f1f23] text-[#e8e5e0] text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 pointer-events-none transition-opacity duration-150 z-10 whitespace-nowrap">
                        {count}
                      </div>

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          count > 0
                            ? count >= 5
                              ? "bg-[#c0392b] group-hover:bg-[#c0392b]/80"
                              : "bg-[#3b9a6d] group-hover:bg-[#3b9a6d]/80"
                            : "bg-white/5 group-hover:bg-white/10"
                        }`}
                        style={{
                          height: `${Math.max(heightPercent, 4)}%`,
                        }}
                      />

                      {/* X-axis label */}
                      <span className="text-[9px] font-mono text-[#66635f] group-hover:text-[#e8e5e0] mt-2 select-none">
                        {i % 3 === 0 ? hourKey : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#66635f] pt-2 border-t border-white/5 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-[#3b9a6d]" /> Normal Activity
                <span className="w-2.5 h-2.5 rounded bg-[#c0392b] ml-2" /> Peak Activity (&gt;5)
              </span>
              <span>24h Moving Window (UTC)</span>
            </div>
          </div>

          {/* Threat Breakdown Progress Bars */}
          <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 space-y-6">
            <div className="pb-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-[#e8e5e0]">
                Incident Type Distribution
              </h3>
              <p className="text-xs text-[#9b9590] mt-0.5">
                Proportion by threat classification
              </p>
            </div>

            <div className="space-y-4">
              {threatEntries.length === 0 ? (
                <div className="text-center py-10 text-[#66635f]">
                  <p className="text-xs">No threat incidents logged yet</p>
                </div>
              ) : (
                threatEntries.map(([type, count]) => {
                  const share =
                    totalAlerts > 0 ? ((count / totalAlerts) * 100).toFixed(0) : "0";

                  return (
                    <div key={type} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#e8e5e0] font-medium">{type}</span>
                        <span className="font-mono text-[#9b9590]">
                          {count} ({share}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#c48830] h-full rounded-full transition-all duration-300"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Summary Badge */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="text-xs font-semibold text-[#e8e5e0]">
                Security Response Architecture
              </div>
              <p className="text-[11px] text-[#66635f] leading-relaxed">
                Automated multi-tier classification ensures immediate escalation to high-priority audio siren & telegram notification upon detection.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
