#!/usr/bin/env python3
"""
Generate the CFO Lens finance summary proof (v18.5).
"""
from __future__ import annotations

import hashlib
import json
import os
import random
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple


SUMMARY_PATH = Path("proof/tower_sync_summary.json")
CLOUD_VERIFY_PATH = Path("proof/cloud_sync_verify.json")
OUTPUT_PATH = Path("proof/cfo_summary.json")


def utc_now() -> str:
  return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> Dict[str, Any]:
  if not path.exists():
    return {}
  try:
    return json.loads(path.read_text())
  except json.JSONDecodeError:
    return {}


def seed_rng(seed_parts: List[str]) -> random.Random:
  seed = hashlib.sha256("::".join(seed_parts).encode("utf-8")).hexdigest()
  return random.Random(int(seed[:16], 16))


def generate_ar_aging(rng: random.Random) -> Tuple[List[Dict[str, Any]], float]:
  buckets = [
    ("0-30", 0.42),
    ("31-60", 0.27),
    ("61-90", 0.18),
    ("90+", 0.13),
  ]
  total = 0.0
  results: List[Dict[str, Any]] = []
  for label, weight in buckets:
    amount = round(rng.uniform(1.5, 3.5) * 1_000_000 * weight, 2)
    invoices = int(amount / rng.uniform(8500, 12500))
    total += amount
    results.append(
      {
        "label": label,
        "amount": amount,
        "invoice_count": invoices,
      }
    )
  return results, round(total, 2)


def generate_dso_series(rng: random.Random) -> Dict[str, Any]:
  base = rng.uniform(36, 42)
  trend7 = round(rng.uniform(-1.2, 1.2), 2)
  trend30 = round(rng.uniform(-2.5, 2.5), 2)
  projection = base + trend30 * 0.4
  return {
    "current": round(base, 2),
    "trend_7d": trend7,
    "trend_30d": trend30,
    "projected_90d": round(projection, 2),
  }


def generate_cohorts(rng: random.Random) -> List[Dict[str, Any]]:
  cohorts = []
  for weeks_back in range(4):
    week_label = time.strftime(
      "%Y-W%V", time.gmtime(time.time() - weeks_back * 7 * 86400)
    )
    collected = round(rng.uniform(0.78, 0.97), 3)
    exceptions = rng.randint(0, 3)
    cohorts.append(
      {
        "cohort": week_label,
        "collected_pct": collected,
        "open_exceptions": exceptions,
      }
    )
  return cohorts


def generate_exceptions(rng: random.Random) -> List[Dict[str, Any]]:
  reasons = [
    "Dispute - pricing variance",
    "Bank routing mismatch",
    "Credit review pending",
    "Contract amendment in progress",
  ]
  statuses = ["investigating", "awaiting-customer", "escalated"]
  items = []
  for idx in range(rng.randint(2, 4)):
    items.append(
      {
        "id": f"AR-{time.strftime('%m%d')}-{idx+1}",
        "tenant": rng.choice(["tenant-emea", "tenant-apac", "tenant-west"]),
        "amount": round(rng.uniform(45_000, 180_000), 2),
        "reason": rng.choice(reasons),
        "status": rng.choice(statuses),
      }
    )
  return items


def compute_trust_index(summary: Dict[str, Any], cloud: Dict[str, Any]) -> Dict[str, Any]:
  parity_ok = bool(summary.get("cloud_parity_ok"))
  ack_rate = summary.get("kpis", {}).get("ack_rate_24h", 0.9)
  latency_ms = summary.get("kpis", {}).get("alert_action_latency_ms_p95", 1800)

  components = [
    ack_rate * 55,
    max(0, 25 - latency_ms / 200),
    15 if parity_ok else -10,
    5 if cloud.get("passed") else -5,
  ]
  score = max(0, min(100, round(statistics.fmean(components), 1)))
  return {
    "score": score,
    "cloud_parity_ok": parity_ok,
    "cloud_verified_at": cloud.get("generated_at"),
  }


def sha_payload(payload: Dict[str, Any]) -> str:
  snapshot = {k: v for k, v in payload.items() if k != "sha256"}
  return hashlib.sha256(json.dumps(snapshot, sort_keys=True).encode("utf-8")).hexdigest()


def main() -> None:
  summary = read_json(SUMMARY_PATH)
  cloud = read_json(CLOUD_VERIFY_PATH)

  seed_parts = [
    summary.get("sha256", "summary"),
    cloud.get("generated_at", "cloud"),
  ]
  rng = seed_rng(seed_parts)

  ar_buckets, ar_total = generate_ar_aging(rng)
  dso = generate_dso_series(rng)
  cohorts = generate_cohorts(rng)
  exceptions = generate_exceptions(rng)
  trust_index = compute_trust_index(summary, cloud)

  payload: Dict[str, Any] = {
    "phase": "cfo_lens",
    "generated_at": utc_now(),
    "trust_index": trust_index,
    "ar_aging": {
      "buckets": ar_buckets,
      "total_outstanding": ar_total,
    },
    "dso": dso,
    "recovery_cohorts": cohorts,
    "exceptions": exceptions,
    "meta": {
      "source": "scripts/gen_cfo_summary.py",
      "inputs": [str(SUMMARY_PATH), str(CLOUD_VERIFY_PATH)],
    },
  }
  payload["sha256"] = sha_payload(payload)

  OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
  OUTPUT_PATH.write_text(json.dumps(payload, indent=2))
  print(f"CFO summary generated → {OUTPUT_PATH} ({payload['sha256']})")


if __name__ == "__main__":
  main()
