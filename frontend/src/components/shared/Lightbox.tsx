"use client";

import React, { useEffect } from "react";
import { X, Download, ShieldAlert, Calendar, Radio } from "lucide-react";
import { Badge } from "./Badge";
import { formatTimestamp } from "@/lib/formatters";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  threatType?: string;
  tier?: number;
  timestamp?: string;
  channelsNotified?: string[];
  message?: string;
}

export function Lightbox({
  isOpen,
  onClose,
  imageUrl,
  threatType,
  tier,
  timestamp,
  channelsNotified = [],
  message,
}: LightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 md:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-[#18181b] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1f1f23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#c0392b]/10 text-[#c0392b] border border-[#c0392b]/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#e8e5e0]">
                  {threatType || "Security Incident Snapshot"}
                </h3>
                {tier !== undefined && (
                  <Badge variant={tier <= 2 ? "critical" : "warning"} size="sm" dot>
                    Tier {tier}
                  </Badge>
                )}
              </div>
              {timestamp && (
                <p className="text-xs text-[#9b9590] flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatTimestamp(timestamp)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              download={`guardia_incident_${Date.now()}.jpg`}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#e8e5e0] border border-white/10 transition-colors"
              title="Download Snapshot"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#9b9590] hover:text-[#e8e5e0] border border-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 bg-black/60 relative overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={threatType || "Incident snapshot"}
            className="max-h-[60vh] w-auto object-contain rounded border border-white/5"
          />
        </div>

        {/* Footer info */}
        {(message || channelsNotified.length > 0) && (
          <div className="px-6 py-4 border-t border-white/10 bg-[#1f1f23]/60 flex flex-wrap items-center justify-between gap-4 text-xs">
            {message && (
              <p className="text-[#9b9590] max-w-xl">
                <span className="text-[#e8e5e0] font-medium">Log:</span> {message}
              </p>
            )}

            {channelsNotified.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[#66635f] flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5" /> Dispatched to:
                </span>
                <div className="flex gap-1.5">
                  {channelsNotified.map((ch) => (
                    <span
                      key={ch}
                      className="px-2 py-0.5 rounded bg-white/5 text-[#9b9590] border border-white/5 uppercase text-[10px] tracking-wider"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
