"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, X, ShieldAlert, Radio } from "lucide-react";
import type { AlertEvent } from "@/lib/types";
import { Badge } from "./Badge";
import { formatTimestamp } from "@/lib/formatters";

interface ToastProps {
  alert: AlertEvent;
  onDismiss: (id: string) => void;
  onViewDetails?: (alert: AlertEvent) => void;
}

export function AlertToast({ alert, onDismiss, onViewDetails }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 8000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss(alert.id);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [alert.id, onDismiss]);

  const isCritical = alert.tier <= 2;

  return (
    <div
      className={`relative w-96 rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 pointer-events-auto overflow-hidden animate-in slide-in-from-top-4 ${
        isCritical
          ? "bg-[#18181b]/95 border-[#c0392b]/40 text-[#e8e5e0]"
          : "bg-[#18181b]/95 border-[#c48830]/40 text-[#e8e5e0]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            isCritical
              ? "bg-[#c0392b]/15 text-[#c0392b] border border-[#c0392b]/30"
              : "bg-[#c48830]/15 text-[#c48830] border border-[#c48830]/30"
          }`}
        >
          {isCritical ? (
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm text-[#e8e5e0] truncate">
              {alert.threat_type}
            </h4>
            <Badge variant={isCritical ? "critical" : "warning"} size="sm" dot>
              Tier {alert.tier}
            </Badge>
          </div>

          <p className="text-xs text-[#9b9590] line-clamp-2 mb-2">{alert.message}</p>

          <div className="flex items-center justify-between text-[11px] text-[#66635f]">
            <span>{formatTimestamp(alert.timestamp)}</span>
            {alert.channels_notified && alert.channels_notified.length > 0 && (
              <span className="flex items-center gap-1 text-[#9b9590]">
                <Radio className="w-3 h-3 text-[#3b9a6d]" />
                {alert.channels_notified.length} alerted
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onDismiss(alert.id)}
          className="text-[#66635f] hover:text-[#e8e5e0] transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {onViewDetails && (
        <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
          <button
            onClick={() => onViewDetails(alert)}
            className="text-xs text-[#3b9a6d] hover:underline font-medium"
          >
            View Snapshot →
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className={`h-full transition-all duration-75 ${
            isCritical ? "bg-[#c0392b]" : "bg-[#c48830]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
