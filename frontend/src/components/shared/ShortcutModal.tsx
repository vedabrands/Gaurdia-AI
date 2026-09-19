"use client";

import React, { useEffect } from "react";
import { X, Keyboard, Command } from "lucide-react";

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "F", description: "Toggle Fullscreen Video Feed" },
  { key: "S", description: "Capture Snapshot with HUD Watermark" },
  { key: "R", description: "Reconnect WebSocket & Reload Video Stream" },
  { key: "M", description: "Mute / Unmute Audio Siren & Alert Beeps" },
  { key: "[", description: "Toggle Sidebar Collapse / Expand" },
  { key: "?", description: "Open / Close this Shortcuts Cheat Sheet" },
  { key: "ESC", description: "Close Modals / Exit Fullscreen" },
];

export function ShortcutModal({ isOpen, onClose }: ShortcutModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full surface-card border border-white/10 rounded-xl overflow-hidden shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#3b9a6d]/10 text-[#3b9a6d] border border-[#3b9a6d]/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#f0ede6]">
                Keyboard Shortcuts
              </h3>
              <p className="text-[11px] text-[#66625c]">
                Tactical surveillance hotkeys
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2.5">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs"
            >
              <span className="text-[#9f9a93]">{item.description}</span>
              <kbd className="px-2 py-1 rounded bg-[#0a0a0c] border border-white/15 font-mono text-[11px] font-bold text-[#f0ede6] shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-[11px] text-[#66625c] font-mono">
          Press <kbd className="text-[#9f9a93]">ESC</kbd> or click outside to dismiss
        </div>
      </div>
    </div>
  );
}
