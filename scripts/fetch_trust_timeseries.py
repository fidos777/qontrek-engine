#!/usr/bin/env python3
import os, json, requests, datetime

url = f"{os.getenv('SUPABASE_URL')}/rest/v1/proofs_parity_log"
params = "?select=created_at,trust_index&order=created_at.desc&limit=168"  # last 7 days (hourly)
headers = {
    "apikey": os.getenv("SUPABASE_SERVICE_KEY"),
    "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}"
}

r = requests.get(url + params, headers=headers)
r.raise_for_status()
data = [
    {"t": row["created_at"], "trust": row["trust_index"]}
    for row in r.json()
]
out = {
    "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
    "points": data
}
os.makedirs("proof/dashboard", exist_ok=True)
with open("proof/dashboard/trust_timeseries.json", "w") as f:
    json.dump(out, f, indent=2)
print("✅ trust_timeseries.json updated (", len(data), "points )")

