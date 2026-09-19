"use client";

import { useState, useEffect, useCallback } from "react";
import { getStatus } from "@/lib/api";
import type { SystemStatus } from "@/lib/types";

export function useSystemStatus(pollInterval = 10000) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getStatus();
      setStatus(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch system status";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    if (pollInterval <= 0) return;

    const timer = setInterval(() => {
      fetchStatus();
    }, pollInterval);

    return () => clearInterval(timer);
  }, [fetchStatus, pollInterval]);

  return {
    status,
    loading,
    error,
    refresh: fetchStatus,
  };
}
