import os
import json
from datetime import datetime

log_path = "logs/fallback_chain_log.json"
os.makedirs("logs", exist_ok=True)

log_entry = {
    "timestamp": datetime.utcnow().isoformat(),
    "sop_name": "quotation_generator",
    "agent": "Zamer",
    "reason": "demo_fail",
    "success_after_fallback": True
}

if os.path.exists(log_path):
    with open(log_path, "r+") as f:
        logs = json.load(f)
        logs.append(log_entry)
        f.seek(0)
        json.dump(logs, f, indent=2)
else:
    with open(log_path, "w") as f:
        json.dump([log_entry], f, indent=2)

print("Fallback log updated.")
