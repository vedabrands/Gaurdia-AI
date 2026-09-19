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
} from "lucide-react";
import type { AlertRecord } from "@/lib/types";
import { Badge } from "@/components/shared/Badge";
import { formatTimestamp } from "@/lib/formatters";
import { Lightbox } from "@/components/shared/Lightbox";

interface RecentAlertsProps {
  alerts: AlertRecord[];
  loading?: boolean;
}

export function RecentAlerts({ alerts, loading = false }: RecentAlertsProps) {
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);

  return (
    <div className="bg-[#18181b] border border-white/5 rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#c0392b]/10 text-[#c0392b] border border-[#c0392b]/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#e8e5e0]">
                Recent Incident Alerts
              </h3>
              <p className="text-[11px] text-[#66635f]">
                Real-time security log & snapshots
              </p>
            </div>
          </div>

          <Link
            href="/alerts"
            className="text-xs font-medium text-[#3b9a6d] hover:text-[#3b9a6d]/80 flex items-center gap-1 transition-colors"
          >
            Full Log <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Alert List */}
        <div className="mt-4 space-y-2.5">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-white/5 animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-10 text-[#66635f]">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium text-[#9b9590]">No recent alerts</p>
              <p className="text-[11px] mt-0.5">
                Surveillance is clear of any active incidents
              </p>
            </div>
          ) : (
            alerts.slice(0, 5).map((alert) => {
              const isCritical = alert.tier <= 2;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Snapshot thumbnail or icon */}
                    <div className="w-12 h-12 rounded bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {alert.snapshot_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={alert.snapshot_url}
                          alt={alert.threat_type}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[#66635f]" />
                      )}
                    </div>

                    {/* Threat Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-[#e8e5e0] truncate">
                          {alert.threat_type}
                        </span>
                        <Badge
                          variant={isCritical ? "critical" : "warning"}
                          size="sm"
                          dot
                        >
                          Tier {alert.tier}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#66635f] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#66635f]" />
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Channels & Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    {alert.channels_notified && alert.channels_notified.length > 0 && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[#9b9590]">
                        <Radio className="w-3 h-3 text-[#3b9a6d]" />
                        {alert.channels_notified.length} alerted
                      </span>
                    )}
                    <ExternalLink className="w-4 h-4 text-[#66635f] group-hover:text-[#e8e5e0] transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#66635f]">
        <span>Auto-synced via WebSocket</span>
        <span className="font-mono">15s Alert Cooldown Active</span>
      </div>

      {/* Lightbox Modal */}
      {selectedAlert && (
        <Lightbox
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          imageUrl={selectedAlert.snapshot_url}
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
