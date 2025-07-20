import os
import uuid
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

def write_task_log(task_name, agent, status, notes=""):
    payload = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "task_name": task_name,
        "agent": agent,
        "status": status,
        "notes": notes
    }

    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json"
    }

    res = requests.post(f"{SUPABASE_URL}/rest/v1/task_log", headers=headers, json=payload)
    print(f"SUPABASE_LOG: {res.status_code} → {res.text}")

# Example use:
if __name__ == "__main__":
    write_task_log("resipi_loader", "loader_bot", "success", "Clinic YAMLs uploaded")

