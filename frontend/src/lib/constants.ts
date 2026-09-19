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

export const THREAT_COLORS = {
  NORMAL: "#3b9a6d",
  WARNING: "#c48830",
  CRITICAL: "#c0392b",
  OFFLINE: "#55524e",
} as const;

export const THREAT_LABELS = {
  NORMAL: "ALL SECTORS SECURED",
  WARNING: "THREAT ADVISORY ACTIVE",
  CRITICAL: "CRITICAL THREAT ENGAGED",
  OFFLINE: "SURVEILLANCE OFFLINE",
} as const;

export const ALERT_COOLDOWN_SEC = 15;

export const KEYBOARD_SHORTCUTS = [
  { key: "F", description: "Toggle Video Fullscreen" },
  { key: "R", description: "Reconnect WebSocket & Feed" },
  { key: "M", description: "Toggle Audio Mute" },
  { key: "S", description: "Capture Feed Snapshot" },
  { key: "[", description: "Toggle Sidebar Collapse" },
  { key: "?", description: "Open Shortcuts Reference" },
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Live Monitor", icon: "monitor" },
  { href: "/alerts", label: "Incident Log", icon: "shield-alert" },
  { href: "/analytics", label: "Analytics", icon: "bar-chart" },
  { href: "/settings", label: "Configuration", icon: "sliders" },
] as const;

export const API_BASE = "";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/events";
