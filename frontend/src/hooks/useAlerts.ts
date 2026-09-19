"use client";

import { useState, useEffect, useCallback } from "react";
import { getAlertHistory } from "@/lib/api";
import type { AlertRecord, AlertHistoryResponse } from "@/lib/types";

export function useAlerts(initialPage = 1, initialPerPage = 20, initialThreatType?: string) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(initialPage);
  const [perPage, setPerPage] = useState<number>(initialPerPage);
  const [threatType, setThreatType] = useState<string | undefined>(initialThreatType);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data: AlertHistoryResponse = await getAlertHistory(page, perPage, threatType);
      setAlerts(data.alerts);
      setTotal(data.total);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load alerts";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, threatType]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Prepend live incoming alert to table if matching filter
  const addLiveAlert = useCallback((newAlert: AlertRecord) => {
    setAlerts((prev) => {
      // Don't add duplicate
      if (prev.some((a) => a.id === newAlert.id)) return prev;
      if (threatType && newAlert.threat_type !== threatType) return prev;
      return [newAlert, ...prev.slice(0, perPage - 1)];
    });
    setTotal((prev) => prev + 1);
  }, [threatType, perPage]);

  return {
    alerts,
    total,
    page,
    perPage,
    threatType,
    loading,
    error,
    setPage,
    setPerPage,
    setThreatType,
    refresh: fetchAlerts,
    addLiveAlert,
  };
}
