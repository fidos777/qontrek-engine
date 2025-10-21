#!/usr/bin/env python3
from __future__ import annotations
import os, json, hashlib
from pathlib import Path
import requests

SUPABASE_URL         = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
TENANT_ID            = os.environ["SUPABASE_TENANT_ID"]

FILES = [
    "proof/tower_sync_summary.json",
    "proof/notify_events.json",
    "proof/tower_sync_cert_v18_3.json",
    "proof/tower_sync_cert_v18_2_ops.json",
]

def fsha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def patch_sha(filename: str, sha: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/proofs"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    params = {
        "tenant_id": f"eq.{TENANT_ID}",
        "filename": f"eq.{filename}",
        "sha256": "is.null",   # only patch rows missing sha256
    }
    body = {"sha256": sha}
    r = requests.patch(url, headers=headers, params=params, data=json.dumps(body), timeout=30)
    if r.status_code >= 300:
        raise SystemExit(f"❌ Patch failed for {filename}: {r.status_code} {r.text}")

def main() -> None:
    for rel in FILES:
        p = Path(rel)
        if not p.exists():
            print(f"⚠️  skip (missing): {rel}")
            continue
        sha = fsha(p)
        patch_sha(p.name, sha)
        print(f"🧩 backfilled sha256 for {p.name}: {sha[:10]}…")

if __name__ == "__main__":
    main()

