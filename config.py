# config.py
"""
Configuration settings for AI Surveillance: Person, Violence, and Weapon Detection
"""
import os

# Helper to automatically load .env if present
def _load_env_file():
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k and k not in os.environ:
                        os.environ[k] = v
        except Exception:
            pass

_load_env_file()



# ==========================================
# 1. MODEL SELECTION & PATHS
# ==========================================
# Person & Pose tracking model:
# "yolov8n-pose.pt" (Single-pass person + 17 skeleton keypoints)
POSE_MODEL = "yolov8n-pose.pt"
PERSON_MODEL = "yolov8n.pt"

# Weapon detector mode:
# 'yolo_world' : Zero-shot open-vocabulary model (Detects custom items without training)
# 'custom'     : Custom-trained YOLO model (e.g., weapon_best.pt)
# 'coco'       : Pretrained COCO (detects knife & baseball bat from yolov8n.pt)
WEAPON_MODE = "yolo_world"

# Model files
YOLO_WORLD_MODEL = "yolov8s-worldv2.pt"
CUSTOM_WEAPON_MODEL = "weapon_best.pt"

# List of dangerous items to detect with YOLO-World
WEAPON_CLASSES = [
    "gun",
    "handgun",
    "pistol",
    "rifle",
    "knife",
    "dagger",
    "sword",
    "machete",
    "metal rod",
    "iron rod",
    "baseball bat",
    "wooden stick",
    "crowbar"
]

# ==========================================
# 1B. INFERENCE & FPS OPTIMIZATION SETTINGS
# ==========================================
# Optimized inference image sizes (e.g., 384 or 480 for ultra-smooth 30+ FPS on CPU)
POSE_IMGSZ = 384                  # Input size for YOLOv8 Pose (384 gives high FPS + accurate keypoints)
WEAPON_IMGSZ = 320                # Input size for YOLO-World weapon detection
WEAPON_CHECK_INTERVAL = 3         # Run weapon detection every N frames (caches boxes in-between to boost FPS)

# ==========================================
# 2. DETECTION CONFIDENCE THRESHOLDS
# ==========================================
PERSON_CONF = 0.50
WEAPON_CONF = 0.30
POSE_CONF = 0.50

# Max pixel distance to consider a weapon as being held by or near a person
PROXIMITY_PX = 180

# ==========================================
# 3. ACTION & VIOLENCE DETECTION HEURISTICS
# ==========================================
FIGHT_WINDOW = 15                 # Frames of temporal history to evaluate
INTERACTION_DIST_PX = 250         # Max distance between 2 persons to evaluate physical interaction
KEYPOINT_CONF = 0.30              # Minimum confidence required for keypoints (wrists, neck, head)
NECK_HOLD_RATIO = 0.22            # Distance ratio relative to victim height to confirm neck hold
STRIKE_VELOCITY_THRESH = 30.0     # Normalized velocity threshold for aggressive punching/striking
VIOLENCE_VELOCITY_THRESH = 30.0   # Alias for violence striking threshold
MIN_CONSEC_FRAMES = 5             # Consecutive frames threat must persist before alert dispatch
MIN_CONSEC_CHOKE_FRAMES = 3       # Consecutive frames for neck grab / choking alert (rapid confirmation)


# ==========================================
# 4. ALERTS & NOTIFICATION CHANNELS
# ==========================================
ALERT_COOLDOWN_SEC = 15           # Cooldown between sending alerts (seconds)

# --- CHANNEL 1: LOCAL PC AUDIO ALARM & VOICE TTS (Works Offline 100%) ---
ENABLE_SOUND_ALARM = True        # Beeps/sounds siren on PC speakers when threat detected
ENABLE_VOICE_ALERT = True        # Speaks "ALERT EMERGENCY DETECTED" via PC speakers
VOICE_ALERT_TEXT = "ALERT EMERGENCY DETECTED" # Exact spoken emergency announcement

# --- CHANNEL 2: TELEGRAM BOT (RECOMMENDED: 100% Free, Instant Photos on Phone) ---
# Setup in 30 seconds:
# 1. Open Telegram on phone, search "@BotFather", send "/newbot", follow prompts to get BOT_TOKEN
# 2. Search "@userinfobot" on Telegram or message your bot, get your CHAT_ID
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# --- CHANNEL 3: DISCORD WEBHOOK (Free, Instant Push Notification + Photos on Phone) ---
# Setup in 10 seconds:
# 1. Create a Discord server/channel -> Channel Settings -> Integrations -> Webhooks -> Copy Webhook URL
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")         # e.g., "https://discord.com/api/webhooks/..."

# --- CHANNEL 4: WHATSAPP (CallMeBot or Twilio) ---
ALERT_WHATSAPP_TO = os.getenv("ALERT_WHATSAPP_TO", "")

# Option A: CallMeBot WhatsApp (Free Direct API)
# 1. Save +34 644 44 25 36 as "CallMeBot" in phone contacts
# 2. Send "I allow callmebot to send me messages" on WhatsApp
# 3. Paste the API key received below:
CALLMEBOT_API_KEY = os.getenv("CALLMEBOT_API_KEY", "")

# Option B: Twilio WhatsApp
TWILIO_SID = os.getenv("TWILIO_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
TWILIO_CONTENT_SID = os.getenv("TWILIO_CONTENT_SID", "")          # Content Template SID from Twilio Console (starts with HX...)

# ==========================================
# 5. VIDEO INPUT SOURCE
# ==========================================
# 0 = Default webcam, or "video.mp4", or "rtsp://..."
VIDEO_SOURCE = os.getenv("VIDEO_SOURCE", 0)

# ==========================================
# 6. DISPLAY & FULLSCREEN SETTINGS
# ==========================================
WINDOW_TITLE = "AI Safety & Weapon Surveillance"
DISPLAY_WIDTH = 1280              # Default launch width (1280x720, 1920x1080, etc.)
DISPLAY_HEIGHT = 720              # Default launch height
START_FULLSCREEN = False          # Set to True to launch directly in fullscreen mode
CAMERA_WIDTH = 1280               # Camera capture resolution request (Width)
CAMERA_HEIGHT = 720               # Camera capture resolution request (Height)

