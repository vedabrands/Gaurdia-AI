# test_whatsapp.py
"""
Diagnostic WhatsApp Test Script:
Tests CallMeBot WhatsApp (direct free API) and Twilio WhatsApp Sandbox (with Content Templates).
"""

import json
import urllib.parse
import requests
from twilio.rest import Client
import config

# Known standard sandbox template SIDs
KNOWN_SANDBOX_TEMPLATES = [
    getattr(config, "TWILIO_CONTENT_SID", "").strip(),
    "HXb5b62575e6e4ff6129ad7c8efe1f983e",
    "HX229f5a04fd0510ce1b071852155d3e75",
    "HX3b730fb8d47b67b1adb3b44b20755745"
]

def test_callmebot():
    callmebot_key = getattr(config, "CALLMEBOT_API_KEY", "").strip()
    if not callmebot_key or callmebot_key.startswith("your_"):
        return False

    print("\n" + "=" * 60)
    print("📲 TESTING VIA CALLMEBOT WHATSAPP GATEWAY")
    print("=" * 60)
    phone = config.ALERT_WHATSAPP_TO.replace("whatsapp:", "").strip()
    test_msg = "🚨 AI Surveillance Test Alert: Threat & Weapon System Connected Successfully! ✅"
    encoded_msg = urllib.parse.quote(test_msg)
    url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={encoded_msg}&apikey={callmebot_key}"

    print(f"To: {phone}")
    print(f"Sending message...")

    try:
        res = requests.get(url, timeout=12)
        if res.status_code == 200:
            print("\n" + "=" * 60)
            print("✅ SUCCESS! WhatsApp message sent via CallMeBot!")
            print("Check your WhatsApp on your phone now!")
            print("=" * 60)
            return True
        else:
            print(f"❌ CallMeBot returned status code: {res.status_code} ({res.text})")
    except Exception as e:
        print(f"❌ CallMeBot request error: {e}")
    return False

def test_twilio():
    print("\n" + "=" * 60)
    print("📲 TESTING VIA TWILIO WHATSAPP SANDBOX")
    print("=" * 60)
    print(f"From (Twilio Sandbox): {config.TWILIO_WHATSAPP_FROM}")
    print(f"To (Your Number):      {config.ALERT_WHATSAPP_TO}")

    if not config.TWILIO_SID or config.TWILIO_SID.startswith("your_"):
        print("❌ Twilio SID is missing in config.py")
        return False

    try:
        client = Client(config.TWILIO_SID, config.TWILIO_AUTH_TOKEN)
    except Exception as e:
        print(f"❌ Could not initialize Twilio client: {e}")
        return False

    # 1. Try template SIDs
    templates_to_try = [t for t in KNOWN_SANDBOX_TEMPLATES if t]
    for idx, sid in enumerate(templates_to_try, 1):
        print(f"\n[Attempt {idx}] Trying Template SID: {sid}...")
        try:
            variables = {
                "1": "AI Surveillance Alert",
                "2": "Threat/Weapon System Connected Successfully! ✅"
            }
            msg = client.messages.create(
                from_=config.TWILIO_WHATSAPP_FROM,
                to=config.ALERT_WHATSAPP_TO,
                content_sid=sid,
                content_variables=json.dumps(variables)
            )
            print("\n" + "=" * 60)
            print(f"✅ SUCCESS! WhatsApp Template Message Sent using SID: {sid}")
            print(f"Message SID: {msg.sid}")
            print("Check your WhatsApp on your phone now!")
            print("=" * 60)
            return True
        except Exception as e:
            print(f"  -> Template {sid} failed: {e}")

    # 2. Try direct body message
    print("\n[Final Attempt] Trying direct freeform text...")
    try:
        msg = client.messages.create(
            body="🚨 AI Surveillance Test Alert: System Connected Successfully! ✅",
            from_=config.TWILIO_WHATSAPP_FROM,
            to=config.ALERT_WHATSAPP_TO
        )
        print("\n" + "=" * 60)
        print(f"✅ SUCCESS! WhatsApp Direct Message Sent!")
        print(f"Message SID: {msg.sid}")
        print("=" * 60)
        return True
    except Exception as e:
        print(f"  -> Direct message failed: {e}")

    return False

def main():
    # Priority 1: CallMeBot if API key exists
    if test_callmebot():
        return

    # Priority 2: Twilio
    success = test_twilio()
    if not success:
        print("\n" + "=" * 60)
        print("💡 QUICK SOLUTION - 2 OPTIONS TO FIX:")
        print("=" * 60)
        print("👉 OPTION A (Fastest - 10 seconds): Use CallMeBot (No Sandbox / No Template issues)")
        print("   1. Save +34 644 44 25 36 as 'CallMeBot' in your phone contacts.")
        print("   2. Send 'I allow callmebot to send me messages' on WhatsApp to that contact.")
        print("   3. Paste the API key into config.py as: CALLMEBOT_API_KEY = 'your_key'")
        print("   4. Run 'python test_whatsapp.py' again!")
        print("-" * 60)
        print("👉 OPTION B: Get Twilio Content SID (HX...)")
        print("   1. Open: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn")
        print("   2. Look at 'Step 2: Send a Template message' and copy the HX... string.")
        print("   3. Paste into config.py as: TWILIO_CONTENT_SID = 'HX...'")
        print("=" * 60)

if __name__ == "__main__":
    main()
