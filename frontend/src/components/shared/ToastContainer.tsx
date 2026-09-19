"use client";

import React, { useState, useEffect } from "react";
import { AlertToast } from "@/components/shared/Toast";
import type { AlertEvent } from "@/lib/types";
import { Lightbox } from "@/components/shared/Lightbox";

export function ToastContainer() {
  const [toasts, setToasts] = useState<AlertEvent[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertEvent | null>(null);

  useEffect(() => {
    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent<AlertEvent>;
      if (customEvent.detail) {
        setToasts((prev) => [customEvent.detail, ...prev.slice(0, 4)]);
      }
    };

    window.addEventListener("guardia:alert", handleAlert);
    return () => window.removeEventListener("guardia:alert", handleAlert);
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <div
        className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full"
        aria-live="assertive"
      >
        {toasts.map((toast) => (
          <AlertToast
            key={toast.id}
            alert={toast}
            onDismiss={handleDismiss}
            onViewDetails={(a) => setSelectedAlert(a)}
          />
        ))}
      </div>

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
    </>
  );
}
