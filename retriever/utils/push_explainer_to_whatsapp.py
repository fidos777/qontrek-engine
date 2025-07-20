# retriever/utils/push_explainer_to_whatsapp.py

import json
import os

PROFILE_PATH = os.path.join(os.path.dirname(__file__), "../../agent_profiles/agent_profile.json")

try:
    with open(PROFILE_PATH, "r") as f:
        profiles = json.load(f)

    for agent, profile in profiles.items():
        message = f"""
📣 WhatsApp Explainer – {agent}
🧠 Role: {profile.get("role")}
🛠️ Tools: {', '.join(profile.get("tools", []))}
🔁 Fallback: {profile.get("fallback")}
📝 Mode: {profile.get("mode")}
"""
        print(message)

except Exception as e:
    print(f"❌ Failed to push demo: {e}")

