#!/usr/bin/env python3
# v18.6b — Reflex Cloud Parity Verifier
# Validates that local proof JSON files match Supabase cloud records by sha256.
# Produces proof/cloud_sync_verify.json with structured counters and detailed status.

from __future__ import annotations
import os, json, hashlib
from datetime import datetime, timezone
from pathlib import Path
import requests

# --- ENV ---
SUPABASE_URL         = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
TENANT_ID            = os.environ.get("SUPABASE_TENANT_ID")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or not TENANT_ID:
    raise SystemExit("❌ Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or SUPABASE_TENANT_ID env vars.")

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
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")

def fsha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def fetch_cloud_row(filename: str) -> dict | None:
    """Fetch the latest cloud proof row for a filename."""
    url = f"{SUPABASE_URL}/rest/v1/proofs"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }
    params = {
        "tenant_id": f"eq.{TENANT_ID}",
        "filename": f"eq.{filename}",
        "select": "filename,meta_hash,sha256,uploaded_at",
    }

    r = requests.get(url, headers=headers, params=params, timeout=30)
    if r.status_code >= 300:
        print(f"❌ Query failed for {filename}: {r.status_code} {r.text}")
        return None

    data = r.json()
    if not data:
        print(f"⚠️  No cloud row found for {filename}")
        return None

    # Return latest record (by uploaded_at if available)
    latest = sorted(data, key=lambda x: x.get("uploaded_at") or "", reverse=True)[0]
    return latest

# --- MAIN ---
def main() -> None:
    print(f"🔐 Using Supabase URL: {SUPABASE_URL}")
    print(f"🔑 Key prefix: {SUPABASE_SERVICE_KEY[:10]}...")

    results = []
    counts = {"verified_ok": 0, "verified_mismatch": 0, "verified_missing_sha": 0, "not_found": 0, "errors": 0}

    for rel in FILES:
        p = Path(rel)
        filename = p.name

        if not p.exists():
            print(f"⚠️  Local file missing: {filename}")
            results.append({"filename": filename, "status": "not_found"})
            counts["not_found"] += 1
            continue

        local_sha = fsha(p)
        cloud = fetch_cloud_row(filename)
        if not cloud:
            results.append({"filename": filename, "status": "error", "issue": "cloud fetch failed"})
            counts["errors"] += 1
            continue

        cloud_sha = cloud.get("sha256")

        if not cloud_sha:
            print(f"🚫 Missing sha256 in cloud row for {filename}")
            results.append({"filename": filename, "status": "missing_sha", "local_sha": local_sha, "cloud_sha": None})
            counts["verified_missing_sha"] += 1
        elif cloud_sha != local_sha:
            print(f"❌ MISMATCH: {filename}")
            print(f"   local: {local_sha[:10]}...  cloud: {cloud_sha[:10]}...")
            results.append({"filename": filename, "status": "mismatch", "local_sha": local_sha, "cloud_sha": cloud_sha})
            counts["verified_mismatch"] += 1
        else:
            print(f"✅ OK: {filename}")
            results.append({"filename": filename, "status": "ok", "sha256": local_sha})
            counts["verified_ok"] += 1

    passed = counts["verified_mismatch"] == 0 and counts["verified_missing_sha"] == 0 and counts["errors"] == 0

    payload = {
        "phase": "cloud_sync_verify",
        "generated_at": iso_now(),
        "passed": passed,
        "counters": counts,
        "results": results,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2))

    print("\n📊 Summary:")
    print(json.dumps(counts, indent=2))
    if passed:
        print("✅ Cloud parity verified. All files match Supabase.")
    else:
        print("❌ Cloud verification detected mismatches or errors.")

if __name__ == "__main__":
    main()

