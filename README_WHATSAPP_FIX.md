# WhatsApp Alert Fix for AI Surveillance System

Your WhatsApp alert system is now configured with two independent options. Choose one:

## 🔧 OPTION 1: Twilio WhatsApp (Requires Template SID)
1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Scroll to "Step 2: Send a Template message"
3. Copy the Content SID that looks like `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Paste it into `config.py`:
   ```python
   TWILIO_CONTENT_SID = "HXyour_actual_sid_here"
   ```
5. Test with: `python test_whatsapp.py`

## ⚡ OPTION 2: CallMeBot WhatsApp (Instant Free - Recommended for India)
**Setup takes 10 seconds:**
1. Save this number in your phone contacts: `+34 644 44 25 36` (name it "CallMeBot")
2. Open WhatsApp and send this message to that contact:
   ```
   I allow callmebot to send me messages
   ```
3. You'll receive an API key reply (looks like: `XXXXXXXXXXXXXXXXXXXX`)
4. Paste it into `config.py`:
   ```python
   CALLMEBOT_API_KEY = "your_actual_key_here"
   ```
5. Test with: `python test_whatsapp.py` (it will try CallMeBot first)

## 📝 Notes
- **CallMeBot is recommended** for users in India (+91) because Twilio trial accounts block freeform WhatsApp messages to international numbers and require pre-approved templates.
- The alert system runs in background threads - video feed will never freeze during WhatsApp sends.
- Snapshots are saved locally to `snapshots/` folder when alerts trigger.
- After configuring either option, run:
  ```bash
  python test_whatsapp.py   # Verify WhatsApp works
  python main.py            # Start full surveillance system
  ```

## 🛠️ Troubleshooting
- If CallMeBot fails: Double-check you sent the exact activation phrase to +34 644 44 25 36 on WhatsApp.
- If Twilio fails: Verify your TWILIO_SID and TWILIO_AUTH_TOKEN are correct from Twilio Console.
- Cooldown: Alerts are rate-limited to 1 per 30 seconds (ALERT_COOLDOWN_SEC in config.py) to avoid spam.