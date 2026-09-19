# alert.py
"""
Multi-Channel Security Alert Manager:
- Channel 1: Local PC Speaker Siren/Alarm & Offline Voice TTS ("ALERT EMERGENCY DETECTED")
- Channel 2: WhatsApp Alerts (Direct CallMeBot & Twilio) to configured phone numbers
- Channel 3: Telegram Bot (Sends instant threat photos + alerts directly to phone)
- Channel 4: Discord Webhook (Sends instant threat photos + push notifications to phone)

All network operations, audio sirens, and speech synthesis run asynchronously in background threads.
"""

import time
import os
import json
import threading
import urllib.parse
import cv2
import config

# HTTP requests for Telegram, Discord, CallMeBot (optional)
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# Twilio WhatsApp support (optional)
try:
    from twilio.rest import Client as TwilioClient
    HAS_TWILIO = True
except ImportError:
    TwilioClient = None
    HAS_TWILIO = False

# Local PC Beep support
try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

# Windows SAPI / COM Voice Text-to-Speech support
try:
    import pythoncom
    import win32com.client
    HAS_WIN32COM = True
except ImportError:
    HAS_WIN32COM = False

# Pyttsx3 fallback support
try:
    import pyttsx3
    HAS_PYTTSX3 = True
except ImportError:
    HAS_PYTTSX3 = False


class AlertManager:
    def __init__(self):
        self.last_alert_time = 0
        self.lock = threading.Lock()
        self.twilio_client = None
        self._init_services()

    def _init_services(self):
        # 1. Twilio WhatsApp
        if HAS_TWILIO and getattr(config, "TWILIO_SID", "") and not config.TWILIO_SID.startswith("your_"):
            try:
                self.twilio_client = TwilioClient(config.TWILIO_SID, config.TWILIO_AUTH_TOKEN)
                print("[INFO] Twilio Client initialized.")
            except Exception as e:
                print(f"[WARNING] Twilio initialization error: {e}")
        elif not HAS_TWILIO:
            print("[INFO] Twilio not installed — WhatsApp via Twilio disabled. Install with: pip install twilio")

        # 2. Telegram Bot
        tg_token = getattr(config, "TELEGRAM_BOT_TOKEN", "").strip()
        tg_chat = getattr(config, "TELEGRAM_CHAT_ID", "").strip()
        if tg_token and tg_chat:
            print("[INFO] Telegram Alert Service enabled.")

        # 3. Discord Webhook
        discord_url = getattr(config, "DISCORD_WEBHOOK_URL", "").strip()
        if discord_url:
            print("[INFO] Discord Alert Service enabled.")

        # 4. CallMeBot WhatsApp
        callmebot_key = getattr(config, "CALLMEBOT_API_KEY", "").strip()
        if callmebot_key and not callmebot_key.startswith("your_"):
            print("[INFO] CallMeBot WhatsApp enabled.")

        # 5. Local Audio Alarm & Voice TTS
        if getattr(config, "ENABLE_SOUND_ALARM", True):
            print("[INFO] Local PC Audio Siren enabled.")
        if getattr(config, "ENABLE_VOICE_ALERT", True):
            print("[INFO] Voice Announcement System ('ALERT EMERGENCY DETECTED') enabled.")

    def can_alert(self):
        """Checks if alert cooldown period has elapsed."""
        return (time.time() - self.last_alert_time) > getattr(config, "ALERT_COOLDOWN_SEC", 15)

    def trigger_alert(self, message, frame=None, threat_type="GENERAL"):
        """Spawns background threads so video capture and GUI never lag."""
        if not self.can_alert():
            return False

        with self.lock:
            self.last_alert_time = time.time()

        frame_copy = frame.copy() if frame is not None else None
        worker = threading.Thread(
            target=self._send_worker,
            args=(message, frame_copy, threat_type),
            daemon=True
        )
        worker.start()
        return True

    def _play_siren(self):
        """Plays urgent security alert beeps on PC speaker."""
        if not HAS_WINSOUND or not getattr(config, "ENABLE_SOUND_ALARM", True):
            return
        try:
            for _ in range(2):
                winsound.Beep(2500, 150)
                winsound.Beep(1800, 150)
        except Exception:
            pass

    def _speak_voice_alert(self, text=None):
        """Announces urgent voice warning via PC audio in background."""
        if not getattr(config, "ENABLE_VOICE_ALERT", True):
            return

        voice_text = text or getattr(config, "VOICE_ALERT_TEXT", "ALERT EMERGENCY DETECTED")

        # Method A: Direct Windows SAPI COM (Fastest, zero lag, high stability)
        if HAS_WIN32COM:
            try:
                pythoncom.CoInitialize()
                speaker = win32com.client.Dispatch("SAPI.SpVoice")
                speaker.Rate = 1
                speaker.Speak(voice_text)
                pythoncom.CoUninitialize()
                return
            except Exception as e:
                print(f"[VOICE SAPI WARNING] {e}")

        # Method B: pyttsx3 fallback
        if HAS_PYTTSX3:
            try:
                engine = pyttsx3.init()
                engine.setProperty('rate', 160)
                engine.say(voice_text)
                engine.runAndWait()
            except Exception as e:
                print(f"[VOICE PYTTSX3 WARNING] {e}")

    def _send_worker(self, message, frame, threat_type):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

        # Primary formatted message with prominent emergency header
        formatted_message = (
            f"🚨 ALERT EMERGENCY DETECTED 🚨\n"
            f"⚠️ Threat: {threat_type}\n"
            f"📅 Time: {timestamp}\n"
            f"📍 Event: {message}"
        )

        # 1. Trigger local audio siren and Voice Announcement in background threads
        if getattr(config, "ENABLE_SOUND_ALARM", True):
            threading.Thread(target=self._play_siren, daemon=True).start()

        if getattr(config, "ENABLE_VOICE_ALERT", True):
            threading.Thread(target=self._speak_voice_alert, daemon=True).start()

        # 2. Save snapshot image to disk
        snapshot_filename = None
        if frame is not None:
            os.makedirs("snapshots", exist_ok=True)
            snapshot_filename = f"snapshots/alert_{int(time.time())}.jpg"
            cv2.imwrite(snapshot_filename, frame)
            print(f"\n[SNAPSHOT SAVED] -> {snapshot_filename}")

        alert_sent = False

        # -------------------------------------------------------------
        # CHANNEL A: TELEGRAM BOT (With Direct Photo Upload)
        # -------------------------------------------------------------
        tg_token = getattr(config, "TELEGRAM_BOT_TOKEN", "").strip()
        tg_chat = getattr(config, "TELEGRAM_CHAT_ID", "").strip()
        if tg_token and tg_chat:
            try:
                if snapshot_filename and os.path.exists(snapshot_filename):
                    url = f"https://api.telegram.org/bot{tg_token}/sendPhoto"
                    with open(snapshot_filename, "rb") as photo_file:
                        data = {"chat_id": tg_chat, "caption": formatted_message}
                        files = {"photo": photo_file}
                        res = requests.post(url, data=data, files=files, timeout=12)
                else:
                    url = f"https://api.telegram.org/bot{tg_token}/sendMessage"
                    res = requests.post(url, json={"chat_id": tg_chat, "text": formatted_message}, timeout=12)

                if res.status_code == 200:
                    print(f"✅ [TELEGRAM ALERT SENT] Threat: {threat_type} (Photo included)")
                    alert_sent = True
                else:
                    print(f"❌ [TELEGRAM ERROR] HTTP {res.status_code}: {res.text}")
            except Exception as e:
                print(f"❌ [TELEGRAM EXCEPTION] {e}")

        # -------------------------------------------------------------
        # CHANNEL B: DISCORD WEBHOOK (With Direct Photo Upload)
        # -------------------------------------------------------------
        discord_url = getattr(config, "DISCORD_WEBHOOK_URL", "").strip()
        if discord_url:
            try:
                if snapshot_filename and os.path.exists(snapshot_filename):
                    with open(snapshot_filename, "rb") as photo_file:
                        data = {"content": formatted_message}
                        files = {"file": (os.path.basename(snapshot_filename), photo_file, "image/jpeg")}
                        res = requests.post(discord_url, data=data, files=files, timeout=12)
                else:
                    res = requests.post(discord_url, json={"content": formatted_message}, timeout=12)

                if res.status_code in (200, 204):
                    print(f"✅ [DISCORD ALERT SENT] Threat: {threat_type} (Photo included)")
                    alert_sent = True
                else:
                    print(f"❌ [DISCORD ERROR] HTTP {res.status_code}: {res.text}")
            except Exception as e:
                print(f"❌ [DISCORD EXCEPTION] {e}")

        # -------------------------------------------------------------
        # CHANNEL C: CALLMEBOT WHATSAPP
        # -------------------------------------------------------------
        callmebot_key = getattr(config, "CALLMEBOT_API_KEY", "").strip()
        if callmebot_key and not callmebot_key.startswith("your_"):
            try:
                phone = config.ALERT_WHATSAPP_TO.replace("whatsapp:", "").strip()
                encoded_msg = urllib.parse.quote(formatted_message)
                url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={encoded_msg}&apikey={callmebot_key}"
                res = requests.get(url, timeout=12)
                if res.status_code == 200:
                    print(f"✅ [WHATSAPP ALERT SENT via CallMeBot] Target: {config.ALERT_WHATSAPP_TO}")
                    alert_sent = True
                else:
                    print(f"❌ [CALLMEBOT ERROR] Status: {res.status_code}")
            except Exception as e:
                print(f"❌ [CALLMEBOT EXCEPTION] {e}")

        # -------------------------------------------------------------
        # CHANNEL D: TWILIO WHATSAPP
        # -------------------------------------------------------------
        if self.twilio_client is not None:
            content_sid = getattr(config, "TWILIO_CONTENT_SID", "").strip()
            if content_sid:
                try:
                    vars_dict = {
                        "1": "ALERT EMERGENCY DETECTED",
                        "2": f"{threat_type}: {message} ({timestamp})"
                    }
                    msg = self.twilio_client.messages.create(
                        from_=config.TWILIO_WHATSAPP_FROM,
                        to=config.ALERT_WHATSAPP_TO,
                        content_sid=content_sid,
                        content_variables=json.dumps(vars_dict)
                    )
                    print(f"✅ [WHATSAPP TEMPLATE SENT via Twilio] SID: {msg.sid}")
                    alert_sent = True
                except Exception as e:
                    print(f"❌ [TWILIO TEMPLATE ERROR] {e}")

            if not alert_sent:
                try:
                    msg = self.twilio_client.messages.create(
                        body=formatted_message,
                        from_=config.TWILIO_WHATSAPP_FROM,
                        to=config.ALERT_WHATSAPP_TO
                    )
                    print(f"✅ [WHATSAPP DIRECT SENT via Twilio] SID: {msg.sid}")
                    alert_sent = True
                except Exception as e:
                    print(f"❌ [TWILIO DIRECT ERROR] {e}")

        # Console Log
        if not alert_sent:
            print(f"\n{'='*55}\n[SECURITY ALARM TRIGGERED]\nTarget WhatsApp: {config.ALERT_WHATSAPP_TO}\n{formatted_message}\n{'='*55}\n")
