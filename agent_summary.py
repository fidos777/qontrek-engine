import os
from datetime import datetime
from supabase import create_client
from collections import defaultdict

# Load Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_today_summary():
    today = datetime.utcnow().date().isoformat()
    response = supabase.table("agent_logs").select("*").gte("timestamp", today).execute()
    logs = response.data

    summary = defaultdict(list)

    for log in logs:
        agent = log["agent_name"]
        status = "✅" if log["status"] == "success" else "❌"
        summary[agent].append(status)

    print(f"📊 Agent Summary ({today})")
    for agent, results in summary.items():
        result_line = "".join(results)
        print(f"{agent} — {len(results)} run(s) {result_line}")

if __name__ == "__main__":
    get_today_summary()

