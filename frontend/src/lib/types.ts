export type ThreatTier = "NORMAL" | "WARNING" | "CRITICAL";

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

export type CameraStatus = "online" | "offline" | "connecting";

export type ViolenceStatus = "INACTIVE" | "FIGHTING" | "CHOKING";

export interface BoundingBox {
  id: number | string;
  x: number; // 0 to 1 normalized
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  type: "person" | "weapon" | "violence" | "fall";
  keypoints?: [number, number, number][]; // [x, y, conf]
}

export interface Telemetry {
  type: "telemetry";
  fps: number;
  person_count: number;
  weapon_count: number;
  threat_tier: ThreatTier;
  fight_detected: boolean;
  neck_hold_detected: boolean;
  fallen_count: number;
  timestamp: string;
  boxes?: BoundingBox[];
}

export interface AlertEvent {
  type: "alert";
  id: string;
  threat_type: string;
  tier: number;
  message: string;
  snapshot_url: string;
  channels_notified: string[];
  timestamp: string;
  confidence?: number;
}

export type WSMessage = Telemetry | AlertEvent;

export interface AlertHistoryItem {
  id: string;
  timestamp: string;
  threat_type: string;
  message: string;
  snapshot_url: string;
  tier: number;
  channels_notified: string[];
  acknowledged?: boolean;
}

export type AlertRecord = AlertHistoryItem;

export interface AlertHistoryResponse {
  alerts: AlertHistoryItem[];
  total: number;
  page: number;
  pages: number;
}

export interface SystemStatus {
  camera_connected: boolean;
  models_loaded: {
    pose: boolean;
    weapon: boolean;
    action: boolean;
  };
  channels: {
    telegram: boolean;
    discord: boolean;
    whatsapp_callmebot: boolean;
    whatsapp_twilio: boolean;
    local_siren: boolean;
    voice_tts: boolean;
  };
  uptime_sec: number;
  video_source: string | number;
}

export interface SystemConfig {
  models: {
    POSE_MODEL: string;
    PERSON_MODEL: string;
    WEAPON_MODE: string;
    YOLO_WORLD_MODEL: string;
    CUSTOM_WEAPON_MODEL: string;
    WEAPON_CLASSES: string[];
    POSE_IMGSZ: number;
    WEAPON_IMGSZ: number;
    WEAPON_CHECK_INTERVAL: number;
  };
  thresholds: {
    PERSON_CONF: number;
    WEAPON_CONF: number;
    POSE_CONF: number;
    PROXIMITY_PX: number;
    FIGHT_WINDOW: number;
    INTERACTION_DIST_PX: number;
    KEYPOINT_CONF: number;
    NECK_HOLD_RATIO: number;
    STRIKE_VELOCITY_THRESH: number;
    VIOLENCE_VELOCITY_THRESH: number;
    MIN_CONSEC_FRAMES: number;
    MIN_CONSEC_CHOKE_FRAMES: number;
  };
  alerts: {
    ALERT_COOLDOWN_SEC: number;
    ENABLE_SOUND_ALARM: boolean;
    ENABLE_VOICE_ALERT: boolean;
    VOICE_ALERT_TEXT: string;
    ALERT_WHATSAPP_TO: string;
    TWILIO_WHATSAPP_FROM: string;
    TELEGRAM_BOT_TOKEN_configured: boolean;
    TELEGRAM_CHAT_ID_configured: boolean;
    DISCORD_WEBHOOK_URL_configured: boolean;
    TWILIO_SID_configured: boolean;
    TWILIO_AUTH_TOKEN_configured: boolean;
    TWILIO_CONTENT_SID_configured: boolean;
    CALLMEBOT_API_KEY_configured: boolean;
  };
  video: {
    VIDEO_SOURCE: string | number;
    DISPLAY_WIDTH: number;
    DISPLAY_HEIGHT: number;
    CAMERA_WIDTH: number;
    CAMERA_HEIGHT: number;
    START_FULLSCREEN: boolean;
  };
}

export interface SystemStats {
  total_alerts: number;
  alerts_by_type: Record<string, number>;
  alerts_by_hour: number[];
  avg_fps: number;
  peak_person_count: number;
  uptime_sec: number;
}

export interface GuardiaState {
  wsStatus: ConnectionStatus;
  cameraStatus: CameraStatus;
  fps: number;
  fpsHistory: number[];
  personCount: number;
  weaponCount: number;
  violenceStatus: ViolenceStatus;
  fallenCount: number;
  threatTier: ThreatTier;
  systemStatus: SystemStatus | null;
  incidents: AlertRecord[];
  uptimeSec: number;
  isMuted: boolean;
  isDemo: boolean;
  isSidebarCollapsed: boolean;
  alertCooldownRemaining: number;
  activeBoundingBoxes: BoundingBox[];
}
