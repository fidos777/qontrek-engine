import os
from supabase import create_client
from datetime import datetime
import uuid

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def log_agent_run(agent_name, prompt_hash, status="success", error_msg=None, user_id=None):
    run_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()

    data = {
        "agent_name": agent_name,
        "run_id": run_id,
        "prompt_hash": prompt_hash,
        "timestamp": timestamp,
        "status": status,
        "error_msg": error_msg,
        "user_id": user_id,
    }

    response = supabase.table("agent_logs").insert(data).execute()
    print("[agent_logger] Logged:", response)

