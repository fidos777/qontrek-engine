import os
import yaml
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

def load_yaml_to_supabase(directory):
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json"
    }
    for filename in os.listdir(directory):
        if filename.endswith(".yaml"):
            with open(os.path.join(directory, filename)) as f:
                data = yaml.safe_load(f)
                res = requests.post(f"{SUPABASE_URL}/rest/v1/resipi_catalog", headers=headers, json=data)
                print(f"{filename}: {res.status_code} → {res.text}")

# CLI usage:
# python3 scripts/resipi_loader.py resipi/clinic
if __name__ == "__main__":
    import sys
    folder = sys.argv[1]
    load_yaml_to_supabase(folder)

