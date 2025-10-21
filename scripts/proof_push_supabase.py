#!/usr/bin/env python3
# v18.6 uploader — computes sha256 and upserts proofs with parity fields.
from __future__ import annotations
import os, json, hashlib, time
from datetime import datetime, timezone
from pathlib import Path
import requests

SUPABASE_URL       = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
TENANT_ID          = os.environ["SUPABASE_TENANT_ID"]

PROOFS = [
    "proof/tower_sync_summary.json",
    "proof/notify_events.json",
    "proof/tower_sync_cert_v18_3.json",
    "proof/tower_sync_cert_v18_2_ops.json",
    # add additional proof files here as you create them
]

def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")

def fsha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def meta_hash_for(fn: str, sha: str) -> str:
    # stable “meta” hash — keep simple and deterministic
    h = hashlib.sha256()
    h.update(fn.encode("utf-8"))
    h.update(b"::")
    h.update(sha.encode("utf-8"))
    return h.hexdigest()

def upsert_rows(rows: list[dict]) -> None:
    url = f"{SUPABASE_URL}/rest/v1/proofs?on_conflict=tenant_id,filename,meta_hash"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }
    r = requests.post(url, headers=headers, data=json.dumps(rows), timeout=30)
    if r.status_code >= 300:
        raise SystemExit(f"❌ Upsert failed: {r.status_code} {r.text}")
    # Optional: print returned rows
    # print(r.json())

def main() -> None:
    base = Path(".")
    to_push: list[dict] = []
    ok_count = 0
    for rel in PROOFS:
        p = base / rel
        if not p.exists():
            print(f"⚠️  Skipping missing proof: {rel}")
            continue

        sha = fsha(p)
        # If the JSON already contains a sha256, keep it; otherwise add it.
        try:
            payload = json.loads(p.read_text())
        except Exception:
            payload = {}

        if payload.get("sha256") != sha:
            payload["sha256"] = sha
            # keep files on disk unchanged; parity lives in DB row too
        # Build the row record
        row = {
            "tenant_id": TENANT_ID,
            "filename": Path(rel).name,
            "meta_hash": meta_hash_for(Path(rel).name, sha),
            "sha256": sha,
            "uploaded_at": iso_now(),
            "proof_json": payload,
        }
        to_push.append(row)

    # Batched upsert (idempotent)
    if to_push:
        upsert_rows(to_push)
        ok_count = len(to_push)

    for rel in [r["filename"] for r in to_push]:
        print(f"✅ Upserted {rel}: OK")
    print(f"\n✅ Completed Supabase sync for {ok_count} proofs.")

if __name__ == "__main__":
    # Basic env sanity
    missing = [k for k in ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SUPABASE_TENANT_ID"] if not os.getenv(k)]
    if missing:
        raise SystemExit(f"❌ Missing env: {', '.join(missing)}")
    main()

