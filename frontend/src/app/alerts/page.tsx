"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Radio,
  Image as ImageIcon,
  Clock,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { Lightbox } from "@/components/shared/Lightbox";
import { formatTimestamp } from "@/lib/formatters";
import { useAlerts } from "@/hooks/useAlerts";
import type { AlertRecord } from "@/lib/types";

const THREAT_FILTERS = [
  { label: "All Incidents", value: "" },
  { label: "Armed Violence (Tier 1)", value: "Armed Violence" },
  { label: "Neck Hold / Choking (Tier 2)", value: "Neck Hold" },
  { label: "Weapon Detected (Tier 3)", value: "Weapon" },
  { label: "Fight Detected (Tier 4)", value: "Fight" },
  { label: "Fall Detected (Tier 5)", value: "Fall" },
];

export default function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    alerts,
    total,
    page,
    perPage,
    threatType,
    loading,
    setPage,
    setThreatType,
    refresh,
  } = useAlerts(1, 15);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const filteredAlerts = alerts.filter((alert) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      alert.threat_type.toLowerCase().includes(q) ||
      alert.message.toLowerCase().includes(q) ||
      alert.id.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const headers = ["ID", "Timestamp", "Threat Type", "Tier", "Message", "Channels"];
    const rows = filteredAlerts.map((a) => [
      a.id,
      a.timestamp,
      `"${a.threat_type}"`,
      a.tier,
      `"${a.message.replace(/"/g, '""')}"`,
      `"${(a.channels_notified || []).join(", ")}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `guardia_incidents_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header />

      <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#c0392b]/10 text-[#c0392b] border border-[#c0392b]/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-[#e8e5e0]">Incident Security Log</h1>
            </div>
            <p className="text-xs text-[#9b9590] mt-1">
              Historical audit log of security threats, weapon alerts, and forensic snapshots
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#e8e5e0] border border-white/10 text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-[#9b9590]" /> Export CSV
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#18181b] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Threat Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {THREAT_FILTERS.map((f) => {
              const active = (threatType || "") === f.value;
              return (
                <button
                  key={f.label}
                  onClick={() => {
                    setThreatType(f.value || undefined);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                    active
                      ? "bg-white/10 text-[#e8e5e0] border-white/20 shadow-sm"
                      : "text-[#9b9590] hover:text-[#e8e5e0] hover:bg-white/5 border-transparent"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#66635f] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs & IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#e8e5e0] placeholder-[#66635f] focus:outline-none focus:border-[#3b9a6d]/50"
            />
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1f1f23] border-b border-white/5 text-[#9b9590] uppercase tracking-wider font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Snapshot</th>
                  <th className="py-3 px-4">Incident Type</th>
                  <th className="py-3 px-4">Severity Tier</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Channels Dispatched</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="w-12 h-12 rounded bg-white/5" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-32 bg-white/5 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-16 bg-white/5 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-28 bg-white/5 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-24 bg-white/5 rounded" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-6 w-16 bg-white/5 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[#66635f]">
                      <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium text-[#9b9590]">
                        No incident records found
                      </p>
                      <p className="text-xs mt-1">
                        Try clearing search filters or check backend camera feed
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => {
                    const isCritical = alert.tier <= 2;
                    return (
                      <tr
                        key={alert.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Snapshot thumbnail */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="w-12 h-12 rounded bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center hover:border-[#3b9a6d]/50 transition-colors"
                          >
                            {alert.snapshot_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={alert.snapshot_url}
                                alt={alert.threat_type}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-[#66635f]" />
                            )}
                          </button>
                        </td>

                        {/* Threat Type & Message */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-sm text-[#e8e5e0]">
                            {alert.threat_type}
                          </div>
                          <p className="text-[11px] text-[#9b9590] mt-0.5 line-clamp-1 max-w-md">
                            {alert.message}
                          </p>
                        </td>

                        {/* Tier */}
                        <td className="py-3 px-4">
                          <Badge
                            variant={isCritical ? "critical" : "warning"}
                            size="sm"
                            dot
                          >
                            Tier {alert.tier}
                          </Badge>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 px-4 font-mono text-[11px] text-[#9b9590]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#66635f]" />
                            {formatTimestamp(alert.timestamp)}
                          </div>
                        </td>

                        {/* Channels Notified */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(alert.channels_notified || []).map((ch) => (
                              <span
                                key={ch}
                                className="px-2 py-0.5 rounded bg-white/5 text-[#9b9590] border border-white/5 uppercase text-[10px] tracking-wider"
                              >
                                {ch}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[#e8e5e0] border border-white/10 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#3b9a6d]" /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-white/5 bg-[#1f1f23]/40 flex items-center justify-between text-xs text-[#9b9590]">
            <div>
              Showing <span className="text-[#e8e5e0] font-mono">{filteredAlerts.length}</span> of{" "}
              <span className="text-[#e8e5e0] font-mono">{total}</span> total incidents
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-[#e8e5e0] border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs px-2">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-[#e8e5e0] border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Snapshot Lightbox Viewer */}
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
