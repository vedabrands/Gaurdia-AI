import React from "react";

interface IndicatorProps {
  status: "online" | "offline" | "connecting" | "warning" | "critical";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  label?: string;
  className?: string;
}

export function Indicator({
  status,
  size = "md",
  pulse = false,
  label,
  className = "",
}: IndicatorProps) {
  const statusColors = {
    online: "bg-[#3b9a6d]",
    offline: "bg-[#66635f]",
    connecting: "bg-[#c48830]",
    warning: "bg-[#c48830]",
    critical: "bg-[#c0392b]",
  };

  const ringColors = {
    online: "ring-[#3b9a6d]/30",
    offline: "ring-transparent",
    connecting: "ring-[#c48830]/30",
    warning: "ring-[#c48830]/30",
    critical: "ring-[#c0392b]/30",
  };

  const sizeClasses = {
    sm: "w-2 h-2 ring-2",
    md: "w-2.5 h-2.5 ring-4",
    lg: "w-3 h-3 ring-4",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex">
        {pulse && status === "online" && (
          <span className="live-pulse absolute inline-flex h-full w-full rounded-full opacity-75" />
        )}
        {pulse && status === "critical" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c0392b] opacity-75" />
        )}
        <span
          className={`rounded-full shrink-0 ${statusColors[status]} ${ringColors[status]} ${sizeClasses[size]}`}
        />
      </span>
      {label && (
        <span className="text-xs text-[#9b9590] capitalize font-medium">{label}</span>
      )}
    </div>
  );
}
