"use client";

import { useState, useEffect, useCallback } from "react";
import { getConfig, updateConfig } from "@/lib/api";
import type { SystemConfig } from "@/lib/types";

export function useConfig() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConfig();
      setConfig(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load configuration";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = useCallback(async (updates: Partial<SystemConfig>) => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateConfig(updates as Record<string, unknown>);
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save configuration";
      setError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    config,
    loading,
    saving,
    saveSuccess,
    error,
    saveConfig,
    refresh: fetchConfig,
  };
}
