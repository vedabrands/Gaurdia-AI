# test_alerts.py
"""
Diagnostic & Testing Utility for AI Surveillance Alert Channels.
Tests: Voice TTS ("ALERT EMERGENCY DETECTED"), Audio Siren, Telegram, Discord, CallMeBot, and Twilio.
"""

import os
import sys
import time
import json
import urllib.parse
import numpy as np
import cv2
import requests
from twilio.rest import Client
import config

try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

try:
    import pythoncom
    import win32com.client
    HAS_WIN32COM = True
except ImportError:
    HAS_WIN32COM = False

try:
    import pyttsx3
    HAS_PYTTSX3 = True
except ImportError:
    HAS_PYTTSX3 = False


def create_test_image():
    """Generates a dummy test image to verify photo uploads."""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    # Background
    img[:] = (35, 35, 35)
    # Banner
    cv2.rectangle(img, (0, 0), (640, 60), (0, 0, 200), -1)
    cv2.putText(img, "TEST ALERT - AI SURVEILLANCE", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
    cv2.putText(img, f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}", (20, 120),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)
    cv2.putText(img, "Camera Connection: ACTIVE", (20, 160),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
    cv2.putText(img, "Weapon / Violence Scanner: READY", (20, 200),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)

    os.makedirs("snapshots", exist_ok=True)
    test_path = "snapshots/test_alert.jpg"
    cv2.imwrite(test_path, img)
    return test_path


def test_voice_tts():
    print("\n🗣️ Testing Voice Text-To-Speech Automation...")
    text = getattr(config, "VOICE_ALERT_TEXT", "ALERT EMERGENCY DETECTED")
    print(f"  -> Speaking: '{text}'...")
    try:
        if HAS_WIN32COM:
            pythoncom.CoInitialize()
            speaker = win32com.client.Dispatch("SAPI.SpVoice")
            speaker.Rate = 1
            speaker.Speak(text)
            pythoncom.CoUninitialize()
            print("  ✅ Voice Speech synthesized successfully via SAPI!")
            return True
        elif HAS_PYTTSX3:
            engine = pyttsx3.init()
            engine.say(text)
            engine.runAndWait()
            print("  ✅ Voice Speech synthesized successfully via pyttsx3!")
            return True
    except Exception as e:
        print(f"  ❌ Voice test failed: {e}")
    return False


def test_audio():
    print("\n🔊 Testing Local PC Sound Siren...")
    if not HAS_WINSOUND:
        print("  ❌ winsound not available on this OS.")
        return False
    try:
        print("  -> Beeping PC speaker...")
        winsound.Beep(2500, 150)
        winsound.Beep(1800, 150)
        print("  ✅ Audio Siren working perfectly!")
        return True
    except Exception as e:
        print(f"  ❌ Sound test failed: {e}")
        return False


def test_telegram(test_image_path):
    print("\n📱 Testing Telegram Bot Alerts...")
    token = getattr(config, "TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = getattr(config, "TELEGRAM_CHAT_ID", "").strip()

    if not token or not chat_id:
        print("  ⚠️ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in config.py")
        return False

    url = f"https://api.telegram.org/bot{token}/sendPhoto"
    caption = "🚨 ALERT EMERGENCY DETECTED 🚨\n⚠️ Threat: TEST ALERT\n✅ Weapon & Violence Detection Online\n📸 Live snapshot transmission verified."

    try:
        with open(test_image_path, "rb") as photo:
            res = requests.post(url, data={"chat_id": chat_id, "caption": caption}, files={"photo": photo}, timeout=15)
        if res.status_code == 200:
            print("  ✅ SUCCESS! Telegram Photo Alert received on your phone!")
            return True
        else:
            print(f"  ❌ Telegram API returned error HTTP {res.status_code}: {res.text}")
    except Exception as e:
        print(f"  ❌ Telegram request failed: {e}")
    return False


def test_discord(test_image_path):
    print("\n🎮 Testing Discord Webhook Alerts...")
    webhook_url = getattr(config, "DISCORD_WEBHOOK_URL", "").strip()
    if not webhook_url:
        print("  ⚠️ DISCORD_WEBHOOK_URL not configured in config.py")
        return False

    content = "🚨 **ALERT EMERGENCY DETECTED** 🚨\n⚠️ Threat: SYSTEM TEST\n✅ Live snapshot attached below:"
    try:
        with open(test_image_path, "rb") as photo:
            res = requests.post(webhook_url, data={"content": content},
                                files={"file": ("test_alert.jpg", photo, "image/jpeg")}, timeout=15)
        if res.status_code in (200, 204):
            print("  ✅ SUCCESS! Discord notification & snapshot sent!")
            return True
        else:
            print(f"  ❌ Discord returned HTTP {res.status_code}: {res.text}")
    except Exception as e:
        print(f"  ❌ Discord request failed: {e}")
    return False


def test_callmebot():
    print(f"\n💬 Testing CallMeBot WhatsApp ({config.ALERT_WHATSAPP_TO})...")
    key = getattr(config, "CALLMEBOT_API_KEY", "").strip()
    if not key or key.startswith("your_"):
        print("  ⚠️ CALLMEBOT_API_KEY is empty in config.py.")
        return False

    phone = config.ALERT_WHATSAPP_TO.replace("whatsapp:", "").strip()
    msg = urllib.parse.quote("🚨 ALERT EMERGENCY DETECTED 🚨\nThreat: SYSTEM TEST\nCamera View: ACTIVE")
    url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={msg}&apikey={key}"

    try:
        res = requests.get(url, timeout=12)
        if res.status_code == 200:
            print("  ✅ SUCCESS! WhatsApp message sent via CallMeBot!")
            return True
        else:
            print(f"  ❌ CallMeBot returned status: {res.status_code} ({res.text})")
    except Exception as e:
        print(f"  ❌ CallMeBot request failed: {e}")
    return False


def test_twilio():
    print(f"\n📞 Testing Twilio WhatsApp / SMS ({config.ALERT_WHATSAPP_TO})...")
    if not config.TWILIO_SID or config.TWILIO_SID.startswith("your_"):
        print("  ⚠️ Twilio SID not set in config.py")
        return False

    try:
        client = Client(config.TWILIO_SID, config.TWILIO_AUTH_TOKEN)
    except Exception as e:
        print(f"  ❌ Twilio client init error: {e}")
        return False

    # Try Content SID if specified
    content_sid = getattr(config, "TWILIO_CONTENT_SID", "").strip()
    if content_sid:
        print(f"  -> Trying Twilio Template SID: {content_sid}...")
        try:
            vars_dict = {"1": "ALERT EMERGENCY DETECTED", "2": "AI Surveillance Online ✅"}
            msg = client.messages.create(
                from_=config.TWILIO_WHATSAPP_FROM,
                to=config.ALERT_WHATSAPP_TO,
                content_sid=content_sid,
                content_variables=json.dumps(vars_dict)
            )
            print(f"  ✅ SUCCESS! Twilio Template Message sent! SID: {msg.sid}")
            return True
        except Exception as e:
            print(f"  ❌ Twilio Template failed: {e}")

    # Try direct message
    print("  -> Trying direct text message...")
    try:
        msg = client.messages.create(
            body="🚨 ALERT EMERGENCY DETECTED 🚨\nThreat: SYSTEM TEST",
            from_=config.TWILIO_WHATSAPP_FROM,
            to=config.ALERT_WHATSAPP_TO
        )
        print(f"  ✅ SUCCESS! Twilio Direct Message sent! SID: {msg.sid}")
        return True
    except Exception as e:
        print(f"  ❌ Twilio Direct failed: {e}")

    return False


def main():
    print("=" * 65)
    print("🛡️  AI SURVEILLANCE NOTIFICATION & ALERT DIAGNOSTIC TOOL")
    print("=" * 65)

    test_image_path = create_test_image()

    v_ok = test_voice_tts()
    s_ok = test_audio()
    tg_ok = test_telegram(test_image_path)
    disc_ok = test_discord(test_image_path)
    cmb_ok = test_callmebot()
    tw_ok = test_twilio()

    print("\n" + "=" * 65)
    print("📊 ALERT SYSTEM STATUS SUMMARY:")
    print("=" * 65)
    print(f"1. Voice TTS ('{getattr(config, 'VOICE_ALERT_TEXT', 'ALERT EMERGENCY DETECTED')}'): {'🟢 OPERATIONAL' if v_ok else '🔴 FAILED'}")
    print(f"2. PC Audio Siren:      {'🟢 ENABLED' if s_ok else '⚪ DISABLED'}")
    print(f"3. Target WhatsApp No:  {config.ALERT_WHATSAPP_TO}")
    print(f"4. Telegram Bot:        {'🟢 CONNECTED' if tg_ok else '🔴 NOT CONFIGURED / FAILED'}")
    print(f"5. Discord Webhook:     {'🟢 CONNECTED' if disc_ok else '🔴 NOT CONFIGURED / FAILED'}")
    print(f"6. CallMeBot WhatsApp:  {'🟢 CONNECTED' if cmb_ok else '🔴 NOT CONFIGURED / FAILED'}")
    print(f"7. Twilio WhatsApp:     {'🟢 CONNECTED' if tw_ok else '🔴 NOT CONFIGURED / FAILED'}")
    print("=" * 65)


if __name__ == "__main__":
    main()
