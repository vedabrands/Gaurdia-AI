"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  BarChart3,
  Settings,
  Shield,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Indicator } from "@/components/shared/Indicator";
import { useSystemStatus } from "@/hooks/useSystemStatus";

const NAV_ITEMS = [
  {
    label: "Live Monitor",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Incident Log",
    href: "/alerts",
    icon: ShieldAlert,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Configuration",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { status } = useSystemStatus();

  return (
    <aside className="w-64 border-r border-white/5 bg-[#18181b] flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#3b9a6d]/10 border border-[#3b9a6d]/30 flex items-center justify-center text-[#3b9a6d]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wider text-[#e8e5e0]">
              GUARDIA<span className="text-[#3b9a6d] font-mono ml-1">AI</span>
            </h1>
            <p className="text-[10px] text-[#66635f] uppercase tracking-widest font-mono">
              Surveillance OS
            </p>
          </div>
        </div>

        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#9b9590] bg-white/5 border border-white/5">
          v2.0
        </span>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#66635f]">
          Operations
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-white/10 text-[#e8e5e0] border border-white/10"
                  : "text-[#9b9590] hover:text-[#e8e5e0] hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? "text-[#3b9a6d]"
                    : "text-[#66635f] group-hover:text-[#9b9590]"
                }`}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#3b9a6d]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Backend / Channel Status Footer */}
      <div className="p-4 border-t border-white/5 bg-[#1f1f23]/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#9b9590] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#3b9a6d]" /> Backend
          </span>
          <Indicator
            status={status?.camera_connected ? "online" : "offline"}
            pulse={status?.camera_connected}
            label={status?.camera_connected ? "Active" : "Offline"}
            size="sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#9b9590]">
          <div className="bg-white/5 p-2 rounded border border-white/5">
            <span className="text-[#66635f] block text-[10px]">Vision Models</span>
            <span className="text-[#e8e5e0]">
              {status?.models_loaded?.pose && status?.models_loaded?.weapon ? "Loaded" : "Online"}
            </span>
          </div>
          <div className="bg-white/5 p-2 rounded border border-white/5">
            <span className="text-[#66635f] block text-[10px]">Video Source</span>
            <span className="text-[#e8e5e0] truncate block">
              CAM-{status?.video_source ?? 0}
            </span>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px] text-[#66635f]">
          <span>FastAPI :8000</span>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-[#9b9590] transition-colors"
          >
            API Docs <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
}
