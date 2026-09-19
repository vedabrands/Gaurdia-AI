export const EASING = {
  spring: "cubic-bezier(0.16, 1, 0.3, 1)",
  settle: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const DURATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  enter: 350,
} as const;

export const THREAT_COLORS: Record<string, string> = {
  NORMAL: "#3b9a6d",
  WARNING: "#c48830",
  CRITICAL: "#c0392b",
} as const;

export const THREAT_LABELS: Record<string, string> = {
  NORMAL: "System Normal",
  WARNING: "Threat Detected",
  CRITICAL: "Critical Alert",
} as const;

export const API_BASE = "";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/events";
