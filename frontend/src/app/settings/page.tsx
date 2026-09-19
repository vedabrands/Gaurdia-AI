"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import {
  Settings,
  Sliders,
  Bell,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Radio,
  Volume2,
  Send,
  MessageSquare,
  Flame,
  UserCheck,
  Activity,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { useConfig } from "@/hooks/useConfig";

interface ConfigFormState {
  PERSON_CONF: number;
  WEAPON_CONF: number;
  POSE_CONF: number;
  PROXIMITY_PX: number;
  INTERACTION_DIST_PX: number;
  NECK_HOLD_RATIO: number;
  STRIKE_VELOCITY_THRESH: number;
  MIN_CONSEC_FRAMES: number;
  MIN_CONSEC_CHOKE_FRAMES: number;
  ALERT_COOLDOWN_SEC: number;
  ENABLE_SOUND_ALARM: boolean;
  ENABLE_VOICE_ALERT: boolean;
  VOICE_ALERT_TEXT: string;
}

export default function SettingsPage() {
  const { config, loading, saving, saveSuccess, error, saveConfig, refresh } =
    useConfig();

  const [form, setForm] = useState<ConfigFormState>({
    PERSON_CONF: 0.4,
    WEAPON_CONF: 0.3,
    POSE_CONF: 0.5,
    PROXIMITY_PX: 100,
    INTERACTION_DIST_PX: 250,
    NECK_HOLD_RATIO: 0.22,
    STRIKE_VELOCITY_THRESH: 30.0,
    MIN_CONSEC_FRAMES: 3,
    MIN_CONSEC_CHOKE_FRAMES: 3,
    ALERT_COOLDOWN_SEC: 15,
    ENABLE_SOUND_ALARM: true,
    ENABLE_VOICE_ALERT: true,
    VOICE_ALERT_TEXT: "ALERT EMERGENCY DETECTED",
  });

  useEffect(() => {
    if (config) {
      setForm({
        PERSON_CONF: config.thresholds?.PERSON_CONF ?? 0.4,
        WEAPON_CONF: config.thresholds?.WEAPON_CONF ?? 0.3,
        POSE_CONF: config.thresholds?.POSE_CONF ?? 0.5,
        PROXIMITY_PX: config.thresholds?.PROXIMITY_PX ?? 100,
        INTERACTION_DIST_PX: config.thresholds?.INTERACTION_DIST_PX ?? 250,
        NECK_HOLD_RATIO: config.thresholds?.NECK_HOLD_RATIO ?? 0.22,
        STRIKE_VELOCITY_THRESH: config.thresholds?.STRIKE_VELOCITY_THRESH ?? 30.0,
        MIN_CONSEC_FRAMES: config.thresholds?.MIN_CONSEC_FRAMES ?? 3,
        MIN_CONSEC_CHOKE_FRAMES: config.thresholds?.MIN_CONSEC_CHOKE_FRAMES ?? 3,
        ALERT_COOLDOWN_SEC: config.alerts?.ALERT_COOLDOWN_SEC ?? 15,
        ENABLE_SOUND_ALARM: config.alerts?.ENABLE_SOUND_ALARM ?? true,
        ENABLE_VOICE_ALERT: config.alerts?.ENABLE_VOICE_ALERT ?? true,
        VOICE_ALERT_TEXT: config.alerts?.VOICE_ALERT_TEXT ?? "ALERT EMERGENCY DETECTED",
      });
    }
  }, [config]);

  const handleSliderChange = (key: keyof ConfigFormState, value: number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleChange = (key: keyof ConfigFormState) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveConfig(form as unknown as Record<string, unknown>);
  };

  const handleReset = () => {
    if (config) {
      setForm({
        PERSON_CONF: config.thresholds?.PERSON_CONF ?? 0.4,
        WEAPON_CONF: config.thresholds?.WEAPON_CONF ?? 0.3,
        POSE_CONF: config.thresholds?.POSE_CONF ?? 0.5,
        PROXIMITY_PX: config.thresholds?.PROXIMITY_PX ?? 100,
        INTERACTION_DIST_PX: config.thresholds?.INTERACTION_DIST_PX ?? 250,
        NECK_HOLD_RATIO: config.thresholds?.NECK_HOLD_RATIO ?? 0.22,
        STRIKE_VELOCITY_THRESH: config.thresholds?.STRIKE_VELOCITY_THRESH ?? 30.0,
        MIN_CONSEC_FRAMES: config.thresholds?.MIN_CONSEC_FRAMES ?? 3,
        MIN_CONSEC_CHOKE_FRAMES: config.thresholds?.MIN_CONSEC_CHOKE_FRAMES ?? 3,
        ALERT_COOLDOWN_SEC: config.alerts?.ALERT_COOLDOWN_SEC ?? 15,
        ENABLE_SOUND_ALARM: config.alerts?.ENABLE_SOUND_ALARM ?? true,
        ENABLE_VOICE_ALERT: config.alerts?.ENABLE_VOICE_ALERT ?? true,
        VOICE_ALERT_TEXT: config.alerts?.VOICE_ALERT_TEXT ?? "ALERT EMERGENCY DETECTED",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header />

      <main className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Title & Save Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#3b9a6d]/10 text-[#3b9a6d] border border-[#3b9a6d]/20">
                <Settings className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-[#e8e5e0]">
                System & AI Configuration
              </h1>
            </div>
            <p className="text-xs text-[#9b9590] mt-1">
              Adjust neural detection thresholds, action heuristic parameters, and alert dispatch channels
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#9b9590] hover:text-[#e8e5e0] border border-white/10 text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" /> Reset Changes
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#3b9a6d] hover:bg-[#3b9a6d]/90 text-[#0f0f11] text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 shadow-lg shadow-[#3b9a6d]/20"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save & Apply"}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-[#3b9a6d]/15 border border-[#3b9a6d]/30 text-[#3b9a6d] flex items-center gap-3 text-xs font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Configuration saved successfully! Real-time pipeline parameters updated.</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-[#c0392b]/15 border border-[#c0392b]/30 text-[#c0392b] flex items-center gap-3 text-xs font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 1: Neural Detection Thresholds */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-5 space-y-6">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                <Sliders className="w-4 h-4 text-[#3b9a6d]" />
                <h3 className="text-sm font-semibold text-[#e8e5e0]">
                  Neural Detection Thresholds
                </h3>
              </div>

              {/* Person Confidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#e8e5e0] font-medium flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#5a7d9a]" /> Person Confidence
                  </span>
                  <span className="font-mono text-[#3b9a6d] font-bold">
                    {((form.PERSON_CONF ?? 0.4) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={form.PERSON_CONF ?? 0.4}
                  onChange={(e) =>
                    handleSliderChange("PERSON_CONF", parseFloat(e.target.value))
                  }
                  className="w-full accent-[#3b9a6d] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-[#66635f]">
                  Minimum YOLOv8 confidence required to track human subjects
                </p>
              </div>

              {/* Weapon Confidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#e8e5e0] font-medium flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#c48830]" /> Weapon Confidence
                  </span>
                  <span className="font-mono text-[#c48830] font-bold">
                    {((form.WEAPON_CONF ?? 0.3) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={form.WEAPON_CONF ?? 0.3}
                  onChange={(e) =>
                    handleSliderChange("WEAPON_CONF", parseFloat(e.target.value))
                  }
                  className="w-full accent-[#c48830] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-[#66635f]">
                  YOLO-World zero-shot confidence for knife, gun, firearm & hazardous item detection
                </p>
              </div>

              {/* Pose Keypoint Confidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#e8e5e0] font-medium flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#7ba3c4]" /> Pose Keypoint Confidence
                  </span>
                  <span className="font-mono text-[#7ba3c4] font-bold">
                    {((form.POSE_CONF ?? 0.5) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={form.POSE_CONF ?? 0.5}
                  onChange={(e) =>
                    handleSliderChange("POSE_CONF", parseFloat(e.target.value))
                  }
                  className="w-full accent-[#5a7d9a] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-[#66635f]">
                  Minimum keypoint confidence for skeletal motion heuristics
                </p>
              </div>

              {/* Proximity Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#e8e5e0] font-medium">
                    Weapon Proximity Threshold
                  </span>
                  <span className="font-mono text-[#e8e5e0] font-bold">
                    {form.PROXIMITY_PX ?? 100} px
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="10"
                  value={form.PROXIMITY_PX ?? 100}
                  onChange={(e) =>
                    handleSliderChange("PROXIMITY_PX", parseInt(e.target.value))
                  }
                  className="w-full accent-[#3b9a6d] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-[#66635f]">
                  Pixel proximity threshold between person boundary and detected weapon
                </p>
              </div>

              {/* Interaction Distance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#e8e5e0] font-medium">
                    Body Interaction Distance
                  </span>
                  <span className="font-mono text-[#e8e5e0] font-bold">
                    {form.INTERACTION_DIST_PX ?? 250} px
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={form.INTERACTION_DIST_PX ?? 250}
                  onChange={(e) =>
                    handleSliderChange("INTERACTION_DIST_PX", parseInt(e.target.value))
                  }
                  className="w-full accent-[#3b9a6d] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-[#66635f]">
                  Maximum distance between tracked subjects to evaluate fighting heuristics
                </p>
              </div>

              {/* Neck Hold Ratio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#e8e5e0] font-medium">
                    Neck Hold / Chokehold Ratio
                  </span>
                  <span className="font-mono text-[#c0392b] font-bold">
                    {(form.NECK_HOLD_RATIO ?? 0.22).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.01"
                  value={form.NECK_HOLD_RATIO ?? 0.22}
                  onChange={(e) =>
                    handleSliderChange("NECK_HOLD_RATIO", parseFloat(e.target.value))
                  }
                  className="w-full accent-[#c0392b] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-[#66635f]">
                  Torso height normalized ratio triggering chokehold classification
                </p>
              </div>
            </div>

            {/* Section 2: Alert Cooldown & Multi-Channel Dispatch */}
            <div className="space-y-6">
              {/* Alert Timing */}
              <div className="bg-[#18181b] border border-white/5 rounded-xl p-5 space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                  <Bell className="w-4 h-4 text-[#c48830]" />
                  <h3 className="text-sm font-semibold text-[#e8e5e0]">
                    Alert Timing & Audio
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#e8e5e0] font-medium">
                      Alert Cooldown Interval
                    </span>
                    <span className="font-mono text-[#e8e5e0] font-bold">
                      {form.ALERT_COOLDOWN_SEC ?? 15}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={form.ALERT_COOLDOWN_SEC ?? 15}
                    onChange={(e) =>
                      handleSliderChange(
                        "ALERT_COOLDOWN_SEC",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full accent-[#3b9a6d] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[11px] text-[#66635f]">
                    Prevents alert spam by enforcing a minimum quiet window between dispatches
                  </p>
                </div>

                {/* Local Siren Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-[#c0392b]" />
                    <div>
                      <div className="text-xs font-semibold text-[#e8e5e0]">
                        Local PC Siren Alarm
                      </div>
                      <div className="text-[10px] text-[#66635f]">
                        Trigger system tone buzzer on Tier 1 & 2 breaches
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.ENABLE_SOUND_ALARM}
                    onChange={() => handleToggleChange("ENABLE_SOUND_ALARM")}
                    className="w-4 h-4 accent-[#3b9a6d] rounded cursor-pointer"
                  />
                </div>

                {/* Voice Alert Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-[#3b9a6d]" />
                    <div>
                      <div className="text-xs font-semibold text-[#e8e5e0]">
                        Voice Text-to-Speech (SAPI)
                      </div>
                      <div className="text-[10px] text-[#66635f]">
                        Speak audio announcement upon threat event
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.ENABLE_VOICE_ALERT}
                    onChange={() => handleToggleChange("ENABLE_VOICE_ALERT")}
                    className="w-4 h-4 accent-[#3b9a6d] rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Dispatch Channel Statuses */}
              <div className="bg-[#18181b] border border-white/5 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-4 h-4 text-[#3b9a6d]" />
                    <h3 className="text-sm font-semibold text-[#e8e5e0]">
                      Dispatch Channel Credentials
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#9b9590] font-mono">
                    Backend Env Status
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Telegram */}
                  <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Send className="w-4 h-4 text-[#5a7d9a]" />
                      <div>
                        <div className="text-xs font-semibold text-[#e8e5e0]">
                          Telegram Bot
                        </div>
                        <div className="text-[10px] text-[#66635f]">Photo & text dispatch</div>
                      </div>
                    </div>
                    <Badge
                      variant={config?.alerts?.TELEGRAM_BOT_TOKEN_configured ? "normal" : "neutral"}
                      size="sm"
                    >
                      {config?.alerts?.TELEGRAM_BOT_TOKEN_configured ? "Active" : "Not Set"}
                    </Badge>
                  </div>

                  {/* Discord */}
                  <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-[#5a7d9a]" />
                      <div>
                        <div className="text-xs font-semibold text-[#e8e5e0]">
                          Discord Webhook
                        </div>
                        <div className="text-[10px] text-[#66635f]">Rich embed card</div>
                      </div>
                    </div>
                    <Badge
                      variant={config?.alerts?.DISCORD_WEBHOOK_URL_configured ? "normal" : "neutral"}
                      size="sm"
                    >
                      {config?.alerts?.DISCORD_WEBHOOK_URL_configured ? "Active" : "Not Set"}
                    </Badge>
                  </div>

                  {/* WhatsApp (CallMeBot) */}
                  <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Radio className="w-4 h-4 text-[#3b9a6d]" />
                      <div>
                        <div className="text-xs font-semibold text-[#e8e5e0]">
                          WhatsApp (CallMeBot)
                        </div>
                        <div className="text-[10px] text-[#66635f]">Direct API message</div>
                      </div>
                    </div>
                    <Badge
                      variant={config?.alerts?.CALLMEBOT_API_KEY_configured ? "normal" : "neutral"}
                      size="sm"
                    >
                      {config?.alerts?.CALLMEBOT_API_KEY_configured ? "Active" : "Not Set"}
                    </Badge>
                  </div>

                  {/* Twilio WhatsApp */}
                  <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Radio className="w-4 h-4 text-[#c48830]" />
                      <div>
                        <div className="text-xs font-semibold text-[#e8e5e0]">
                          Twilio WhatsApp
                        </div>
                        <div className="text-[10px] text-[#66635f]">Enterprise dispatch</div>
                      </div>
                    </div>
                    <Badge
                      variant={config?.alerts?.TWILIO_SID_configured ? "normal" : "neutral"}
                      size="sm"
                    >
                      {config?.alerts?.TWILIO_SID_configured ? "Active" : "Not Set"}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-[#66635f] flex items-start gap-2">
                  <Shield className="w-4 h-4 text-[#3b9a6d] shrink-0 mt-0.5" />
                  <span>
                    API tokens are securely read from your backend environment / <code className="text-[#e8e5e0]">config.py</code>. Sliders adjust live in-memory pipeline heuristics.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
