#!/usr/bin/env python3
"""
v18.6 Cloud Parity Verifier
Ensures local proof files match Supabase cloud rows (by sha256).
Writes detailed report to proof/cloud_sync_verify.json
"""

from __future__ import annotations
import os, json, hashlib, requests
from datetime import datetime, timezone
from pathlib import Path

# --- ENV SETUP ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
TENANT_ID = os.getenv("SUPABASE_TENANT_ID", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.")
    exit(1)

# Fix: ensure full key format (not truncated JWT)
if SUPABASE_SERVICE_KEY.startswith("eyJhb"):
    print("⚠️ Detected JWT-style key — please use sb_secret_* service key.")
print(f"🔐 Using Supabase URL: {SUPABASE_URL}")
print(f"🔑 Key prefix: {SUPABASE_SERVICE_KEY[:10]}...")

# --- CONFIG ---
FILES = [
    "proof/tower_sync_summary.json",
    "proof/notify_events.json",
    "proof/tower_sync_cert_v18_3.json",
    "proof/tower_sync_cert_v18_2_ops.json",
]
OUT_PATH = Path("proof/cloud_sync_verify.json")

# --- HELPERS ---
def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

def fsha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def fetch_cloud_row(filename: str) -> dict | None:
    """Fetch latest proof row for this tenant & filename"""
    url = f"{SUPABASE_URL}/rest/v1/proofs"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    params = {
        "tenant_id": f"eq.{TENANT_ID}",
        "filename": f"eq.{filename}",
        "select": "filename,meta_hash,sha256,uploaded_at",
        "order": "uploaded_at.desc",
        "limit": "1",
    }
    r = requests.get(url, headers=headers, params=params, timeout=30)
    if r.status_code >= 400:
        raise RuntimeError(f"Supabase query failed: {r.status_code} {r.text}")
    data = r.json()
    return data[0] if data else None

# --- MAIN ---
def main():
    results = []
    counters = {
        "verified_ok": 0,
        "verified_mismatch": 0,
        "verified_missing_sha": 0,
        "not_found": 0,
        "errors": 0,
    }

    for file in FILES:
        path = Path(file)
        local_sha = fsha(path) if path.exists() else None
        status = "unknown"
        issue = None
        cloud_sha = None

        try:
            row = fetch_cloud_row(path.name)
            if not row:
                status = "not_found"
                counters["not_found"] += 1
                issue = "no cloud record found"
            else:
                cloud_sha = row.get("sha256")
                if not cloud_sha:
                    status = "missing_sha"
                    counters["verified_missing_sha"] += 1
                    issue = "cloud record missing sha256"
                elif cloud_sha == local_sha:
                    status = "ok"
                    counters["verified_ok"] += 1
                else:
                    status = "mismatch"
                    counters["verified_mismatch"] += 1
                    issue = f"sha mismatch (local={local_sha[:8]}..., cloud={cloud_sha[:8]}...)"
        except Exception as e:
            status = "error"
            counters["errors"] += 1
            issue = str(e)

        results.append({
            "filename": path.name,
            "status": status,
            "local_sha": local_sha,
            "cloud_sha": cloud_sha,
            "issue": issue,
        })
        print(f"📄 {path.name}: {status.upper()}  "
              f"local={local_sha[:8] if local_sha else '-'}  "
              f"cloud={cloud_sha[:8] if cloud_sha else '-'}")

    passed = (
        counters["verified_ok"] == len(FILES)
        and all(v == 0 for k, v in counters.items() if k != "verified_ok")
    )

    report = {
        "phase": "cloud_sync_verify",
        "generated_at": iso_now(),
        "passed": passed,
        "counters": counters,
        "results": results,
    }

    OUT_PATH.write_text(json.dumps(report, indent=2))
    print(f"\n✅ Verification proof written → {OUT_PATH}")
    if passed:
        print("✅ Cloud parity verified; ready for seal rotation.")
    else:
        print("❌ Cloud verification detected mismatches or errors.")

if __name__ == "__main__":
    main()

