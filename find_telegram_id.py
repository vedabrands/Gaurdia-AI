# find_telegram_id.py
"""
Auto-detects your Telegram Chat ID:
1. Run this script.
2. Open Telegram on your phone and search for your bot: @GaurdiaAI_bot
3. Click "START" or send "hello".
4. This script will instantly capture your Chat ID and verify message delivery!
"""

import time
import requests
import config

TOKEN = getattr(config, "TELEGRAM_BOT_TOKEN", "").strip()

def main():
    print("=" * 60)
    print("🤖 TELEGRAM BOT ACTIVATOR & CHAT ID VERIFIER")
    print("=" * 60)
    print(f"Bot Username: @GaurdiaAI_bot")
    print(f"Bot Token:    {TOKEN[:15]}...")
    print("\n👉 ACTION REQUIRED (Takes 5 seconds):")
    print("1. Open Telegram on your phone.")
    print("2. In the search bar at the top, type: @GaurdiaAI_bot")
    print("3. Tap on 'Gaurdia AI' and click the 'START' button (or send 'hi').")
    print("\n⏳ Listening for your message... (Waiting up to 45 seconds)")
    print("-" * 60)

    start_time = time.time()
    while time.time() - start_time < 45:
        try:
            res = requests.get(f"https://api.telegram.org/bot{TOKEN}/getUpdates", timeout=5).json()
            if res.get("ok") and len(res.get("result", [])) > 0:
                for update in reversed(res["result"]):
                    msg = update.get("message") or update.get("my_chat_member")
                    if msg:
                        chat = msg.get("chat", {})
                        chat_id = str(chat.get("id"))
                        first_name = chat.get("first_name", "User")
                        print("\n" + "=" * 60)
                        print(f"🎉 FOUND YOU, {first_name}!")
                        print(f"✅ Your Exact Chat ID: {chat_id}")
                        print("=" * 60)

                        # Send immediate test confirmation message
                        test_msg = f"🛡️ Gaurdia AI Surveillance Connected!\nHello {first_name}, you will now receive real-time alerts & threat snapshots here. 🚀"
                        send_res = requests.post(
                            f"https://api.telegram.org/bot{TOKEN}/sendMessage",
                            json={"chat_id": chat_id, "text": test_msg}
                        ).json()

                        if send_res.get("ok"):
                            print("📲 Test confirmation message sent to your Telegram app!")

                        return chat_id
        except Exception as e:
            pass

        time.sleep(2)
        print(".", end="", flush=True)

    print("\n\n⚠️ Did not receive message yet. Please make sure you searched '@GaurdiaAI_bot' and tapped START.")
    return None

if __name__ == "__main__":
    main()
