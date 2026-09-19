# api_server.py
"""
GUARDIA AI — FastAPI Backend Server
Wraps the existing surveillance pipeline (PoseTracker, WeaponDetector, ActionAnalyzer,
AlertManager) and exposes HTTP/WebSocket endpoints for a web-based dashboard.

Endpoints:
    GET  /api/stream                     — MJPEG live video stream
    WS   /ws/events                      — Real-time telemetry + alert push
    GET  /api/alerts/history             — Paginated alert log
    GET  /api/alerts/history/{id}/snapshot — Serve snapshot JPEG
    GET  /api/config                     — Grouped config (secrets masked)
    PUT  /api/config                     — Hot-update config values
    GET  /api/status                     — System health / readiness
    GET  /api/stats                      — Aggregate analytics
"""

import asyncio
import os
import re
import sys
import threading
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import cv2
import numpy as np
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

# ---------------------------------------------------------------------------
# Project root — ensures imports resolve regardless of cwd
# ---------------------------------------------------------------------------
_PROJECT_DIR = Path(__file__).resolve().parent
if str(_PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(_PROJECT_DIR))

import config  # noqa: E402
from alert import AlertManager  # noqa: E402
from detector import WeaponDetector  # noqa: E402
from pose_action import ActionAnalyzer  # noqa: E402
from tracker_utils import PoseTracker  # noqa: E402

# ---------------------------------------------------------------------------
# Constants (identical to main.py)
# ---------------------------------------------------------------------------
SKELETON_CONNECTIONS = [
    (0, 1), (0, 2), (1, 3), (2, 4),
    (5, 6), (5, 7), (7, 9), (6, 8), (8, 10),
    (5, 11), (6, 12), (11, 12),
    (11, 13), (13, 15), (12, 14), (14, 16),
]

SNAPSHOTS_DIR = _PROJECT_DIR / "snapshots"
MAX_ALERT_LOG = 500


# ---------------------------------------------------------------------------
# Utility — proximity (replicated from main.py)
# ---------------------------------------------------------------------------
def boxes_proximity(box_a, box_b, thresh: float) -> bool:
    """True when the centres of two xyxy boxes are closer than *thresh* px."""
    ca = np.array([(box_a[0] + box_a[2]) / 2.0, (box_a[1] + box_a[3]) / 2.0])
    cb = np.array([(box_b[0] + box_b[2]) / 2.0, (box_b[1] + box_b[3]) / 2.0])
    return float(np.linalg.norm(ca - cb)) < thresh


# ---------------------------------------------------------------------------
# Utility — skeleton drawing (replicated from main.py)
# ---------------------------------------------------------------------------
def draw_skeleton(frame, keypoints, color=(0, 255, 255)):
    """Draws keypoints and skeleton bones on *frame*."""
    if keypoints is None or len(keypoints) < 17:
        return
    for p1, p2 in SKELETON_CONNECTIONS:
        if p1 < len(keypoints) and p2 < len(keypoints):
            k1, k2 = keypoints[p1], keypoints[p2]
            if k1[2] > 0.4 and k2[2] > 0.4:
                pt1 = (int(k1[0]), int(k1[1]))
                pt2 = (int(k2[0]), int(k2[1]))
                cv2.line(frame, pt1, pt2, color, 2)
    for pt in keypoints:
        if pt[2] > 0.4:
            cv2.circle(frame, (int(pt[0]), int(pt[1])), 4, (0, 0, 255), -1)


# ---------------------------------------------------------------------------
# SurveillancePipeline — runs in a daemon thread
# ---------------------------------------------------------------------------
class SurveillancePipeline:
    """Mirror of main.py's while-loop, but headless (no cv2.imshow)."""

    def __init__(self):
        self._lock = threading.Lock()
        self._latest_frame: Optional[bytes] = None
        self._state: dict[str, Any] = {
            "fps": 0.0,
            "person_count": 0,
            "weapon_count": 0,
            "threat_tier": "NORMAL",
            "fight_detected": False,
            "neck_hold_detected": False,
            "fallen_count": 0,
        }
        self._alert_log: list[dict] = []
        self._ws_clients: set[WebSocket] = set()
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._start_time = time.time()
        self._camera_connected = False
        self._models_loaded = {"pose": False, "weapon": False, "action": False}
        self._peak_person_count = 0
        self._total_alerts = 0
        self._alerts_by_type: dict[str, int] = defaultdict(int)
        self._alerts_by_hour: list[int] = [0] * 24

    # -- public accessors (brief lock) -----------------------------------
    def get_latest_frame(self) -> Optional[bytes]:
        with self._lock:
            return self._latest_frame

    def get_state(self) -> dict:
        with self._lock:
            return dict(self._state)

    def get_alert_log(self) -> list[dict]:
        with self._lock:
            return list(self._alert_log)

    # -- lifecycle -------------------------------------------------------
    def start(self):
        self._load_historical_alerts()
        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True, name="pipeline")
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread is not None:
            self._thread.join(timeout=5)

    # -- WebSocket helpers -----------------------------------------------
    def register_ws(self, ws: WebSocket):
        with self._lock:
            self._ws_clients.add(ws)

    def unregister_ws(self, ws: WebSocket):
        with self._lock:
            self._ws_clients.discard(ws)

    def _broadcast_alert(self, alert_payload: dict):
        """Queue an alert broadcast for every connected WS client."""
        with self._lock:
            clients = set(self._ws_clients)
        for ws in clients:
            try:
                asyncio.run_coroutine_threadsafe(
                    ws.send_json(alert_payload),
                    _event_loop,
                )
            except Exception:
                pass

    # -- historical snapshot scan ----------------------------------------
    def _load_historical_alerts(self):
        """Populate _alert_log from existing snapshots/ directory."""
        if not SNAPSHOTS_DIR.is_dir():
            return
        pattern = re.compile(r"^alert_(\d+)\.jpg$")
        entries: list[dict] = []
        for f in SNAPSHOTS_DIR.iterdir():
            m = pattern.match(f.name)
            if not m:
                continue
            ts_epoch = int(m.group(1))
            alert_id = f.stem
            entries.append({
                "id": alert_id,
                "threat_type": "UNKNOWN",
                "tier": 0,
                "message": "Historical alert",
                "snapshot_url": f"/api/alerts/history/{alert_id}/snapshot",
                "channels_notified": [],
                "timestamp": datetime.fromtimestamp(ts_epoch, tz=timezone.utc).isoformat(),
            })
        entries.sort(key=lambda e: e["timestamp"])
        with self._lock:
            self._alert_log = entries[-MAX_ALERT_LOG:]
            self._total_alerts = len(self._alert_log)
            for e in self._alert_log:
                self._alerts_by_type[e["threat_type"]] += 1
                try:
                    hour = datetime.fromisoformat(e["timestamp"]).hour
                    self._alerts_by_hour[hour] += 1
                except Exception:
                    pass

    # -- core pipeline (runs in daemon thread) ---------------------------
    def _run(self):  # noqa: C901 — mirrors main.py complexity
        # Initialise models
        try:
            tracker = PoseTracker(
                model_path=config.POSE_MODEL,
                conf=config.PERSON_CONF,
                imgsz=getattr(config, "POSE_IMGSZ", 384),
            )
            self._models_loaded["pose"] = True
        except Exception as exc:
            print(f"[API] PoseTracker init failed: {exc}")
            return

        try:
            weapon_detector = WeaponDetector(
                mode=config.WEAPON_MODE,
                conf_thresh=config.WEAPON_CONF,
                imgsz=getattr(config, "WEAPON_IMGSZ", 320),
            )
            self._models_loaded["weapon"] = True
        except Exception as exc:
            print(f"[API] WeaponDetector init failed: {exc}")
            return

        try:
            action_analyzer = ActionAnalyzer(
                window=getattr(config, "FIGHT_WINDOW", 15),
                velocity_thresh=getattr(config, "STRIKE_VELOCITY_THRESH", 30.0),
            )
            self._models_loaded["action"] = True
        except Exception as exc:
            print(f"[API] ActionAnalyzer init failed: {exc}")
            return

        alert_mgr = AlertManager()

        cap = cv2.VideoCapture(config.VIDEO_SOURCE)
        if not cap.isOpened():
            print(f"[API] Could not open video source: {config.VIDEO_SOURCE}")
            self._camera_connected = False
            return

        if isinstance(config.VIDEO_SOURCE, int):
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, getattr(config, "CAMERA_WIDTH", 1280))
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, getattr(config, "CAMERA_HEIGHT", 720))

        self._camera_connected = True

        # Persistence counters (identical to main.py)
        consec_choke_count = 0
        consec_fight_count = 0
        consec_weapon_count = 0
        consec_fall_count = 0

        fps_history: list[float] = []
        prev_time = time.time()
        frame_count = 0
        cached_weapons: list = []
        weapon_interval = getattr(config, "WEAPON_CHECK_INTERVAL", 3)

        print("[API] Pipeline thread started — processing frames.")

        while self._running:
            ret, frame = cap.read()
            if not ret:
                # For camera sources, try to reconnect; for files, loop
                if isinstance(config.VIDEO_SOURCE, int):
                    self._camera_connected = False
                    time.sleep(1)
                    continue
                else:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue

            self._camera_connected = True
            current_time = time.time()
            fps = 1.0 / max(0.001, current_time - prev_time)
            prev_time = current_time
            fps_history.append(fps)
            if len(fps_history) > 30:
                fps_history.pop(0)
            avg_fps = sum(fps_history) / len(fps_history)

            display_frame = frame.copy()
            h, w = frame.shape[:2]

            # 1. Track persons
            people = tracker.track(frame)

            # 2. Detect weapons (cadenced)
            if frame_count % weapon_interval == 0:
                cached_weapons = weapon_detector.detect_weapons(frame)
            weapons = cached_weapons
            frame_count += 1

            # 3. Action analysis
            action_results = action_analyzer.update(people)
            fight_detected = action_results["fight_detected"]
            neck_hold_detected = action_results.get("neck_hold_detected", False)
            choke_events = action_results.get("choke_events", [])
            choking_ids = action_results.get("choking_ids", [])
            victim_ids = action_results.get("victim_ids", [])
            aggressive_ids = action_results["aggressive_ids"]
            fallen_ids = action_results["fallen_ids"]

            # 4. Weapon proximity + drawing
            weapon_held = False
            detected_weapon_names: list[str] = []

            for w_box in weapons:
                wx1, wy1, wx2, wy2, wconf, wname = w_box
                detected_weapon_names.append(wname)

                cv2.rectangle(display_frame, (int(wx1), int(wy1)), (int(wx2), int(wy2)), (0, 0, 255), 3)
                label = f"HAZARD: {wname.upper()} ({wconf:.2f})"
                (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                cv2.rectangle(display_frame, (int(wx1), int(wy1) - 25), (int(wx1) + lw, int(wy1)), (0, 0, 255), -1)
                cv2.putText(display_frame, label, (int(wx1), int(wy1) - 7),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                for p in people:
                    if boxes_proximity(w_box[:4], p["box"], config.PROXIMITY_PX):
                        weapon_held = True
                        pc = ((int(p["box"][0]) + int(p["box"][2])) // 2,
                              (int(p["box"][1]) + int(p["box"][3])) // 2)
                        wc = ((int(wx1) + int(wx2)) // 2, (int(wy1) + int(wy2)) // 2)
                        cv2.line(display_frame, pc, wc, (0, 0, 255), 2, cv2.LINE_AA)

            # Persistence counters
            consec_weapon_count = (consec_weapon_count + 1) if len(weapons) > 0 else 0
            consec_choke_count = (consec_choke_count + 1) if neck_hold_detected else 0
            consec_fight_count = (consec_fight_count + 1) if fight_detected else 0
            consec_fall_count = (consec_fall_count + 1) if len(fallen_ids) > 0 else 0

            # 5. Draw person bounding boxes + skeletons
            for p in people:
                pid = p["id"]
                x1, y1, x2, y2 = map(int, p["box"])
                kp = p.get("keypoints")

                if pid in choking_ids:
                    box_color = (0, 0, 255)
                    status_text = f"ID {pid} [AGGRESSOR: CHOKING/NECK HOLD]"
                elif pid in victim_ids:
                    box_color = (0, 215, 255)
                    status_text = f"ID {pid} [VICTIM: NECK HELD]"
                elif pid in aggressive_ids:
                    box_color = (0, 140, 255)
                    status_text = f"ID {pid} [AGGRESSIVE: FIGHTING]"
                elif pid in fallen_ids:
                    box_color = (255, 0, 255)
                    status_text = f"ID {pid} [FALLEN]"
                else:
                    box_color = (0, 255, 0)
                    status_text = f"ID {pid} [NORMAL]"

                cv2.rectangle(display_frame, (x1, y1), (x2, y2), box_color, 2)
                cv2.putText(display_frame, status_text, (x1, max(15, y1 - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, box_color, 2)

                if kp is not None:
                    draw_skeleton(display_frame, kp, color=box_color)

            # 6. Choke contact overlays
            for ev in choke_events:
                c_pts = ev.get("contact_points")
                if c_pts and len(c_pts) == 2:
                    p_wrist, p_neck = c_pts
                    w_pt = (int(p_wrist[0]), int(p_wrist[1]))
                    n_pt = (int(p_neck[0]), int(p_neck[1]))
                    cv2.line(display_frame, w_pt, n_pt, (0, 0, 255), 3, cv2.LINE_AA)
                    cv2.circle(display_frame, n_pt, 14, (0, 0, 255), 2, cv2.LINE_AA)
                    cv2.circle(display_frame, n_pt, 6, (0, 0, 255), -1, cv2.LINE_AA)
                    hold_lbl = ev["type"].replace("_", " ")
                    cv2.putText(display_frame, hold_lbl, (n_pt[0] + 16, n_pt[1] - 4),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            # 7. Threat tier evaluation + alert dispatch
            status_banner = "SYSTEM STATUS: NORMAL"
            banner_color = (0, 180, 0)
            threat_tier = "NORMAL"
            threat_tier_num = 0

            min_choke_frames = getattr(config, "MIN_CONSEC_CHOKE_FRAMES", 3)

            # Tier 1: Armed Violence
            if (consec_weapon_count >= config.MIN_CONSEC_FRAMES
                    and (consec_fight_count >= config.MIN_CONSEC_FRAMES
                         or consec_choke_count >= min_choke_frames)):
                status_banner = "CRITICAL: ARMED VIOLENCE DETECTED!"
                banner_color = (0, 0, 255)
                threat_tier = "CRITICAL"
                threat_tier_num = 1
                weapon_list_str = ", ".join(set(detected_weapon_names))
                msg = f"Critical Threat: Armed physical violence detected in camera! Weapons identified: {weapon_list_str}"
                fired = alert_mgr.trigger_alert(msg, frame=display_frame, threat_type="ARMED VIOLENCE")
                if fired:
                    self._record_alert("ARMED VIOLENCE", threat_tier_num, msg)

            # Tier 2: Neck Hold / Choking
            elif consec_choke_count >= min_choke_frames:
                status_banner = "AGGRESSIVE ASSAULT: NECK HOLD / CHOKING DETECTED!"
                banner_color = (0, 0, 255)
                threat_tier = "CRITICAL"
                threat_tier_num = 2
                choke_details = action_results.get("details", "Neck grab / choke hold in progress")
                msg = f"Violence Alert: Physical aggression detected! {choke_details}"
                fired = alert_mgr.trigger_alert(msg, frame=display_frame, threat_type="NECK HOLD / CHOKING")
                if fired:
                    self._record_alert("NECK HOLD / CHOKING", threat_tier_num, msg)

            # Tier 3: Weapon Detected
            elif consec_weapon_count >= config.MIN_CONSEC_FRAMES:
                status_banner = "WEAPON / HAZARDOUS ITEM DETECTED"
                banner_color = (0, 0, 255)
                threat_tier = "WARNING"
                threat_tier_num = 3
                weapon_list_str = ", ".join(set(detected_weapon_names))
                msg = f"Weapon Alert: Dangerous item ({weapon_list_str}) detected in camera view!"
                fired = alert_mgr.trigger_alert(msg, frame=display_frame, threat_type="WEAPON DETECTED")
                if fired:
                    self._record_alert("WEAPON DETECTED", threat_tier_num, msg)

            # Tier 4: Fight
            elif consec_fight_count >= config.MIN_CONSEC_FRAMES:
                status_banner = "PHYSICAL ALTERCATION / FIGHT DETECTED"
                banner_color = (0, 140, 255)
                threat_tier = "WARNING"
                threat_tier_num = 4
                msg = "Violence Alert: Physical fight or violent assault behavior detected between persons!"
                fired = alert_mgr.trigger_alert(msg, frame=display_frame, threat_type="FIGHT DETECTED")
                if fired:
                    self._record_alert("FIGHT DETECTED", threat_tier_num, msg)

            # Tier 5: Fall
            elif consec_fall_count >= (config.MIN_CONSEC_FRAMES * 2):
                status_banner = "PERSON DOWN / FALL DETECTED"
                banner_color = (255, 0, 255)
                threat_tier = "WARNING"
                threat_tier_num = 5
                msg = "Medical/Safety Alert: Person knockdown or fall detected!"
                fired = alert_mgr.trigger_alert(msg, frame=display_frame, threat_type="FALL DETECTED")
                if fired:
                    self._record_alert("FALL DETECTED", threat_tier_num, msg)

            # 8. HUD — top banner
            cv2.rectangle(display_frame, (0, 0), (w, 40), banner_color, -1)
            cv2.putText(display_frame, status_banner, (15, 26),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

            # HUD — bottom info bar
            choke_stat = f" | Choke/Holds: {len(choke_events)}" if choke_events else ""
            info_str = (f"FPS: {avg_fps:.1f} | People: {len(people)}{choke_stat}"
                        f" | Weapons: {len(weapons)} | Mode: {config.WEAPON_MODE}")
            cv2.rectangle(display_frame, (0, h - 30), (w, h), (30, 30, 30), -1)
            cv2.putText(display_frame, info_str, (15, h - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.48, (200, 200, 200), 1)

            # Encode annotated frame to JPEG bytes
            ok, buf = cv2.imencode(".jpg", display_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if ok:
                jpeg_bytes = buf.tobytes()
            else:
                jpeg_bytes = None

            # Update shared state
            with self._lock:
                self._latest_frame = jpeg_bytes
                self._state = {
                    "fps": round(avg_fps, 1),
                    "person_count": len(people),
                    "weapon_count": len(weapons),
                    "threat_tier": threat_tier,
                    "fight_detected": fight_detected,
                    "neck_hold_detected": neck_hold_detected,
                    "fallen_count": len(fallen_ids),
                }
                if len(people) > self._peak_person_count:
                    self._peak_person_count = len(people)

        # Cleanup
        cap.release()
        action_analyzer.close()
        self._camera_connected = False
        print("[API] Pipeline thread stopped.")

    # -- alert bookkeeping -----------------------------------------------
    def _record_alert(self, threat_type: str, tier: int, message: str):
        """Called from the pipeline thread when trigger_alert returns True."""
        now = datetime.now(timezone.utc)
        alert_id = f"alert_{int(time.time())}"
        channels: list[str] = []
        if getattr(config, "TELEGRAM_BOT_TOKEN", "").strip() and getattr(config, "TELEGRAM_CHAT_ID", "").strip():
            channels.append("telegram")
        if getattr(config, "DISCORD_WEBHOOK_URL", "").strip():
            channels.append("discord")
        if getattr(config, "CALLMEBOT_API_KEY", "").strip():
            channels.append("whatsapp_callmebot")
        if getattr(config, "TWILIO_SID", "").strip() and not getattr(config, "TWILIO_SID", "").startswith("your_"):
            channels.append("whatsapp_twilio")
        if getattr(config, "ENABLE_SOUND_ALARM", False):
            channels.append("local_siren")
        if getattr(config, "ENABLE_VOICE_ALERT", False):
            channels.append("voice_tts")

        entry = {
            "id": alert_id,
            "threat_type": threat_type,
            "tier": tier,
            "message": message,
            "snapshot_url": f"/api/alerts/history/{alert_id}/snapshot",
            "channels_notified": channels,
            "timestamp": now.isoformat(),
        }

        with self._lock:
            self._alert_log.append(entry)
            if len(self._alert_log) > MAX_ALERT_LOG:
                self._alert_log = self._alert_log[-MAX_ALERT_LOG:]
            self._total_alerts += 1
            self._alerts_by_type[threat_type] += 1
            self._alerts_by_hour[now.hour] += 1

        # Broadcast to WS clients
        ws_payload = {"type": "alert", **entry}
        self._broadcast_alert(ws_payload)


# ---------------------------------------------------------------------------
# Global references
# ---------------------------------------------------------------------------
pipeline = SurveillancePipeline()
_event_loop: asyncio.AbstractEventLoop  # set during startup


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _event_loop
    _event_loop = asyncio.get_running_loop()
    pipeline.start()
    yield
    pipeline.stop()


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="GUARDIA AI Surveillance API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# GET /api/stream — MJPEG live video
# ---------------------------------------------------------------------------
@app.get("/api/stream")
async def video_stream():
    async def generate():
        while True:
            frame_bytes = pipeline.get_latest_frame()
            if frame_bytes:
                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n"
                       + frame_bytes
                       + b"\r\n")
            await asyncio.sleep(0.04)

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


# ---------------------------------------------------------------------------
# WebSocket /ws/events — telemetry heartbeat + live alerts
# ---------------------------------------------------------------------------
@app.websocket("/ws/events")
async def ws_events(ws: WebSocket):
    await ws.accept()
    pipeline.register_ws(ws)
    try:
        while True:
            state = pipeline.get_state()
            telemetry = {
                "type": "telemetry",
                "fps": state["fps"],
                "person_count": state["person_count"],
                "weapon_count": state["weapon_count"],
                "threat_tier": state["threat_tier"],
                "fight_detected": state["fight_detected"],
                "neck_hold_detected": state["neck_hold_detected"],
                "fallen_count": state["fallen_count"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await ws.send_json(telemetry)
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        pipeline.unregister_ws(ws)


# ---------------------------------------------------------------------------
# GET /api/alerts/history
# ---------------------------------------------------------------------------
@app.get("/api/alerts/history")
async def alerts_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    threat_type: Optional[str] = Query(None),
):
    log = pipeline.get_alert_log()
    if threat_type:
        log = [a for a in log if a["threat_type"].upper() == threat_type.upper()]

    total = len(log)
    pages = max(1, (total + per_page - 1) // per_page)
    start = (page - 1) * per_page
    end = start + per_page
    # Newest first
    sorted_log = list(reversed(log))
    page_items = sorted_log[start:end]

    return JSONResponse({
        "alerts": page_items,
        "total": total,
        "page": page,
        "pages": pages,
    })


# ---------------------------------------------------------------------------
# GET /api/alerts/history/{alert_id}/snapshot
# ---------------------------------------------------------------------------
@app.get("/api/alerts/history/{alert_id}/snapshot")
async def alert_snapshot(alert_id: str):
    safe_id = re.sub(r"[^a-zA-Z0-9_]", "", alert_id)
    path = SNAPSHOTS_DIR / f"{safe_id}.jpg"
    if not path.is_file():
        return JSONResponse({"error": "Snapshot not found"}, status_code=404)
    return FileResponse(str(path), media_type="image/jpeg")


# ---------------------------------------------------------------------------
# GET /api/config
# ---------------------------------------------------------------------------
_SECRET_ATTRS = {
    "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID",
    "DISCORD_WEBHOOK_URL",
    "TWILIO_SID", "TWILIO_AUTH_TOKEN", "TWILIO_CONTENT_SID",
    "CALLMEBOT_API_KEY",
}


def _mask(attr: str) -> Any:
    val = getattr(config, attr, "")
    if not val or (isinstance(val, str) and not val.strip()):
        return False
    return True


@app.get("/api/config")
async def get_config():
    return JSONResponse({
        "models": {
            "POSE_MODEL": config.POSE_MODEL,
            "PERSON_MODEL": getattr(config, "PERSON_MODEL", ""),
            "WEAPON_MODE": config.WEAPON_MODE,
            "YOLO_WORLD_MODEL": getattr(config, "YOLO_WORLD_MODEL", ""),
            "CUSTOM_WEAPON_MODEL": getattr(config, "CUSTOM_WEAPON_MODEL", ""),
            "WEAPON_CLASSES": getattr(config, "WEAPON_CLASSES", []),
            "POSE_IMGSZ": getattr(config, "POSE_IMGSZ", 384),
            "WEAPON_IMGSZ": getattr(config, "WEAPON_IMGSZ", 320),
            "WEAPON_CHECK_INTERVAL": getattr(config, "WEAPON_CHECK_INTERVAL", 3),
        },
        "thresholds": {
            "PERSON_CONF": config.PERSON_CONF,
            "WEAPON_CONF": config.WEAPON_CONF,
            "POSE_CONF": getattr(config, "POSE_CONF", 0.5),
            "PROXIMITY_PX": config.PROXIMITY_PX,
            "FIGHT_WINDOW": getattr(config, "FIGHT_WINDOW", 15),
            "INTERACTION_DIST_PX": getattr(config, "INTERACTION_DIST_PX", 250),
            "KEYPOINT_CONF": getattr(config, "KEYPOINT_CONF", 0.30),
            "NECK_HOLD_RATIO": getattr(config, "NECK_HOLD_RATIO", 0.22),
            "STRIKE_VELOCITY_THRESH": getattr(config, "STRIKE_VELOCITY_THRESH", 30.0),
            "VIOLENCE_VELOCITY_THRESH": getattr(config, "VIOLENCE_VELOCITY_THRESH", 30.0),
            "MIN_CONSEC_FRAMES": config.MIN_CONSEC_FRAMES,
            "MIN_CONSEC_CHOKE_FRAMES": getattr(config, "MIN_CONSEC_CHOKE_FRAMES", 3),
        },
        "alerts": {
            "ALERT_COOLDOWN_SEC": getattr(config, "ALERT_COOLDOWN_SEC", 15),
            "ENABLE_SOUND_ALARM": getattr(config, "ENABLE_SOUND_ALARM", True),
            "ENABLE_VOICE_ALERT": getattr(config, "ENABLE_VOICE_ALERT", True),
            "VOICE_ALERT_TEXT": getattr(config, "VOICE_ALERT_TEXT", "ALERT EMERGENCY DETECTED"),
            "ALERT_WHATSAPP_TO": getattr(config, "ALERT_WHATSAPP_TO", ""),
            "TWILIO_WHATSAPP_FROM": getattr(config, "TWILIO_WHATSAPP_FROM", ""),
            # secrets masked as boolean flags
            "TELEGRAM_BOT_TOKEN_configured": _mask("TELEGRAM_BOT_TOKEN"),
            "TELEGRAM_CHAT_ID_configured": _mask("TELEGRAM_CHAT_ID"),
            "DISCORD_WEBHOOK_URL_configured": _mask("DISCORD_WEBHOOK_URL"),
            "TWILIO_SID_configured": _mask("TWILIO_SID"),
            "TWILIO_AUTH_TOKEN_configured": _mask("TWILIO_AUTH_TOKEN"),
            "TWILIO_CONTENT_SID_configured": _mask("TWILIO_CONTENT_SID"),
            "CALLMEBOT_API_KEY_configured": _mask("CALLMEBOT_API_KEY"),
        },
        "video": {
            "VIDEO_SOURCE": config.VIDEO_SOURCE,
            "DISPLAY_WIDTH": getattr(config, "DISPLAY_WIDTH", 1280),
            "DISPLAY_HEIGHT": getattr(config, "DISPLAY_HEIGHT", 720),
            "CAMERA_WIDTH": getattr(config, "CAMERA_WIDTH", 1280),
            "CAMERA_HEIGHT": getattr(config, "CAMERA_HEIGHT", 720),
            "START_FULLSCREEN": getattr(config, "START_FULLSCREEN", False),
        },
    })


# ---------------------------------------------------------------------------
# PUT /api/config — hot-update config attrs
# ---------------------------------------------------------------------------
_ALLOWED_TYPES: dict[str, type] = {
    "PERSON_CONF": float,
    "WEAPON_CONF": float,
    "POSE_CONF": float,
    "PROXIMITY_PX": (int, float),  # type: ignore[dict-item]
    "FIGHT_WINDOW": int,
    "INTERACTION_DIST_PX": (int, float),  # type: ignore[dict-item]
    "KEYPOINT_CONF": float,
    "NECK_HOLD_RATIO": float,
    "STRIKE_VELOCITY_THRESH": float,
    "VIOLENCE_VELOCITY_THRESH": float,
    "MIN_CONSEC_FRAMES": int,
    "MIN_CONSEC_CHOKE_FRAMES": int,
    "ALERT_COOLDOWN_SEC": (int, float),  # type: ignore[dict-item]
    "ENABLE_SOUND_ALARM": bool,
    "ENABLE_VOICE_ALERT": bool,
    "VOICE_ALERT_TEXT": str,
    "ALERT_WHATSAPP_TO": str,
    "TWILIO_WHATSAPP_FROM": str,
    "TELEGRAM_BOT_TOKEN": str,
    "TELEGRAM_CHAT_ID": str,
    "DISCORD_WEBHOOK_URL": str,
    "TWILIO_SID": str,
    "TWILIO_AUTH_TOKEN": str,
    "TWILIO_CONTENT_SID": str,
    "CALLMEBOT_API_KEY": str,
    "WEAPON_MODE": str,
    "WEAPON_CHECK_INTERVAL": int,
    "POSE_IMGSZ": int,
    "WEAPON_IMGSZ": int,
    "VIDEO_SOURCE": (int, str),  # type: ignore[dict-item]
    "DISPLAY_WIDTH": int,
    "DISPLAY_HEIGHT": int,
    "CAMERA_WIDTH": int,
    "CAMERA_HEIGHT": int,
    "START_FULLSCREEN": bool,
}


@app.put("/api/config")
async def update_config(body: dict[str, Any]):
    updated: dict[str, Any] = {}
    errors: dict[str, str] = {}

    for key, value in body.items():
        expected = _ALLOWED_TYPES.get(key)
        if expected is None:
            errors[key] = f"Unknown or read-only config key: {key}"
            continue

        # Special handling for float / int / bool / str to handle JSON type mapping
        if expected is float or expected == (int, float):
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                errors[key] = f"Expected numeric float, got {type(value).__name__}"
                continue
            value = float(value)
        elif expected is int:
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                errors[key] = f"Expected integer, got {type(value).__name__}"
                continue
            value = int(value)
        elif expected is bool:
            if not isinstance(value, bool):
                errors[key] = f"Expected boolean, got {type(value).__name__}"
                continue
        elif expected is str:
            if not isinstance(value, str):
                errors[key] = f"Expected string, got {type(value).__name__}"
                continue
        elif expected == (int, str):
            if isinstance(value, bool) or not isinstance(value, (int, str)):
                errors[key] = f"Expected integer or string, got {type(value).__name__}"
                continue
        elif not isinstance(value, expected):
            errors[key] = f"Expected type {expected}, got {type(value).__name__}"
            continue

        setattr(config, key, value)
        updated[key] = value

    status_code = 200 if not errors else 207
    return JSONResponse({"updated": updated, "errors": errors}, status_code=status_code)


# ---------------------------------------------------------------------------
# GET /api/status
# ---------------------------------------------------------------------------
@app.get("/api/status")
async def system_status():
    tg_ok = bool(getattr(config, "TELEGRAM_BOT_TOKEN", "").strip()
                 and getattr(config, "TELEGRAM_CHAT_ID", "").strip())
    discord_ok = bool(getattr(config, "DISCORD_WEBHOOK_URL", "").strip())
    callmebot_ok = bool(getattr(config, "CALLMEBOT_API_KEY", "").strip()
                        and not getattr(config, "CALLMEBOT_API_KEY", "").startswith("your_"))
    twilio_ok = bool(getattr(config, "TWILIO_SID", "").strip()
                     and not getattr(config, "TWILIO_SID", "").startswith("your_"))
    siren_ok = getattr(config, "ENABLE_SOUND_ALARM", False)
    voice_ok = getattr(config, "ENABLE_VOICE_ALERT", False)

    return JSONResponse({
        "camera_connected": pipeline._camera_connected,
        "models_loaded": dict(pipeline._models_loaded),
        "channels": {
            "telegram": tg_ok,
            "discord": discord_ok,
            "whatsapp_callmebot": callmebot_ok,
            "whatsapp_twilio": twilio_ok,
            "local_siren": siren_ok,
            "voice_tts": voice_ok,
        },
        "uptime_sec": round(time.time() - pipeline._start_time, 1),
        "video_source": config.VIDEO_SOURCE,
    })


# ---------------------------------------------------------------------------
# GET /api/stats
# ---------------------------------------------------------------------------
@app.get("/api/stats")
async def system_stats():
    state = pipeline.get_state()
    return JSONResponse({
        "total_alerts": pipeline._total_alerts,
        "alerts_by_type": dict(pipeline._alerts_by_type),
        "alerts_by_hour": list(pipeline._alerts_by_hour),
        "avg_fps": state["fps"],
        "peak_person_count": pipeline._peak_person_count,
        "uptime_sec": round(time.time() - pipeline._start_time, 1),
    })


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
