export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatFps(fps: number): string {
  return fps.toFixed(1);
}

export function threatTierLabel(tier: number): string {
  switch (tier) {
    case 1:
      return "ARMED VIOLENCE";
    case 2:
      return "NECK HOLD / CHOKING";
    case 3:
      return "WEAPON DETECTED";
    case 4:
      return "FIGHT DETECTED";
    case 5:
      return "FALL DETECTED";
    default:
      return "GENERAL";
  }
}
