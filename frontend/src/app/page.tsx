"use client";

import React, { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { ThreatBanner } from "@/components/dashboard/ThreatBanner";
import { TelemetryBar } from "@/components/dashboard/TelemetryBar";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { AlertToast } from "@/components/shared/Toast";
import { Lightbox } from "@/components/shared/Lightbox";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAlerts } from "@/hooks/useAlerts";
import type { AlertEvent, AlertRecord } from "@/lib/types";

export default function DashboardPage() {
  const [toasts, setToasts] = useState<AlertEvent[]>([]);
  const [selectedLightboxAlert, setSelectedLightboxAlert] = useState<AlertRecord | null>(null);

  const { alerts, loading: alertsLoading, addLiveAlert } = useAlerts(1, 10);

  const handleAlertReceived = useCallback(
    (alert: AlertEvent) => {
      // Add to toasts
      setToasts((prev) => [alert, ...prev.slice(0, 3)]);
      // Add to alert list
      addLiveAlert({
        id: alert.id,
        timestamp: alert.timestamp,
        threat_type: alert.threat_type,
        tier: alert.tier,
        message: alert.message,
        snapshot_url: alert.snapshot_url,
        channels_notified: alert.channels_notified,
      });
    },
    [addLiveAlert]
  );

  const { telemetry, connectionStatus } = useTelemetry(handleAlertReceived);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openLightboxFromToast = (alert: AlertEvent) => {
    setSelectedLightboxAlert({
      id: alert.id,
      timestamp: alert.timestamp,
      threat_type: alert.threat_type,
      tier: alert.tier,
      message: alert.message,
      snapshot_url: alert.snapshot_url,
      channels_notified: alert.channels_notified,
    });
    dismissToast(alert.id);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header with real-time status */}
      <Header
        threatTier={telemetry.threat_tier}
        wsStatus={connectionStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Threat Level Banner */}
        <ThreatBanner telemetry={telemetry} />

        {/* Telemetry Metrics Bar */}
        <TelemetryBar telemetry={telemetry} />

        {/* Live Surveillance Feed + Recent Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Video Stream */}
          <div className="lg:col-span-2 space-y-4">
            <LiveFeed
              threatTier={telemetry.threat_tier}
              personCount={telemetry.person_count}
              weaponCount={telemetry.weapon_count}
              fps={telemetry.fps}
            />
          </div>

          {/* Recent Incident Feed */}
          <div className="lg:col-span-1 h-[420px] lg:h-full min-h-[420px]">
            <RecentAlerts alerts={alerts} loading={alertsLoading} />
          </div>
        </div>
      </main>

      {/* Floating Alert Toasts Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <AlertToast
            key={toast.id}
            alert={toast}
            onDismiss={dismissToast}
            onViewDetails={openLightboxFromToast}
          />
        ))}
      </div>

      {/* Snapshot Lightbox Viewer */}
      {selectedLightboxAlert && (
        <Lightbox
          isOpen={!!selectedLightboxAlert}
          onClose={() => setSelectedLightboxAlert(null)}
          imageUrl={selectedLightboxAlert.snapshot_url}
          threatType={selectedLightboxAlert.threat_type}
          tier={selectedLightboxAlert.tier}
          timestamp={selectedLightboxAlert.timestamp}
          channelsNotified={selectedLightboxAlert.channels_notified}
          message={selectedLightboxAlert.message}
        />
      )}
    </div>
  );
}
