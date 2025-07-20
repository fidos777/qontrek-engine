import os
import requests
import json
from datetime import datetime

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

def log_task(task, agent, status):
    url = f"{SUPABASE_URL}/rest/v1/task_log"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "task_name": task,
        "agent": agent,
        "status": status,
        "notes": "Codex batch run"
    }
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(f"SUPABASE_LOG: {response.status_code} → {response.text}")

if __name__ == "__main__":
    log_task("resipi_loader", "loader_bot", "success")
