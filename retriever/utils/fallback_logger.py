# retriever/utils/fallback_logger.py

import json
from datetime import datetime

FALLBACK_LOG_PATH = "logs/fallback_chain_log.json"

def log_fallback_chain(run_id, task, chain):
    """
    Append fallback chain to fallback_chain_log.json
    """
    entry = {
        "run_id": run_id,
        "task": task,
        "chain": chain,
        "timestamp": datetime.now().isoformat()
    }

    try:
        with open(FALLBACK_LOG_PATH, "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        data = []

    data.append(entry)

    with open(FALLBACK_LOG_PATH, "w") as f:
        json.dump(data, f, indent=2)

    print(f"✅ Fallback chain logged for {run_id}")

