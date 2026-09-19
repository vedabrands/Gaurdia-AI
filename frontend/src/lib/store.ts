import { GuardiaState, WSMessage, AlertRecord, ThreatTier, BoundingBox } from "./types";
import { WS_URL, ALERT_COOLDOWN_SEC } from "./constants";
import { playAlertSound } from "./audio";

type Listener = (state: GuardiaState) => void;

function loadStoredBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveStoredBoolean(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const initialState: GuardiaState = {
  wsStatus: "connecting",
  cameraStatus: "offline",
  fps: 0,
  fpsHistory: new Array(60).fill(0),
  personCount: 0,
  weaponCount: 0,
  violenceStatus: "INACTIVE",
  fallenCount: 0,
  threatTier: "NORMAL",
  systemStatus: null,
  incidents: [],
  uptimeSec: 0,
  isMuted: loadStoredBoolean("guardia_muted", false),
  isDemo: false,
  isSidebarCollapsed: loadStoredBoolean("guardia_sidebar_collapsed", false),
  alertCooldownRemaining: 0,
  activeBoundingBoxes: [],
};

class GuardiaStore {
  private state: GuardiaState = { ...initialState };
  private listeners: Set<Listener> = new Set();
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;
  private demoInterval: ReturnType<typeof setInterval> | null = null;
  private retryDelay = 1000;
  private reconnectCountdownInterval: ReturnType<typeof setInterval> | null = null;
  public reconnectCountdown = 0;

  constructor() {
    if (typeof window !== "undefined") {
      // Check query param for demo mode
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("demo") === "true") {
        this.state.isDemo = true;
      }
      this.init();
    }
  }

  public init() {
    this.startCooldownTicker();
    if (this.state.isDemo) {
      this.startDemoEngine();
    } else {
      this.connectWebSocket();
    }
  }

  public getState(): GuardiaState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public setState(partial: Partial<GuardiaState> | ((prev: GuardiaState) => Partial<GuardiaState>)) {
    const next = typeof partial === "function" ? partial(this.state) : partial;
    this.state = { ...this.state, ...next };
    this.notify();
  }

  // --- Mute & Sidebar Toggles ---
  public toggleMute() {
    const nextMuted = !this.state.isMuted;
    saveStoredBoolean("guardia_muted", nextMuted);
    this.setState({ isMuted: nextMuted });
    playAlertSound("CLICK", nextMuted);
  }

  public toggleSidebar() {
    const nextCollapsed = !this.state.isSidebarCollapsed;
    saveStoredBoolean("guardia_sidebar_collapsed", nextCollapsed);
    this.setState({ isSidebarCollapsed: nextCollapsed });
    playAlertSound("CLICK", this.state.isMuted);
  }

  public toggleDemo() {
    const nextDemo = !this.state.isDemo;
    this.setState({ isDemo: nextDemo });

    if (nextDemo) {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.startDemoEngine();
    } else {
      this.stopDemoEngine();
      this.connectWebSocket();
    }
  }

  // --- Incident Actions ---
  public acknowledgeIncident(id: string) {
    this.setState((prev) => ({
      incidents: prev.incidents.map((inc) => (inc.id === id ? { ...inc, acknowledged: true } : inc)),
    }));
    playAlertSound("CLICK", this.state.isMuted);
  }

  public dismissIncident(id: string) {
    this.setState((prev) => ({
      incidents: prev.incidents.filter((inc) => inc.id !== id),
    }));
    playAlertSound("CLICK", this.state.isMuted);
  }

  // --- Alert Cooldown Engine ---
  private startCooldownTicker() {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      if (this.state.alertCooldownRemaining > 0) {
        this.setState((prev) => ({
          alertCooldownRemaining: Math.max(0, prev.alertCooldownRemaining - 1),
        }));
      }
    }, 1000);
  }

  // --- WebSocket Connection Management ---
  public connectWebSocket() {
    if (this.state.isDemo || typeof window === "undefined") return;

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.setState({ wsStatus: "connecting" });

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.retryDelay = 1000;
        this.reconnectCountdown = 0;
        if (this.reconnectCountdownInterval) clearInterval(this.reconnectCountdownInterval);
        this.setState({
          wsStatus: "connected",
          cameraStatus: "online",
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.handleIncomingMessage(msg);
        } catch {
          // ignore parsing error
        }
      };

      this.ws.onclose = () => {
        this.setState({
          wsStatus: "disconnected",
          cameraStatus: "offline",
          fps: 0,
        });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setState({ wsStatus: "error", cameraStatus: "offline" });
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.state.isDemo) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectCountdownInterval) clearInterval(this.reconnectCountdownInterval);

    this.reconnectCountdown = Math.ceil(this.retryDelay / 1000);
    this.notify();

    this.reconnectCountdownInterval = setInterval(() => {
      this.reconnectCountdown = Math.max(0, this.reconnectCountdown - 1);
      this.notify();
    }, 1000);

    this.reconnectTimer = setTimeout(() => {
      this.retryDelay = Math.min(this.retryDelay * 2, 30000);
      this.connectWebSocket();
    }, this.retryDelay);
  }

  public forceReconnect() {
    this.retryDelay = 1000;
    this.reconnectCountdown = 0;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectCountdownInterval) clearInterval(this.reconnectCountdownInterval);
    playAlertSound("CLICK", this.state.isMuted);
    this.connectWebSocket();
  }

  private handleIncomingMessage(msg: WSMessage) {
    if (msg.type === "telemetry") {
      const fps = Math.round(msg.fps || 0);
      const history = [...this.state.fpsHistory.slice(1), fps];

      let violence: "INACTIVE" | "FIGHTING" | "CHOKING" = "INACTIVE";
      if (msg.neck_hold_detected) violence = "CHOKING";
      else if (msg.fight_detected) violence = "FIGHTING";

      this.setState({
        fps,
        fpsHistory: history,
        personCount: msg.person_count || 0,
        weaponCount: msg.weapon_count || 0,
        violenceStatus: violence,
        fallenCount: msg.fallen_count || 0,
        threatTier: msg.threat_tier || "NORMAL",
        activeBoundingBoxes: msg.boxes || [],
      });
    } else if (msg.type === "alert") {
      const tierLabel: ThreatTier = msg.tier === 2 ? "CRITICAL" : "WARNING";

      const newIncident: AlertRecord = {
        id: msg.id || String(Date.now()),
        timestamp: msg.timestamp || new Date().toISOString(),
        threat_type: msg.threat_type || "SUSPICIOUS ACTIVITY",
        message: msg.message || "Threat detected by AI pipeline",
        snapshot_url: msg.snapshot_url || "",
        tier: msg.tier,
        channels_notified: msg.channels_notified || ["Local Console"],
        acknowledged: false,
      };

      this.setState((prev) => ({
        incidents: [newIncident, ...prev.incidents.slice(0, 49)],
        threatTier: tierLabel,
        alertCooldownRemaining: ALERT_COOLDOWN_SEC,
      }));

      playAlertSound(tierLabel, this.state.isMuted);

      // Dispatch CustomEvent for Stackable Toasts
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("guardia:alert", {
            detail: newIncident,
          })
        );
      }
    }
  }

  // --- Demo / Simulation Mode Engine ---
  private startDemoEngine() {
    this.stopDemoEngine();
    this.setState({
      wsStatus: "connected",
      cameraStatus: "online",
      fps: 30,
      threatTier: "NORMAL",
      personCount: 2,
    });

    let frameCount = 0;
    this.demoInterval = setInterval(() => {
      frameCount++;
      const baseFps = 28 + Math.floor(Math.random() * 5);
      const persons = 1 + (frameCount % 3);

      // Simulated Bounding Boxes
      const boxes: BoundingBox[] = [
        {
          id: "p1",
          x: 0.2 + Math.sin(frameCount * 0.1) * 0.05,
          y: 0.18,
          width: 0.28,
          height: 0.65,
          label: "PERSON #1",
          confidence: 0.94,
          type: "person",
          keypoints: [
            [0.34, 0.22, 0.95],
            [0.33, 0.20, 0.9],
            [0.35, 0.20, 0.9],
            [0.31, 0.21, 0.8],
            [0.37, 0.21, 0.8],
            [0.28, 0.35, 0.9],
            [0.40, 0.35, 0.9],
            [0.26, 0.48, 0.85],
            [0.42, 0.48, 0.85],
            [0.24, 0.60, 0.8],
            [0.44, 0.60, 0.8],
            [0.30, 0.60, 0.9],
            [0.38, 0.60, 0.9],
            [0.29, 0.75, 0.85],
            [0.39, 0.75, 0.85],
            [0.28, 0.82, 0.8],
            [0.40, 0.82, 0.8],
          ],
        },
      ];

      // Occasional simulated threat
      let threat: ThreatTier = "NORMAL";
      let violence: "INACTIVE" | "FIGHTING" | "CHOKING" = "INACTIVE";
      let weapons = 0;
      let fallen = 0;

      if (frameCount % 15 === 0) {
        threat = "CRITICAL";
        weapons = 1;
        boxes.push({
          id: "w1",
          x: 0.44,
          y: 0.46,
          width: 0.14,
          height: 0.18,
          label: "WEAPON: KNIFE",
          confidence: 0.89,
          type: "weapon",
        });

        const demoAlert: AlertRecord = {
          id: `demo-${Date.now()}`,
          timestamp: new Date().toISOString(),
          threat_type: "WEAPON DETECTED",
          message: "Knife identified in sector A2 (94% confidence)",
          snapshot_url: "",
          tier: 2,
          channels_notified: ["PC Audio", "Telegram Bot", "Discord"],
          acknowledged: false,
        };

        this.setState((prev) => ({
          incidents: [demoAlert, ...prev.incidents.slice(0, 49)],
          alertCooldownRemaining: ALERT_COOLDOWN_SEC,
        }));

        playAlertSound("CRITICAL", this.state.isMuted);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("guardia:alert", {
              detail: demoAlert,
            })
          );
        }
      } else if (frameCount % 9 === 0) {
        threat = "WARNING";
        violence = "FIGHTING";
      }

      this.setState((prev) => ({
        fps: baseFps,
        fpsHistory: [...prev.fpsHistory.slice(1), baseFps],
        personCount: persons,
        weaponCount: weapons,
        violenceStatus: violence,
        fallenCount: fallen,
        threatTier: threat,
        activeBoundingBoxes: boxes,
      }));
    }, 1000);
  }

  private stopDemoEngine() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
  }
}

export const guardiaStore = new GuardiaStore();
