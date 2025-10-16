#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bridge_eval_syncer.py (v10.7.6-p4)
Purpose:
    Merge all proof artifacts (C1–C4) into one CSV
    and sync it to Supabase + Tower YAML.
"""

import os, csv, json, glob
from datetime import datetime

# === Paths & Setup ===
PROOF_DIR = "proof"
ARTIFACTS_DIR = "artifacts"
OUT_PATH = os.path.join(ARTIFACTS_DIR, "joins", "tower_eval_view_v2.csv")
MISSION_LOG = "ops/mission_v12.yaml"

# Auto-create dirs
os.makedirs(PROOF_DIR, exist_ok=True)
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
os.makedirs(os.path.dirname(MISSION_LOG), exist_ok=True)

# === Helpers ===
def load_json(p):
    try:
        with open(p, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️  Skipping {p}: {e}")
        return None

def load_csv(p):
    try:
        with open(p, "r") as f:
            return list(csv.DictReader(f))
    except Exception as e:
        print(f"⚠️  Skipping CSV {p}: {e}")
        return []

# === Load Proofs (C1) ===
eval_log = load_json(os.path.join(PROOF_DIR, "preflight_C1_eval_log.json"))
manifest_diff = load_json(os.path.join(PROOF_DIR, "C1_agentkit_manifest_diff.json"))
eff_metrics = load_json(os.path.join(PROOF_DIR, "C1_efficiency_metrics.json"))
test_results = load_csv(os.path.join(PROOF_DIR, "C1_test_results.csv"))

# === Load Runtime (C2) ===
runtime_runs = []
for path in glob.glob(os.path.join(ARTIFACTS_DIR, "agentkit_runs", "*.json")):
    j = load_json(path)
    if j: runtime_runs.append(j)

# === Load Logs (C3–C4 bridge) ===
parity_logs = []
for path in glob.glob(os.path.join(ARTIFACTS_DIR, "logs", "ws_parity_test.log")):
    with open(path, "r") as f:
        parity_logs.append(f.read().strip())

# === Merge Logic ===
rows = []
for run in runtime_runs:
    rid = run.get("run_id") or os.path.basename(run.get("file", ""))
    rows.append({
        "run_id": rid,
        "phase": run.get("phase", ""),
        "eval_score": run.get("eval_score", ""),
        "latency_ms": run.get("latency_ms", ""),
        "tokens_used": run.get("tokens_used", ""),
        "energy_cost": run.get("energy_cost", ""),
        "manifest_drift": (manifest_diff or {}).get("drift_percent", ""),
        "baseline_efficiency": (eff_metrics or {}).get("tokens_per_kwh", ""),
        "proof_timestamp": (eff_metrics or {}).get("created_at", datetime.utcnow().isoformat()),
        "drift_log_excerpt": (parity_logs[-1][:80] if parity_logs else ""),
        "eval_log_ref": (eval_log or {}).get("summary", ""),
    })

# === Write CSV ===
if rows:
    with open(OUT_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader(); writer.writerows(rows)
    print(f"✅ Bridge Eval Sync Complete → {OUT_PATH}")
    print(f"🧾 {len(rows)} joined records from C1–C4 proof chain.")
else:
    print("⚠️  No runtime runs found — nothing written.")

# === Tower Log Update ===
cert_time = datetime.utcnow().isoformat() + "Z"
with open(MISSION_LOG, "a") as f:
    f.write(f"\n# Bridge Eval Sync v10.7.6-p4 completed {cert_time}\n")
    f.write(f"certified_at: {cert_time}\ncertified_by: firdaus_ismail\n")

# === Supabase Sync ===
try:
    from supabase import create_client
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

    if SUPABASE_URL and SUPABASE_KEY and rows:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        client.table("tower_eval_view_v2").upsert(rows)
        print("☁️  Synced tower_eval_view_v2.csv → Supabase table")
    else:
        print("⚠️  Supabase creds missing or no rows — skipped upload")
except ModuleNotFoundError:
    print("⚠️  Supabase Python SDK not installed (pip install supabase)")
except Exception as e:
    print(f"❌ Supabase sync error: {e}")

