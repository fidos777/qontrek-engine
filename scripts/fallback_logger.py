import json
import os
from datetime import datetime

LOG_FILE = "logs/fallback_chain_log.json"

def log_fallback(sop_name, agent, reason, success=False):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "sop_name": sop_name,
        "agent": agent,
        "reason": reason,
        "success_after_fallback": success
    }

    os.makedirs("logs", exist_ok=True)

    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            logs = json.load(f)
    else:
        logs = []

    logs.append(log_entry)

    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=2)

# Example use:
if __name__ == "__main__":
    log_fallback("quotation_generator", "Zamer", "Primary agent timeout", success=True)

