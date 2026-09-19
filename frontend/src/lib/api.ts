import type {
  AlertHistoryResponse,
  SystemConfig,
  SystemStats,
  SystemStatus,
} from "./types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getStatus(): Promise<SystemStatus> {
  return fetchJSON<SystemStatus>("/api/status");
}

export async function getAlertHistory(
  page = 1,
  perPage = 20,
  threatType?: string
): Promise<AlertHistoryResponse> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (threatType) params.set("threat_type", threatType);
  return fetchJSON<AlertHistoryResponse>(`/api/alerts/history?${params}`);
}

export async function getConfig(): Promise<SystemConfig> {
  return fetchJSON<SystemConfig>("/api/config");
}

export async function updateConfig(
  updates: Record<string, unknown>
): Promise<SystemConfig> {
  const res = await fetchJSON<{
    updated: Record<string, unknown>;
    errors?: Record<string, string>;
  }>("/api/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (res.errors && Object.keys(res.errors).length > 0) {
    const errorMsg = Object.entries(res.errors)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    throw new Error(errorMsg);
  }

  return getConfig();
}

export async function getStats(): Promise<SystemStats> {
  return fetchJSON<SystemStats>("/api/stats");
}
