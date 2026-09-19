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
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useGuardiaStore } from "@/hooks/useGuardiaStore";
import { guardiaStore } from "@/lib/store";
import { Indicator } from "@/components/shared/Indicator";
import { useSystemStatus } from "@/hooks/useSystemStatus";

const NAV_ITEMS = [
  {
    label: "Live Monitor",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Incident Log",
    href: "/alerts",
    icon: ShieldAlert,
    badge: "LIVE",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    label: "Configuration",
    href: "/settings",
    icon: Settings,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, isDemo, incidents } = useGuardiaStore();
  const { status } = useSystemStatus();

  const unacknowledgedCount = incidents.filter((i) => !i.acknowledged).length;

  return (
    <aside
      className={`relative border-r border-white/5 bg-[#121216]/95 backdrop-blur-md flex flex-col shrink-0 min-h-screen transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-40 ${
        isSidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between min-h-[68px]">
        <Link href="/" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-10 h-10 rounded-lg bg-[#3b9a6d]/10 border border-[#3b9a6d]/30 flex items-center justify-center text-[#3b9a6d] shrink-0 group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-5 h-5" />
          </div>
          {!isSidebarCollapsed && (
            <div className="transition-opacity duration-200">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm tracking-wider text-[#f0ede6]">
                  GUARDIA<span className="text-[#3b9a6d] font-mono ml-0.5">AI</span>
                </h1>
                {isDemo && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#c48830]/20 text-[#c48830] border border-[#c48830]/30 animate-pulse">
                    Demo
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#66625c] uppercase tracking-widest font-mono">
                Surveillance OS
              </p>
            </div>
          )}
        </Link>

        {!isSidebarCollapsed && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#9f9a93] bg-white/5 border border-white/5">
            v2.4
          </span>
        )}
      </div>

      {/* Collapse Toggle Handle */}
      <button
        type="button"
        onClick={() => guardiaStore.toggleSidebar()}
        aria-label={isSidebarCollapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#1a1a22] border border-white/15 text-[#9f9a93] hover:text-[#f0ede6] hover:bg-[#252530] flex items-center justify-center text-xs shadow-md z-50 transition-transform active:scale-95"
        title="Shortcut: ["
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Navigation */}
      <nav className="p-3 space-y-1.5 flex-1">
        {!isSidebarCollapsed && (
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#66625c]">
            Operations
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isSidebarCollapsed ? `${item.label}` : undefined}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-white/10 text-[#f0ede6] border border-white/10 shadow-sm"
                  : "text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/5 border border-transparent"
              } ${isSidebarCollapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`w-4 h-4 transition-colors shrink-0 ${
                  isActive
                    ? "text-[#3b9a6d]"
                    : "text-[#66625c] group-hover:text-[#9f9a93]"
                }`}
              />

              {!isSidebarCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}

              {/* Unacknowledged Incident Badge */}
              {item.href === "/alerts" && unacknowledgedCount > 0 && (
                <span
                  className={`rounded-full font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#c0392b] text-white ${
                    isSidebarCollapsed ? "absolute -top-1 -right-1" : ""
                  }`}
                >
                  {unacknowledgedCount}
                </span>
              )}

              {/* Active Indicator Bar */}
              {isActive && !isSidebarCollapsed && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b9a6d] shadow-[0_0_8px_#3b9a6d]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Demo Mode Quick Launcher */}
      <div className="p-3 border-t border-white/5">
        <button
          type="button"
          onClick={() => guardiaStore.toggleDemo()}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-mono transition-all border ${
            isDemo
              ? "bg-[#c48830]/15 text-[#c48830] border-[#c48830]/30 shadow-[0_0_12px_rgba(196,136,48,0.2)]"
              : "bg-white/5 text-[#9f9a93] hover:text-[#f0ede6] hover:bg-white/10 border-white/5"
          }`}
          title="Toggle zero-backend demo mode simulation"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#c48830]" />
          {!isSidebarCollapsed && (
            <span>{isDemo ? "Exit Demo Mode" : "Simulate Demo Mode"}</span>
          )}
        </button>
      </div>

      {/* Backend / Channel Status Footer */}
      <div className="p-3.5 border-t border-white/5 bg-[#1a1a22]/40 space-y-2.5">
        <div className={`flex items-center text-xs ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!isSidebarCollapsed && (
            <span className="text-[#9f9a93] flex items-center gap-1.5 font-mono text-[11px]">
              <Radio className="w-3.5 h-3.5 text-[#3b9a6d]" /> Backend
            </span>
          )}
          <Indicator
            status={isDemo || status?.camera_connected ? "online" : "offline"}
            pulse={isDemo || status?.camera_connected}
            label={isSidebarCollapsed ? undefined : isDemo ? "Simulated" : status?.camera_connected ? "Active" : "Standby"}
            size="sm"
          />
        </div>

        {!isSidebarCollapsed && (
          <>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#9f9a93]">
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-[#66625c] block text-[10px]">Models</span>
                <span className="text-[#f0ede6]">
                  {isDemo ? "Simulated" : status?.models_loaded?.pose ? "YOLOv8 + World" : "Ready"}
                </span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-[#66625c] block text-[10px]">Feed</span>
                <span className="text-[#f0ede6] truncate block">
                  CAM-{isDemo ? "SIM" : status?.video_source ?? 0}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-[#66625c]">
              <span className="font-mono">FastAPI :8000</span>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[#9f9a93] transition-colors"
              >
                Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
