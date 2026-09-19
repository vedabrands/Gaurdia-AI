import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "normal" | "warning" | "critical" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  dot = false,
}: BadgeProps) {
  const variantStyles = {
    normal: "bg-[#3b9a6d]/10 text-[#3b9a6d] border-[#3b9a6d]/20",
    warning: "bg-[#c48830]/10 text-[#c48830] border-[#c48830]/20",
    critical: "bg-[#c0392b]/10 text-[#c0392b] border-[#c0392b]/25",
    info: "bg-[#5a7d9a]/10 text-[#7ba3c4] border-[#5a7d9a]/20",
    neutral: "bg-white/5 text-[#9b9590] border-white/10",
  };

  const dotColors = {
    normal: "bg-[#3b9a6d]",
    warning: "bg-[#c48830]",
    critical: "bg-[#c0392b]",
    info: "bg-[#5a7d9a]",
    neutral: "bg-[#66635f]",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 tracking-wide",
    md: "text-xs px-2.5 py-1 font-medium",
    lg: "text-sm px-3 py-1.5 font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} transition-all duration-200 ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]} ${
            variant === "critical" ? "animate-ping opacity-80" : ""
          }`}
        />
      )}
      {children}
    </span>
  );
}
