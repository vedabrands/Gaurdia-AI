"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { ThreatBanner } from "@/components/dashboard/ThreatBanner";
import { TelemetryBar } from "@/components/dashboard/TelemetryBar";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { ToastContainer } from "@/components/shared/ToastContainer";
import { ShortcutModal } from "@/components/shared/ShortcutModal";
import { useGuardiaStore } from "@/hooks/useGuardiaStore";
import { guardiaStore } from "@/lib/store";

export default function DashboardPage() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const store = useGuardiaStore();

  // Global Keyboard Shortcuts (M, [, ?, /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        guardiaStore.toggleMute();
      } else if (e.key === "[") {
        e.preventDefault();
        guardiaStore.toggleSidebar();
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0c]">
      {/* Header with real-time status & navigation controls */}
      <Header onOpenShortcuts={() => setIsShortcutsOpen(true)} />

      {/* Main Tactical Dashboard Area */}
      <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-[1700px] w-full mx-auto">
        {/* Threat Level Banner */}
        <ThreatBanner />

        {/* Telemetry Metrics Grid Bar */}
        <TelemetryBar />

        {/* Live Surveillance Feed + Recent Incident Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          {/* Main Video Stream & Overlay Canvas */}
          <div className="lg:col-span-2">
            <LiveFeed />
          </div>

          {/* Incident Log & Cooldown Monitor */}
          <div className="lg:col-span-1 h-full min-h-[440px]">
            <RecentAlerts />
          </div>
        </div>
      </main>

      {/* Real-time Stackable Floating Alert Toasts Container */}
      <ToastContainer />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <ShortcutModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
