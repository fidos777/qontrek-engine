# retriever/utils/retool_agentcard_generator.py

import json
import os

PROFILE_PATH = os.path.join(os.path.dirname(__file__), "../../agent_profiles/agent_profile.json")

try:
    with open(PROFILE_PATH, "r") as f:
        profiles = json.load(f)

    for agent, profile in profiles.items():
        card = {
            "agent": agent,
            "role": profile.get("role"),
            "tools": profile.get("tools", []),
            "fallback": profile.get("fallback"),
            "mode": profile.get("mode"),
        }
        print(f"📇 Retool Card – {agent}:")
        print(json.dumps(card, indent=2))
        print("")

except Exception as e:
    print(f"❌ Error: {e}")

